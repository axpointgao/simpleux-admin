-- 简化成本标准表结构
-- 创建时间: 2024-12-06
-- 说明: 删除 effective_to 和 is_active 字段，只保留 effective_from
-- 逻辑：只要没有更新的生效日期出现，就永远有效

-- 0. 先删除或更新依赖的视图（如果存在）
DROP VIEW IF EXISTS active_cost_standards_view CASCADE;

-- 1. 删除 effective_to 字段
ALTER TABLE cost_standards
DROP COLUMN IF EXISTS effective_to;

-- 2. 删除 is_active 字段
ALTER TABLE cost_standards
DROP COLUMN IF EXISTS is_active;

-- 3. 删除相关的索引（如果存在）
DROP INDEX IF EXISTS idx_cost_standards_effective_date;
DROP INDEX IF EXISTS idx_cost_standards_is_active;

-- 4. 更新唯一索引（移除 effective_from，因为同一个级别+城市可以有多个不同生效日期的记录）
DROP INDEX IF EXISTS idx_cost_standards_unique;
CREATE UNIQUE INDEX IF NOT EXISTS idx_cost_standards_unique 
  ON cost_standards(employee_level, city_type, effective_from);

-- 5. 更新 get_cost_standard 函数
-- 逻辑：选择 effective_from <= p_date 且是最新的那条记录（按 effective_from DESC 排序取第一条）
CREATE OR REPLACE FUNCTION get_cost_standard(
  p_employee_level TEXT,
  p_city_type TEXT,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS NUMERIC(10,2) AS $$
DECLARE
  v_daily_cost NUMERIC(10,2);
BEGIN
  -- 选择 effective_from <= p_date 且是最新的那条记录
  -- 如果没有更新的生效日期出现，就永远有效
  SELECT daily_cost INTO v_daily_cost
  FROM cost_standards
  WHERE employee_level = p_employee_level
    AND city_type = p_city_type
    AND effective_from <= p_date
  ORDER BY effective_from DESC
  LIMIT 1;
  
  RETURN COALESCE(v_daily_cost, 0);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 6. 更新当前生效的成本标准视图
CREATE OR REPLACE VIEW active_cost_standards_view AS
SELECT 
  cs.*,
  CASE 
    WHEN cs.effective_from <= CURRENT_DATE THEN '生效'
    ELSE '未生效'
  END as status
FROM cost_standards cs
WHERE cs.effective_from <= CURRENT_DATE
  AND NOT EXISTS (
    -- 排除那些有更新生效日期的记录（失效的记录）
    SELECT 1 
    FROM cost_standards cs2
    WHERE cs2.employee_level = cs.employee_level
      AND cs2.city_type = cs.city_type
      AND cs2.effective_from > cs.effective_from
      AND cs2.effective_from <= CURRENT_DATE
  );

-- 7. 注释说明
COMMENT ON FUNCTION get_cost_standard IS '根据员工级别、城市类型和日期获取成本标准。逻辑：选择 effective_from <= p_date 且是最新的那条记录，如果没有更新的生效日期出现，就永远有效';
COMMENT ON VIEW active_cost_standards_view IS '当前生效的成本标准视图，排除有更新生效日期的记录';

