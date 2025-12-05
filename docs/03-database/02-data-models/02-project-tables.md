# 商业项目相关表设计

## 一、项目主表

### 1.1 projects（项目主表）

**表说明**：存储商业项目的基本信息。

**字段定义**：

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | uuid | PK | 项目ID |
| code | text | NOT NULL, UNIQUE | 项目编号（PROJ-YYYYMMDD-XXXX，自动生成） |
| name | text | NOT NULL | 项目名称 |
| type | text | NOT NULL | 项目类型（项目制/计件制/离岸制/驻场制） |
| status | text | NOT NULL, DEFAULT '待启动' | 项目状态 |
| is_pending_entry | boolean | NOT NULL, DEFAULT false | 待补录标记 |
| manager_id | uuid | FK → profiles.id, NOT NULL | 项目经理ID |
| manager_name | text | NOT NULL | 项目经理姓名 |
| group | text | NOT NULL | 归属部门 |
| biz_manager | text | NULL | 商务经理 |
| client_dept | text | NULL | 客户部 |
| plan_start_date | date | NOT NULL | 计划开始日期 |
| plan_end_date | date | NOT NULL | 计划结束日期 |
| actual_start_date | date | NULL | 实际开始日期 |
| actual_end_date | date | NULL | 实际结束日期 |
| progress | integer | NOT NULL, DEFAULT 0 | 项目进度（0-100） |
| contract_amount | numeric(15,2) | NOT NULL, DEFAULT 0 | 业绩金额 |
| demand_code | text | NULL | 需求编号（DEM-YYYYMMDD-XXXX，自动生成） |
| demand_name | text | NULL | 需求名称 |
| framework_id | uuid | FK → framework_agreements.id, NULL | 计件项目ID |
| created_by | uuid | FK → profiles.id, NOT NULL | 创建人ID |
| created_at | timestamp | NOT NULL, DEFAULT now() | 创建时间 |
| updated_at | timestamp | NOT NULL, DEFAULT now() | 更新时间 |

**索引**：
- PRIMARY KEY (id)
- UNIQUE INDEX idx_projects_code (code)
- INDEX idx_projects_type (type)
- INDEX idx_projects_status (status)
- INDEX idx_projects_group (group)
- INDEX idx_projects_manager_id (manager_id)
- INDEX idx_projects_framework_id (framework_id)

**检查约束**：
- `type` IN ('项目制', '计件制', '离岸制', '驻场制')
- `status` IN ('待启动', '进行中', '待确认', '已确认', '已归档')
- `progress` BETWEEN 0 AND 100

**RLS策略**：
- 用户可以根据部门权限查看项目
- 项目经理可以查看和管理自己的项目
- 部门主管可以查看和管理本部门的项目

### 1.2 framework_agreements（计件项目表）

**表说明**：存储计件项目（主项目）信息，用于计件制项目。

**字段定义**：

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | uuid | PK | 计件项目ID |
| code | text | NOT NULL, UNIQUE | 计件项目编号（FRAM-YYYYMMDD-XXXX，自动生成） |
| name | text | NOT NULL | 主项目名称 |
| manager_id | uuid | FK → profiles.id, NOT NULL | 项目经理ID |
| manager_name | text | NOT NULL | 项目经理 |
| biz_manager | text | NULL | 商务经理 |
| group | text | NOT NULL | 归属部门 |
| client_dept | text | NULL | 客户部 |
| created_at | timestamp | NOT NULL, DEFAULT now() | 创建时间 |
| updated_at | timestamp | NOT NULL, DEFAULT now() | 更新时间 |

**索引**：
- PRIMARY KEY (id)
- UNIQUE INDEX idx_framework_agreements_code (code)
- INDEX idx_framework_agreements_group (group)
- INDEX idx_framework_agreements_manager_id (manager_id)

**RLS策略**：
- 用户可以根据部门权限查看计件项目
- 部门主管可以创建和管理本部门的计件项目

