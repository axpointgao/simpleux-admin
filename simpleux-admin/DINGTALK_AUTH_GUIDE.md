# 钉钉登录实现指南

## 📋 概述

本系统使用钉钉 OAuth 2.0 进行用户认证，不再支持用户名/邮箱密码登录。用户通过钉钉账号登录系统。

## 🔧 配置步骤

### 1. 注册钉钉应用

1. 登录 [钉钉开放平台](https://open.dingtalk.com/)
2. 创建企业内部应用或第三方应用
3. 获取应用的 `AppKey` 和 `AppSecret`
4. 配置应用权限：
   - 通讯录权限（用于获取用户信息）
   - 身份验证权限（用于 OAuth 登录）

### 2. 配置回调地址

在钉钉开放平台中配置 OAuth 回调地址：

- **开发环境**：`http://localhost:3001/api/auth/dingtalk/callback`
- **生产环境**：`https://your-domain.com/api/auth/dingtalk/callback`

### 3. 配置环境变量

编辑 `.env` 文件：

```env
# 钉钉 OAuth Configuration
REACT_APP_DINGTALK_APP_KEY=your_dingtalk_app_key
REACT_APP_DINGTALK_AUTH_URL=https://oapi.dingtalk.com/connect/oauth2/sns_authorize
REACT_APP_DINGTALK_REDIRECT_URI=http://localhost:3001/api/auth/dingtalk/callback
```

**注意**：

- `REACT_APP_DINGTALK_APP_KEY`：钉钉应用的 AppKey
- `REACT_APP_DINGTALK_AUTH_URL`：钉钉 OAuth 授权地址（通常不需要修改）
- `REACT_APP_DINGTALK_REDIRECT_URI`：回调地址，需要与钉钉开放平台配置一致

### 4. 后端 API 实现

需要在后端实现钉钉 OAuth 回调处理 API：

**路径**：`/api/auth/dingtalk/callback`

**功能**：

1. 接收钉钉回调的 `code` 和 `state` 参数
2. 验证 `state` 参数（防止 CSRF 攻击）
3. 使用 `code` 向钉钉服务器换取 `access_token`
4. 使用 `access_token` 获取用户信息（用户 ID、姓名、部门等）
5. 根据用户信息创建或更新 Supabase 用户
6. 创建 Supabase session
7. 重定向回前端并携带 session token

**示例实现**（Next.js API Route）：

```typescript
// app/api/auth/dingtalk/callback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  if (!code || !state) {
    return NextResponse.redirect(
      new URL('/login?error=invalid_params', request.url)
    );
  }

  try {
    // 1. 验证 state（前端已保存到 sessionStorage）
    // 这里需要从 session 或 Redis 中验证 state

    // 2. 使用 code 换取 access_token
    const tokenResponse = await fetch('https://oapi.dingtalk.com/gettoken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appkey: process.env.DINGTALK_APP_KEY,
        appsecret: process.env.DINGTALK_APP_SECRET,
      }),
    });
    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // 3. 使用 access_token 获取用户信息
    const userResponse = await fetch(
      `https://oapi.dingtalk.com/topapi/v2/user/getuserinfo?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      }
    );
    const userData = await userResponse.json();
    const userId = userData.result.userid;

    // 4. 获取用户详细信息
    const userDetailResponse = await fetch(
      `https://oapi.dingtalk.com/topapi/v2/user/get?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userid: userId }),
      }
    );
    const userDetail = await userDetailResponse.json();

    // 5. 创建或更新 Supabase 用户
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 使用钉钉用户ID作为唯一标识
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('*')
      .eq('dingtalk_user_id', userId)
      .single();

    let supabaseUserId: string;

    if (existingUser) {
      // 更新现有用户
      supabaseUserId = existingUser.id;
      await supabase
        .from('profiles')
        .update({
          name: userDetail.result.name,
          email: userDetail.result.email,
          avatar: userDetail.result.avatar,
          updated_at: new Date().toISOString(),
        })
        .eq('id', supabaseUserId);
    } else {
      // 创建新用户（需要先创建 auth.users 记录）
      // 这里简化处理，实际需要更复杂的逻辑
      const { data: newUser, error } = await supabase.auth.admin.createUser({
        email: userDetail.result.email || `${userId}@dingtalk.local`,
        email_confirm: true,
        user_metadata: {
          name: userDetail.result.name,
          dingtalk_user_id: userId,
        },
      });

      if (error) throw error;
      supabaseUserId = newUser.user.id;
    }

    // 6. 创建 Supabase session
    const { data: sessionData, error: sessionError } =
      await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: userDetail.result.email || `${userId}@dingtalk.local`,
      });

    if (sessionError) throw sessionError;

    // 7. 重定向到前端，携带 session token
    const redirectUrl = new URL('/', request.url);
    redirectUrl.searchParams.set(
      'access_token',
      sessionData.properties.access_token
    );
    redirectUrl.searchParams.set(
      'refresh_token',
      sessionData.properties.refresh_token
    );

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error('钉钉登录失败:', error);
    return NextResponse.redirect(
      new URL('/login?error=login_failed', request.url)
    );
  }
}
```

## 🚀 使用流程

### 用户登录流程

1. 用户访问登录页面
2. 点击"使用钉钉登录"按钮
3. 跳转到钉钉授权页面
4. 用户在钉钉中确认授权
5. 钉钉回调到后端 API
6. 后端处理回调，创建 Supabase session
7. 重定向回前端，前端完成登录

### 前端代码

登录页面已简化为只有一个"使用钉钉登录"按钮：

```typescript
import { redirectToDingtalk } from '@/utils/dingtalkAuth';

function handleLogin() {
  redirectToDingtalk(); // 跳转到钉钉授权页面
}
```

## 🔐 安全注意事项

1. **State 参数**：使用随机生成的 `state` 参数防止 CSRF 攻击
2. **AppSecret 保护**：`AppSecret` 必须保存在后端，不能暴露在前端
3. **HTTPS**：生产环境必须使用 HTTPS
4. **Token 存储**：Supabase session token 应存储在 httpOnly cookie 中
5. **用户信息同步**：定期同步钉钉用户信息，确保数据一致性

## 📝 开发环境测试

### 使用钉钉测试账号

1. 在钉钉开放平台创建测试应用
2. 添加测试人员到应用
3. 使用测试人员的钉钉账号登录

### Mock 模式（可选）

开发时如果无法连接钉钉，可以添加 mock 模式：

```typescript
// .env
REACT_APP_USE_MOCK_AUTH = true;
```

```typescript
// utils/dingtalkAuth.ts
if (process.env.REACT_APP_USE_MOCK_AUTH === 'true') {
  // 使用 mock 登录
  localStorage.setItem('userStatus', 'login');
  window.location.href = '/';
  return;
}
```

## 🐛 故障排查

### 问题 1：跳转后显示"无效的授权码"

**原因**：回调地址配置不正确或 `code` 已过期

**解决**：

- 检查钉钉开放平台中的回调地址配置
- 确保 `REACT_APP_DINGTALK_REDIRECT_URI` 与配置一致
- 检查后端是否正确处理回调

### 问题 2：无法获取用户信息

**原因**：应用权限不足或 `access_token` 无效

**解决**：

- 检查应用权限配置
- 确认 `AppKey` 和 `AppSecret` 正确
- 检查 token 是否过期

### 问题 3：State 验证失败

**原因**：`state` 参数丢失或过期

**解决**：

- 检查 `sessionStorage` 是否被清除
- 确保 `state` 在回调时正确验证

## 📚 相关文档

- [钉钉开放平台文档](https://open.dingtalk.com/document/)
- [钉钉 OAuth 2.0 文档](https://open.dingtalk.com/document/orgapp/obtain-identity-credentials)
- [Supabase Auth 文档](https://supabase.com/docs/guides/auth)

## ✨ 下一步

1. ✅ 配置钉钉应用
2. ✅ 实现后端回调 API
3. ⏳ 测试登录流程
4. ⏳ 配置生产环境
5. ⏳ 实现用户信息同步
