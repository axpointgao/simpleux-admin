# 接口规范

## 一、接口设计原则

### 1.1 RESTful API设计

**资源导向**：
- 使用名词表示资源
- 使用HTTP方法表示操作
- URL结构清晰、层次分明

**HTTP方法**：
- `GET`: 查询资源
- `POST`: 创建资源
- `PUT`: 更新资源（完整更新）
- `PATCH`: 更新资源（部分更新）
- `DELETE`: 删除资源

**URL规范**：
```
GET    /api/projects              # 获取项目列表
GET    /api/projects/:id          # 获取项目详情
POST   /api/projects              # 创建项目
PUT    /api/projects/:id          # 更新项目
DELETE /api/projects/:id          # 删除项目
```

### 1.2 接口版本管理

**版本控制方式**：
- URL路径版本：`/api/v1/projects`
- Header版本：`Accept: application/vnd.api+json;version=1`

**当前版本**：v1（默认，URL中可省略）

## 二、请求规范

### 2.1 请求头

**必需请求头**：
```
Content-Type: application/json
Authorization: Bearer <token>
```

**可选请求头**：
```
X-Request-ID: <uuid>              # 请求ID（用于追踪）
Accept: application/json          # 响应格式
Accept-Language: zh-CN            # 语言
```

### 2.2 请求参数

**查询参数**（GET请求）：
```
GET /api/projects?page=1&pageSize=20&status=进行中&sort=created_at&order=desc
```

**路径参数**：
```
GET /api/projects/:id
PUT /api/projects/:id
DELETE /api/projects/:id
```

**请求体**（POST/PUT/PATCH）：
```json
{
  "name": "项目名称",
  "type": "项目制",
  "status": "进行中"
}
```

### 2.3 分页参数

**标准分页**：
```
page: 页码（从1开始）
pageSize: 每页数量（默认20，最大100）
```

**游标分页**（可选）：
```
cursor: 游标值
limit: 每页数量
```

## 三、响应规范

### 3.1 响应格式

**成功响应**：
```json
{
  "success": true,
  "data": {
    // 响应数据
  },
  "message": "操作成功"
}
```

**列表响应**：
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

**错误响应**：
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述",
    "details": {}
  }
}
```

### 3.2 HTTP状态码

**成功状态码**：
- `200 OK`: 请求成功
- `201 Created`: 资源创建成功
- `204 No Content`: 请求成功，无返回内容

**客户端错误**：
- `400 Bad Request`: 请求参数错误
- `401 Unauthorized`: 未认证
- `403 Forbidden`: 无权限
- `404 Not Found`: 资源不存在
- `409 Conflict`: 资源冲突
- `422 Unprocessable Entity`: 验证失败

**服务端错误**：
- `500 Internal Server Error`: 服务器内部错误
- `503 Service Unavailable`: 服务不可用

## 四、错误码定义

### 4.1 错误码规范

**错误码格式**：
```
<模块>_<操作>_<错误类型>
```

**示例**：
- `PROJECT_CREATE_VALIDATION_ERROR`: 项目创建验证错误
- `PROJECT_NOT_FOUND`: 项目不存在
- `PERMISSION_DENIED`: 权限不足

### 4.2 常见错误码

**通用错误**：
| 错误码 | HTTP状态码 | 说明 |
|--------|-----------|------|
| `UNAUTHORIZED` | 401 | 未认证 |
| `FORBIDDEN` | 403 | 无权限 |
| `NOT_FOUND` | 404 | 资源不存在 |
| `VALIDATION_ERROR` | 422 | 验证失败 |
| `INTERNAL_ERROR` | 500 | 服务器内部错误 |

**业务错误**：
| 错误码 | HTTP状态码 | 说明 |
|--------|-----------|------|
| `PROJECT_NOT_FOUND` | 404 | 项目不存在 |
| `PROJECT_CREATE_VALIDATION_ERROR` | 422 | 项目创建验证失败 |
| `PERFORMANCE_AMOUNT_EXCEEDED` | 422 | 业绩金额超限 |
| `APPROVAL_ALREADY_PROCESSED` | 409 | 审批已处理 |

## 五、认证和授权

### 5.1 认证方式

**Bearer Token**：
```
Authorization: Bearer <jwt_token>
```

**Token获取**：
- 通过Supabase Auth获取JWT Token
- Token有效期：24小时
- 支持Token刷新

### 5.2 权限验证

**权限检查**：
- 每个接口进行权限验证
- 使用RLS（Row Level Security）进行数据级权限控制
- 应用层进行功能级权限检查

**权限错误**：
- 无权限时返回 `403 Forbidden`
- 错误信息：`{"code": "FORBIDDEN", "message": "无权限访问该资源"}`

## 六、数据验证

### 6.1 输入验证

**验证规则**：
- 使用Zod Schema进行验证
- 验证失败返回 `422 Unprocessable Entity`
- 错误信息包含具体字段和错误原因

**验证错误响应**：
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "验证失败",
    "details": {
      "name": ["项目名称不能为空"],
      "type": ["项目类型无效"]
    }
  }
}
```

