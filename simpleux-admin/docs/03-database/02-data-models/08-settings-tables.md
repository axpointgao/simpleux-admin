# 系统设置相关表设计

## 一、成本标准表

### 1.1 cost_standards（人日成本标准表）

**表说明**：存储人日成本标准配置。

**字段定义**：

| 字段名         | 类型          | 约束                       | 说明                         |
| -------------- | ------------- | -------------------------- | ---------------------------- |
| id             | uuid          | PK                         | 成本标准 ID                  |
| employee_level | text          | NOT NULL                   | 员工级别（P0-P9, M0-M5）     |
| city_type      | text          | NOT NULL                   | 城市类型（Chengdu/Hangzhou） |
| daily_cost     | numeric(10,2) | NOT NULL                   | 人日成本                     |
| effective_from | date          | NOT NULL                   | 生效开始日期                 |
| effective_to   | date          | NULL                       | 生效结束日期                 |
| is_active      | boolean       | NOT NULL, DEFAULT true     | 是否启用                     |
| created_by     | uuid          | FK → profiles.id, NOT NULL | 创建人 ID                    |
| created_at     | timestamp     | NOT NULL, DEFAULT now()    | 创建时间                     |
| updated_at     | timestamp     | NOT NULL, DEFAULT now()    | 更新时间                     |

**索引**：

- PRIMARY KEY (id)
- UNIQUE INDEX idx_cost_standards_unique (employee_level, city_type, effective_from)
- INDEX idx_cost_standards_employee_level (employee_level, city_type)
- INDEX idx_cost_standards_effective_date (effective_from, effective_to)

**检查约束**：

- `employee_level` IN ('P0', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'P9', 'M0', 'M1', 'M2', 'M3', 'M4', 'M5')
- `city_type` IN ('Chengdu', 'Hangzhou')
- `daily_cost` > 0
- `effective_to` IS NULL OR `effective_to` >= `effective_from`

**RLS 策略**：

- 所有用户都可以查看成本标准
- 只有系统管理员可以编辑成本标准

## 二、审批流程模板表

### 2.1 approval_process_templates（审批流程模板表）

**表说明**：存储审批流程模板配置。

**字段定义**：

| 字段名     | 类型      | 约束                       | 说明                      |
| ---------- | --------- | -------------------------- | ------------------------- |
| id         | uuid      | PK                         | 模板 ID                   |
| type       | text      | NOT NULL, UNIQUE           | 审批类型                  |
| name       | text      | NOT NULL                   | 模板名称                  |
| steps      | jsonb     | NOT NULL                   | 审批步骤配置（JSON 数组） |
| is_active  | boolean   | NOT NULL, DEFAULT true     | 是否启用                  |
| created_by | uuid      | FK → profiles.id, NOT NULL | 创建人 ID                 |
| created_at | timestamp | NOT NULL, DEFAULT now()    | 创建时间                  |
| updated_at | timestamp | NOT NULL, DEFAULT now()    | 更新时间                  |

**索引**：

- PRIMARY KEY (id)
- UNIQUE INDEX idx_approval_process_templates_type (type)
- INDEX idx_approval_process_templates_is_active (is_active)

**检查约束**：

- `type` IN ('project_create', 'project_change', 'project_post_record', 'expense_travel', 'expense_outsource', 'design_confirm', 'contribution_create', 'contribution_acceptance', 'performance_acceptance')

**RLS 策略**：

- 所有用户都可以查看审批流程模板
- 只有系统管理员可以编辑审批流程模板

**steps 字段 JSON 结构**：

```json
[
  {
    "step_order": 1,
    "approver_type": "role",
    "approver_value": "department_head",
    "is_required": true
  },
  {
    "step_order": 2,
    "approver_type": "user",
    "approver_value": "user_id",
    "is_required": true
  }
]
```

## 三、集成配置表

### 3.1 integration_settings（集成配置表）

**表说明**：存储第三方集成配置（钉钉等）。

**字段定义**：

