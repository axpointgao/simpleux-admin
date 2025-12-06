-- 创建缺失的成本计算触发器
-- 创建时间: 2024-12-06
-- 说明: 如果成本计算触发器不存在，执行此文件创建它

-- 如果触发器已存在，先删除
DROP TRIGGER IF EXISTS calculate_project_expenses_labor_cost ON project_expenses_labor;

-- 创建触发器
CREATE TRIGGER calculate_project_expenses_labor_cost
  BEFORE INSERT OR UPDATE ON project_expenses_labor
  FOR EACH ROW
  EXECUTE FUNCTION calculate_labor_expense_cost();

-- 添加注释
COMMENT ON TRIGGER calculate_project_expenses_labor_cost ON project_expenses_labor 
IS '自动计算项目人力支出的成本，从成本标准表获取 daily_cost 并计算 calculated_cost';

