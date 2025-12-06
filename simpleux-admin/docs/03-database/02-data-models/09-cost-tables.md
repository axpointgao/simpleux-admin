# 成本管理相关表设计

## 一、员工月度完全人力成本表

### 1.1 employee_monthly_costs（员工月度完全人力成本表）

**表说明**：存储每个员工每月的完全人力成本，用于计算部门成本和驻场制项目成本。

**字段定义**：

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | uuid | PK | 成本记录ID |
| employee_id | uuid | FK → profiles.id, NOT NULL | 员工ID |
| employee_name | text | NOT NULL | 员工姓名（历史快照字段） |
| month | date | NOT NULL | 月份（格式：YYYY-MM-01） |
| work_days | numeric(3,1) | NOT NULL | 在职天数（0、0.5、1） |
| employee_level | text | NOT NULL | 员工级别（P0-P9, M0-M5，历史快照字段） |
| city_type | text | NOT NULL | 城市类型（Chengdu/Hangzhou，历史快照字段） |
| department | text | NOT NULL | 员工部门（历史快照字段） |
| daily_cost | numeric(10,2) | NOT NULL | 人日成本（从成本标准获取） |
| total_cost | numeric(12,2) | NOT NULL | 总成本（计算公式：daily_cost × work_days × 21.75） |
| recorded_by | uuid | FK → profiles.id, NOT NULL | 录入人ID |
| recorded_by_name | text | NOT NULL | 录入人姓名 |
| created_at | timestamp | NOT NULL, DEFAULT now() | 创建时间 |
| updated_at | timestamp | NOT NULL, DEFAULT now() | 更新时间 |

**索引**：
- PRIMARY KEY (id)
- UNIQUE INDEX idx_employee_monthly_costs_unique (employee_id, month)
- INDEX idx_employee_monthly_costs_employee (employee_id)
- INDEX idx_employee_monthly_costs_month (month)
- INDEX idx_employee_monthly_costs_level_city (employee_level, city_type)
- INDEX idx_employee_monthly_costs_department (department)

**检查约束**：
- `work_days` IN (0, 0.5, 1)
- `employee_level` IN ('P0', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'P9', 'M0', 'M1', 'M2', 'M3', 'M4', 'M5')
- `city_type` IN ('Chengdu', 'Hangzhou')
- `daily_cost` > 0
- `total_cost` > 0

**RLS策略**：
- 财务人员可以查看和编辑所有成本记录
- 部门主管可以查看本部门的成本记录
- 其他人员不能查看成本记录

**触发器**：
- 自动计算 `total_cost`：`total_cost = daily_cost × work_days × 21.75`
- 自动更新 `updated_at` 时间戳
- **历史数据快照**：创建记录时，自动从 `profiles` 表快照员工信息（姓名、级别、城市类型、部门）到成本记录中

**历史数据保护规则**：
- `employee_name`、`employee_level`、`city_type`、`department` 为历史快照字段
- 创建成本记录时，系统自动从 `profiles` 表获取并存储这些信息
- 创建后，这些字段不允许修改，确保历史数据的准确性
- 即使员工后续离职、级别变化、部门调整，历史成本记录保持不变
- 查询历史成本时，使用快照信息，而不是实时查询员工表
- 部门成本统计基于历史快照的部门信息，确保历史部门成本统计的准确性

## 二、项目差旅成本表

### 2.1 project_travel_costs（项目差旅成本表）

**表说明**：存储项目相关的差旅成本，由财务人员录入。与项目详情页的差旅支出功能共享此表（或通过关联表关联）。

**字段定义**：

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | uuid | PK | 成本记录ID |
| project_id | uuid | FK → projects.id, NOT NULL | 项目ID |
| project_name | text | NOT NULL | 项目名称（冗余字段） |
| month | date | NOT NULL | 月份（格式：YYYY-MM-01） |
| item | text | NOT NULL | 出差事项 |
| transport_big | numeric(10,2) | DEFAULT 0 | 大交通费用 |
| stay | numeric(10,2) | DEFAULT 0 | 住宿费用 |
| transport_small | numeric(10,2) | DEFAULT 0 | 小交通费用 |
| allowance | numeric(10,2) | DEFAULT 0 | 差旅补贴 |
| other | numeric(10,2) | DEFAULT 0 | 其他费用 |
| total_cost | numeric(12,2) | NOT NULL | 总成本（计算公式：所有费用项之和） |
| recorded_by | uuid | FK → profiles.id, NOT NULL | 录入人ID |
| recorded_by_name | text | NOT NULL | 录入人姓名 |
| created_at | timestamp | NOT NULL, DEFAULT now() | 创建时间 |
| updated_at | timestamp | NOT NULL, DEFAULT now() | 更新时间 |

