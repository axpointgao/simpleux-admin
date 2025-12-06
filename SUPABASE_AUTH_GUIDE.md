# Supabase 认证实现指南

## 📋 概述

本指南说明如何在前端项目中集成 Supabase 认证，替换现有的 mock 登录系统。

## ✅ 已完成的配置

### 1. 安装依赖

```bash
npm install @supabase/supabase-js @supabase/ssr
```

### 2. 创建的文件

- `src/lib/supabase/client.ts` - Supabase 客户端
- `src/utils/supabaseAuth.ts` - 认证工具函数
- `src/utils/apiClient.ts` - 带认证的 API 客户端
- `.env.example` - 环境变量示例

### 3. 修改的文件

- `src/pages/login/form.tsx` - 登录表单（使用 Supabase 认证）
- `src/utils/checkLogin.tsx` - 登录检查（支持 Supabase）
- `src/index.tsx` - 应用入口（异步检查登录）
- `src/components/NavBar/index.tsx` - 导航栏（使用 Supabase 登出）

## 🔧 配置步骤

### 1. 配置环境变量

创建 `.env` 文件（从 `.env.example` 复制）：

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入你的 Supabase 配置：

```env
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
REACT_APP_API_URL=http://localhost:3002/api
```

### 2. 在 Supabase Dashboard 中配置

1. **启用 Email 认证**

   - 登录 Supabase Dashboard
   - 进入 Authentication → Providers
   - 确保 Email 提供者已启用

2. **配置 Email 模板**（可选）

   - Authentication → Email Templates
   - 自定义确认邮件和重置密码邮件

3. **创建测试用户**（可选）
   - Authentication → Users
   - 点击 "Add user" 创建测试用户

## 🚀 使用方法

### 登录

登录表单现在使用 Supabase 认证：

```typescript
import { signIn } from '@/utils/supabaseAuth';

// 登录
await signIn('user@example.com', 'password');
```

**注意**：Supabase 使用 email 登录，如果用户名不是 email 格式，系统会自动添加 `@example.com` 后缀（仅用于测试）。

### 登出

```typescript
import { signOut } from '@/utils/supabaseAuth';

// 登出
await signOut();
```

### 检查登录状态

```typescript
import { isAuthenticated } from '@/utils/supabaseAuth';

// 检查是否已登录
const loggedIn = await isAuthenticated();
```

### 获取当前用户

```typescript
import { getCurrentUser } from '@/utils/supabaseAuth';

// 获取当前用户
const user = await getCurrentUser();
```

### 使用 API 客户端

所有 API 请求会自动添加认证 token：

```typescript
import apiClient from '@/utils/apiClient';

// GET 请求
const response = await apiClient.get('/projects');

// POST 请求
const response = await apiClient.post('/projects', data);
```

## 📝 代码示例

### 登录表单

```typescript
import { signIn } from '@/utils/supabaseAuth';
import { Message } from '@arco-design/web-react';

async function handleLogin(email: string, password: string) {
  try {
    await signIn(email, password);
    Message.success('登录成功');
    window.location.href = '/';
  } catch (error) {
    Message.error(error.message);
  }
}
```

### 监听认证状态变化

```typescript
import { onAuthStateChange } from '@/utils/supabaseAuth';

useEffect(() => {
  const {
    data: { subscription },
  } = onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT') {
      window.location.href = '/login';
    }
  });

  return () => {
    subscription.unsubscribe();
  };
}, []);
```

## 🔄 迁移现有代码

### 替换 axios 调用

**之前**：

```typescript
import axios from 'axios';

axios.get('/api/projects');
```

**之后**：

```typescript
import apiClient from '@/utils/apiClient';

apiClient.get('/projects');
```

### 替换登录检查

**之前**：

```typescript
import checkLogin from '@/utils/checkLogin';

if (checkLogin()) {
  // ...
}
```

**之后**：

```typescript
import checkLogin from '@/utils/checkLogin';

checkLogin().then((isLoggedIn) => {
  if (isLoggedIn) {
    // ...
  }
});
```

或者使用同步版本（仅检查本地存储）：

```typescript
import { checkLoginSync } from '@/utils/checkLogin';

if (checkLoginSync()) {
  // ...
}
```

## 🧪 测试

### 1. 创建测试用户

在 Supabase Dashboard 中：

1. 进入 Authentication → Users
2. 点击 "Add user"
3. 输入 email 和 password
4. 取消勾选 "Auto Confirm User"（如果需要邮箱确认）

### 2. 测试登录

1. 启动前端服务：`npm start`
2. 访问登录页面
3. 使用创建的测试用户登录

### 3. 测试 API 调用

登录后，所有 API 请求会自动包含认证 token，后端会验证 token 并返回数据。

## ⚠️ 注意事项

### 1. Email vs Username

Supabase 使用 email 作为登录标识。如果现有系统使用 username，需要：

- **方案 1**：修改登录表单，使用 email 字段
- **方案 2**：在登录时自动转换（当前实现）
- **方案 3**：在 Supabase 中配置自定义认证提供者

### 2. 用户注册

当前登录表单有"注册"按钮，但功能未实现。可以：

```typescript
import { signUp } from '@/utils/supabaseAuth';

await signUp('user@example.com', 'password');
```

### 3. 密码重置

Supabase 支持密码重置，需要实现：

```typescript
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();
await supabase.auth.resetPasswordForEmail('user@example.com');
```

### 4. 会话管理

Supabase 会自动管理会话和 token 刷新。`@supabase/ssr` 包会自动处理 cookie 和 token 存储。

### 5. 环境变量

确保 `.env` 文件已添加到 `.gitignore`，不要提交敏感信息。

## 🔐 安全建议

1. **使用 HTTPS**：生产环境必须使用 HTTPS
2. **保护 Anon Key**：虽然 Anon Key 可以在前端使用，但应该配置 RLS 策略保护数据
3. **配置 CORS**：在 Supabase Dashboard 中配置允许的域名
4. **启用 MFA**：生产环境建议启用多因素认证

## 📚 相关文档

- [Supabase Auth 文档](https://supabase.com/docs/guides/auth)
- [Supabase JS 客户端](https://supabase.com/docs/reference/javascript/auth-api)
- [API 文档](../simpleux-api/API.md)

## 🐛 故障排查

### 问题 1：登录失败 "Invalid login credentials"

**原因**：用户不存在或密码错误

**解决**：

- 检查 Supabase Dashboard 中用户是否存在
- 确认密码正确
- 检查用户是否已确认邮箱（如果启用了邮箱确认）

### 问题 2：API 请求返回 401

**原因**：Token 未正确传递或已过期

**解决**：

- 检查 `apiClient.ts` 中的 token 获取逻辑
- 确认 Supabase 会话有效
- 检查后端认证中间件

### 问题 3：环境变量未生效

**原因**：React 需要重启才能加载新的环境变量

**解决**：

- 停止开发服务器
- 重新运行 `npm start`
- 确认 `.env` 文件在项目根目录

## ✨ 下一步

1. ✅ 配置环境变量
2. ✅ 测试登录功能
3. ⏳ 实现用户注册功能
4. ⏳ 实现密码重置功能
5. ⏳ 替换所有 API 调用为 `apiClient`
6. ⏳ 配置 RLS 策略保护数据
