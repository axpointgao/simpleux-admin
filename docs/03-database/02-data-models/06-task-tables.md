# 任务和工时相关表设计

## 一、任务主表

### 1.1 tasks（任务主表）

**表说明**：存储通用任务信息，支持关联到不同的业务实体。

**字段定义**：

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | uuid | PK | 任务ID |
| name | text | NOT NULL | 任务名称 |
| description | text | NULL | 任务描述 |
| entity_type | text | NOT NULL | 关联实体类型 |
| entity_id | uuid | NULL | 关联实体ID |
| assignee_id | uuid | FK → profiles.id, NOT NULL | 执行人ID |
| assignee_name | text | NOT NULL | 执行人姓名 |
| status | text | NOT NULL, DEFAULT 'in_progress' | 任务状态 |
| priority | text | NULL | 优先级（low/medium/high） |
| plan_start_date | date | NULL | 计划开始日期 |
| plan_end_date | date | NULL | 计划结束日期 |
| created_by | uuid | FK → profiles.id, NOT NULL | 创建人ID |
| created_at | timestamp | NOT NULL, DEFAULT now() | 创建时间 |
| updated_at | timestamp | NOT NULL, DEFAULT now() | 更新时间 |

**索引**：
- PRIMARY KEY (id)
- INDEX idx_tasks_entity (entity_type, entity_id)
- INDEX idx_tasks_assignee_id (assignee_id)
- INDEX idx_tasks_status (status)
- INDEX idx_tasks_created_by (created_by)

**检查约束**：
- `status` IN ('in_progress', 'completed', 'cancelled')
- `entity_type` IN ('project', 'opportunity', 'contribution', 'other_task')
- `priority` IN ('low', 'medium', 'high') OR `priority` IS NULL

**RLS策略**：
- 执行人可以查看和管理自己的任务
- 创建人可以查看和管理自己创建的任务
- 部门主管可以查看和管理本部门的任务

## 二、计划工时表

### 2.1 planned_work_hours（计划工时表）

**表说明**：存储任务的计划工时分配。

**字段定义**：

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | uuid | PK | 计划工时ID |
| task_id | uuid | FK → tasks.id, NOT NULL | 任务ID |
| start_date | date | NOT NULL | 开始日期 |
| end_date | date | NOT NULL | 结束日期 |
| allocation_mode | text | NOT NULL | 分配模式（total_hours/daily_hours） |
| total_hours | numeric(10,2) | NULL | 总工时（合计工时模式） |
| daily_hours | numeric(10,2) | NULL | 每天工时（每天工时模式） |
| work_days | integer | NOT NULL | 工作日数量（自动计算） |
| created_by | uuid | FK → profiles.id, NOT NULL | 创建人ID |
| created_at | timestamp | NOT NULL, DEFAULT now() | 创建时间 |
| updated_at | timestamp | NOT NULL, DEFAULT now() | 更新时间 |

**索引**：
- PRIMARY KEY (id)
- INDEX idx_planned_work_hours_task_id (task_id)
- INDEX idx_planned_work_hours_date_range (start_date, end_date)

**检查约束**：
- `allocation_mode` IN ('total_hours', 'daily_hours')
- `end_date` >= `start_date`
- 合计工时模式：`total_hours IS NOT NULL AND daily_hours IS NULL`
- 每天工时模式：`daily_hours IS NOT NULL AND total_hours IS NULL`
- `work_days` > 0

**RLS策略**：
- 与任务表的RLS策略一致

### 2.2 planned_work_hour_details（计划工时明细表）

**表说明**：存储计划工时的每日明细，用于日历视图展示。

**字段定义**：

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | uuid | PK | 明细ID |
| planned_work_hour_id | uuid | FK → planned_work_hours.id, NOT NULL | 计划工时ID |
| work_date | date | NOT NULL | 工作日期 |
| hours | numeric(10,2) | NOT NULL | 计划工时 |
| created_at | timestamp | NOT NULL, DEFAULT now() | 创建时间 |

**索引**：
- PRIMARY KEY (id)
- UNIQUE INDEX idx_planned_work_hour_details_unique (planned_work_hour_id, work_date)
- INDEX idx_planned_work_hour_details_work_date (work_date)

**RLS策略**：
- 与任务表的RLS策略一致

## 三、实际工时表

### 3.1 actual_work_hours（实际工时表）

**表说明**：存储任务的实际工时录入。