**索引**：
- PRIMARY KEY (id)
- INDEX idx_project_travel_costs_project (project_id)
- INDEX idx_project_travel_costs_month (month)
- INDEX idx_project_travel_costs_project_month (project_id, month)

**检查约束**：
- `total_cost` >= 0
- 至少有一项费用 > 0（通过应用层验证）

**RLS策略**：
- 财务人员可以查看和编辑所有成本记录
- 项目经理可以查看关联项目的成本记录
- 其他人员不能查看成本记录

**触发器**：
- 自动计算 `total_cost`：`total_cost = transport_big + stay + transport_small + allowance + other`
- 自动更新 `updated_at` 时间戳

## 三、项目外包成本表

### 3.1 project_outsource_costs（项目外包成本表）

**表说明**：存储项目相关的外包成本，由财务人员录入。与项目详情页的外包支出功能共享此表（或通过关联表关联）。

**字段定义**：

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | uuid | PK | 成本记录ID |
| project_id | uuid | FK → projects.id, NOT NULL | 项目ID |
| project_name | text | NOT NULL | 项目名称（冗余字段） |
| month | date | NOT NULL | 月份（格式：YYYY-MM-01） |
| item | text | NOT NULL | 外包事项 |
| supplier_id | uuid | FK → suppliers.id, NULL | 供应商ID |
| supplier_name | text | NULL | 供应商名称（冗余字段） |
| amount | numeric(12,2) | NOT NULL | 外包金额 |
| recorded_by | uuid | FK → profiles.id, NOT NULL | 录入人ID |
| recorded_by_name | text | NOT NULL | 录入人姓名 |
| created_at | timestamp | NOT NULL, DEFAULT now() | 创建时间 |
| updated_at | timestamp | NOT NULL, DEFAULT now() | 更新时间 |

**索引**：
- PRIMARY KEY (id)
- INDEX idx_project_outsource_costs_project (project_id)
- INDEX idx_project_outsource_costs_month (month)
- INDEX idx_project_outsource_costs_project_month (project_id, month)
- INDEX idx_project_outsource_costs_supplier (supplier_id)

**检查约束**：
- `amount` > 0

**RLS策略**：
- 财务人员可以查看和编辑所有成本记录
- 项目经理可以查看关联项目的成本记录
- 其他人员不能查看成本记录

**触发器**：
- 自动更新 `updated_at` 时间戳

## 四、商机差旅成本表

### 4.1 opportunity_travel_costs（商机差旅成本表）

**表说明**：存储售前支持商机相关的差旅成本，由财务人员录入。

**字段定义**：

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | uuid | PK | 成本记录ID |
| opportunity_id | uuid | FK → opportunities.id, NOT NULL | 商机ID |
| opportunity_name | text | NOT NULL | 商机名称（冗余字段） |
| month | date | NOT NULL | 月份（格式：YYYY-MM-01） |
| item | text | NOT NULL | 出差事项 |
| transport_big | numeric(10,2) | DEFAULT 0 | 大交通费用 |
| stay | numeric(10,2) | DEFAULT 0 | 住宿费用 |
| transport_small | numeric(10,2) | DEFAULT 0 | 小交通费用 |
| allowance | numeric(10,2) | DEFAULT 0 | 差旅补贴 |
| other | numeric(10,2) | DEFAULT 0 | 其他费用 |
| total_cost | numeric(12,2) | NOT NULL | 总成本（计算公式：所有费用项之和） |
| recorded_by | uuid | FK → profiles.id, NOT NULL | 录入人ID |
| recorded_by_name | text | NOT NULL | 录入人姓名 |
| created_at | timestamp | NOT NULL, DEFAULT now() | 创建时间 |
| updated_at | timestamp | NOT NULL, DEFAULT now() | 更新时间 |

**索引**：
- PRIMARY KEY (id)
- INDEX idx_opportunity_travel_costs_opportunity (opportunity_id)
- INDEX idx_opportunity_travel_costs_month (month)
- INDEX idx_opportunity_travel_costs_opportunity_month (opportunity_id, month)

**检查约束**：
- `total_cost` >= 0
- 至少有一项费用 > 0（通过应用层验证）

**RLS策略**：
- 财务人员可以查看和编辑所有成本记录
- 商机负责人可以查看关联商机的成本记录
- 其他人员不能查看成本记录

**触发器**：
- 自动计算 `total_cost`：`total_cost = transport_big + stay + transport_small + allowance + other`
- 自动更新 `updated_at` 时间戳

## 五、商机外包成本表

### 5.1 opportunity_outsource_costs（商机外包成本表）

**表说明**：存储售前支持商机相关的外包成本，由财务人员录入。

