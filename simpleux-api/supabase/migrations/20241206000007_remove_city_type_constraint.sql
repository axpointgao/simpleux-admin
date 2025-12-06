-- 移除成本标准表的城市类型约束，支持可添加城市类型
-- 创建时间: 2024-12-06
-- 说明: 移除 cost_standards 表的 city_type CHECK 约束，允许添加任意城市类型

-- 删除原有的 city_type 检查约束
ALTER TABLE cost_standards
DROP CONSTRAINT IF EXISTS chk_cost_standards_city_type;

-- 注意：不再限制 city_type 的值，允许用户添加任意城市类型
-- 前端已支持通过 Select 组件的 allowCreate 功能添加新的城市类型
