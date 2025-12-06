# Supabase Auth 登录配置指南

## 📋 概述

前端已集成 Supabase Auth 登录，替换了原有的 mock 登录系统。

## ✅ 已完成的配置

### 1. 安装依赖

```bash
npm install @supabase/supabase-js
```

### 2. 创建的文件

- `src/lib/supabase/client.ts` - Supabase 客户端配置
- `src/utils/supabaseAuth.ts` - 认证工具函数（登录、登出、获取用户等）
- `.env.example` - 环境变量示例

### 3. 修改的文件

- `src/pages/login/form.tsx` - 登录表单（使用 Supabase Auth）
- `src/utils/checkLogin.tsx` - 登录检查（支持 Supabase session）
- `src/index.tsx` - 应用入口（异步检查登录）
- `src/components/NavBar/index.tsx` - 导航栏（使用 Supabase 登出）
- `src/api/config.ts` - API 配置（使用 Supabase session token）

## 🔧 配置步骤

### 1. 配置环境变量

创建 `.env` 或 `.env.development` 文件：

```env
# Supabase 配置
# 从 Supabase Dashboard > Settings > API 获取
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key

# API 配置
REACT_APP_API_BASE_URL=http://localhost:3002/api
```

**获取 Supabase 配置**：

1. 登录 [Supabase Dashboard](https://app.supabase.com)
2. 选择你的项目
3. 进入 **Settings** > **API**
4. 复制 **Project URL** 和 **anon public** key

### 2. 在 Supabase Dashboard 中配置

1. **启用 Email 认证**

   - 进入 **Authentication** > **Providers**
   - 确保 **Email** 提供者已启用

2. **配置 Email 模板**（可选）

   - **Authentication** > **Email Templates**
   - 自定义确认邮件和重置密码邮件

3. **创建测试用户**

   - **Authentication** > **Users**
   - 点击 **"Add user"** > **"Create new user"**
   - 填写邮箱和密码
   - ✅ 勾选 **"Auto Confirm User"**（自动确认，无需邮箱验证）
   - 记录生成的 **User UID**

4. **创建用户记录和分配角色**
   - 执行 SQL 脚本：`simpleux-api/supabase/create_test_admin_quick.sql`
   - 将 `YOUR_USER_ID_HERE` 替换为步骤 3 中的 User UID

## 🚀 使用方法

### 登录

1. 启动前端服务：

   ```bash
   cd simpleux-admin
   npm start
   ```

2. 访问登录页面：`http://localhost:3001/login`

3. 使用创建的 Supabase 用户登录：
   - **邮箱**：你创建用户时使用的邮箱（例如：`admin@test.com`）
   - **密码**：你创建用户时设置的密码

### 登出

点击导航栏右上角的用户头像 > **登出**

## 🔍 验证

### 检查登录状态

在浏览器控制台执行：

```javascript
// 检查 Supabase session
const { supabase } = await import('./src/lib/supabase/client');
const {
  data: { session },
} = await supabase.auth.getSession();
console.log('Session:', session);
console.log('User:', session?.user);
```

### 检查用户信息

登录后，检查 localStorage：

- `userStatus`: `"login"`
- `userId`: 用户 UUID
- `userEmail`: 用户邮箱
- `token`: Supabase access token

## ⚠️ 注意事项

1. **环境变量必须配置**：如果没有配置 Supabase URL 和 Key，登录功能将无法使用

2. **用户必须先在 Supabase Auth 中创建**：不能直接在数据库中创建用户，必须通过 Supabase Auth 创建

3. **密码验证**：Supabase Auth 会验证密码，mock 登录已不再使用

4. **Session 管理**：Supabase 会自动管理 session，包括自动刷新 token

5. **API 请求**：所有 API 请求会自动携带 Supabase access token 作为 Authorization header

## 🐛 故障排除

### 问题：登录提示"账号或者密码错误"

**可能原因**：

1. 用户未在 Supabase Auth 中创建
2. 邮箱或密码输入错误
3. 用户未确认（如果未勾选 Auto Confirm）

**解决方案**：

1. 检查 Supabase Dashboard > Authentication > Users 中是否存在该用户
2. 确认邮箱和密码正确
3. 如果用户存在但无法登录，尝试重置密码或重新创建用户

### 问题：登录后立即跳转到登录页

**可能原因**：

1. Supabase 配置错误
2. Session 未正确保存

**解决方案**：

1. 检查环境变量是否正确配置
2. 检查浏览器控制台是否有错误
3. 检查 localStorage 中是否有 `userStatus` 和 `token`

### 问题：API 请求返回 401 未授权

**可能原因**：

1. Token 未正确传递
2. Token 已过期

**解决方案**：

1. 检查 API 请求的 Authorization header
2. Supabase 会自动刷新 token，如果问题持续，尝试重新登录

## 📝 后续工作

1. **用户信息同步**：登录后从 `profiles` 表获取用户详细信息（姓名、角色等）
2. **权限控制**：根据用户角色显示/隐藏功能
3. **密码重置**：实现忘记密码功能
4. **注册功能**：如果需要，可以实现用户注册功能