**字段定义**：

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | uuid | PK | 成本记录ID |
| opportunity_id | uuid | FK → opportunities.id, NOT NULL | 商机ID |
| opportunity_name | text | NOT NULL | 商机名称（冗余字段） |
| month | date | NOT NULL | 月份（格式：YYYY-MM-01） |
| item | text | NOT NULL | 外包事项 |
| supplier_id | uuid | FK → suppliers.id, NULL | 供应商ID |
| supplier_name | text | NULL | 供应商名称（冗余字段） |
| amount | numeric(12,2) | NOT NULL | 外包金额 |
| recorded_by | uuid | FK → profiles.id, NOT NULL | 录入人ID |
| recorded_by_name | text | NOT NULL | 录入人姓名 |
| created_at | timestamp | NOT NULL, DEFAULT now() | 创建时间 |
| updated_at | timestamp | NOT NULL, DEFAULT now() | 更新时间 |

**索引**：
- PRIMARY KEY (id)
- INDEX idx_opportunity_outsource_costs_opportunity (opportunity_id)
- INDEX idx_opportunity_outsource_costs_month (month)
- INDEX idx_opportunity_outsource_costs_opportunity_month (opportunity_id, month)
- INDEX idx_opportunity_outsource_costs_supplier (supplier_id)

**检查约束**：
- `amount` > 0

**RLS策略**：
- 财务人员可以查看和编辑所有成本记录
- 商机负责人可以查看关联商机的成本记录
- 其他人员不能查看成本记录

**触发器**：
- 自动更新 `updated_at` 时间戳

## 六、驻场制项目成本关联表（可选）

### 6.1 onsite_project_costs（驻场制项目成本表）

**表说明**：存储驻场制项目的成本记录，由系统自动创建（与业绩登记关联）。如果不需要单独存储，可以通过查询 `employee_monthly_costs` 和业绩记录关联计算。

**字段定义**：

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | uuid | PK | 成本记录ID |
| project_id | uuid | FK → projects.id, NOT NULL | 项目ID |
| performance_record_id | uuid | FK → performance_records.id, NOT NULL | 业绩记录ID |
| month | date | NOT NULL | 月份（格式：YYYY-MM-01） |
| total_cost | numeric(12,2) | NOT NULL | 总成本（计算公式：所有参与员工的完全人力成本之和） |
| created_at | timestamp | NOT NULL, DEFAULT now() | 创建时间 |
| updated_at | timestamp | NOT NULL, DEFAULT now() | 更新时间 |

**索引**：
- PRIMARY KEY (id)
- UNIQUE INDEX idx_onsite_project_costs_unique (project_id, performance_record_id)
- INDEX idx_onsite_project_costs_project (project_id)
- INDEX idx_onsite_project_costs_month (month)

**检查约束**：
- `total_cost` > 0

**RLS策略**：
- 财务人员可以查看所有成本记录
- 项目经理可以查看关联项目的成本记录
- 其他人员不能查看成本记录

**触发器**：
- 自动更新 `updated_at` 时间戳

**注意**：此表为可选表。如果不需要单独存储，可以通过查询 `employee_monthly_costs` 和业绩记录关联计算。具体实现方式根据业务需求决定。

### 6.2 onsite_project_cost_details（驻场制项目成本明细表）

**表说明**：存储驻场制项目成本的明细（参与人员和成本），用于记录每个月的参与人员和对应的成本。

**字段定义**：

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | uuid | PK | 明细ID |
| onsite_project_cost_id | uuid | FK → onsite_project_costs.id, NOT NULL | 驻场制项目成本ID |
| employee_id | uuid | FK → profiles.id, NOT NULL | 员工ID |
| employee_name | text | NOT NULL | 员工姓名（冗余字段） |
| employee_monthly_cost_id | uuid | FK → employee_monthly_costs.id, NOT NULL | 员工月度成本ID |
| cost_amount | numeric(12,2) | NOT NULL | 成本金额（从员工月度成本获取） |
| created_at | timestamp | NOT NULL, DEFAULT now() | 创建时间 |

**索引**：
- PRIMARY KEY (id)
- INDEX idx_onsite_project_cost_details_cost (onsite_project_cost_id)
- INDEX idx_onsite_project_cost_details_employee (employee_id)

**检查约束**：
- `cost_amount` > 0

**RLS策略**：
- 财务人员可以查看所有成本明细
- 项目经理可以查看关联项目的成本明细
- 其他人员不能查看成本明细

**注意**：此表为可选表。如果不需要单独存储明细，可以通过查询 `employee_monthly_costs` 和业绩记录关联计算。具体实现方式根据业务需求决定。

## 七、数据完整性约束

### 7.1 外键约束

**employee_monthly_costs表**：
- `employee_id` → `profiles.id` (RESTRICT DELETE)
- `recorded_by` → `profiles.id` (RESTRICT DELETE)

**project_travel_costs表**：
- `project_id` → `projects.id` (RESTRICT DELETE)
- `recorded_by` → `profiles.id` (RESTRICT DELETE)

