# 商业项目模块 API 文档

## 基础信息

- **Base URL**: `http://localhost:3002/api`
- **认证方式**: Bearer Token (通过 Supabase Auth)
- **响应格式**: JSON

## 响应格式

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

## 项目相关 API

### 1. 获取项目列表

**GET** `/api/projects`

**查询参数**:
- `keyword` (string, optional): 项目名称或需求名称模糊搜索
- `type` (string, optional): 项目类型，多个用逗号分隔（项目制,计件制,离岸制,驻场制）
- `status` (string, optional): 项目状态，多个用逗号分隔（待启动,进行中,待确认,已确认,已归档）
- `group` (string, optional): 归属部门，多个用逗号分隔
- `showArchived` (boolean, optional): 是否显示归档项目，默认 false
- `current` (number, optional): 当前页码，默认 1
- `pageSize` (number, optional): 每页数量，默认 10

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "code": "PROJ-2024-001",
      "name": "XX银行移动端设计项目",
      "type": "项目制",
      "status": "进行中",
      ...
    }
  ],
  "total": 100
}
```

### 2. 获取项目详情

**GET** `/api/projects/[id]`

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "code": "PROJ-2024-001",
    "name": "XX银行移动端设计项目",
    ...
  }
}
```

### 3. 创建项目

**POST** `/api/projects`

**请求体**:
```json
{
  "name": "项目名称",
  "type": "项目制",
  "managerId": "uuid",
  "managerName": "张三",
  "group": "设计一部",
  "bizManager": "李四",
  "clientDept": "金融客户部",
  "planStartDate": "2024-01-01",
  "planEndDate": "2024-06-30",
  "contractAmount": 500000,
  "stages": [
    {
      "name": "需求分析",
      "percentage": 20
    }
  ],
  "laborBudget": [
    {
      "employeeLevel": "P7",
      "cityType": "Chengdu",
      "days": 50
    }
  ],
  "travelBudget": [...],
  "outsourceBudget": [...]
}
```

### 4. 获取项目预算

**GET** `/api/projects/[id]/budgets`

**响应示例**:
```json
{
  "success": true,
  "data": {
    "labor": [...],
    "travel": [...],
    "outsource": [...]
  }
}
```

### 5. 获取项目支出

**GET** `/api/projects/[id]/expenses`

**响应示例**:
```json
{
  "success": true,
  "data": {
    "travel": [...],
    "outsource": [...],
    "labor": []
  }
}
```

### 6. 创建差旅支出

**POST** `/api/projects/[id]/expenses/travel`

**请求体**:
```json
{
  "item": "客户现场调研",
  "expenseDate": "2024-01-15",
  "transportBig": 5000,
  "stay": 3000,
  "transportSmall": 500,
  "allowance": 1000,
  "other": 500
}
```

### 7. 更新差旅支出

**PUT** `/api/projects/[id]/expenses/travel/[expenseId]`

### 8. 删除差旅支出

**DELETE** `/api/projects/[id]/expenses/travel/[expenseId]`

### 9. 创建外包支出

**POST** `/api/projects/[id]/expenses/outsource`

**请求体**:
```json
{
  "item": "插画设计",
  "supplierName": "供应商A",
  "amount": 50000,
  "expenseDate": "2024-01-15"
}
```

### 10. 更新外包支出

**PUT** `/api/projects/[id]/expenses/outsource/[expenseId]`

### 11. 删除外包支出

**DELETE** `/api/projects/[id]/expenses/outsource/[expenseId]`

### 12. 获取项目阶段

**GET** `/api/projects/[id]/stages`

### 13. 获取项目变更记录

**GET** `/api/projects/[id]/changes`

### 14. 获取项目变更记录

**GET** `/api/projects/[id]/changes`

### 15. 创建项目变更申请

**POST** `/api/projects/[id]/changes`

**请求体**:
```json
{
  "changeType": "project",
  "changeDate": "2024-03-15",
  "description": "变更说明",
  "attachmentUrl": "https://...",
  "contractAmount": 600000,
  "name": "新项目名称",
  ...
}
```

### 16. 提交补录申请

**POST** `/api/projects/[id]/pending-entry`

**请求体**:
```json
{
  "demandAmount": 500000,
  "stages": [
    {
      "name": "需求分析",
      "percentage": 20
    }
  ],
  "laborBudget": [...],
  "travelBudget": [...],
  "outsourceBudget": [...]
}
```

### 17. 发起设计确认

**POST** `/api/projects/[id]/design-confirm`

**请求体**:
```json
{
  "description": "客户已确认设计方案",
  "attachmentUrl": "https://..."
}
```

### 18. 发起归档

**POST** `/api/projects/[id]/archive`

**请求体**:
```json
{
  "description": "项目已完成，申请归档"
}
```

### 19. 取消归档

**DELETE** `/api/projects/[id]/archive`

### 20. 更新阶段进度

**PUT** `/api/projects/[id]/stages/[stageId]`

**请求体**:
```json
{
  "completionPercentage": 80,
  "status": "in_progress",
  "attachmentUrl": "https://..."
}
```

## 框架协议相关 API

### 1. 获取框架协议列表

**GET** `/api/frameworks`

**查询参数**:
- `name` (string, optional): 框架协议名称模糊搜索
- `managerId` (string, optional): 项目经理ID
- `group` (string, optional): 归属部门
- `current` (number, optional): 当前页码
- `pageSize` (number, optional): 每页数量

### 2. 获取框架协议详情

**GET** `/api/frameworks/[id]`

### 3. 创建框架协议

**POST** `/api/frameworks`

**请求体**:
```json
{
  "name": "XX电商平台主项目",
  "managerId": "uuid",
  "managerName": "王五",
  "group": "设计一部",
  "bizManager": "李四",
  "clientDept": "电商客户部"
}
```

### 4. 更新框架协议

**PUT** `/api/frameworks/[id]`

### 5. 获取框架协议关联的项目

**GET** `/api/frameworks/[id]/projects`

## 注意事项

1. 所有 API 都需要用户登录认证
2. 数据库字段使用 snake_case，API 返回使用 camelCase
3. 金额字段统一使用 numeric 类型，返回时转换为 number
4. 日期字段使用 ISO 8601 格式字符串

