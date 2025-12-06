# Supabase 数据库迁移说明

## 目录结构

```
supabase/
└── migrations/
    ├── 20241204000000_create_core_tables.sql
    ├── 20241205000000_create_commercial_project_tables.sql
    ├── 20241206000000_add_project_summary_triggers.sql
    ├── 20241206000001_fix_trigger_function.sql
    ├── 20241206000002_create_cost_standards_and_trigger.sql
    ├── 20241206000003_configure_production_rls_policies.sql
    ├── 20241206000004_complete_missing_parts.sql
    ├── 20241206000005_add_created_by_to_framework_agreements.sql
    ├── 20241206000007_remove_city_type_constraint.sql
    └── 20241206000008_fix_rls_for_admin_and_test_data.sql
```

## 迁移文件说明

### 20241204000000_create_core_tables.sql

创建核心业务表，包括：

**执行顺序**：必须在所有其他迁移文件之前执行

1. **用户扩展表**：
   - `profiles` - 用户扩展表（扩展 Supabase Auth 的用户表）
   - 存储用户的业务信息：钉钉用户ID、姓名、员工等级、职位、城市类型、部门、状态等

2. **部门表**：
   - `departments` - 部门表
   - 支持层级结构（通过 `parent_id` 实现树形结构）
   - 支持钉钉部门ID同步

3. **角色表**：
   - `roles` - 系统角色表
   - 预置系统角色：`admin`（系统管理员）、`director`（总监）、`department_head`（部门主管）、`employee`（员工）

4. **用户角色关联表**：
   - `user_roles` - 用户角色关联表
   - 支持一个用户拥有多个角色

5. **自动功能**：
   - `updated_at` 字段自动更新触发器
   - RLS（Row Level Security）策略（开发环境临时策略）

### 20241205000000_create_commercial_project_tables.sql

创建商业项目相关的所有数据库表，包括：

**执行顺序**：必须在 `20241204000000_create_core_tables.sql` 之后执行

1. **主表**：
   - `framework_agreements` - 计件项目表
   - `projects` - 项目主表

2. **预算表**：
   - `project_budgets_labor` - 项目人力预算表
   - `project_budgets_travel` - 项目差旅预算表
   - `project_budgets_outsource` - 项目外包预算表

3. **支出表**：
   - `project_expenses_labor` - 项目人力支出表
   - `project_expenses_travel` - 项目差旅支出表
   - `project_expenses_outsource` - 项目外包支出表

4. **变更记录表**：
   - `project_changes` - 项目变更记录表

### 20241206000000_add_project_summary_triggers.sql

创建自动维护项目汇总字段的触发器，包括：

1. **预算/支出汇总自动更新**：
   - 当预算/支出表（`project_budgets_*`、`project_expenses_*`）变化时，自动更新 `projects` 表的汇总字段
   - 汇总字段：`labor_budget_total`、`labor_expense_total`、`travel_budget_total`、`travel_expense_total`、`outsource_budget_total`、`outsource_expense_total`

2. **利润率自动计算**：
   - 当汇总字段或 `contract_amount` 变化时，自动计算并更新 `estimated_profit_rate` 和 `actual_profit_rate`

3. **framework_name 自动同步**：
   - 当 `framework_agreements.name` 更新时，自动同步所有关联项目的 `framework_name`
   - 当项目创建或更新 `framework_id` 时，自动初始化 `framework_name`

4. **初始化现有数据**：
   - 迁移时会自动为所有现有项目初始化汇总字段

**执行顺序**：必须在 `20241205000000_create_commercial_project_tables.sql` 之后执行

## 使用方法

### 使用 Supabase CLI

1. 安装 Supabase CLI：
```bash
npm install -g supabase
```

2. 登录 Supabase：
```bash
supabase login
```

3. 链接到项目：
```bash
cd simpleux-api
supabase link --project-ref your-project-ref
```

4. 运行迁移：
```bash
supabase db push
```

### 使用 Supabase Dashboard