**字段定义**：

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | uuid | PK | 实际工时ID |
| task_id | uuid | FK → tasks.id, NOT NULL | 任务ID |
| start_date | date | NOT NULL | 开始日期 |
| end_date | date | NOT NULL | 结束日期 |
| input_mode | text | NOT NULL | 录入模式（total_hours/daily_hours） |
| total_hours | numeric(10,2) | NULL | 总工时（合计工时模式） |
| daily_hours | numeric(10,2) | NULL | 每天工时（每天工时模式） |
| work_days | integer | NOT NULL | 工作日数量（自动计算） |
| created_by | uuid | FK → profiles.id, NOT NULL | 创建人ID（执行人） |
| created_at | timestamp | NOT NULL, DEFAULT now() | 创建时间 |
| updated_at | timestamp | NOT NULL, DEFAULT now() | 更新时间 |

**索引**：
- PRIMARY KEY (id)
- INDEX idx_actual_work_hours_task_id (task_id)
- INDEX idx_actual_work_hours_date_range (start_date, end_date)
- INDEX idx_actual_work_hours_created_by (created_by)

**检查约束**：
- `input_mode` IN ('total_hours', 'daily_hours')
- `end_date` >= `start_date`
- 合计工时模式：`total_hours IS NOT NULL AND daily_hours IS NULL`
- 每天工时模式：`daily_hours IS NOT NULL AND total_hours IS NULL`
- `work_days` > 0

**RLS策略**：
- 执行人只能查看和管理自己的实际工时
- 部门主管可以查看本部门员工的实际工时

### 3.2 actual_work_hour_details（实际工时明细表）

**表说明**：存储实际工时的每日明细，用于日历视图展示。

**字段定义**：

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | uuid | PK | 明细ID |
| actual_work_hour_id | uuid | FK → actual_work_hours.id, NOT NULL | 实际工时ID |
| work_date | date | NOT NULL | 工作日期 |
| hours | numeric(10,2) | NOT NULL | 实际工时 |
| created_at | timestamp | NOT NULL, DEFAULT now() | 创建时间 |
| updated_at | timestamp | NOT NULL, DEFAULT now() | 更新时间 |

**索引**：
- PRIMARY KEY (id)
- UNIQUE INDEX idx_actual_work_hour_details_unique (actual_work_hour_id, work_date)
- INDEX idx_actual_work_hour_details_work_date (work_date)

**RLS策略**：
- 与任务表的RLS策略一致

## 四、数据完整性约束

### 4.1 外键约束

**tasks表**：
- `assignee_id` → `profiles.id` (RESTRICT DELETE)
- `created_by` → `profiles.id` (RESTRICT DELETE)

**计划工时表**：
- `task_id` → `tasks.id` (CASCADE DELETE)
- `created_by` → `profiles.id` (RESTRICT DELETE)

**计划工时明细表**：
- `planned_work_hour_id` → `planned_work_hours.id` (CASCADE DELETE)

**实际工时表**：
- `task_id` → `tasks.id` (CASCADE DELETE)
- `created_by` → `profiles.id` (RESTRICT DELETE)

**实际工时明细表**：
- `actual_work_hour_id` → `actual_work_hours.id` (CASCADE DELETE)

### 4.2 触发器

**自动计算工作日数量**：
- `planned_work_hours`: 根据开始日期、结束日期和节假日表计算工作日数量
- `actual_work_hours`: 根据开始日期、结束日期和节假日表计算工作日数量

**自动生成计划工时明细**：
- 当创建或更新计划工时时，自动生成每日明细记录
- 排除周末和节假日

**自动生成实际工时明细**：
- 当创建或更新实际工时时，自动生成每日明细记录
- 排除周末和节假日

## 五、视图

### 5.1 task_workhour_stats_view（任务工时统计视图）

**视图说明**：聚合任务的计划工时和实际工时统计。

**SQL**：
```sql
CREATE VIEW task_workhour_stats_view AS
SELECT 
  t.id,
  t.name,
  t.status,
  COALESCE(SUM(pwh.total_hours), COALESCE(SUM(pwh.daily_hours * pwh.work_days), 0)) as total_planned_hours,
  COALESCE(SUM(awh.total_hours), COALESCE(SUM(awh.daily_hours * awh.work_days), 0)) as total_actual_hours
FROM tasks t
LEFT JOIN planned_work_hours pwh ON t.id = pwh.task_id
LEFT JOIN actual_work_hours awh ON t.id = awh.task_id
GROUP BY t.id;
```

## 六、函数

### 6.1 计算工作日数量函数

**函数名**：`calculate_workdays(start_date, end_date)`
- 计算日期区间内的工作日数量
- 排除周末和节假日
- 返回integer

### 6.2 生成工时明细函数

**函数名**：`generate_workhour_details(work_hour_id, start_date, end_date, hours_per_day)`
- 生成计划工时或实际工时的每日明细
- 排除周末和节假日
- 返回void

