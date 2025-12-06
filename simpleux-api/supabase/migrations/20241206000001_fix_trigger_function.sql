-- 修复触发器函数中的列引用歧义问题
-- 创建时间: 2024-12-06
-- 说明: 修复 update_project_budget_expense_totals 函数中的变量命名冲突

-- ============================================
-- 先删除旧函数（如果存在）
-- ============================================

DROP FUNCTION IF EXISTS update_project_budget_expense_totals(UUID);

-- ============================================
-- 重新创建函数：更新项目预算/支出汇总
-- ============================================

CREATE FUNCTION update_project_budget_expense_totals(p_project_id UUID)
RETURNS VOID AS $$
DECLARE
  v_labor_budget NUMERIC := 0;
  v_labor_expense NUMERIC := 0;
  v_travel_budget NUMERIC := 0;
  v_travel_expense NUMERIC := 0;
  v_outsource_budget NUMERIC := 0;
  v_outsource_expense NUMERIC := 0;
  v_contract_amount NUMERIC := 0;
  v_estimated_profit_rate NUMERIC := 0;
  v_actual_profit_rate NUMERIC := 0;
BEGIN
  -- 计算人力预算总额
  SELECT COALESCE(SUM(total_cost), 0) INTO v_labor_budget
  FROM project_budgets_labor
  WHERE project_budgets_labor.project_id = p_project_id;

  -- 计算人力支出总额
  SELECT COALESCE(SUM(calculated_cost), 0) INTO v_labor_expense
  FROM project_expenses_labor
  WHERE project_expenses_labor.project_id = p_project_id;

  -- 计算差旅预算总额
  SELECT COALESCE(SUM(total_cost), 0) INTO v_travel_budget
  FROM project_budgets_travel
  WHERE project_budgets_travel.project_id = p_project_id;

  -- 计算差旅支出总额
  SELECT COALESCE(SUM(total_amount), 0) INTO v_travel_expense
  FROM project_expenses_travel
  WHERE project_expenses_travel.project_id = p_project_id;

  -- 计算外包预算总额
  SELECT COALESCE(SUM(amount), 0) INTO v_outsource_budget
  FROM project_budgets_outsource
  WHERE project_budgets_outsource.project_id = p_project_id;

  -- 计算外包支出总额
  SELECT COALESCE(SUM(amount), 0) INTO v_outsource_expense
  FROM project_expenses_outsource
  WHERE project_expenses_outsource.project_id = p_project_id;

  -- 获取业绩金额
  SELECT p.contract_amount INTO v_contract_amount
  FROM projects p
  WHERE p.id = p_project_id;

  -- 计算预计利润率（基于预算）
  IF v_contract_amount > 0 THEN
    v_estimated_profit_rate := ((v_contract_amount - v_labor_budget - v_travel_budget - v_outsource_budget) / v_contract_amount) * 100;
  END IF;

  -- 计算实际利润率（基于支出）
  IF v_contract_amount > 0 THEN
    v_actual_profit_rate := ((v_contract_amount - v_labor_expense - v_travel_expense - v_outsource_expense) / v_contract_amount) * 100;
  END IF;

  -- 更新 projects 表
  UPDATE projects
  SET
    labor_budget_total = v_labor_budget,
    labor_expense_total = v_labor_expense,
    travel_budget_total = v_travel_budget,
    travel_expense_total = v_travel_expense,
    outsource_budget_total = v_outsource_budget,
    outsource_expense_total = v_outsource_expense,
    estimated_profit_rate = v_estimated_profit_rate,
    actual_profit_rate = v_actual_profit_rate,
    updated_at = now()
  WHERE id = p_project_id;
END;
$$ LANGUAGE plpgsql;

