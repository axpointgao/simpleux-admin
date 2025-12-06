# 数据库索引和优化

## 一、索引设计原则

### 1.1 索引类型

**B-Tree索引（默认）**：
- 适用于等值查询、范围查询、排序
- 支持 `=`, `>`, `<`, `>=`, `<=`, `BETWEEN`, `IN`, `LIKE`（前缀匹配）
- 适用于大多数查询场景

**唯一索引**：
- 确保列值的唯一性
- 自动创建唯一约束
- 用于主键、外键、业务唯一字段

**复合索引**：
- 多个列组合的索引
- 遵循最左前缀原则
- 优化多条件查询

**部分索引**：
- 只索引满足条件的行
- 减少索引大小，提高查询效率
- 适用于有条件的查询场景

### 1.2 索引创建策略

**必须创建索引的字段**：
- 主键（自动创建）
- 外键（建议创建）
- 唯一约束字段
- 频繁查询的字段
- 排序和分组的字段
- 关联查询的字段

**不建议创建索引的情况**：
- 数据量很小的表（< 1000行）
- 频繁更新的字段（需要权衡）
- 很少用于查询的字段
- 包含大量NULL值的字段

## 二、核心表索引设计

### 2.1 profiles（用户表）

**已有索引**：
- PRIMARY KEY (id)
- UNIQUE INDEX idx_profiles_dingtalk_user_id (dingtalk_user_id)
- INDEX idx_profiles_department (department)
- INDEX idx_profiles_status (status)

**建议添加索引**：
```sql
-- 按员工级别和城市类型查询（成本计算）
CREATE INDEX idx_profiles_level_city ON profiles(employee_level, city_type);

-- 按状态和部门查询
CREATE INDEX idx_profiles_status_department ON profiles(status, department);
```

### 2.2 projects（项目表）

**已有索引**：
- PRIMARY KEY (id)
- UNIQUE INDEX idx_projects_code (code)
- INDEX idx_projects_type (type)
- INDEX idx_projects_status (status)
- INDEX idx_projects_group (group)
- INDEX idx_projects_manager_id (manager_id)
- INDEX idx_projects_framework_id (framework_id)

**建议添加索引**：
```sql
-- 按状态和部门查询（列表筛选）
CREATE INDEX idx_projects_status_group ON projects(status, group);

-- 按日期范围查询
CREATE INDEX idx_projects_date_range ON projects(plan_start_date, plan_end_date);

-- 复合查询（状态 + 类型 + 部门）
CREATE INDEX idx_projects_status_type_group ON projects(status, type, group);
```

### 2.3 performance_records（业绩记录表）

**已有索引**：
- PRIMARY KEY (id)
- INDEX idx_performance_records_project_id (project_id)
- INDEX idx_performance_records_demand_code (demand_code)
- INDEX idx_performance_records_record_month (record_month)
- INDEX idx_performance_records_status (status)
- UNIQUE INDEX idx_performance_records_project_month (project_id, record_month) WHERE project_id IS NOT NULL AND record_month IS NOT NULL
- UNIQUE INDEX idx_performance_records_demand (demand_code) WHERE demand_code IS NOT NULL

**建议添加索引**：
```sql
-- 按状态和月份查询
CREATE INDEX idx_performance_records_status_month ON performance_records(status, record_month);
```

### 2.4 tasks（任务表）

**已有索引**：
- PRIMARY KEY (id)
- INDEX idx_tasks_entity (entity_type, entity_id)
- INDEX idx_tasks_assignee_id (assignee_id)
- INDEX idx_tasks_status (status)
- INDEX idx_tasks_created_by (created_by)

**建议添加索引**：
```sql
-- 按执行人和状态查询
CREATE INDEX idx_tasks_assignee_status ON tasks(assignee_id, status);

-- 按日期范围查询
CREATE INDEX idx_tasks_date_range ON tasks(plan_start_date, plan_end_date);
```

### 2.5 approvals（审批表）

**已有索引**：
- PRIMARY KEY (id)
- INDEX idx_approvals_type (type)
- INDEX idx_approvals_related (related_type, related_id)
- INDEX idx_approvals_applicant_id (applicant_id)
- INDEX idx_approvals_status (status)
- INDEX idx_approvals_dingtalk_task_id (dingtalk_task_id)

**建议添加索引**：
```sql
-- 按状态和申请人查询
CREATE INDEX idx_approvals_status_applicant ON approvals(status, applicant_id);

-- 按类型和状态查询
CREATE INDEX idx_approvals_type_status ON approvals(type, status);
```

## 三、查询优化

### 3.1 常见查询优化

**列表查询优化**：
```sql
-- 优化前：全表扫描
SELECT * FROM projects WHERE status = '进行中';

-- 优化后：使用索引
SELECT * FROM projects WHERE status = '进行中' ORDER BY created_at DESC LIMIT 20;
-- 建议添加：CREATE INDEX idx_projects_status_created ON projects(status, created_at);
```

