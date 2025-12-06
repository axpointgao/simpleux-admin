-- 执行新的迁移脚本
-- 创建时间: 2024-12-06
-- 说明: 合并执行城市类型表创建和成本标准表简化

-- ============================================
-- 第一部分：创建城市类型表
-- ============================================

-- 1. 创建城市类型表
CREATE TABLE IF NOT EXISTS city_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_city_types_sort_order ON city_types(sort_order);
CREATE INDEX IF NOT EXISTS idx_city_types_name ON city_types(name);

-- 创建 updated_at 触发器
CREATE TRIGGER update_city_types_updated_at
  BEFORE UPDATE ON city_types
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 2. 启用 RLS
ALTER TABLE city_types ENABLE ROW LEVEL SECURITY;

-- RLS 策略：所有用户都可以查看，只有系统管理员可以编辑
CREATE POLICY "city_types_select_policy" ON city_types
  FOR SELECT
  USING (true);

CREATE POLICY "city_types_insert_policy" ON city_types
  FOR INSERT
  WITH CHECK (is_system_admin(auth.uid()));

CREATE POLICY "city_types_update_policy" ON city_types
  FOR UPDATE
  USING (is_system_admin(auth.uid()))
  WITH CHECK (is_system_admin(auth.uid()));

CREATE POLICY "city_types_delete_policy" ON city_types
  FOR DELETE
  USING (is_system_admin(auth.uid()));

-- 3. 初始化一些城市类型
INSERT INTO city_types (name, display_name, sort_order) VALUES
  ('成都', '成都', 1),
  ('杭州', '杭州', 2),
  ('北京', '北京', 3),
  ('上海', '上海', 4)
ON CONFLICT (name) DO NOTHING;

-- 4. 注释说明
COMMENT ON TABLE city_types IS '城市类型表，用于成本标准、人员管理等多个模块';
COMMENT ON COLUMN city_types.name IS '城市类型名称（唯一标识）';
COMMENT ON COLUMN city_types.display_name IS '城市类型显示名称';
COMMENT ON COLUMN city_types.sort_order IS '排序顺序';

-- ============================================
-- 第二部分：简化成本标准表结构
-- ============================================

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

-- ============================================
-- 执行完成提示
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ 迁移执行完成！';
  RAISE NOTICE '✅ 城市类型表已创建';
  RAISE NOTICE '✅ 成本标准表已简化（删除了 effective_to 和 is_active 字段）';
  RAISE NOTICE '✅ get_cost_standard 函数已更新';
  RAISE NOTICE '✅ active_cost_standards_view 视图已更新';
END $$;

