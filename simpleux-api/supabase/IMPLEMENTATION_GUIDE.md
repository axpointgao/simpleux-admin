# 数据库迁移实施指南

本文档说明如何实施两个重要的数据库迁移工作：
1. 配置生产环境的 RLS 策略
2. 实现人力成本计算的触发器

## 一、工作概述

### 1.1 配置生产环境的 RLS 策略

**目标**：为商业项目相关表配置生产环境的 Row Level Security (RLS) 策略，实现基于角色、部门、创建人的权限控制。

**迁移文件**：`20241206000003_configure_production_rls_policies.sql`

**影响范围**：
- `framework_agreements`（计件项目表）
- `projects`（项目主表）
- `project_budgets_labor`（项目人力预算表）
- `project_budgets_travel`（项目差旅预算表）
- `project_budgets_outsource`（项目外包预算表）
- `project_expenses_labor`（项目人力支出表）
- `project_expenses_travel`（项目差旅支出表）
- `project_expenses_outsource`（项目外包支出表）
- `project_changes`（项目变更记录表）
- `cost_standards`（成本标准表）

**权限规则**：
- **系统管理员**：可以查看、创建、更新、删除所有数据
- **部门主管**：可以查看和更新本部门的数据
- **普通用户**：
  - 可以查看自己创建的数据、自己作为项目经理的数据
  - 可以创建数据（创建人必须是当前用户）
  - 可以更新自己创建的数据
  - 可以删除自己创建的数据（部分表）

### 1.2 实现人力成本计算的触发器

**目标**：创建 `cost_standards` 表，并实现 `project_expenses_labor` 表的自动成本计算触发器。

**迁移文件**：`20241206000002_create_cost_standards_and_trigger.sql`

**功能**：
- 创建 `cost_standards` 表（人日成本标准表）
- 创建 `get_cost_standard` 函数（根据员工级别、城市类型和日期获取成本标准）
- 创建 `calculate_labor_expense_cost` 触发器函数（自动计算人力支出成本）
- 创建 `active_cost_standards_view` 视图（当前生效的成本标准视图）

**计算规则**：
- `calculated_cost = hours / 8 * daily_cost`
- `daily_cost` 从 `cost_standards` 表获取（根据员工级别、城市类型、日期）
- 如果找不到成本标准，尝试从项目预算中获取 `unit_cost` 作为备用方案

## 二、实施步骤

### 2.1 前置条件检查

在执行迁移之前，请确认以下条件：

1. **核心表已创建**：
   - ✅ `profiles` 表（用户扩展表）
   - ✅ `roles` 表（角色表）
   - ✅ `user_roles` 表（用户角色关联表）
   - ✅ `departments` 表（部门表，可选）

2. **角色代码已配置**：
   - 系统管理员角色代码：`admin`
   - 部门主管角色代码：`department_head`
   - 如果使用不同的角色代码，需要修改迁移文件中的角色代码

3. **数据库连接**：
   - 已配置 Supabase 连接（`.env.local` 文件）
   - 已安装 Supabase CLI（如果使用 CLI）

### 2.2 执行顺序

**重要**：必须按照以下顺序执行迁移文件：

1. **第一步**：执行 `20241206000002_create_cost_standards_and_trigger.sql`
   - 创建 `cost_standards` 表`
   - 创建成本计算触发器
   - 此迁移不依赖其他迁移文件

2. **第二步**：执行 `20241206000003_configure_production_rls_policies.sql`
   - 配置生产环境的 RLS 策略
   - 删除开发环境的临时策略
   - 此迁移依赖核心表（`profiles`、`roles`、`user_roles`）

### 2.3 使用 Supabase CLI 执行迁移

```bash
# 1. 进入 simpleux-api 目录
cd simpleux-api

# 2. 链接到 Supabase 项目（如果还没有链接）
supabase link --project-ref your-project-ref

# 3. 执行迁移
supabase db push
```

### 2.4 使用 Supabase Dashboard 执行迁移

1. 登录 [Supabase Dashboard](https://app.supabase.com)
2. 选择你的项目
3. 进入 **SQL Editor**
4. 按照顺序执行迁移文件：
   - 先执行 `20241206000002_create_cost_standards_and_trigger.sql`
   - 再执行 `20241206000003_configure_production_rls_policies.sql`

## 三、配置说明

### 3.1 成本标准表配置

**表结构**：
- `employee_level`：员工级别（P0-P9, M0-M5）
- `city_type`：城市类型（Chengdu/Hangzhou）
- `daily_cost`：人日成本（单位：元/天）
- `effective_from`：生效开始日期
- `effective_to`：生效结束日期（NULL 表示永久有效）
- `is_active`：是否启用

**初始化数据示例**：

```sql
-- 插入成本标准数据
INSERT INTO cost_standards (employee_level, city_type, daily_cost, effective_from, created_by)
VALUES
  ('P5', 'Chengdu', 1000.00, '2024-01-01', 'your-admin-user-id'),
  ('P5', 'Hangzhou', 1400.00, '2024-01-01', 'your-admin-user-id'),
  ('P6', 'Chengdu', 1500.00, '2024-01-01', 'your-admin-user-id'),
  ('P6', 'Hangzhou', 2000.00, '2024-01-01', 'your-admin-user-id'),
  ('P7', 'Chengdu', 2200.00, '2024-01-01', 'your-admin-user-id'),
  ('P7', 'Hangzhou', 2800.00, '2024-01-01', 'your-admin-user-id'),
  ('P8', 'Chengdu', 3000.00, '2024-01-01', 'your-admin-user-id'),
  ('P8', 'Hangzhou', 3800.00, '2024-01-01', 'your-admin-user-id'),
  ('M1', 'Chengdu', 2500.00, '2024-01-01', 'your-admin-user-id'),
  ('M1', 'Hangzhou', 3200.00, '2024-01-01', 'your-admin-user-id'),
  ('M2', 'Chengdu', 3500.00, '2024-01-01', 'your-admin-user-id'),
  ('M2', 'Hangzhou', 4500.00, '2024-01-01', 'your-admin-user-id');