| 字段名           | 类型      | 约束                    | 说明               |
| ---------------- | --------- | ----------------------- | ------------------ |
| id               | uuid      | PK                      | 配置 ID            |
| integration_type | text      | NOT NULL                | 集成类型           |
| config_key       | text      | NOT NULL                | 配置键             |
| config_value     | text      | NULL                    | 配置值（加密存储） |
| is_active        | boolean   | NOT NULL, DEFAULT true  | 是否启用           |
| created_at       | timestamp | NOT NULL, DEFAULT now() | 创建时间           |
| updated_at       | timestamp | NOT NULL, DEFAULT now() | 更新时间           |

**索引**：

- PRIMARY KEY (id)
- UNIQUE INDEX idx_integration_settings_unique (integration_type, config_key)
- INDEX idx_integration_settings_integration_type (integration_type)

**检查约束**：

- `integration_type` IN ('dingtalk')

**RLS 策略**：

- 只有系统管理员可以查看和编辑集成配置

## 四、通知配置表

### 4.1 notification_configs（通知配置表）

**表说明**：存储通知配置。

**字段定义**：

| 字段名            | 类型      | 约束                    | 说明     |
| ----------------- | --------- | ----------------------- | -------- |
| id                | uuid      | PK                      | 配置 ID  |
| notification_type | text      | NOT NULL                | 通知类型 |
| channel           | text      | NOT NULL                | 通知渠道 |
| template          | text      | NULL                    | 通知模板 |
| is_enabled        | boolean   | NOT NULL, DEFAULT true  | 是否启用 |
| created_at        | timestamp | NOT NULL, DEFAULT now() | 创建时间 |
| updated_at        | timestamp | NOT NULL, DEFAULT now() | 更新时间 |

**索引**：

- PRIMARY KEY (id)
- UNIQUE INDEX idx_notification_configs_unique (notification_type, channel)
- INDEX idx_notification_configs_notification_type (notification_type)

**检查约束**：

- `notification_type` IN ('approval', 'project_status', 'task_assigned', 'workhour_reminder')
- `channel` IN ('dingtalk', 'email', 'sms')

**RLS 策略**：

- 只有系统管理员可以查看和编辑通知配置

## 五、系统参数表

### 5.1 system_parameters（系统参数表）

**表说明**：存储系统参数配置。

**字段定义**：

| 字段名      | 类型      | 约束                    | 说明     |
| ----------- | --------- | ----------------------- | -------- |
| id          | uuid      | PK                      | 参数 ID  |
| param_key   | text      | NOT NULL, UNIQUE        | 参数键   |
| param_value | text      | NULL                    | 参数值   |
| param_type  | text      | NOT NULL                | 参数类型 |
| description | text      | NULL                    | 参数描述 |
| created_at  | timestamp | NOT NULL, DEFAULT now() | 创建时间 |
| updated_at  | timestamp | NOT NULL, DEFAULT now() | 更新时间 |

**索引**：

- PRIMARY KEY (id)
- UNIQUE INDEX idx_system_parameters_param_key (param_key)

**检查约束**：

- `param_type` IN ('string', 'number', 'boolean', 'json')

**RLS 策略**：

- 所有用户都可以查看系统参数
- 只有系统管理员可以编辑系统参数

## 六、数据完整性约束

### 6.1 外键约束

**cost_standards 表**：

- `created_by` → `profiles.id` (RESTRICT DELETE)

**approval_process_templates 表**：

- `created_by` → `profiles.id` (RESTRICT DELETE)

## 七、视图

### 7.1 active_cost_standards_view（当前生效的成本标准视图）

**视图说明**：获取当前生效的成本标准。

**SQL**：

```sql
CREATE VIEW active_cost_standards_view AS
SELECT
  cs.*
FROM cost_standards cs
WHERE cs.is_active = true
  AND cs.effective_from <= CURRENT_DATE
  AND (cs.effective_to IS NULL OR cs.effective_to >= CURRENT_DATE);
```

## 八、函数

### 8.1 获取成本标准函数

**函数名**：`get_cost_standard(employee_level, city_type, date)`

- 根据员工级别、城市类型和日期获取成本标准
- 返回 numeric
