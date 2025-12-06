-- 项目汇总字段自动更新触发器
-- 创建时间: 2024-12-06
-- 说明: 自动维护 projects 表中的预算/支出汇总字段和利润率字段

-- ============================================
-- 1. 函数：更新项目预算/支出汇总
-- ============================================

CREATE OR REPLACE FUNCTION update_project_budget_expense_totals(p_project_id UUID)
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

-- ============================================
-- 2. 触发器：项目人力预算表变化时更新汇总
-- ============================================

CREATE OR REPLACE FUNCTION trigger_update_project_labor_budget_totals()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM update_project_budget_expense_totals(OLD.project_id);
    RETURN OLD;
  ELSE
    PERFORM update_project_budget_expense_totals(NEW.project_id);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_project_labor_budget_totals
  AFTER INSERT OR UPDATE OR DELETE ON project_budgets_labor
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_project_labor_budget_totals();

-- ============================================
-- 3. 触发器：项目人力支出表变化时更新汇总
-- ============================================

CREATE OR REPLACE FUNCTION trigger_update_project_labor_expense_totals()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM update_project_budget_expense_totals(OLD.project_id);
    RETURN OLD;
  ELSE
    PERFORM update_project_budget_expense_totals(NEW.project_id);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_project_labor_expense_totals
  AFTER INSERT OR UPDATE OR DELETE ON project_expenses_labor
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_project_labor_expense_totals();

-- ============================================
-- 4. 触发器：项目差旅预算表变化时更新汇总
-- ============================================

CREATE OR REPLACE FUNCTION trigger_update_project_travel_budget_totals()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM update_project_budget_expense_totals(OLD.project_id);
    RETURN OLD;
  ELSE
    PERFORM update_project_budget_expense_totals(NEW.project_id);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_project_travel_budget_totals
  AFTER INSERT OR UPDATE OR DELETE ON project_budgets_travel
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_project_travel_budget_totals();

-- ============================================
-- 5. 触发器：项目差旅支出表变化时更新汇总
-- ============================================

CREATE OR REPLACE FUNCTION trigger_update_project_travel_expense_totals()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM update_project_budget_expense_totals(OLD.project_id);
    RETURN OLD;
  ELSE
    PERFORM update_project_budget_expense_totals(NEW.project_id);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_project_travel_expense_totals
  AFTER INSERT OR UPDATE OR DELETE ON project_expenses_travel
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_project_travel_expense_totals();

-- ============================================
-- 6. 触发器：项目外包预算表变化时更新汇总
-- ============================================

CREATE OR REPLACE FUNCTION trigger_update_project_outsource_budget_totals()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM update_project_budget_expense_totals(OLD.project_id);
    RETURN OLD;
  ELSE
    PERFORM update_project_budget_expense_totals(NEW.project_id);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_project_outsource_budget_totals
  AFTER INSERT OR UPDATE OR DELETE ON project_budgets_outsource
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_project_outsource_budget_totals();

-- ============================================
-- 7. 触发器：项目外包支出表变化时更新汇总
-- ============================================

CREATE OR REPLACE FUNCTION trigger_update_project_outsource_expense_totals()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM update_project_budget_expense_totals(OLD.project_id);
    RETURN OLD;
  ELSE
    PERFORM update_project_budget_expense_totals(NEW.project_id);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_project_outsource_expense_totals
  AFTER INSERT OR UPDATE OR DELETE ON project_expenses_outsource
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_project_outsource_expense_totals();

-- ============================================
-- 8. 触发器：项目业绩金额变化时更新利润率
-- ============================================

CREATE OR REPLACE FUNCTION trigger_update_project_profit_rate()
RETURNS TRIGGER AS $$
BEGIN
  -- 如果 contract_amount 变化，重新计算利润率
  IF TG_OP = 'UPDATE' AND (OLD.contract_amount IS DISTINCT FROM NEW.contract_amount) THEN
    PERFORM update_project_budget_expense_totals(NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_project_profit_rate
  AFTER UPDATE OF contract_amount ON projects
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_project_profit_rate();

-- ============================================
-- 9. 触发器：同步 framework_name
-- ============================================

CREATE OR REPLACE FUNCTION sync_framework_name()
RETURNS TRIGGER AS $$
BEGIN
  -- 当 framework_agreements.name 更新时，同步更新所有关联项目的 framework_name
  UPDATE projects
  SET framework_name = NEW.name,
      updated_at = now()
  WHERE framework_id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sync_framework_name
  AFTER UPDATE OF name ON framework_agreements
  FOR EACH ROW
  EXECUTE FUNCTION sync_framework_name();

-- ============================================
-- 10. 触发器：创建项目时初始化 framework_name
-- ============================================

CREATE OR REPLACE FUNCTION init_framework_name()
RETURNS TRIGGER AS $$
BEGIN
  -- 如果项目有关联的计件项目，初始化 framework_name
  IF NEW.framework_id IS NOT NULL THEN
    SELECT name INTO NEW.framework_name
    FROM framework_agreements
    WHERE id = NEW.framework_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_init_framework_name
  BEFORE INSERT OR UPDATE OF framework_id ON projects
  FOR EACH ROW
  EXECUTE FUNCTION init_framework_name();

-- ============================================
-- 11. 初始化现有项目的汇总数据（一次性执行）
-- ============================================

-- 为所有现有项目初始化汇总字段
DO $$
DECLARE
  project_record RECORD;
BEGIN
  FOR project_record IN SELECT id FROM projects LOOP
    PERFORM update_project_budget_expense_totals(project_record.id);
  END LOOP;
END $$;

-- ============================================
-- 迁移完成
-- ============================================

