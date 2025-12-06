-- 检查查询性能和索引使用情况
-- 在 Supabase Dashboard 的 SQL Editor 中执行

-- 1. 检查索引是否存在
SELECT 
  indexname,
  indexdef,
  idx_scan as "索引扫描次数",
  idx_tup_read as "索引读取行数",
  idx_tup_fetch as "索引获取行数"
FROM pg_indexes
LEFT JOIN pg_stat_user_indexes ON pg_indexes.indexname = pg_stat_user_indexes.indexname
WHERE pg_indexes.schemaname = 'public'
  AND pg_indexes.tablename = 'projects'
ORDER BY pg_indexes.indexname;

-- 2. 查看查询计划（模拟实际查询）
-- 注意：需要替换 auth.uid() 为实际的用户 ID 或使用 SECURITY DEFINER 函数
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT 
  id, code, name, type, status, manager_id, manager_name, "group", 
  client_dept, biz_manager, framework_id, framework_name, demand_code,
  contract_amount, labor_budget_total, labor_expense_total,
  estimated_profit_rate, actual_profit_rate, is_pending_entry,
  created_at, updated_at
FROM projects
WHERE status != '已归档'
ORDER BY created_at DESC
LIMIT 10;

-- 3. 检查 RLS 策略的执行计划
-- 查看 RLS 策略是否使用了索引
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT COUNT(*) 
FROM projects
WHERE status != '已归档';

-- 4. 检查表统计信息
SELECT 
  schemaname,
  tablename,
  n_live_tup as "活跃行数",
  n_dead_tup as "死行数",
  last_vacuum,
  last_autovacuum,
  last_analyze,
  last_autoanalyze
FROM pg_stat_user_tables
WHERE tablename = 'projects';

-- 5. 检查是否有需要 VACUUM 或 ANALYZE
-- 如果统计信息过时，查询优化器可能选择错误的执行计划

