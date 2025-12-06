# 触发器测试指南

## 测试方法

### 方法 1：使用 Supabase Dashboard（推荐）

1. 登录 [Supabase Dashboard](https://app.supabase.com)
2. 选择你的项目
3. 进入 **SQL Editor**
4. 复制 `test_triggers_simple.sql` 文件内容
5. 粘贴到 SQL Editor 中
6. 点击 **Run** 执行

### 方法 2：使用 Supabase CLI

```bash
cd simpleux-api
supabase db execute --file supabase/test_triggers_simple.sql
```

## 测试内容

测试脚本会自动：

1. ✅ **创建测试数据**
   - 创建测试计件项目
   - 创建测试项目

2. ✅ **测试预算汇总自动更新**
   - 添加人力预算 → 检查 `labor_budget_total` 是否更新
   - 添加差旅预算 → 检查 `travel_budget_total` 是否更新

3. ✅ **测试支出汇总自动更新**
   - 添加人力支出 → 检查 `labor_expense_total` 是否更新

4. ✅ **测试利润率自动计算**
   - 检查 `estimated_profit_rate` 和 `actual_profit_rate` 是否自动计算

5. ✅ **测试 framework_name 同步**
   - 更新计件项目名称 → 检查项目的 `framework_name` 是否同步

6. ✅ **测试业绩金额更新**
   - 更新 `contract_amount` → 检查利润率是否重新计算

## 预期结果

### 1. 预算汇总字段应该自动更新

添加预算数据后，`projects` 表的汇总字段应该立即更新：
- `labor_budget_total` = 人力预算总和
- `travel_budget_total` = 差旅预算总和
- `outsource_budget_total` = 外包预算总和

### 2. 支出汇总字段应该自动更新

添加支出数据后，`projects` 表的汇总字段应该立即更新：
- `labor_expense_total` = 人力支出总和
- `travel_expense_total` = 差旅支出总和
- `outsource_expense_total` = 外包支出总和

### 3. 利润率应该自动计算

- `estimated_profit_rate` = ((contract_amount - 预算总和) / contract_amount) * 100
- `actual_profit_rate` = ((contract_amount - 支出总和) / contract_amount) * 100

### 4. framework_name 应该自动同步

更新 `framework_agreements.name` 后，所有关联项目的 `framework_name` 应该自动更新。

## 验证步骤

执行测试脚本后，检查输出中的：

1. **初始状态**：所有汇总字段应该为 0 或 NULL
2. **添加预算后**：对应的汇总字段应该更新
3. **添加支出后**：对应的汇总字段和实际利润率应该更新
4. **更新计件项目名称后**：项目的 `framework_name` 应该同步
5. **更新业绩金额后**：利润率应该重新计算

## 如果测试失败

### 检查触发器是否存在

```sql
SELECT 
  trigger_name, 
  event_object_table, 
  action_statement
FROM information_schema.triggers
WHERE trigger_name LIKE '%project%' OR trigger_name LIKE '%framework%'
ORDER BY trigger_name;
```

### 检查函数是否存在

```sql
SELECT 
  routine_name, 
  routine_type
FROM information_schema.routines
WHERE routine_name LIKE '%project%' OR routine_name LIKE '%framework%'
ORDER BY routine_name;
```

### 手动测试单个触发器

```sql
-- 测试更新汇总函数
SELECT update_project_budget_expense_totals('your-project-id');
```

## 清理测试数据

测试完成后，可以执行以下 SQL 清理测试数据：

```sql
-- 删除测试数据（替换为实际的 ID）
DELETE FROM project_expenses_labor WHERE project_id = 'your-project-id';
DELETE FROM project_budgets_travel WHERE project_id = 'your-project-id';
DELETE FROM project_budgets_labor WHERE project_id = 'your-project-id';
DELETE FROM projects WHERE code LIKE 'PROJ-TEST-%';
DELETE FROM framework_agreements WHERE code LIKE 'FRAM-TEST-%';
```

