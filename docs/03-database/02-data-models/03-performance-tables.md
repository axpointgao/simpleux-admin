# 业绩管理相关表设计

## 一、业绩记录表

### 1.1 performance_records（业绩记录主表）

**表说明**：存储业绩记录的基本信息。

**字段定义**：

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | uuid | PK | 业绩记录ID |
| project_id | uuid | FK → projects.id, NULL | 项目ID（项目制/离岸制/驻场制） |
| demand_code | text | NULL | 需求编号（计件制） |
| demand_name | text | NULL | 需求名称（计件制） |
| record_month | date | NULL | 业绩月份（离岸制/驻场制必填，格式：YYYY-MM-01） |
| registration_amount | numeric(15,2) | NOT NULL | 业绩金额（登记金额） |
| split_amount | numeric(15,2) | NULL | 拆分金额 |
| status | text | NOT NULL, DEFAULT 'draft' | 状态（draft/confirmed） |
| created_at | timestamp | NOT NULL, DEFAULT now() | 创建时间 |
| updated_at | timestamp | NOT NULL, DEFAULT now() | 更新时间 |

**索引**：
- PRIMARY KEY (id)
- INDEX idx_performance_records_project_id (project_id)
- INDEX idx_performance_records_demand_code (demand_code)
- INDEX idx_performance_records_record_month (record_month)
- INDEX idx_performance_records_status (status)
- UNIQUE INDEX idx_performance_records_project_month (project_id, record_month) WHERE project_id IS NOT NULL AND record_month IS NOT NULL
- UNIQUE INDEX idx_performance_records_demand (demand_code) WHERE demand_code IS NOT NULL

**检查约束**：
- `status` IN ('draft', 'confirmed')
- 项目制和计件制：`project_id IS NOT NULL OR demand_code IS NOT NULL`，`record_month IS NULL`
- 离岸制和驻场制：`project_id IS NOT NULL`，`record_month IS NOT NULL`

**RLS策略**：
- 用户可以根据部门权限查看业绩记录
- 部门主管可以查看和管理本部门的业绩记录

### 1.2 performance_acceptances（业绩验收表）

**表说明**：存储业绩验收记录。

**字段定义**：

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | uuid | PK | 验收记录ID |
| performance_id | uuid | FK → performance_records.id, NOT NULL | 业绩记录ID |
| acceptance_month | date | NOT NULL | 验收月份（格式：YYYY-MM-01） |
| acceptance_amount | numeric(15,2) | NOT NULL | 验收金额 |
| status | text | NOT NULL | 验收状态（未验收/部分验收/全部验收） |
| description | text | NULL | 验收说明 |
| attachment_url | text | NULL | 需求平台截图URL |
| approval_id | uuid | FK → approvals.id, NULL | 关联的审批ID |
| created_at | timestamp | NOT NULL, DEFAULT now() | 创建时间 |
| updated_at | timestamp | NOT NULL, DEFAULT now() | 更新时间 |

**索引**：
- PRIMARY KEY (id)
- INDEX idx_performance_acceptances_performance_id (performance_id)
- INDEX idx_performance_acceptances_acceptance_month (acceptance_month)
- INDEX idx_performance_acceptances_approval_id (approval_id)

**检查约束**：
- `status` IN ('未验收', '部分验收', '全部验收')
- `acceptance_amount` > 0

**RLS策略**：
- 与业绩记录表的RLS策略一致

### 1.3 performance_settlements（业绩结算表）

**表说明**：存储业绩结算记录。

**字段定义**：

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | uuid | PK | 结算记录ID |
| performance_id | uuid | FK → performance_records.id, NOT NULL | 业绩记录ID |
| settlement_date | date | NULL | 结算日期（为空=待结算，有值=已结算） |
| settlement_amount | numeric(15,2) | NOT NULL | 结算金额 |
| status | text | NOT NULL, DEFAULT 'pending' | 结算状态（pending/completed） |
| created_at | timestamp | NOT NULL, DEFAULT now() | 创建时间 |
| updated_at | timestamp | NOT NULL, DEFAULT now() | 更新时间 |

**索引**：
- PRIMARY KEY (id)
- INDEX idx_performance_settlements_performance_id (performance_id)
- INDEX idx_performance_settlements_settlement_date (settlement_date)
- INDEX idx_performance_settlements_status (status)

**检查约束**：
- `status` IN ('pending', 'completed')
- `settlement_amount` > 0

**RLS策略**：
- 与业绩记录表的RLS策略一致

### 1.4 performance_payments（业绩到账表）

**表说明**：存储业绩到账记录。

**字段定义**：

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | uuid | PK | 到账记录ID |
| performance_id | uuid | FK → performance_records.id, NOT NULL | 业绩记录ID |
| payment_date | date | NOT NULL | 到账日期 |
| payment_amount | numeric(15,2) | NOT NULL | 到账金额 |
| status | text | NOT NULL | 到账状态（未到账/部分到账/全部到账） |
| created_at | timestamp | NOT NULL, DEFAULT now() | 创建时间 |
| updated_at | timestamp | NOT NULL, DEFAULT now() | 更新时间 |