```

### 3.2 RLS 策略配置

**辅助函数**：
- `is_system_admin(user_id)`：检查用户是否为系统管理员
- `is_department_head(user_id)`：检查用户是否为部门主管
- `get_user_department(user_id)`：获取用户所属部门

**策略类型**：
- `SELECT`：查看策略
- `INSERT`：插入策略
- `UPDATE`：更新策略
- `DELETE`：删除策略

**注意事项**：
- 如果使用不同的角色代码，需要修改迁移文件中的角色代码
- 如果 `profiles` 表的 `department` 字段类型不是 `TEXT`，需要修改 `get_user_department` 函数

## 四、测试验证

### 4.1 测试成本标准表

```sql
-- 1. 测试获取成本标准函数
SELECT get_cost_standard('P5', 'Chengdu', '2024-12-06');

-- 2. 测试当前生效的成本标准视图
SELECT * FROM active_cost_standards_view;

-- 3. 测试人力支出成本计算触发器
-- 插入测试数据（需要先有项目和员工数据）
INSERT INTO project_expenses_labor (
  project_id, employee_id, employee_name, employee_level, work_date, hours
) VALUES (
  'your-project-id',
  'your-employee-id',
  '测试员工',
  'P5',
  '2024-12-06',
  8.0
);

-- 检查 calculated_cost 是否自动计算
SELECT calculated_cost FROM project_expenses_labor WHERE id = 'your-expense-id';
```

### 4.2 测试 RLS 策略

```sql
-- 1. 使用不同角色的用户测试权限
-- 切换到普通用户
SET ROLE authenticated;
SET request.jwt.claim.sub = 'user-id';

-- 2. 测试查看权限
SELECT * FROM projects;

-- 3. 测试创建权限
INSERT INTO projects (...) VALUES (...);

-- 4. 测试更新权限
UPDATE projects SET name = '新名称' WHERE id = 'project-id';

-- 5. 测试删除权限
DELETE FROM projects WHERE id = 'project-id';
```

## 五、回滚方案

如果需要回滚迁移，可以执行以下操作：

### 5.1 回滚 RLS 策略

```sql
-- 删除所有生产环境的 RLS 策略
DROP POLICY IF EXISTS "framework_agreements_select_policy" ON framework_agreements;
DROP POLICY IF EXISTS "framework_agreements_insert_policy" ON framework_agreements;
DROP POLICY IF EXISTS "framework_agreements_update_policy" ON framework_agreements;
DROP POLICY IF EXISTS "framework_agreements_delete_policy" ON framework_agreements;
-- ... 其他表的策略 ...

-- 恢复开发环境的临时策略
CREATE POLICY "Allow all operations for development" ON framework_agreements
  FOR ALL USING (true) WITH CHECK (true);
-- ... 其他表 ...
```

### 5.2 回滚成本标准表和触发器

```sql
-- 删除触发器
DROP TRIGGER IF EXISTS calculate_project_expenses_labor_cost ON project_expenses_labor;

-- 删除函数
DROP FUNCTION IF EXISTS calculate_labor_expense_cost();
DROP FUNCTION IF EXISTS get_cost_standard(TEXT, TEXT, DATE);

-- 删除视图
DROP VIEW IF EXISTS active_cost_standards_view;

-- 删除表
DROP TABLE IF EXISTS cost_standards;
```

## 六、常见问题

### 6.1 触发器不工作

**问题**：**插入 `project_expenses_labor` 时，`calculated_cost` 为 0**

**原因**：
- 找不到对应的成本标准
- 员工不存在或 `city_type` 为 NULL
- 项目预算中也没有对应的 `unit_cost`

**解决方案**：
1. 检查 `cost_standards` 表中是否有对应的成本标准
2. 检查 `profiles` 表中员工的 `city_type` 是否已设置
3. 检查项目预算中是否有对应的 `unit_cost`

### 6.2 RLS 策略导致查询失败

**问题**：**查询数据时返回空结果或权限错误**

**原因**：
- 用户没有相应的权限
- 角色代码配置不正确
- 用户部门信息不正确

**解决方案**：
1. 检查用户的角色是否正确配置
2. 检查 `user_roles` 表中是否有用户的角色关联
3. 检查 `profiles` 表中用户的 `department` 字段是否正确
4. 检查角色代码是否与迁移文件中的代码一致

### 6.3 成本标准查询不到

**问题**：**`get_cost_standard` 函数返回 0**

**原因**：
- 成本标准不存在
- 成本标准已过期（`effective_to < CURRENT_DATE`）
- 成本标准未启用（`is_active = false`）

**解决方案**：
1. 检查 `cost_standards` 表中是否有对应的成本标准
2. 检查 `effective_from` 和 `effective_to` 是否包含查询日期
3. 检查 `is_active` 是否为 `true`

## 七、后续工作

1. **初始化成本标准数据**：根据实际业务需求，插入成本标准数据
2. **测试权限控制**：使用不同角色的用户测试权限控制是否生效
3. **监控触发器性能**：监控成本计算触发器的性能，确保不影响插入性能
4. **优化查询性能**：如果查询性能有问题，考虑添加索引或优化查询

## 八、相关文档

- [Supabase 迁移说明](./README.md)
- [数据库设计文档](../../docs/03-database/02-data-models/08-settings-tables.md)
- [权限控制实现指南](../../docs/08-project/06-permission-control.md)

