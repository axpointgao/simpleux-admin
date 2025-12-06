-- 检查 cost_standards 表的 city_type 约束
-- 如果约束存在，会显示约束信息；如果不存在，不会返回任何结果

SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'cost_standards'::regclass
  AND conname = 'chk_cost_standards_city_type';

-- 如果上面的查询返回结果，说明约束仍然存在
-- 需要执行 20241206000007_remove_city_type_constraint.sql 迁移文件来移除约束