1. 登录 [Supabase Dashboard](https://app.supabase.com)
2. 选择你的项目
3. 进入 SQL Editor
4. 复制迁移文件内容并执行

## 迁移文件执行顺序

**重要**：迁移文件必须按照以下顺序执行：

1. ✅ `20241204000000_create_core_tables.sql` - 核心业务表（用户、部门、角色）**（已完全执行）**
2. ✅ `20241205000000_create_commercial_project_tables.sql` - 商业项目相关表 **（已完全执行）**
3. ✅ `20241206000000_add_project_summary_triggers.sql` - 项目汇总字段触发器 **（已完全执行）**
   - ✅ `update_project_budget_expense_totals` 函数已创建
   - ✅ `trigger_update_project_labor_budget_totals` 函数已创建
   - ✅ `sync_framework_name` 函数已创建
   - ✅ `init_framework_name` 函数已创建
   - ✅ 所有相关触发器已创建

4. ⏳ `20241206000001_fix_trigger_function.sql` - 修复触发器函数 **（已包含在后续迁移中）**

5. ✅ `20241206000002_create_cost_standards_and_trigger.sql` - 成本标准和人力成本计算触发器 **（已完全执行）**
   - ✅ `cost_standards` 表已创建
   - ✅ `get_cost_standard` 函数已创建
   - ✅ `calculate_labor_expense_cost` 函数已创建
   - ✅ `project_expenses_labor` 成本计算触发器已创建

6. ✅ `20241206000003_configure_production_rls_policies.sql` - 生产环境 RLS 策略 **（已完全执行）**
   - ✅ `is_system_admin` 函数已创建
   - ✅ `is_department_head` 函数已创建
   - ✅ `get_user_department` 函数已创建
   - ✅ 生产环境 RLS 策略已配置

7. ✅ `20241206000004_complete_missing_parts.sql` - 补全缺失的 framework_name 同步功能 **（已执行）**

8. ✅ `20241206000005_add_created_by_to_framework_agreements.sql` - 为 framework_agreements 表添加 created_by 字段 **（已执行）**
   - ✅ `created_by` 字段已添加
   - ✅ 现有数据已更新

9. ⏳ `20241206000007_remove_city_type_constraint.sql` - 移除成本标准表的城市类型约束 **（待执行）**
   - 移除 `city_type` 的 CHECK 约束，支持自定义添加城市类型
   - 前端已支持通过 Select 组件的 allowCreate 功能添加新的城市类型

10. ⏳ `20241206000008_fix_rls_for_admin_and_test_data.sql` - 修复 RLS 策略，确保管理员可以查看所有数据 **（待执行）**
    - 更新 projects 和 framework_agreements 的查看策略，支持总监角色查看所有数据
    - 为测试数据设置 created_by（如果为 NULL）

**状态说明**：
- ✅ 已完全执行
- ⚠️ 部分执行
- ❌ 未执行
- ⏳ 待执行

**执行指南**：参考 `EXECUTE_MIGRATIONS.md`

## 注意事项

1. **外键依赖**：
   - `profiles` 表需要在所有业务表之前创建（引用 `auth.users`）
   - `framework_agreements` 表需要在 `projects` 表之前创建
   - `departments` 表支持自引用（`parent_id`）
2. **RLS 策略**：
   - 核心表使用开发环境的临时策略（允许所有操作）
   - 商业项目表在生产环境需要配置具体的权限策略（见 `20241206000003_configure_production_rls_policies.sql`）
3. **触发器**：
   - 自动计算总价和更新 `updated_at` 字段
   - 自动维护项目汇总字段和利润率
   - 自动计算人力成本
4. **索引**：已为常用查询字段创建索引，优化查询性能

## 后续工作

1. ✅ **项目汇总字段自动更新触发器**（已完成）
   - 迁移文件：`20241206000000_add_project_summary_triggers.sql`
   - 自动维护预算/支出汇总字段和利润率
   - 自动同步 framework_name

2. ✅ 配置生产环境的 RLS 策略（迁移文件：`20241206000003_configure_production_rls_policies.sql`）
3. ✅ 实现人力成本计算的触发器（迁移文件：`20241206000002_create_cost_standards_and_trigger.sql`）
4. ✅ 创建项目统计视图（已在初始迁移中创建）
5. ✅ 创建计算项目利润的函数（已在初始迁移中创建）

