-- 立即移除成本标准表的城市类型约束
-- 如果迁移文件 20241206000007_remove_city_type_constraint.sql 还没有执行，可以手动执行这个脚本

-- 删除原有的 city_type 检查约束
ALTER TABLE cost_standards
DROP CONSTRAINT IF EXISTS chk_cost_standards_city_type;

-- 验证约束是否已删除
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conrelid = 'cost_standards'::regclass 
      AND conname = 'chk_cost_standards_city_type'
  ) THEN
    RAISE EXCEPTION '约束仍然存在，删除失败';
  ELSE
    RAISE NOTICE '约束已成功删除';
  END IF;
END $$;

