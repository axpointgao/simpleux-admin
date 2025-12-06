# 售前支持相关表设计

## 一、商机主表

### 1.1 opportunities（商机主表）

**表说明**：存储售前支持商机的基本信息。

**字段定义**：

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | uuid | PK | 商机ID |
| code | text | NOT NULL, UNIQUE | 商机编号（自动生成，不在UI中显示） |
| name | text | NOT NULL | 商机名称 |
| create_date | timestamp | NOT NULL, DEFAULT now() | 创建日期 |
| status | text | NOT NULL, DEFAULT '进行中' | 商机状态 |
| win_rate | text | NULL | 赢单概率（High/Medium/Low） |
| estimated_amount | numeric(15,2) | NULL | 预估金额 |
| support_types | text[] | NULL | 支持类型数组（评估报价/投标配合/POC方案/交流分享） |
| owner_id | uuid | FK → profiles.id, NOT NULL | 负责人ID |
| owner_name | text | NOT NULL | 负责人姓名 |
| group | text | NOT NULL | 所属组（部门） |
| biz_manager | text | NULL | 商务经理 |
| client_dept | text | NULL | 所属客户部 |
| created_by | uuid | FK → profiles.id, NOT NULL | 创建人ID |
| created_at | timestamp | NOT NULL, DEFAULT now() | 创建时间 |
| updated_at | timestamp | NOT NULL, DEFAULT now() | 更新时间 |

**索引**：
- PRIMARY KEY (id)
- UNIQUE INDEX idx_opportunities_code (code)
- INDEX idx_opportunities_status (status)
- INDEX idx_opportunities_group (group)
- INDEX idx_opportunities_owner_id (owner_id)
- INDEX idx_opportunities_create_date (create_date)

**检查约束**：
- `status` IN ('进行中', '赢单', '输单', '沉默', '放弃')
- `win_rate` IN ('High', 'Medium', 'Low') OR `win_rate` IS NULL

**RLS策略**：
- 用户可以根据部门权限查看商机
- 负责人可以查看和管理自己的商机
- 部门主管可以查看和管理本部门的商机

## 二、跟进记录表

### 2.1 opportunity_followups（商机跟进记录表）

**表说明**：存储商机的跟进记录。

**字段定义**：

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | uuid | PK | 跟进记录ID |
| opportunity_id | uuid | FK → opportunities.id, NOT NULL | 商机ID |
| followup_date | timestamp | NOT NULL, DEFAULT now() | 跟进日期 |
| status | text | NOT NULL | 商机状态（跟进时的状态） |
| win_rate | text | NULL | 赢单概率 |
| estimated_amount | numeric(15,2) | NULL | 预估金额 |
| support_types | text[] | NULL | 支持类型数组 |
| note | text | NOT NULL | 跟进备注 |
| created_by | uuid | FK → profiles.id, NOT NULL | 创建人ID |
| created_at | timestamp | NOT NULL, DEFAULT now() | 创建时间 |

**索引**：
- PRIMARY KEY (id)
- INDEX idx_opportunity_followups_opportunity_id (opportunity_id)
- INDEX idx_opportunity_followups_followup_date (followup_date)

**检查约束**：
- `status` IN ('进行中', '赢单', '输单', '沉默', '放弃')
- `win_rate` IN ('High', 'Medium', 'Low') OR `win_rate` IS NULL

**RLS策略**：
- 与商机表的RLS策略一致

## 三、成本表

### 3.1 opportunity_expenses_labor（售前人力支出表）

**表说明**：存储售前支持的人力支出记录，从任务工时自动计算。

**字段定义**：

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | uuid | PK | 支出ID |
| opportunity_id | uuid | FK → opportunities.id, NOT NULL | 商机ID |
| task_id | uuid | FK → tasks.id, NOT NULL | 任务ID |
| month | date | NOT NULL | 月份（格式：YYYY-MM-01） |
| employee_id | uuid | FK → profiles.id, NOT NULL | 员工ID |
| employee_name | text | NOT NULL | 姓名 |
| employee_level | text | NOT NULL | 级别 |
| actual_hours | numeric(10,2) | NOT NULL | 实际工时（从任务工时获取） |
| cost_subtotal | numeric(15,2) | NOT NULL | 成本小计（自动计算） |
| created_at | timestamp | NOT NULL, DEFAULT now() | 创建时间 |
| updated_at | timestamp | NOT NULL, DEFAULT now() | 更新时间 |

**索引**：
- PRIMARY KEY (id)
- INDEX idx_opportunity_expenses_labor_opportunity_id (opportunity_id)
- INDEX idx_opportunity_expenses_labor_task_id (task_id)
- INDEX idx_opportunity_expenses_labor_month (month)
- INDEX idx_opportunity_expenses_labor_employee_id (employee_id)

**RLS策略**：
- 与商机表的RLS策略一致