### 6.2 数据类型

**支持的数据类型**：
- `string`: 字符串
- `number`: 数字
- `boolean`: 布尔值
- `date`: 日期（ISO 8601格式：YYYY-MM-DD）
- `datetime`: 日期时间（ISO 8601格式：YYYY-MM-DDTHH:mm:ssZ）
- `array`: 数组
- `object`: 对象

## 七、Server Actions规范

### 7.1 Server Actions格式

**函数签名**：
```typescript
'use server'
export async function actionName(params: ActionParams): Promise<ActionResult> {
  // 实现逻辑
}
```

**返回格式**：
```typescript
// 成功
return { success: true, data: result };

// 失败
return { success: false, error: errorMessage };
```

### 7.2 错误处理

**统一错误处理**：
```typescript
try {
  // 业务逻辑
  return { success: true, data: result };
} catch (error) {
  console.error('Error:', error);
  return { 
    success: false, 
    error: error instanceof Error ? error.message : 'Unknown error' 
  };
}
```

## 八、API Routes规范

### 8.1 路由结构

**文件组织**：
```
app/api/
├── projects/
│   ├── route.ts              # GET, POST /api/projects
│   └── [id]/
│       └── route.ts           # GET, PUT, DELETE /api/projects/:id
└── integrations/
    └── dingtalk/
        └── callback/
            └── route.ts       # POST /api/integrations/dingtalk/callback
```

### 8.2 路由处理

**Next.js API Route**：
```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // 处理GET请求
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
```

## 九、接口文档

### 9.1 文档格式

**使用OpenAPI规范**：
- 使用Swagger/OpenAPI 3.0格式
- 提供接口描述、参数说明、响应示例
- 支持在线测试

### 9.2 文档内容

**必需内容**：
- 接口路径和方法
- 请求参数（路径、查询、请求体）
- 响应格式和状态码
- 错误码说明
- 示例请求和响应

## 十、性能要求

### 10.1 响应时间

**目标响应时间**：
- 列表查询：< 2秒
- 详情查询：< 1秒
- 创建/更新：< 3秒
- 删除：< 1秒

### 10.2 优化策略

**查询优化**：
- 使用索引优化查询
- 分页查询避免全表扫描
- 使用缓存减少数据库查询

**批量操作**：
- 支持批量创建/更新
- 使用事务保证数据一致性
- 提供批量操作接口

## 十一、安全要求

### 11.1 输入安全

**防护措施**：
- SQL注入防护（参数化查询）
- XSS防护（数据转义）
- CSRF防护（Token验证）

### 11.2 数据安全

**敏感数据**：
- 密码、Token等敏感信息不记录日志
- API密钥加密存储
- 传输使用HTTPS

## 十二、版本兼容

### 12.1 向后兼容

**兼容策略**：
- 新增字段使用可选字段
- 废弃字段标记为deprecated
- 保持旧版本接口可用

### 12.2 版本迁移

**迁移计划**：
- 提前通知版本变更
- 提供迁移指南
- 支持多版本并存

