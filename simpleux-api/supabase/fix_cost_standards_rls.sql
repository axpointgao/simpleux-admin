-- 修复 cost_standards 表的 RLS 策略问题
-- 在 Supabase Dashboard 的 SQL Editor 中执行此脚本

-- 1. 删除旧的开发环境策略（如果存在）
DROP POLICY IF EXISTS "Allow all operations for development" ON cost_standards;

-- 2. 查看当前的策略
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'cost_standards';

-- 3. 如果 SELECT 策略不存在或有问题，重新创建
DROP POLICY IF EXISTS "cost_standards_select_policy" ON cost_standards;

CREATE POLICY "cost_standards_select_policy" ON cost_standards
  FOR SELECT
  USING (true);

-- 4. 验证策略
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'cost_standards'
  AND cmd = 'SELECT';

