-- 创建成本标准表并实现人力成本计算触发器
-- 创建时间: 2024-12-06
-- 说明: 创建 cost_standards 表，并实现 project_expenses_labor 表的自动成本计算触发器

-- 1. 创建成本标准表（cost_standards）
CREATE TABLE IF NOT EXISTS cost_standards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_level TEXT NOT NULL,
  city_type TEXT NOT NULL,
  daily_cost NUMERIC(10,2) NOT NULL,
  effective_from DATE NOT NULL,
  effective_to DATE NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT chk_cost_standards_employee_level CHECK (
    employee_level IN ('P0', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'P9', 'M0', 'M1', 'M2', 'M3', 'M4', 'M5')
  ),
  CONSTRAINT chk_cost_standards_city_type CHECK (city_type IN ('Chengdu', 'Hangzhou')),
  CONSTRAINT chk_cost_standards_daily_cost CHECK (daily_cost > 0),
  CONSTRAINT chk_cost_standards_effective_date CHECK (
    effective_to IS NULL OR effective_to >= effective_from
  )
);

-- 创建成本标准表的索引
CREATE UNIQUE INDEX IF NOT EXISTS idx_cost_standards_unique 
  ON cost_standards(employee_level, city_type, effective_from);
CREATE INDEX IF NOT EXISTS idx_cost_standards_employee_level 
  ON cost_standards(employee_level, city_type);
CREATE INDEX IF NOT EXISTS idx_cost_standards_effective_date 
  ON cost_standards(effective_from, effective_to);
CREATE INDEX IF NOT EXISTS idx_cost_standards_is_active 
  ON cost_standards(is_active);

-- 创建 updated_at 触发器
CREATE TRIGGER update_cost_standards_updated_at
  BEFORE UPDATE ON cost_standards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 2. 创建获取成本标准的函数
-- 根据员工级别、城市类型和日期获取成本标准
CREATE OR REPLACE FUNCTION get_cost_standard(
  p_employee_level TEXT,
  p_city_type TEXT,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS NUMERIC(10,2) AS $$
DECLARE
  v_daily_cost NUMERIC(10,2);
BEGIN
  SELECT daily_cost INTO v_daily_cost
  FROM cost_standards
  WHERE employee_level = p_employee_level
    AND city_type = p_city_type
    AND is_active = true
    AND effective_from <= p_date
    AND (effective_to IS NULL OR effective_to >= p_date)
  ORDER BY effective_from DESC
  LIMIT 1;
  
  RETURN COALESCE(v_daily_cost, 0);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 3. 创建人力支出成本计算触发器函数
-- 自动从成本标准表获取 daily_cost，并计算 calculated_cost = hours / 8 * daily_cost
CREATE OR REPLACE FUNCTION calculate_labor_expense_cost()
RETURNS TRIGGER AS $$
DECLARE
  v_daily_cost NUMERIC(10,2);
  v_city_type TEXT;
BEGIN
  -- 从员工表（profiles）获取 city_type
  -- 注意：如果 profiles 表不存在或员工不存在，会返回 NULL
  SELECT city_type INTO v_city_type
  FROM profiles
  WHERE id = NEW.employee_id;
  
  -- 如果找不到 city_type，尝试从项目预算中获取对应的 unit_cost
  IF v_city_type IS NULL THEN
    -- 尝试从项目预算中获取对应的 unit_cost（作为备用方案）
    SELECT unit_cost INTO v_daily_cost
    FROM project_budgets_labor
    WHERE project_id = NEW.project_id
      AND employee_level = NEW.employee_level
    LIMIT 1;
  ELSE
    -- 从成本标准表获取 daily_cost
    v_daily_cost := get_cost_standard(NEW.employee_level, v_city_type, NEW.work_date);
    
    -- 如果找不到成本标准，尝试使用项目预算中的 unit_cost
    IF v_daily_cost = 0 THEN
      SELECT unit_cost INTO v_daily_cost
      FROM project_budgets_labor
      WHERE project_id = NEW.project_id
        AND employee_level = NEW.employee_level
      LIMIT 1;
    END IF;
  END IF;
  
  -- 计算成本：hours / 8 * daily_cost
  -- 如果仍然找不到成本标准，使用 0（需要前端验证，确保成本标准存在）
  NEW.calculated_cost := (NEW.hours / 8.0) * COALESCE(v_daily_cost, 0);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
CREATE TRIGGER calculate_project_expenses_labor_cost
  BEFORE INSERT OR UPDATE ON project_expenses_labor
  FOR EACH ROW
  EXECUTE FUNCTION calculate_labor_expense_cost();

-- 4. 创建当前生效的成本标准视图
CREATE OR REPLACE VIEW active_cost_standards_view AS
SELECT 
  cs.*
FROM cost_standards cs
WHERE cs.is_active = true
  AND cs.effective_from <= CURRENT_DATE
  AND (cs.effective_to IS NULL OR cs.effective_to >= CURRENT_DATE);

-- 5. 启用 RLS
ALTER TABLE cost_standards ENABLE ROW LEVEL SECURITY;

-- 临时策略：允许所有操作（开发环境）
-- 生产环境需要根据实际需求配置具体的 RLS 策略
CREATE POLICY "Allow all operations for development" ON cost_standards
  FOR ALL USING (true) WITH CHECK (true);

-- 6. 注释说明
COMMENT ON TABLE cost_standards IS '人日成本标准表，存储不同员工级别和城市类型的成本标准';
COMMENT ON FUNCTION get_cost_standard IS '根据员工级别、城市类型和日期获取成本标准';
COMMENT ON FUNCTION calculate_labor_expense_cost IS '自动计算项目人力支出的成本，从成本标准表获取 daily_cost 并计算 calculated_cost';
COMMENT ON VIEW active_cost_standards_view IS '当前生效的成本标准视图';