## 二、预算表

### 2.1 project_budgets_labor（项目人力预算表）

**表说明**：存储项目的人力预算信息。

**字段定义**：

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | uuid | PK | 预算ID |
| project_id | uuid | FK → projects.id, NOT NULL | 项目ID |
| employee_level | text | NOT NULL | 级别（P0-P9, M0-M5） |
| city_type | text | NOT NULL | 类型（Chengdu/Hangzhou） |
| days | numeric(10,2) | NOT NULL | 人日数 |
| unit_cost | numeric(10,2) | NOT NULL | 单价（从成本标准获取） |
| total_cost | numeric(15,2) | NOT NULL | 总价（days * unit_cost） |
| created_at | timestamp | NOT NULL, DEFAULT now() | 创建时间 |
| updated_at | timestamp | NOT NULL, DEFAULT now() | 更新时间 |

**索引**：
- PRIMARY KEY (id)
- INDEX idx_project_budgets_labor_project_id (project_id)
- INDEX idx_project_budgets_labor_employee_level (employee_level, city_type)

**RLS策略**：
- 与项目表的RLS策略一致

### 2.2 project_budgets_travel（项目差旅预算表）

**表说明**：存储项目的差旅预算信息。

**字段定义**：

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | uuid | PK | 预算ID |
| project_id | uuid | FK → projects.id, NOT NULL | 项目ID |
| item | text | NOT NULL | 差旅事项 |
| transport_big | numeric(10,2) | NOT NULL, DEFAULT 0 | 大交通 |
| stay | numeric(10,2) | NOT NULL, DEFAULT 0 | 住宿 |
| transport_small | numeric(10,2) | NOT NULL, DEFAULT 0 | 小交通 |
| allowance | numeric(10,2) | NOT NULL, DEFAULT 0 | 补助 |
| other | numeric(10,2) | NOT NULL, DEFAULT 0 | 其他 |
| total_cost | numeric(15,2) | NOT NULL | 总价（各项费用之和） |
| created_at | timestamp | NOT NULL, DEFAULT now() | 创建时间 |
| updated_at | timestamp | NOT NULL, DEFAULT now() | 更新时间 |

**索引**：
- PRIMARY KEY (id)
- INDEX idx_project_budgets_travel_project_id (project_id)

**RLS策略**：
- 与项目表的RLS策略一致

### 2.3 project_budgets_outsource（项目外包预算表）

**表说明**：存储项目的外包预算信息。

**字段定义**：

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | uuid | PK | 预算ID |
| project_id | uuid | FK → projects.id, NOT NULL | 项目ID |
| item | text | NOT NULL | 外包事项 |
| supplier_id | uuid | FK → suppliers.id, NULL | 供应商ID |
| supplier_name | text | NULL | 供应商名称 |
| amount | numeric(15,2) | NOT NULL | 金额 |
| created_at | timestamp | NOT NULL, DEFAULT now() | 创建时间 |
| updated_at | timestamp | NOT NULL, DEFAULT now() | 更新时间 |

**索引**：
- PRIMARY KEY (id)
- INDEX idx_project_budgets_outsource_project_id (project_id)
- INDEX idx_project_budgets_outsource_supplier_id (supplier_id)

**RLS策略**：
- 与项目表的RLS策略一致

## 三、支出表

### 3.1 project_expenses_labor（项目人力支出表）

**表说明**：存储项目的人力实际支出信息，从Teambition同步或手动录入。

**字段定义**：

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | uuid | PK | 支出ID |
| project_id | uuid | FK → projects.id, NOT NULL | 项目ID |
| employee_id | uuid | FK → profiles.id, NOT NULL | 员工ID |
| employee_name | text | NOT NULL | 姓名 |
| employee_level | text | NOT NULL | 级别 |
| work_date | date | NOT NULL | 统计月份 |
| hours | numeric(10,2) | NOT NULL | 工时（小时） |
| calculated_cost | numeric(15,2) | NOT NULL | 计算成本（hours/8 * daily_cost） |
| created_at | timestamp | NOT NULL, DEFAULT now() | 创建时间 |
| updated_at | timestamp | NOT NULL, DEFAULT now() | 更新时间 |

