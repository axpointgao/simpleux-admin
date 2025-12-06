-- 简单的触发器测试脚本
-- 在 Supabase Dashboard 的 SQL Editor 中执行

-- ============================================
-- 步骤 1: 创建测试数据
-- ============================================

-- 1.1 创建测试计件项目
DO $$
DECLARE
  v_framework_id UUID;
  v_project_id UUID;
  -- 最终检查变量
  v_final_code TEXT;
  v_final_name TEXT;
  v_final_contract_amount NUMERIC;
  v_final_labor_budget NUMERIC;
  v_final_labor_expense NUMERIC;
  v_final_travel_budget NUMERIC;
  v_final_travel_expense NUMERIC;
  v_final_estimated_rate NUMERIC;
  v_final_actual_rate NUMERIC;
  v_final_framework_name TEXT;
BEGIN
  -- 创建计件项目
  INSERT INTO framework_agreements (code, name, manager_id, manager_name, "group")
  VALUES ('FRAM-TEST-001', '测试计件项目', gen_random_uuid(), '测试经理', '测试部门')
  RETURNING id INTO v_framework_id;

  RAISE NOTICE '计件项目创建成功，ID: %', v_framework_id;

  -- 1.2 创建测试项目
  INSERT INTO projects (
    code, name, type, status, manager_id, manager_name, "group",
    plan_start_date, plan_end_date, contract_amount, framework_id, created_by
  )
  VALUES (
    'PROJ-TEST-001', '触发器测试项目', '项目制', '待启动',
    gen_random_uuid(), '测试经理', '测试部门',
    CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', 100000.00,
    v_framework_id, gen_random_uuid()
  )
  RETURNING id INTO v_project_id;

  RAISE NOTICE '项目创建成功，ID: %', v_project_id;

  -- ============================================
  -- 步骤 2: 检查初始状态
  -- ============================================
  
  RAISE NOTICE '=== 检查初始状态 ===';
  
  PERFORM id, code, name, 
    COALESCE(labor_budget_total, 0) as labor_budget,
    COALESCE(estimated_profit_rate, 0) as profit_rate,
    framework_name
  FROM projects
  WHERE id = v_project_id;

  -- ============================================
  -- 步骤 3: 测试添加人力预算
  -- ============================================
  
  RAISE NOTICE '=== 测试：添加人力预算 ===';
  
  INSERT INTO project_budgets_labor (project_id, employee_level, city_type, days, unit_cost)
  VALUES (v_project_id, 'P5', 'Chengdu', 10, 1000.00);

  -- 检查汇总字段是否更新
  RAISE NOTICE '添加人力预算后：';
  PERFORM id, code, name,
    COALESCE(labor_budget_total, 0) as labor_budget,
    COALESCE(estimated_profit_rate, 0) as profit_rate
  FROM projects
  WHERE id = v_project_id;

  -- ============================================
  -- 步骤 4: 测试添加差旅预算
  -- ============================================
  
  RAISE NOTICE '=== 测试：添加差旅预算 ===';
  
  INSERT INTO project_budgets_travel (project_id, item, transport_big, stay, transport_small)
  VALUES (v_project_id, '测试差旅', 2000.00, 1500.00, 500.00);

  -- 检查汇总字段
  RAISE NOTICE '添加差旅预算后：';
  PERFORM id, code, name,
    COALESCE(labor_budget_total, 0) as labor_budget,
    COALESCE(travel_budget_total, 0) as travel_budget,
    COALESCE(estimated_profit_rate, 0) as profit_rate
  FROM projects
  WHERE id = v_project_id;

  -- ============================================
  -- 步骤 5: 测试添加人力支出
  -- ============================================
  
  RAISE NOTICE '=== 测试：添加人力支出 ===';
  
  INSERT INTO project_expenses_labor (
    project_id, employee_id, employee_name, employee_level, work_date, hours, calculated_cost
  )
  VALUES (
    v_project_id, gen_random_uuid(), '测试员工', 'P5', CURRENT_DATE, 8, 800.00
  );

  -- 检查支出汇总和实际利润率
  RAISE NOTICE '添加人力支出后：';
  PERFORM id, code, name,
    COALESCE(labor_budget_total, 0) as labor_budget,
    COALESCE(labor_expense_total, 0) as labor_expense,
    COALESCE(estimated_profit_rate, 0) as estimated_rate,
    COALESCE(actual_profit_rate, 0) as actual_rate
  FROM projects
  WHERE id = v_project_id;

  -- ============================================
  -- 步骤 6: 测试更新 framework_name
  -- ============================================
  
  RAISE NOTICE '=== 测试：更新计件项目名称 ===';
  
  UPDATE framework_agreements
  SET name = '测试计件项目（已更新）'
  WHERE id = v_framework_id;

  -- 检查项目的 framework_name 是否同步
  RAISE NOTICE '更新计件项目名称后：';
  PERFORM id, code, name, framework_name
  FROM projects
  WHERE id = v_project_id;

  -- ============================================
  -- 步骤 7: 测试更新业绩金额
  -- ============================================
  
  RAISE NOTICE '=== 测试：更新业绩金额 ===';
  
  UPDATE projects
  SET contract_amount = 150000.00
  WHERE id = v_project_id;

  -- 检查利润率是否重新计算
  RAISE NOTICE '更新业绩金额后：';
  PERFORM id, code, name,
    contract_amount,
    COALESCE(labor_budget_total, 0) as labor_budget,
    COALESCE(travel_budget_total, 0) as travel_budget,
    COALESCE(estimated_profit_rate, 0) as estimated_rate,
    COALESCE(actual_profit_rate, 0) as actual_rate
  FROM projects
  WHERE id = v_project_id;

  -- ============================================
  -- 步骤 8: 最终检查
  -- ============================================
  
  RAISE NOTICE '=== 最终检查 ===';
  RAISE NOTICE '项目汇总数据：';
  
  -- 获取最终结果并显示
  SELECT 
    p.code,
    p.name,
    p.contract_amount,
    COALESCE(p.labor_budget_total, 0),
    COALESCE(p.labor_expense_total, 0),
    COALESCE(p.travel_budget_total, 0),
    COALESCE(p.travel_expense_total, 0),
    COALESCE(p.estimated_profit_rate, 0),
    COALESCE(p.actual_profit_rate, 0),
    p.framework_name
  INTO 
    v_final_code,
    v_final_name,
    v_final_contract_amount,
    v_final_labor_budget,
    v_final_labor_expense,
    v_final_travel_budget,
    v_final_travel_expense,
    v_final_estimated_rate,
    v_final_actual_rate,
    v_final_framework_name
  FROM projects p
  WHERE p.id = v_project_id;

  RAISE NOTICE '项目编号: %', v_final_code;
  RAISE NOTICE '项目名称: %', v_final_name;
  RAISE NOTICE '业绩金额: %', v_final_contract_amount;
  RAISE NOTICE '人力预算: %, 人力支出: %', v_final_labor_budget, v_final_labor_expense;
  RAISE NOTICE '差旅预算: %, 差旅支出: %', v_final_travel_budget, v_final_travel_expense;
  RAISE NOTICE '预计利润率: %%%', v_final_estimated_rate;
  RAISE NOTICE '实际利润率: %%%', v_final_actual_rate;
  RAISE NOTICE '计件项目名称: %', v_final_framework_name;

  -- ============================================
  -- 清理测试数据（可选，取消注释以执行）
  -- ============================================
  
  -- DELETE FROM project_expenses_labor WHERE project_id = v_project_id;
  -- DELETE FROM project_budgets_travel WHERE project_id = v_project_id;
  -- DELETE FROM project_budgets_labor WHERE project_id = v_project_id;
  -- DELETE FROM projects WHERE id = v_project_id;
  -- DELETE FROM framework_agreements WHERE id = v_framework_id;
  
  RAISE NOTICE '测试完成！';

END $$;

