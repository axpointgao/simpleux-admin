# 前端环境变量配置指南

## 📋 概述

前端需要配置 Supabase 和 API 相关的环境变量才能正常使用登录和 API 功能。

## 🔧 配置步骤

### 1. 创建环境变量文件

在 `simpleux-admin` 目录下创建 `.env.development` 文件（开发环境）或 `.env` 文件（生产环境）。

### 2. 获取 Supabase 配置

**前端和后端使用同一个 Supabase 项目**，所以配置值相同：

1. 登录 [Supabase Dashboard](https://app.supabase.com)
2. 选择你的项目
3. 进入 **Settings** > **API**
4. 复制以下值：
   - **Project URL** → `REACT_APP_SUPABASE_URL`
   - **anon/public key** → `REACT_APP_SUPABASE_ANON_KEY`

### 3. 配置环境变量

编辑 `.env.development` 文件，填入你的配置：

```env
# Supabase 配置（与后端使用同一个项目）
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here

# API 配置
REACT_APP_API_BASE_URL=http://localhost:3002/api

# Mock 配置
REACT_APP_USE_MOCK=false
```

### 4. 重启前端服务

配置完成后，需要重启前端服务：

```bash
cd simpleux-admin
npm start
```

## 📝 配置说明

### Supabase 配置

- **REACT_APP_SUPABASE_URL**: Supabase 项目 URL

  - 与后端的 `NEXT_PUBLIC_SUPABASE_URL` 相同
  - 格式：`https://xxxxx.supabase.co`

- **REACT_APP_SUPABASE_ANON_KEY**: Supabase 匿名密钥
  - 与后端的 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 相同
  - 这是公开的客户端密钥，可以安全地在前端使用

### API 配置

- **REACT_APP_API_BASE_URL**: 后端 API 服务地址
  - 开发环境：`http://localhost:3002/api`
  - 生产环境：根据实际部署地址配置

### Mock 配置

- **REACT_APP_USE_MOCK**: 是否使用 mock 数据
  - `false`: 使用真实 API（推荐）
  - `true`: 使用 mock 数据（仅用于前端开发，不连接后端）

## 🔍 验证配置

### 检查环境变量是否加载

在浏览器控制台执行：

```javascript
console.log('Supabase URL:', process.env.REACT_APP_SUPABASE_URL);
console.log('API Base URL:', process.env.REACT_APP_API_BASE_URL);
```

### 检查 Supabase 连接

在浏览器控制台执行：

```javascript
const { supabase } = await import('./src/lib/supabase/client');
console.log('Supabase client:', supabase);
```

## ⚠️ 注意事项

1. **环境变量命名**：

   - React 应用的环境变量必须以 `REACT_APP_` 开头
   - Next.js 应用的环境变量以 `NEXT_PUBLIC_` 开头
   - 虽然前缀不同，但值相同（同一个 Supabase 项目）

2. **安全性**：

   - `REACT_APP_SUPABASE_ANON_KEY` 是公开的，可以安全地在前端使用
   - 不要在前端使用 `SUPABASE_SERVICE_ROLE_KEY`（这是服务端专用，有更高权限）

3. **文件位置**：

   - `.env.development` - 开发环境配置
   - `.env.production` - 生产环境配置
   - `.env` - 所有环境通用配置

4. **Git 忽略**：
   - `.env*` 文件已在 `.gitignore` 中，不会被提交到 Git
   - 不要将真实的密钥提交到代码仓库

## 🔄 与后端配置对比

| 前端变量                      | 后端变量                        | 说明                   |
| ----------------------------- | ------------------------------- | ---------------------- |
| `REACT_APP_SUPABASE_URL`      | `NEXT_PUBLIC_SUPABASE_URL`      | 同一个值               |
| `REACT_APP_SUPABASE_ANON_KEY` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 同一个值               |
| `REACT_APP_API_BASE_URL`      | -                               | 前端专用，指向后端 API |

## 🐛 故障排除

### 问题：环境变量未生效

**解决方案**：

1. 确认文件名为 `.env.development` 或 `.env`
2. 确认变量名以 `REACT_APP_` 开头
3. 重启前端服务（环境变量在启动时加载）

### 问题：Supabase 连接失败

**解决方案**：

1. 检查 `REACT_APP_SUPABASE_URL` 是否正确
2. 检查 `REACT_APP_SUPABASE_ANON_KEY` 是否正确
3. 检查浏览器控制台是否有 CORS 错误

### 问题：API 请求失败

**解决方案**：

1. 检查 `REACT_APP_API_BASE_URL` 是否正确
2. 确认后端服务是否运行在 3002 端口
3. 检查浏览器控制台的网络请求