### 3.2 opportunity_expenses_travel（售前差旅支出表）

**表说明**：存储售前支持的差旅支出记录，手动录入。

**字段定义**：

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | uuid | PK | 支出ID |
| opportunity_id | uuid | FK → opportunities.id, NOT NULL | 商机ID |
| month | date | NOT NULL | 月份（格式：YYYY-MM-01） |
| item | text | NOT NULL | 出差事项 |
| transport_big | numeric(10,2) | NOT NULL, DEFAULT 0 | 大交通 |
| stay | numeric(10,2) | NOT NULL, DEFAULT 0 | 住宿 |
| transport_small | numeric(10,2) | NOT NULL, DEFAULT 0 | 小交通 |
| allowance | numeric(10,2) | NOT NULL, DEFAULT 0 | 补助 |
| other | numeric(10,2) | NOT NULL, DEFAULT 0 | 其他 |
| travel_subtotal | numeric(15,2) | NOT NULL | 差旅小计（自动计算） |
| created_at | timestamp | NOT NULL, DEFAULT now() | 创建时间 |
| updated_at | timestamp | NOT NULL, DEFAULT now() | 更新时间 |

**索引**：
- PRIMARY KEY (id)
- INDEX idx_opportunity_expenses_travel_opportunity_id (opportunity_id)
- INDEX idx_opportunity_expenses_travel_month (month)

**RLS策略**：
- 与商机表的RLS策略一致

### 3.3 opportunity_expenses_outsource（售前外包支出表）

**表说明**：存储售前支持的外包支出记录，手动录入。

**字段定义**：

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | uuid | PK | 支出ID |
| opportunity_id | uuid | FK → opportunities.id, NOT NULL | 商机ID |
| month | date | NOT NULL | 月份（格式：YYYY-MM-01） |
| item | text | NOT NULL | 外包事项 |
| supplier_id | uuid | FK → suppliers.id, NULL | 供应商ID |
| supplier_name | text | NULL | 供应商名称 |
| outsource_subtotal | numeric(15,2) | NOT NULL | 外包小计 |
| created_at | timestamp | NOT NULL, DEFAULT now() | 创建时间 |
| updated_at | timestamp | NOT NULL, DEFAULT now() | 更新时间 |

**索引**：
- PRIMARY KEY (id)
- INDEX idx_opportunity_expenses_outsource_opportunity_id (opportunity_id)
- INDEX idx_opportunity_expenses_outsource_month (month)
- INDEX idx_opportunity_expenses_outsource_supplier_id (supplier_id)

**RLS策略**：
- 与商机表的RLS策略一致

## 四、数据完整性约束

### 4.1 外键约束

**opportunities表**：
- `owner_id` → `profiles.id` (RESTRICT DELETE)
- `created_by` → `profiles.id` (RESTRICT DELETE)

**跟进记录表**：
- `opportunity_id` → `opportunities.id` (CASCADE DELETE)
- `created_by` → `profiles.id` (RESTRICT DELETE)

**成本表**：
- `opportunity_id` → `opportunities.id` (CASCADE DELETE)
- `task_id` → `tasks.id` (SET NULL ON DELETE)
- `employee_id` → `profiles.id` (RESTRICT DELETE)
- `supplier_id` → `suppliers.id` (SET NULL ON DELETE)

### 4.2 触发器

**自动计算成本小计**：
- `opportunity_expenses_travel`: `travel_subtotal = transport_big + stay + transport_small + allowance + other`
- `opportunity_expenses_labor`: `cost_subtotal = actual_hours / 8 * daily_cost`（从成本标准获取daily_cost）

## 五、视图

### 5.1 opportunity_cost_view（商机成本统计视图）

**视图说明**：聚合商机的成本统计。

**SQL**：
```sql
CREATE VIEW opportunity_cost_view AS
SELECT 
  o.id,
  o.name,
  COALESCE(SUM(oel.cost_subtotal), 0) as total_labor_cost,
  COALESCE(SUM(oet.travel_subtotal), 0) as total_travel_cost,
  COALESCE(SUM(oeo.outsource_subtotal), 0) as total_outsource_cost,
  COALESCE(SUM(oel.cost_subtotal), 0) + 
  COALESCE(SUM(oet.travel_subtotal), 0) + 
  COALESCE(SUM(oeo.outsource_subtotal), 0) as total_cost
FROM opportunities o
LEFT JOIN opportunity_expenses_labor oel ON o.id = oel.opportunity_id
LEFT JOIN opportunity_expenses_travel oet ON o.id = oet.opportunity_id
LEFT JOIN opportunity_expenses_outsource oeo ON o.id = oeo.opportunity_id
GROUP BY o.id;
```

## 六、函数

### 6.1 计算商机总成本函数

**函数名**：`calculate_opportunity_cost(opportunity_id)`
- 计算商机的总成本（人力 + 差旅 + 外包）
- 返回numeric

