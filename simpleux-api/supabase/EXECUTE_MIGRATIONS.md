# 数据库迁移执行指南

根据检查结果，以下迁移文件需要执行：

## 执行顺序

### 1. 补全项目汇总触发器（可选）

如果检查结果显示 `sync_framework_name` 和 `init_framework_name` 函数不存在，执行：

**文件**: `20241206000004_complete_missing_parts.sql`

**说明**: 补全 framework_name 同步功能

### 2. 执行成本标准迁移（必需）

**文件**: `20241206000002_create_cost_standards_and_trigger.sql`

**说明**: 创建成本标准表和人力成本计算触发器

**包含内容**:
- `cost_standards` 表
- `get_cost_standard` 函数
- `calculate_labor_expense_cost` 函数
- `project_expenses_labor` 成本计算触发器

### 3. 添加 created_by 字段到 framework_agreements 表（必需，在执行 RLS 策略之前）

**文件**: `20241206000005_add_created_by_to_framework_agreements.sql`

**说明**: 为 `framework_agreements` 表添加 `created_by` 字段，RLS 策略需要使用此字段

**包含内容**:
- 添加 `created_by` 字段
- 为现有数据设置默认值（使用 `manager_id`）
- 创建索引

### 4. 执行生产环境 RLS 策略（必需）

**文件**: `20241206000003_configure_production_rls_policies.sql`

**说明**: 配置生产环境的权限策略

**前置要求**: 必须先执行 `20241206000005_add_created_by_to_framework_agreements.sql`

**包含内容**:
- RLS 辅助函数（`is_system_admin`, `is_department_head`, `get_user_department`）
- 生产环境 RLS 策略（替换开发环境策略）

## 执行方法

### 方法 1: 使用 Supabase Dashboard（推荐）

1. 登录 [Supabase Dashboard](https://app.supabase.com)
2. 选择你的项目
3. 进入 **SQL Editor**
4. 按顺序执行以下迁移文件：
   - `20241206000004_complete_missing_parts.sql`（如果 framework_name 功能缺失）
   - `20241206000002_create_cost_standards_and_trigger.sql`
   - `20241206000005_add_created_by_to_framework_agreements.sql`（**必须先执行**）
   - `20241206000003_configure_production_rls_policies.sql`
5. 每个文件执行后，检查是否有错误

### 方法 2: 使用 Supabase CLI

```bash
cd simpleux-api
supabase db push
```

这会自动执行所有未执行的迁移文件。

## 执行后验证

执行完成后，运行检查脚本验证：

**文件**: `check_migrations_results.sql`

在 Supabase Dashboard 的 SQL Editor 中执行，检查所有项目是否都显示 ✅。

## 注意事项

1. **执行顺序很重要**：必须按照上述顺序执行
2. **备份数据**：执行前建议备份数据库（特别是生产环境）
3. **RLS 策略影响**：执行 RLS 策略迁移后，会删除开发环境的临时策略，如果用户没有正确配置角色，可能会影响数据访问
4. **成本标准表**：执行成本标准迁移后，需要手动添加成本标准数据，否则人力成本计算会失败

## 执行后需要做的事情

1. **添加成本标准数据**：
   ```sql
   INSERT INTO cost_standards (employee_level, city_type, daily_cost, effective_from, created_by)
   VALUES 
     ('P5', 'Chengdu', 1000.00, CURRENT_DATE, 'your-user-id'),
     ('P5', 'Hangzhou', 1000.00, CURRENT_DATE, 'your-user-id');
   -- 根据实际需求添加更多成本标准
   ```

2. **验证 RLS 策略**：测试不同角色的用户是否能正常访问数据

3. **验证触发器**：测试预算/支出变化时，汇总字段是否自动更新