**索引**：
- PRIMARY KEY (id)
- INDEX idx_project_expenses_labor_project_id (project_id)
- INDEX idx_project_expenses_labor_employee_id (employee_id)
- INDEX idx_project_expenses_labor_work_date (work_date)
- UNIQUE INDEX idx_project_expenses_labor_unique (project_id, employee_id, work_date)

**RLS策略**：
- 与项目表的RLS策略一致

### 3.2 project_expenses_travel（项目差旅支出表）

**表说明**：存储项目的差旅实际支出信息，手动录入。

**字段定义**：

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | uuid | PK | 支出ID |
| project_id | uuid | FK → projects.id, NOT NULL | 项目ID |
| item | text | NOT NULL | 差旅事项 |
| expense_date | date | NOT NULL | 统计月份 |
| transport_big | numeric(10,2) | NOT NULL, DEFAULT 0 | 大交通 |
| stay | numeric(10,2) | NOT NULL, DEFAULT 0 | 住宿 |
| transport_small | numeric(10,2) | NOT NULL, DEFAULT 0 | 小交通 |
| allowance | numeric(10,2) | NOT NULL, DEFAULT 0 | 补助 |
| other | numeric(10,2) | NOT NULL, DEFAULT 0 | 其他 |
| total_amount | numeric(15,2) | NOT NULL | 总金额（各项费用之和） |
| created_at | timestamp | NOT NULL, DEFAULT now() | 创建时间 |
| updated_at | timestamp | NOT NULL, DEFAULT now() | 更新时间 |

**索引**：
- PRIMARY KEY (id)
- INDEX idx_project_expenses_travel_project_id (project_id)
- INDEX idx_project_expenses_travel_expense_date (expense_date)

**RLS策略**：
- 与项目表的RLS策略一致

### 3.3 project_expenses_outsource（项目外包支出表）

**表说明**：存储项目的外包实际支出信息，手动录入。

**字段定义**：

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | uuid | PK | 支出ID |
| project_id | uuid | FK → projects.id, NOT NULL | 项目ID |
| item | text | NOT NULL | 外包事项 |
| supplier_id | uuid | FK → suppliers.id, NULL | 供应商ID |
| supplier_name | text | NULL | 供应商名称 |
| amount | numeric(15,2) | NOT NULL | 金额 |
| expense_date | date | NOT NULL | 统计月份 |
| created_at | timestamp | NOT NULL, DEFAULT now() | 创建时间 |
| updated_at | timestamp | NOT NULL, DEFAULT now() | 更新时间 |

**索引**：
- PRIMARY KEY (id)
- INDEX idx_project_expenses_outsource_project_id (project_id)
- INDEX idx_project_expenses_outsource_supplier_id (supplier_id)
- INDEX idx_project_expenses_outsource_expense_date (expense_date)

**RLS策略**：
- 与项目表的RLS策略一致

## 四、变更记录表

### 4.1 project_changes（项目变更记录表）

**表说明**：存储项目的变更记录。

**字段定义**：

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | uuid | PK | 变更记录ID |
| project_id | uuid | FK → projects.id, NOT NULL | 项目ID |
| change_type | text | NOT NULL | 变更类型（project/demand） |
| change_date | date | NOT NULL | 变更日期 |
| contract_amount | numeric(15,2) | NULL | 变更后的业绩金额 |
| cost_budget | numeric(15,2) | NULL | 变更后的成本预算 |
| labor_budget_hours | numeric(10,2) | NULL | 变更后的工时预算 |
| travel_budget | numeric(15,2) | NULL | 变更后的差旅预算 |
| outsource_budget | numeric(15,2) | NULL | 变更后的外包预算 |
| description | text | NOT NULL | 变更说明 |
| attachment_url | text | NULL | 变更附件URL |
| approval_id | uuid | FK → approvals.id, NULL | 关联的审批ID |
| created_by | uuid | FK → profiles.id, NOT NULL | 创建人ID |
| created_at | timestamp | NOT NULL, DEFAULT now() | 创建时间 |

