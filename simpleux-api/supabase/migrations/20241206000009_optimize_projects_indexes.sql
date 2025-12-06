-- 优化 projects 表的索引，提升查询性能
-- 创建时间: 2024-12-06
-- 说明: 添加缺失的索引，优化常用查询场景

-- 1. 添加 created_at 索引（用于排序，非常重要！）
-- 列表查询默认按 created_at DESC 排序，但没有索引会导致全表扫描
CREATE INDEX IF NOT EXISTS idx_projects_created_at_desc ON projects(created_at DESC);

-- 2. 添加复合索引，优化常见的筛选+排序组合查询
-- 场景：筛选状态 + 按创建时间排序
CREATE INDEX IF NOT EXISTS idx_projects_status_created_at ON projects(status, created_at DESC);

-- 场景：筛选类型 + 按创建时间排序
CREATE INDEX IF NOT EXISTS idx_projects_type_created_at ON projects(type, created_at DESC);

-- 场景：筛选部门 + 按创建时间排序
CREATE INDEX IF NOT EXISTS idx_projects_group_created_at ON projects("group", created_at DESC);

-- 场景：筛选状态（排除已归档）+ 按创建时间排序（最常用）
CREATE INDEX IF NOT EXISTS idx_projects_status_not_archived_created_at 
ON projects(created_at DESC) 
WHERE status != '已归档';

-- 3. 添加 created_by 索引（用于 RLS 策略优化）
CREATE INDEX IF NOT EXISTS idx_projects_created_by ON projects(created_by);

-- 4. 分析表，更新统计信息（帮助查询优化器选择最佳索引）
ANALYZE projects;

