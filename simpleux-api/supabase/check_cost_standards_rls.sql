-- 检查 cost_standards 表的 RLS 策略
-- 执行此脚本查看当前配置的 RLS 策略

-- 1. 检查 RLS 是否启用
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename = 'cost_standards';

-- 2. 查看所有 RLS 策略
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
WHERE tablename = 'cost_standards'
ORDER BY policyname;

-- 3. 检查是否有冲突的策略
-- 如果有多个 SELECT 策略，可能会有冲突

-- 4. 测试查询（需要替换 YOUR_USER_ID）
-- SELECT * FROM cost_standards LIMIT 5;

