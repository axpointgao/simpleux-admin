# 阶段 2：数据库集成配置指南

## 📋 概述

阶段 2 是将前端从 mock 数据切换到真实数据库 API 的过渡阶段。

## ✅ 前置条件检查

### 1. 静态页面是否完成

- ✅ 项目列表页
- ✅ 项目创建页
- ✅ 项目详情抽屉
- ✅ 各种弹窗（变更、补录、支出等）

### 2. 后端 API 是否就绪

- ✅ API 路由已开发
- ✅ 数据库迁移已完成
- ✅ 开发模式支持已添加

### 3. 数据库是否配置

- ⚠️ 需要确认 Supabase 项目已创建
- ⚠️ 需要确认数据库迁移已执行

## 🔧 配置步骤

### 步骤 1：配置后端开发模式

在 `simpleux-api/.env.local` 中设置：

```env
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 开发模式：跳过认证
SKIP_AUTH=true
NODE_ENV=development

# API 配置
API_PORT=3002
NEXT_PUBLIC_API_URL=http://localhost:3002
```

### 步骤 2：配置前端 API 连接

在 `simpleux-admin/.env` 或 `.env.development` 中设置：

```env
# 不使用 mock，连接真实 API
REACT_APP_USE_MOCK=false

# API 地址
REACT_APP_API_URL=http://localhost:3002/api

# Supabase 配置（暂时不需要，但保留）
REACT_APP_SUPABASE_URL=
REACT_APP_SUPABASE_ANON_KEY=
```

### 步骤 3：启动服务

#### 启动后端 API

```bash
cd simpleux-api
npm run dev
```

验证 API 是否正常：

```bash
curl http://localhost:3002/api/projects
```

应该返回项目列表（可能是空数组），而不是 401 错误。

#### 启动前端

```bash
cd simpleux-admin
npm start
```

### 步骤 4：测试连接

1. 打开浏览器访问 `http://localhost:3001`
2. 进入项目列表页面
3. 检查是否从数据库加载数据
4. 检查控制台是否有错误

## 🔄 切换回 Mock 模式

如果需要切换回 mock 数据：

在 `simpleux-admin/.env` 中设置：

```env
REACT_APP_USE_MOCK=true
```

重启前端服务即可。

## ⚠️ 注意事项

1. **数据库必须已配置**

   - Supabase 项目已创建
   - 数据库迁移已执行
   - 环境变量已配置

2. **开发模式仅用于开发**

   - `SKIP_AUTH=true` 仅用于开发环境
   - 不要在生产环境使用

3. **数据格式兼容**
   - 确保 API 返回的数据格式与 mock 数据格式一致
   - 如有差异，需要调整前端代码

## 🐛 故障排查

### 问题 1：API 返回 401 错误

**原因**：后端未设置 `SKIP_AUTH=true`

**解决**：

1. 检查 `simpleux-api/.env.local` 中是否有 `SKIP_AUTH=true`
2. 重启后端服务

### 问题 2：API 返回空数据

**原因**：数据库中没有数据

**解决**：

1. 在 Supabase Dashboard 中检查表是否有数据
2. 可以手动插入测试数据
3. 或者暂时切换回 mock 模式

### 问题 3：前端无法连接 API

**原因**：API 地址配置错误或后端未启动

**解决**：

1. 检查 `REACT_APP_API_URL` 是否正确
2. 确认后端服务已启动（`http://localhost:3002`）
3. 检查浏览器控制台的网络请求

## 📝 下一步

阶段 2 完成后，可以：

1. 测试所有功能是否正常
2. 验证数据是否正确显示
3. 准备进入阶段 3（生产部署，启用认证）
