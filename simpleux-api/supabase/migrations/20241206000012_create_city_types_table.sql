-- 创建城市类型表
-- 创建时间: 2024-12-06
-- 说明: 创建独立的城市类型表，用于成本标准、人员管理等多个模块

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

