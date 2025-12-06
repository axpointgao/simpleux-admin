-- 测试触发器是否正常工作
-- 使用方法：在 Supabase Dashboard 的 SQL Editor 中执行

-- ============================================
-- 1. 测试：创建测试项目
-- ============================================

-- 创建测试计件项目
INSERT INTO framework_agreements (code, name, manager_id, manager_name, "group")
VALUES ('FRAM-TEST-001', '测试计件项目', '00000000-0000-0000-0000-000000000001', '测试经理', '测试部门')
RETURNING id, code, name;

-- 保存计件项目 ID（需要手动替换下面的 {framework_id}）
-- 假设返回的 ID 是：'11111111-1111-1111-1111-111111111111'

-- 创建测试项目
INSERT INTO projects (
  code, name, type, status, manager_id, manager_name, "group",
  plan_start_date, plan_end_date, contract_amount, framework_id, created_by
)
VALUES (
  'PROJ-TEST-001', '测试项目', '项目制', '待启动',
  '00000000-0000-0000-0000-000000000001', '测试经理', '测试部门',
  CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', 100000.00,
  '11111111-1111-1111-1111-111111111111', -- 替换为实际的 framework_id
  '00000000-0000-0000-0000-000000000001'
)
RETURNING id, code, name, framework_name, labor_budget_total, estimated_profit_rate;

-- 保存项目 ID（需要手动替换下面的 {project_id}）
-- 假设返回的 ID 是：'22222222-2222-2222-2222-222222222222'

-- ============================================
-- 2. 测试：添加预算数据，检查汇总字段是否自动更新
-- ============================================

-- 添加人力预算
INSERT INTO project_budgets_labor (project_id, employee_level, city_type, days, unit_cost)
VALUES (
  '22222222-2222-2222-2222-222222222222', -- 替换为实际的 project_id
  'P5', 'Chengdu', 10, 1000.00
);

-- 检查汇总字段是否更新
SELECT 
  id, code, name,
  labor_budget_total,
  estimated_profit_rate
FROM projects
WHERE id = '22222222-2222-2222-2222-222222222222';

-- 添加差旅预算
INSERT INTO project_budgets_travel (project_id, item, transport_big, stay, transport_small)
VALUES (
  '22222222-2222-2222-2222-222222222222', -- 替换为实际的 project_id
  '测试差旅', 2000.00, 1500.00, 500.00
);

-- 再次检查汇总字段
SELECT 
  id, code, name,
  labor_budget_total,
  travel_budget_total,
  outsource_budget_total,
  estimated_profit_rate
FROM projects
WHERE id = '22222222-2222-2222-2222-222222222222';

-- ============================================
-- 3. 测试：添加支出数据，检查支出汇总和实际利润率
-- ============================================

-- 添加人力支出
INSERT INTO project_expenses_labor (
  project_id, employee_id, employee_name, employee_level, work_date, hours, calculated_cost
)
VALUES (
  '22222222-2222-2222-2222-222222222222', -- 替换为实际的 project_id
  '00000000-0000-0000-0000-000000000002', '测试员工', 'P5', CURRENT_DATE, 8, 800.00
);

-- 检查支出汇总和实际利润率
SELECT 
  id, code, name,
  labor_budget_total,
  labor_expense_total,
  travel_budget_total,
  travel_expense_total,
  estimated_profit_rate,
  actual_profit_rate
FROM projects
WHERE id = '22222222-2222-2222-2222-222222222222';

-- ============================================
-- 4. 测试：更新 framework_agreements.name，检查 framework_name 是否同步
-- ============================================

-- 更新计件项目名称
UPDATE framework_agreements
SET name = '测试计件项目（已更新）'
WHERE id = '11111111-1111-1111-1111-111111111111'; -- 替换为实际的 framework_id

-- 检查项目的 framework_name 是否同步更新
SELECT 
  id, code, name,
  framework_id,
  framework_name
FROM projects
WHERE framework_id = '11111111-1111-1111-1111-111111111111'; -- 替换为实际的 framework_id

-- ============================================
-- 5. 测试：更新项目业绩金额，检查利润率是否重新计算
-- ============================================

-- 更新业绩金额
UPDATE projects
SET contract_amount = 150000.00
WHERE id = '22222222-2222-2222-2222-222222222222'; -- 替换为实际的 project_id

-- 检查利润率是否重新计算
SELECT 
  id, code, name,
  contract_amount,
  labor_budget_total,
  travel_budget_total,
  estimated_profit_rate,
  actual_profit_rate
FROM projects
WHERE id = '22222222-2222-2222-2222-222222222222'; -- 替换为实际的 project_id

-- ============================================
-- 6. 清理测试数据（可选）
-- ============================================

-- 删除测试数据（如果需要）
-- DELETE FROM project_expenses_labor WHERE project_id = '22222222-2222-2222-2222-222222222222';
-- DELETE FROM project_budgets_travel WHERE project_id = '22222222-2222-2222-2222-222222222222';
-- DELETE FROM project_budgets_labor WHERE project_id = '22222222-2222-2222-2222-222222222222';
-- DELETE FROM projects WHERE id = '22222222-2222-2222-2222-222222222222';
-- DELETE FROM framework_agreements WHERE id = '11111111-1111-1111-1111-111111111111';

