# API 测试指南

## 🚀 API 服务已启动

API 服务运行在：`http://localhost:3002`

## 📋 快速测试

### 1. 测试服务是否运行

```bash
# 检查服务状态
curl http://localhost:3002

# 应该返回 Next.js 的默认页面或 404（这是正常的，因为根路径没有定义）
```

### 2. 测试 API 接口

#### 获取项目列表

```bash
curl http://localhost:3002/api/projects
```

**注意**：由于所有 API 都需要认证，可能会返回 401 未授权错误。这是正常的，说明 API 正在工作。

#### 带认证的测试

如果需要测试带认证的接口，需要先获取 Supabase 的访问令牌：

```bash
# 使用 Supabase Auth 获取 token 后
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3002/api/projects
```

## 🔍 API 接口列表

### 项目相关

- `GET /api/projects` - 获取项目列表
- `POST /api/projects` - 创建项目
- `GET /api/projects/[id]` - 获取项目详情
- `GET /api/projects/[id]/budgets` - 获取项目预算
- `GET /api/projects/[id]/expenses` - 获取项目支出
- `GET /api/projects/[id]/stages` - 获取项目阶段
- `PUT /api/projects/[id]/stages/[stageId]` - 更新阶段进度
- `GET /api/projects/[id]/changes` - 获取变更记录
- `POST /api/projects/[id]/changes` - 创建变更申请
- `POST /api/projects/[id]/pending-entry` - 提交补录申请
- `POST /api/projects/[id]/design-confirm` - 发起设计确认
- `POST /api/projects/[id]/archive` - 发起归档
- `DELETE /api/projects/[id]/archive` - 取消归档

### 支出管理

- `POST /api/projects/[id]/expenses/travel` - 创建差旅支出
- `PUT /api/projects/[id]/expenses/travel/[expenseId]` - 更新差旅支出
- `DELETE /api/projects/[id]/expenses/travel/[expenseId]` - 删除差旅支出
- `POST /api/projects/[id]/expenses/outsource` - 创建外包支出
- `PUT /api/projects/[id]/expenses/outsource/[expenseId]` - 更新外包支出
- `DELETE /api/projects/[id]/expenses/outsource/[expenseId]` - 删除外包支出

### 框架协议相关

- `GET /api/frameworks` - 获取框架协议列表
- `POST /api/frameworks` - 创建框架协议
- `GET /api/frameworks/[id]` - 获取框架协议详情
- `PUT /api/frameworks/[id]` - 更新框架协议
- `GET /api/frameworks/[id]/projects` - 获取关联项目

## 🧪 使用 Postman 测试

### 1. 创建 Collection

1. 打开 Postman
2. 创建新的 Collection：`SimpleUX API`
3. 设置 Base URL 变量：`{{baseUrl}}` = `http://localhost:3002/api`

### 2. 配置认证

由于所有接口需要 Supabase 认证，需要：

1. 在 Collection 级别设置认证
2. 类型选择：`Bearer Token`
3. Token 从 Supabase Auth 获取

### 3. 测试示例

#### 创建项目

```
POST {{baseUrl}}/projects
Content-Type: application/json

{
  "name": "测试项目",
  "type": "项目制",
  "managerId": "00000000-0000-0000-0000-000000000001",
  "managerName": "测试经理",
  "group": "设计一部",
  "planStartDate": "2024-01-01",
  "planEndDate": "2024-12-31",
  "contractAmount": 500000
}
```

## 🔐 认证说明

所有 API 接口都需要用户登录认证。认证方式：

1. 使用 Supabase Auth 登录获取 access token
2. 在请求头中添加：`Authorization: Bearer <token>`

## 📊 响应格式

### 成功响应

```json
{
  "success": true,
  "data": { ... }
}
```

### 错误响应

```json
{
  "success": false,
  "error": "错误信息"
}
```

## 🐛 常见问题

### 1. 401 未授权

**原因**：未提供有效的认证 token

**解决**：
- 确保已登录 Supabase
- 检查 token 是否有效
- 确认请求头格式正确

### 2. 404 未找到

**原因**：API 路径错误或服务未启动

**解决**：
- 检查 API 路径是否正确
- 确认服务在 3002 端口运行
- 检查路由文件是否存在

### 3. 500 服务器错误

**原因**：数据库连接问题或代码错误

**解决**：
- 检查数据库连接配置
- 查看服务器日志
- 确认数据库表已创建

## 📝 下一步

1. ✅ API 服务已启动
2. ⏳ 配置前端连接真实 API
3. ⏳ 实现 Supabase 认证集成
4. ⏳ 替换前端 mock 数据为真实 API 调用

## 🔗 相关文档

- [API 文档](./API.md) - 完整的 API 接口文档
- [数据库配置](./DATABASE_SETUP.md) - 数据库配置说明
- [迁移成功](./MIGRATION_SUCCESS.md) - 迁移完成确认

