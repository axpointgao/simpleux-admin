-- 测试查询 cost_standards 表
-- 用于检查数据是否存在以及 RLS 策略是否正常工作

-- 1. 查看表中的所有数据（绕过 RLS，使用管理员权限）
-- 注意：这需要在 Supabase Dashboard 的 SQL Editor 中执行，使用 service_role key
SELECT 
    id,
    employee_level,
    city_type,
    daily_cost,
    effective_from,
    effective_to,
    is_active,
    created_by,
    created_at
FROM cost_standards
ORDER BY created_at DESC
LIMIT 10;

-- 2. 检查数据总数
SELECT COUNT(*) as total_count FROM cost_standards;

-- 3. 检查最近创建的数据
SELECT 
    id,
    employee_level,
    city_type,
    daily_cost,
    effective_from,
    created_by,
    created_at
FROM cost_standards
ORDER BY created_at DESC
LIMIT 5;

-- 4. 检查 RLS 策略是否正常工作
-- 这个查询会使用当前用户的权限（通过 auth.uid()）
-- 如果 RLS 策略正确，应该能看到所有数据（因为 SELECT 策略是 USING (true)）
SELECT 
    COUNT(*) as visible_count
FROM cost_standards;