**索引**：
- PRIMARY KEY (id)
- INDEX idx_project_changes_project_id (project_id)
- INDEX idx_project_changes_change_date (change_date)
- INDEX idx_project_changes_approval_id (approval_id)

**检查约束**：
- `change_type` IN ('project', 'demand')

**RLS策略**：
- 与项目表的RLS策略一致

## 五、数据完整性约束

### 5.1 外键约束

**projects表**：
- `manager_id` → `profiles.id` (RESTRICT DELETE)
- `framework_id` → `framework_agreements.id` (SET NULL ON DELETE)

**预算表**：
- `project_id` → `projects.id` (CASCADE DELETE)
- `supplier_id` → `suppliers.id` (SET NULL ON DELETE)

**支出表**：
- `project_id` → `projects.id` (CASCADE DELETE)
- `employee_id` → `profiles.id` (RESTRICT DELETE)
- `supplier_id` → `suppliers.id` (SET NULL ON DELETE)

**变更记录表**：
- `project_id` → `projects.id` (CASCADE DELETE)
- `approval_id` → `approvals.id` (SET NULL ON DELETE)

### 5.2 触发器

**自动计算总价**：
- `project_budgets_labor`: `total_cost = days * unit_cost`
- `project_budgets_travel`: `total_cost = transport_big + stay + transport_small + allowance + other`
- `project_expenses_travel`: `total_amount = transport_big + stay + transport_small + allowance + other`

**自动计算人力成本**：
- `project_expenses_labor`: `calculated_cost = hours / 8 * daily_cost`（从成本标准获取daily_cost）

## 六、视图

### 6.1 project_stats_view（项目统计视图）

**视图说明**：聚合项目的预算和支出统计。

**SQL**：
```sql
CREATE VIEW project_stats_view AS
SELECT 
  p.id,
  p.name,
  p.type,
  p.status,
  p.contract_amount,
  COALESCE(SUM(pbl.total_cost), 0) as budget_labor,
  COALESCE(SUM(pbt.total_cost), 0) as budget_travel,
  COALESCE(SUM(pbo.amount), 0) as budget_outsource,
  COALESCE(SUM(pel.calculated_cost), 0) as expense_labor,
  COALESCE(SUM(pet.total_amount), 0) as expense_travel,
  COALESCE(SUM(peo.amount), 0) as expense_outsource
FROM projects p
LEFT JOIN project_budgets_labor pbl ON p.id = pbl.project_id
LEFT JOIN project_budgets_travel pbt ON p.id = pbt.project_id
LEFT JOIN project_budgets_outsource pbo ON p.id = pbo.project_id
LEFT JOIN project_expenses_labor pel ON p.id = pel.project_id
LEFT JOIN project_expenses_travel pet ON p.id = pet.project_id
LEFT JOIN project_expenses_outsource peo ON p.id = peo.project_id
GROUP BY p.id;
```

## 七、函数

### 7.1 计算项目利润函数

**函数名**：`calculate_project_profit(project_id)`
- 计算项目利润
- 归档前：`contract_amount - (预计人力支出 + 差旅预算 + 外包预算)`
- 归档时：`contract_amount - (实际人力支出 + 实际差旅支出 + 实际外包支出)`
- 返回numeric

### 7.2 计算人力成本函数

**函数名**：`calculate_labor_cost(project_id, employee_id, work_date, hours)`
- 根据工时和人日成本标准计算人力成本
- 返回numeric