**project_outsource_costs表**：
- `project_id` → `projects.id` (RESTRICT DELETE)
- `supplier_id` → `suppliers.id` (SET NULL DELETE)
- `recorded_by` → `profiles.id` (RESTRICT DELETE)

**opportunity_travel_costs表**：
- `opportunity_id` → `opportunities.id` (RESTRICT DELETE)
- `recorded_by` → `profiles.id` (RESTRICT DELETE)

**opportunity_outsource_costs表**：
- `opportunity_id` → `opportunities.id` (RESTRICT DELETE)
- `supplier_id` → `suppliers.id` (SET NULL DELETE)
- `recorded_by` → `profiles.id` (RESTRICT DELETE)

**onsite_project_costs表**（如果使用）：
- `project_id` → `projects.id` (RESTRICT DELETE)
- `performance_record_id` → `performance_records.id` (RESTRICT DELETE)

**onsite_project_cost_details表**（如果使用）：
- `onsite_project_cost_id` → `onsite_project_costs.id` (CASCADE DELETE)
- `employee_id` → `profiles.id` (RESTRICT DELETE)
- `employee_monthly_cost_id` → `employee_monthly_costs.id` (RESTRICT DELETE)

### 7.2 唯一性约束

**employee_monthly_costs表**：
- `(employee_id, month)` 唯一，确保每个员工每个月只有一条成本记录

**onsite_project_costs表**（如果使用）：
- `(project_id, performance_record_id)` 唯一，确保每个项目的每个业绩记录只有一条成本记录

## 八、视图

### 8.1 department_cost_summary_view（部门成本汇总视图）

**视图说明**：按部门和月份汇总部门总成本。**重要**：使用历史快照的部门信息，确保历史数据的准确性。

**SQL**：
```sql
CREATE VIEW department_cost_summary_view AS
SELECT 
  d.code AS department_code,
  d.name AS department_name,
  DATE_TRUNC('month', emc.month) AS month,
  -- 部门人力成本（基于历史快照的部门信息）
  COALESCE(SUM(CASE WHEN emc.department = d.code THEN emc.total_cost ELSE 0 END), 0) AS human_resource_cost,
  -- 部门项目差旅成本
  COALESCE(SUM(ptc.total_cost), 0) AS project_travel_cost,
  -- 部门项目外包成本
  COALESCE(SUM(poc.amount), 0) AS project_outsource_cost,
  -- 部门商机差旅成本
  COALESCE(SUM(otc.total_cost), 0) AS opportunity_travel_cost,
  -- 部门商机外包成本
  COALESCE(SUM(ooc.amount), 0) AS opportunity_outsource_cost,
  -- 部门总成本
  COALESCE(SUM(CASE WHEN emc.department = d.code THEN emc.total_cost ELSE 0 END), 0) + 
  COALESCE(SUM(ptc.total_cost), 0) + 
  COALESCE(SUM(poc.amount), 0) + 
  COALESCE(SUM(otc.total_cost), 0) + 
  COALESCE(SUM(ooc.amount), 0) AS total_cost
FROM departments d
LEFT JOIN employee_monthly_costs emc ON emc.department = d.code
LEFT JOIN projects prj ON prj.group = d.code
LEFT JOIN project_travel_costs ptc ON ptc.project_id = prj.id
LEFT JOIN project_outsource_costs poc ON poc.project_id = prj.id
LEFT JOIN opportunities opp ON opp.group = d.code
LEFT JOIN opportunity_travel_costs otc ON otc.opportunity_id = opp.id
LEFT JOIN opportunity_outsource_costs ooc ON ooc.opportunity_id = opp.id
GROUP BY d.code, d.name, DATE_TRUNC('month', emc.month);
```

**重要说明**：
- 部门人力成本统计使用 `emc.department`（历史快照字段），而不是实时查询 `profiles.department`
- 即使员工后续部门调整，历史成本仍归属于当时的部门
- 确保历史部门成本统计的准确性和可追溯性

## 九、函数

### 9.1 获取员工月度成本函数

**函数名**：`get_employee_monthly_cost(employee_id, month)`
- 根据员工ID和月份获取员工月度完全人力成本
- 返回 `employee_monthly_costs` 记录

### 9.2 计算部门成本函数

**函数名**：`calculate_department_cost(department_code, month)`
- 根据部门代码和月份计算部门总成本
- **重要**：使用历史快照的部门信息，而不是实时查询员工表的当前部门
- 部门人力成本基于 `employee_monthly_costs.department`（历史快照字段）
- 返回部门成本明细（人力、差旅、外包等）

### 9.3 计算驻场制项目成本函数

**函数名**：`calculate_onsite_project_cost(project_id, month)`
- 根据项目ID和月份计算驻场制项目成本
- 基于业绩记录中选择的员工，查找对应的员工月度成本并汇总
- 返回项目总成本