**关联查询优化**：
```sql
-- 优化前：嵌套循环
SELECT p.*, pr.registration_amount 
FROM projects p 
LEFT JOIN performance_records pr ON p.id = pr.project_id 
WHERE p.status = '进行中';

-- 优化后：使用索引和JOIN优化
-- 确保 projects.status 和 performance_records.project_id 都有索引
```

**日期范围查询优化**：
```sql
-- 优化前：函数计算
SELECT * FROM projects 
WHERE EXTRACT(YEAR FROM plan_start_date) = 2024;

-- 优化后：直接比较
SELECT * FROM projects 
WHERE plan_start_date >= '2024-01-01' AND plan_start_date < '2025-01-01';
```

### 3.2 分页查询优化

**使用游标分页**：
```sql
-- 优化前：OFFSET分页（大数据量时性能差）
SELECT * FROM projects 
ORDER BY created_at DESC 
OFFSET 1000 LIMIT 20;

-- 优化后：游标分页
SELECT * FROM projects 
WHERE created_at < '2024-01-01' 
ORDER BY created_at DESC 
LIMIT 20;
```

**使用覆盖索引**：
```sql
-- 如果只需要部分字段，创建覆盖索引
CREATE INDEX idx_projects_list ON projects(status, created_at) 
INCLUDE (name, type, manager_name);
```

## 四、性能监控

### 4.1 慢查询监控

**启用慢查询日志**：
```sql
-- PostgreSQL配置
log_min_duration_statement = 1000  -- 记录超过1秒的查询
log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h '
```

**查询慢查询**：
```sql
-- 查看慢查询统计
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

### 4.2 索引使用情况

**查看索引使用统计**：
```sql
-- 查看索引使用情况
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;
```

**识别未使用的索引**：
```sql
-- 查找未使用的索引（idx_scan = 0）
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0
AND indexname NOT LIKE 'pg_toast%';
```

## 五、表分区

### 5.1 分区策略

**按时间分区**（适用于历史数据表）：
```sql
-- 示例：按月份分区业绩记录表
CREATE TABLE performance_records_2024_01 PARTITION OF performance_records
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE performance_records_2024_02 PARTITION OF performance_records
FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');
```

**按范围分区**（适用于大表）：
```sql
-- 示例：按项目ID范围分区
CREATE TABLE projects_partition_1 PARTITION OF projects
FOR VALUES FROM (MINVALUE) TO (1000);
```

### 5.2 分区维护

**自动创建分区**：
- 使用定时任务自动创建下个月的分区
- 定期归档旧分区数据

**分区裁剪**：
- 查询时自动裁剪不相关的分区
- 提高查询性能

## 六、统计信息更新

### 6.1 自动更新统计信息

**PostgreSQL自动VACUUM和ANALYZE**：
```sql
-- 配置自动VACUUM
autovacuum = on
autovacuum_analyze_threshold = 50
autovacuum_analyze_scale_factor = 0.1
```

**手动更新统计信息**：
```sql
-- 更新表统计信息
ANALYZE projects;
ANALYZE performance_records;

-- 更新整个数据库
ANALYZE;
```

### 6.2 查询计划分析

**使用EXPLAIN分析查询计划**：
```sql
-- 查看查询计划
EXPLAIN ANALYZE
SELECT * FROM projects 
WHERE status = '进行中' 
ORDER BY created_at DESC 
LIMIT 20;
```

**优化查询计划**：
- 确保使用索引
- 避免全表扫描
- 优化JOIN顺序
- 使用合适的连接方式

## 七、连接池配置

### 7.1 Supabase连接池

**连接池参数**：
- `max_connections`: 最大连接数
- `shared_buffers`: 共享缓冲区大小
- `work_mem`: 工作内存大小

**优化建议**：
- 根据并发用户数调整连接池大小
- 监控连接数使用情况
- 避免连接泄漏

## 八、缓存策略

### 8.1 应用层缓存

**缓存内容**：
- 用户信息
- 部门列表
- 成本标准
- 审批流程模板

**缓存更新**：
- 数据变更时清除相关缓存
- 设置合理的缓存过期时间

### 8.2 数据库缓存

**PostgreSQL缓存**：
- 使用共享缓冲区缓存常用数据
- 调整`shared_buffers`参数
- 监控缓存命中率

## 九、定期维护

### 9.1 定期任务

**每日任务**：
- 更新统计信息（ANALYZE）
- 检查慢查询日志
- 监控索引使用情况

**每周任务**：
- 清理未使用的索引
- 优化查询性能
- 检查表大小和增长趋势

**每月任务**：
- 归档历史数据
- 重建索引（如需要）
- 性能报告分析

### 9.2 监控指标

**关键指标**：
- 查询响应时间
- 索引命中率
- 缓存命中率
- 连接数使用率
- 表大小和增长

**告警阈值**：
- 慢查询 > 1秒
- 索引命中率 < 95%
- 连接数使用率 > 80%

