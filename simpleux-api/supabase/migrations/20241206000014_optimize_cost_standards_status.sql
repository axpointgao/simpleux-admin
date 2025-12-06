-- 优化成本标准状态计算
-- 创建时间: 2024-12-06
-- 说明: 创建函数和索引来优化状态计算性能

-- 1. 创建计算状态的函数（使用窗口函数优化性能）
CREATE OR REPLACE FUNCTION get_cost_standards_with_status(
  p_employee_levels TEXT[] DEFAULT NULL,
  p_city_types TEXT[] DEFAULT NULL,
  p_limit INTEGER DEFAULT NULL,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  employee_level TEXT,
  city_type TEXT,
  daily_cost NUMERIC(10,2),
  effective_from DATE,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  status TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH filtered_standards AS (
    SELECT cs.*
    FROM cost_standards cs
    WHERE 
      (p_employee_levels IS NULL OR cs.employee_level = ANY(p_employee_levels))
      AND (p_city_types IS NULL OR cs.city_type = ANY(p_city_types))
  ),
  max_dates AS (
    SELECT 
      fs.employee_level,
      fs.city_type,
      MAX(fs.effective_from) as max_effective_from
    FROM filtered_standards fs
    WHERE fs.effective_from <= CURRENT_DATE
    GROUP BY fs.employee_level, fs.city_type
  )
  SELECT 
    fs.id,
    fs.employee_level,
    fs.city_type,
    fs.daily_cost,
    fs.effective_from,
    fs.created_by,
    fs.created_at,
    fs.updated_at,
    CASE 
      WHEN fs.effective_from > CURRENT_DATE THEN '未生效'
      WHEN md.max_effective_from IS NOT NULL AND fs.effective_from = md.max_effective_from THEN '生效'
      ELSE '失效'
    END as status
  FROM filtered_standards fs
  LEFT JOIN max_dates md ON 
    fs.employee_level = md.employee_level 
    AND fs.city_type = md.city_type
  ORDER BY fs.employee_level, fs.city_type, fs.effective_from DESC
  LIMIT CASE WHEN p_limit IS NULL THEN NULL ELSE p_limit END
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;

-- 2. 优化索引：为状态计算查询添加复合索引
-- 注意：不能使用 CURRENT_DATE 在索引 WHERE 条件中（不是 IMMUTABLE）
-- 使用普通复合索引即可，数据库查询优化器会自动使用
CREATE INDEX IF NOT EXISTS idx_cost_standards_status_query 
  ON cost_standards(employee_level, city_type, effective_from DESC);

-- 3. 添加注释
COMMENT ON FUNCTION get_cost_standards_with_status IS '获取成本标准列表并计算状态，使用窗口函数优化性能';

