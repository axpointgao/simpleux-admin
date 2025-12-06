# 专业贡献相关表设计

## 一、专业贡献主表

### 1.1 contributions（专业贡献主表）

**表说明**：存储专业贡献的基本信息。

**字段定义**：

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | uuid | PK | 专业贡献ID |
| code | text | NOT NULL, UNIQUE | 专业贡献编号（自动生成，不在UI中显示） |
| category | text | NOT NULL | 类别（设计规范/组件库/工具/方法/其他） |
| sub_category | text | NULL | 子类别 |
| name | text | NOT NULL | 专业贡献名称 |
| description | text | NULL | 立项说明 |
| create_date | timestamp | NOT NULL, DEFAULT now() | 立项日期 |
| status | text | NOT NULL, DEFAULT 'pending' | 状态 |
| applicant_id | uuid | FK → profiles.id, NOT NULL | 申请人ID |
| applicant_name | text | NOT NULL | 申请人姓名 |
| created_at | timestamp | NOT NULL, DEFAULT now() | 创建时间 |
| updated_at | timestamp | NOT NULL, DEFAULT now() | 更新时间 |

**索引**：
- PRIMARY KEY (id)
- UNIQUE INDEX idx_contributions_code (code)
- INDEX idx_contributions_status (status)
- INDEX idx_contributions_category (category)
- INDEX idx_contributions_applicant_id (applicant_id)

**检查约束**：
- `status` IN ('pending', 'in_progress', 'acceptance_pending', 'accepted', 'rejected', 'archived')
- `category` IN ('设计规范', '组件库', '工具', '方法', '其他')

**RLS策略**：
- 用户可以根据部门权限查看专业贡献
- 申请人可以查看和管理自己的专业贡献
- 部门主管可以查看和管理本部门的专业贡献

### 1.2 contribution_executors（专业贡献执行人表）

**表说明**：存储专业贡献的执行人信息，每个执行人有独立的积分。

**字段定义**：

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | uuid | PK | 执行人关联ID |
| contribution_id | uuid | FK → contributions.id, NOT NULL | 专业贡献ID |
| executor_id | uuid | FK → profiles.id, NOT NULL | 执行人ID |
| executor_name | text | NOT NULL | 执行人姓名 |
| points | numeric(10,2) | NOT NULL, DEFAULT 0 | 积分 |
| created_at | timestamp | NOT NULL, DEFAULT now() | 创建时间 |
| updated_at | timestamp | NOT NULL, DEFAULT now() | 更新时间 |

**索引**：
- PRIMARY KEY (id)
- UNIQUE INDEX idx_contribution_executors_unique (contribution_id, executor_id)
- INDEX idx_contribution_executors_contribution_id (contribution_id)
- INDEX idx_contribution_executors_executor_id (executor_id)

**检查约束**：
- `points` >= 0

**RLS策略**：
- 与专业贡献表的RLS策略一致

### 1.3 contribution_approvals（专业贡献审批表）

**表说明**：存储专业贡献的审批记录。

**字段定义**：

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | uuid | PK | 审批记录ID |
| contribution_id | uuid | FK → contributions.id, NOT NULL | 专业贡献ID |
| approval_id | uuid | FK → approvals.id, NULL | 关联的审批ID |
| status | text | NOT NULL | 审批状态（pending/approved/rejected） |
| approver_id | uuid | FK → profiles.id, NULL | 审批人ID |
| approver_name | text | NULL | 审批人姓名 |
| approved_at | timestamp | NULL | 审批时间 |
| comment | text | NULL | 审批意见 |
| created_at | timestamp | NOT NULL, DEFAULT now() | 创建时间 |
| updated_at | timestamp | NOT NULL, DEFAULT now() | 更新时间 |

**索引**：
- PRIMARY KEY (id)
- INDEX idx_contribution_approvals_contribution_id (contribution_id)
- INDEX idx_contribution_approvals_approval_id (approval_id)
- INDEX idx_contribution_approvals_status (status)

**检查约束**：
- `status` IN ('pending', 'approved', 'rejected')

**RLS策略**：
- 与专业贡献表的RLS策略一致

### 1.4 contribution_acceptances（专业贡献验收表）

**表说明**：存储专业贡献的验收记录。

**字段定义**：

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | uuid | PK | 验收记录ID |
| contribution_id | uuid | FK → contributions.id, NOT NULL | 专业贡献ID |
| acceptance_date | date | NOT NULL | 验收日期 |
| status | text | NOT NULL | 验收状态（pending/approved/rejected） |
| rating | integer | NULL | 评级（1-5星） |
| comment | text | NULL | 验收意见 |
| approval_id | uuid | FK → approvals.id, NULL | 关联的审批ID |
| applicant_id | uuid | FK → profiles.id, NOT NULL | 申请人ID（申请人或执行人） |
| applicant_name | text | NOT NULL | 申请人姓名 |
| approver_id | uuid | FK → profiles.id, NULL | 审批人ID |
| approver_name | text | NULL | 审批人姓名 |
| approved_at | timestamp | NULL | 审批时间 |
| created_at | timestamp | NOT NULL, DEFAULT now() | 创建时间 |
| updated_at | timestamp | NOT NULL, DEFAULT now() | 更新时间 |

**索引**：
- PRIMARY KEY (id)
- INDEX idx_contribution_acceptances_contribution_id (contribution_id)
- INDEX idx_contribution_acceptances_approval_id (approval_id)
- INDEX idx_contribution_acceptances_status (status)

**检查约束**：
- `status` IN ('pending', 'approved', 'rejected')
- `rating` BETWEEN 1 AND 5 OR `rating` IS NULL

**RLS策略**：
- 与专业贡献表的RLS策略一致

## 二、数据完整性约束

### 2.1 外键约束

**contributions表**：
- `applicant_id` → `profiles.id` (RESTRICT DELETE)

**contribution_executors表**：
- `contribution_id` → `contributions.id` (CASCADE DELETE)
- `executor_id` → `profiles.id` (RESTRICT DELETE)

**contribution_approvals表**：
- `contribution_id` → `contributions.id` (CASCADE DELETE)
- `approval_id` → `approvals.id` (SET NULL ON DELETE)
- `approver_id` → `profiles.id` (RESTRICT DELETE)

**contribution_acceptances表**：
- `contribution_id` → `contributions.id` (CASCADE DELETE)
- `approval_id` → `approvals.id` (SET NULL ON DELETE)
- `applicant_id` → `profiles.id` (RESTRICT DELETE)
- `approver_id` → `profiles.id` (RESTRICT DELETE)

### 2.2 业务约束

**执行人约束**：
- 一个专业贡献至少有一个执行人
- 执行人不能重复（同一贡献的同一执行人只能有一条记录）

**积分约束**：
- 积分必须 >= 0

## 三、视图

### 3.1 contribution_stats_view（专业贡献统计视图）

**视图说明**：聚合专业贡献的执行人和积分统计。

**SQL**：
```sql
CREATE VIEW contribution_stats_view AS
SELECT 
  c.id,
  c.name,
  c.status,
  COUNT(ce.id) as executor_count,
  SUM(ce.points) as total_points
FROM contributions c
LEFT JOIN contribution_executors ce ON c.id = ce.contribution_id
GROUP BY c.id;
```

## 四、函数

### 4.1 计算专业贡献总积分函数

**函数名**：`calculate_contribution_total_points(contribution_id)`
- 计算专业贡献的总积分（所有执行人积分之和）
- 返回numeric

