# 审批管理相关表设计

## 一、审批主表

### 1.1 approvals（审批主表）

**表说明**：存储审批流程的基本信息。

**字段定义**：

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | uuid | PK | 审批ID |
| type | text | NOT NULL | 审批类型 |
| related_id | uuid | NOT NULL | 关联业务ID |
| related_type | text | NOT NULL | 关联业务类型 |
| applicant_id | uuid | FK → profiles.id, NOT NULL | 申请人ID |
| applicant_name | text | NOT NULL | 申请人姓名 |
| status | text | NOT NULL, DEFAULT 'pending' | 审批状态 |
| dingtalk_task_id | text | NULL | 钉钉待办任务ID |
| created_at | timestamp | NOT NULL, DEFAULT now() | 创建时间 |
| updated_at | timestamp | NOT NULL, DEFAULT now() | 更新时间 |

**索引**：
- PRIMARY KEY (id)
- INDEX idx_approvals_type (type)
- INDEX idx_approvals_related (related_type, related_id)
- INDEX idx_approvals_applicant_id (applicant_id)
- INDEX idx_approvals_status (status)
- INDEX idx_approvals_dingtalk_task_id (dingtalk_task_id)

**检查约束**：
- `status` IN ('pending', 'approved', 'rejected', 'cancelled')
- `type` IN ('project_create', 'project_change', 'project_post_record', 'expense_travel', 'expense_outsource', 'design_confirm', 'contribution_create', 'contribution_acceptance', 'performance_acceptance')
- `related_type` IN ('project', 'opportunity', 'contribution', 'expense', 'performance')

**RLS策略**：
- 申请人可以查看自己的审批
- 审批人可以查看待审批的审批
- 部门主管可以查看本部门的审批

### 1.2 approval_steps（审批步骤表）

**表说明**：存储审批流程的步骤信息。

**字段定义**：

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | uuid | PK | 审批步骤ID |
| approval_id | uuid | FK → approvals.id, NOT NULL | 审批ID |
| step_order | integer | NOT NULL | 步骤顺序（从1开始） |
| approver_id | uuid | FK → profiles.id, NOT NULL | 审批人ID |
| approver_name | text | NOT NULL | 审批人姓名 |
| step_status | text | NOT NULL, DEFAULT 'pending' | 步骤状态 |
| comment | text | NULL | 审批意见 |
| approved_at | timestamp | NULL | 审批时间 |
| dingtalk_task_id | text | NULL | 钉钉待办任务ID |
| created_at | timestamp | NOT NULL, DEFAULT now() | 创建时间 |
| updated_at | timestamp | NOT NULL, DEFAULT now() | 更新时间 |

**索引**：
- PRIMARY KEY (id)
- INDEX idx_approval_steps_approval_id (approval_id)
- INDEX idx_approval_steps_approver_id (approver_id)
- INDEX idx_approval_steps_step_status (step_status)
- INDEX idx_approval_steps_dingtalk_task_id (dingtalk_task_id)

**检查约束**：
- `step_status` IN ('pending', 'approved', 'rejected')
- `step_order` > 0

**RLS策略**：
- 与审批表的RLS策略一致

### 1.3 approval_history（审批历史表）

**表说明**：存储审批操作的历史记录。

**字段定义**：

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | uuid | PK | 历史记录ID |
| approval_id | uuid | FK → approvals.id, NOT NULL | 审批ID |
| step_id | uuid | FK → approval_steps.id, NULL | 审批步骤ID |
| action | text | NOT NULL | 操作类型 |
| operator_id | uuid | FK → profiles.id, NOT NULL | 操作人ID |
| operator_name | text | NOT NULL | 操作人姓名 |
| comment | text | NULL | 操作意见 |
| action_time | timestamp | NOT NULL, DEFAULT now() | 操作时间 |

**索引**：
- PRIMARY KEY (id)
- INDEX idx_approval_history_approval_id (approval_id)
- INDEX idx_approval_history_step_id (step_id)
- INDEX idx_approval_history_action_time (action_time)

**检查约束**：
- `action` IN ('create', 'approve', 'reject', 'cancel', 'submit')

**RLS策略**：
- 与审批表的RLS策略一致

### 1.4 approval_attachments（审批附件表）

**表说明**：存储审批相关的附件。

**字段定义**：

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | uuid | PK | 附件ID |
| approval_id | uuid | FK → approvals.id, NOT NULL | 审批ID |
| file_name | text | NOT NULL | 文件名 |
| file_url | text | NOT NULL | 文件URL |
| file_size | integer | NULL | 文件大小（字节） |
| file_type | text | NULL | 文件类型 |
| uploaded_by | uuid | FK → profiles.id, NOT NULL | 上传人ID |
| uploaded_at | timestamp | NOT NULL, DEFAULT now() | 上传时间 |

**索引**：
- PRIMARY KEY (id)
- INDEX idx_approval_attachments_approval_id (approval_id)

**RLS策略**：
- 与审批表的RLS策略一致

## 二、数据完整性约束

### 2.1 外键约束

**approvals表**：
- `applicant_id` → `profiles.id` (RESTRICT DELETE)

**approval_steps表**：
- `approval_id` → `approvals.id` (CASCADE DELETE)
- `approver_id` → `profiles.id` (RESTRICT DELETE)

**approval_history表**：
- `approval_id` → `approvals.id` (CASCADE DELETE)
- `step_id` → `approval_steps.id` (SET NULL ON DELETE)
- `operator_id` → `profiles.id` (RESTRICT DELETE)

**approval_attachments表**：
- `approval_id` → `approvals.id` (CASCADE DELETE)
- `uploaded_by` → `profiles.id` (RESTRICT DELETE)

### 2.2 业务约束

**审批步骤顺序**：
- 步骤顺序必须连续（1, 2, 3, ...）
- 前一步骤审批通过后，才能进行下一步骤

**审批状态一致性**：
- 所有步骤都审批通过后，审批状态自动变为'approved'
- 任何一步骤被拒绝后，审批状态自动变为'rejected'

## 三、视图

### 3.1 approval_status_view（审批状态视图）

**视图说明**：聚合审批的步骤状态信息。

**SQL**：
```sql
CREATE VIEW approval_status_view AS
SELECT 
  a.id,
  a.type,
  a.status,
  COUNT(CASE WHEN ast.step_status = 'pending' THEN 1 END) as pending_steps,
  COUNT(CASE WHEN ast.step_status = 'approved' THEN 1 END) as approved_steps,
  COUNT(CASE WHEN ast.step_status = 'rejected' THEN 1 END) as rejected_steps,
  MAX(ast.step_order) as total_steps
FROM approvals a
LEFT JOIN approval_steps ast ON a.id = ast.approval_id
GROUP BY a.id;
```

## 四、函数

### 4.1 更新审批状态函数

**函数名**：`update_approval_status(approval_id)`
- 根据审批步骤状态自动更新审批状态
- 所有步骤通过 → 'approved'
- 任何步骤拒绝 → 'rejected'
- 返回void