**索引**：
- PRIMARY KEY (id)
- INDEX idx_performance_payments_performance_id (performance_id)
- INDEX idx_performance_payments_payment_date (payment_date)

**检查约束**：
- `status` IN ('未到账', '部分到账', '全部到账')
- `payment_amount` > 0

**RLS策略**：
- 与业绩记录表的RLS策略一致

### 1.5 performance_splits（业绩拆分表）

**表说明**：存储业绩拆分记录，用于跨部门资源借用的业绩分配。

**字段定义**：

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | uuid | PK | 拆分记录ID |
| performance_id | uuid | FK → performance_records.id, NOT NULL | 业绩记录ID |
| department | text | NOT NULL | 拆分到的部门（Department枚举） |
| split_amount | numeric(15,2) | NOT NULL | 拆分金额 |
| split_reason | text | NULL | 拆分原因 |
| operator_id | uuid | FK → profiles.id, NOT NULL | 操作人ID（归属部门主管） |
| operator_name | text | NOT NULL | 操作人姓名 |
| created_at | timestamp | NOT NULL, DEFAULT now() | 创建时间 |
| updated_at | timestamp | NOT NULL, DEFAULT now() | 更新时间 |

**索引**：
- PRIMARY KEY (id)
- INDEX idx_performance_splits_performance_id (performance_id)
- INDEX idx_performance_splits_department (department)

**检查约束**：
- `split_amount` > 0

**RLS策略**：
- 与业绩记录表的RLS策略一致

### 1.6 performance_change_logs（业绩变更日志表）

**表说明**：记录业绩记录及其相关数据的状态变更历史。

**字段定义**：

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | uuid | PK | 日志ID |
| performance_id | uuid | FK → performance_records.id, NOT NULL | 业绩记录ID |
| change_type | text | NOT NULL | 变更类型 |
| change_field | text | NULL | 变更的字段名称 |
| old_value | text | NULL | 变更前的值 |
| new_value | text | NULL | 变更后的值 |
| operator_id | uuid | FK → profiles.id, NOT NULL | 操作人ID |
| operator_name | text | NOT NULL | 操作人姓名 |
| change_time | timestamp | NOT NULL, DEFAULT now() | 变更时间 |
| description | text | NULL | 变更说明 |

**索引**：
- PRIMARY KEY (id)
- INDEX idx_performance_change_logs_performance_id (performance_id)
- INDEX idx_performance_change_logs_change_type (change_type)
- INDEX idx_performance_change_logs_change_time (change_time)

**检查约束**：
- `change_type` IN ('registration_status', 'registration_amount', 'need_settlement', 'acceptance', 'settlement', 'payment', 'split')

**RLS策略**：
- 与业绩记录表的RLS策略一致

## 二、数据完整性约束

### 2.1 外键约束

**performance_records表**：
- `project_id` → `projects.id` (SET NULL ON DELETE)

**验收、结算、到账、拆分表**：
- `performance_id` → `performance_records.id` (CASCADE DELETE)
- `approval_id` → `approvals.id` (SET NULL ON DELETE)

**变更日志表**：
- `performance_id` → `performance_records.id` (CASCADE DELETE)
- `operator_id` → `profiles.id` (RESTRICT DELETE)

### 2.2 业务约束

**业绩金额验证**：
- 验收金额不能超过业绩金额
- 结算金额不能超过验收金额
- 到账金额不能超过业绩金额
- 拆分金额合计必须等于业绩金额

**唯一性约束**：
- 项目制/计件制：一个项目/需求只有一条业绩记录
- 离岸制/驻场制：一个项目在一个月份只有一条业绩记录

## 三、视图

### 3.1 performance_stats_view（业绩统计视图）

**视图说明**：聚合业绩的验收、结算、到账统计。

**SQL**：
```sql
CREATE VIEW performance_stats_view AS
SELECT 
  pr.id,
  pr.registration_amount,
  COALESCE(SUM(pa.acceptance_amount), 0) as total_acceptance_amount,
  COALESCE(SUM(ps.settlement_amount), 0) as total_settlement_amount,
  COALESCE(SUM(pp.payment_amount), 0) as total_payment_amount,
  COALESCE(SUM(psplit.split_amount), 0) as total_split_amount
FROM performance_records pr
LEFT JOIN performance_acceptances pa ON pr.id = pa.performance_id AND pa.status != '未验收'
LEFT JOIN performance_settlements ps ON pr.id = ps.performance_id AND ps.status = 'completed'
LEFT JOIN performance_payments pp ON pr.id = pp.performance_id
LEFT JOIN performance_splits psplit ON pr.id = psplit.performance_id
GROUP BY pr.id;
```

## 四、函数

### 4.1 计算剩余可结算金额函数

**函数名**：`calculate_remaining_settlement_amount(performance_id)`
- 计算剩余可结算金额
- 公式：`total_acceptance_amount - total_settlement_amount - pending_settlement_amount`
- 返回numeric

### 4.2 验证拆分金额函数

**函数名**：`validate_split_amount(performance_id)`
- 验证拆分金额合计是否等于业绩金额
- 返回boolean

