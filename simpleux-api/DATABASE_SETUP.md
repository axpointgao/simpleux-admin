# 数据库配置指南

## 快速开始

### 1. 创建 Supabase 项目

1. 访问 [Supabase](https://supabase.com)
2. 注册/登录账号
3. 创建新项目
4. 记录项目 URL 和 API Key

### 2. 配置环境变量

在 `simpleux-api/.env.local` 文件中配置：

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. 执行数据库迁移

#### 方法1：使用 Supabase Dashboard（推荐）

1. 登录 Supabase Dashboard
2. 进入你的项目
3. 点击左侧菜单 "SQL Editor"
4. 打开文件 `supabase/migrations/20241204000000_create_commercial_project_tables.sql`
5. 复制全部内容
6. 粘贴到 SQL Editor 中
7. 点击 "Run" 执行

#### 方法2：使用 Supabase CLI

```bash
# 安装 Supabase CLI
npm install -g supabase

# 登录 Supabase
supabase login

# 链接到你的项目
supabase link --project-ref your-project-ref

# 应用迁移
supabase db push
```

### 4. 验证迁移

在 Supabase Dashboard 的 SQL Editor 中执行：

```sql
-- 检查表是否创建成功
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (table_name LIKE 'project%' OR table_name = 'framework_agreements')
ORDER BY table_name;
```

应该看到以下表：
- `framework_agreements`
- `projects`
- `project_stages`
- `project_budgets_labor`
- `project_budgets_travel`
- `project_budgets_outsource`
- `project_expenses_travel`
- `project_expenses_outsource`
- `project_changes`

## 表结构说明

### 核心表

#### projects（项目主表）
- 存储项目的基本信息
- 包含项目类型、状态、进度、财务统计等字段
- 支持四种项目类型：项目制、计件制、离岸制、驻场制

#### framework_agreements（框架协议表）
- 存储框架协议（主项目）信息
- 用于计件制项目

#### project_stages（项目阶段表）
- 存储项目的交付阶段
- 仅用于项目制和计件制项目

### 预算表

- `project_budgets_labor` - 人力预算
- `project_budgets_travel` - 差旅预算
- `project_budgets_outsource` - 外包预算

### 支出表

- `project_expenses_travel` - 差旅支出
- `project_expenses_outsource` - 外包支出
- `project_expenses_labor` - 人力支出（由任务和工时模块管理）

### 其他表

- `project_changes` - 项目变更记录

## 自动功能

### 触发器

1. **自动计算总价**：
   - 人力预算：`total_cost = days * unit_cost`
   - 差旅预算：`total_cost = 各项费用之和`
   - 差旅支出：`total_amount = 各项费用之和`

2. **自动更新时间戳**：
   - 所有表的 `updated_at` 字段在更新时自动更新

### 视图

- `project_stats_view` - 项目统计视图，聚合预算和支出数据

### 函数

- `calculate_project_profit(project_id)` - 计算项目利润

## 索引优化

所有表都创建了必要的索引：
- 主键索引（自动）
- 外键索引
- 查询字段索引（status, type, group 等）
- 复合索引（用于多条件查询）

## 数据完整性

### 检查约束

- `projects.type` 只能是：'项目制', '计件制', '离岸制', '驻场制'
- `projects.status` 只能是：'待启动', '进行中', '待确认', '已确认', '已归档'
- `projects.progress` 范围：0-100
- `project_changes.change_type` 只能是：'project', 'demand'

### 外键约束

- `projects.manager_id` → `profiles.id` (需要 profiles 表)
- `projects.framework_id` → `framework_agreements.id`
- 所有预算和支出表的 `project_id` → `projects.id` (CASCADE DELETE)

## 注意事项

### 1. 依赖表

以下表需要先创建（如果不存在）：
- `profiles` - 用户表（用于 manager_id, created_by）
- `approvals` - 审批表（用于 project_changes.approval_id，可选）
- `suppliers` - 供应商表（用于外包预算和支出，可选）

如果这些表不存在，可以：
- 暂时注释掉相关外键约束
- 或者先创建这些基础表

### 2. RLS 策略

当前迁移中 RLS 策略被注释掉了，因为需要：
- `profiles` 表存在
- 权限系统完善

等基础表创建后，可以启用 RLS 策略。

### 3. 测试数据

迁移完成后，可以插入一些测试数据：

```sql
-- 插入测试框架协议
INSERT INTO framework_agreements (code, name, manager_id, manager_name, group)
VALUES ('FRAM-2024-001', '测试框架协议', '00000000-0000-0000-0000-000000000001', '测试经理', '设计一部');

-- 插入测试项目
INSERT INTO projects (
  code, name, type, status, manager_id, manager_name, group,
  plan_start_date, plan_end_date, contract_amount, created_by
)
VALUES (
  'PROJ-2024-001', '测试项目', '项目制', '待启动',
  '00000000-0000-0000-0000-000000000001', '测试经理', '设计一部',
  '2024-01-01', '2024-06-30', 500000, '00000000-0000-0000-0000-000000000001'
);
```

## 后续步骤

1. ✅ 执行数据库迁移
2. ⏳ 创建基础表（profiles, suppliers 等）
3. ⏳ 配置 RLS 策略
4. ⏳ 插入测试数据
5. ⏳ 测试 API 接口

## 故障排查

### 问题1：外键约束错误

**错误**：`foreign key constraint "fk_projects_manager_id" does not exist`

**解决**：确保 `profiles` 表已创建，或者暂时注释掉外键约束。

### 问题2：触发器错误

**错误**：`function calculate_labor_budget_total() does not exist`

**解决**：确保按顺序执行所有 SQL 语句，函数定义在触发器之前。

### 问题3：视图错误

**错误**：`relation "project_expenses_labor" does not exist`

**解决**：如果 `project_expenses_labor` 表不存在，可以：
- 从视图中移除该表的引用
- 或者创建该表（如果由本模块管理）

## 参考文档

- [Supabase 文档](https://supabase.com/docs)
- [PostgreSQL 文档](https://www.postgresql.org/docs/)
- [数据库设计文档](../../docs/03-database/02-data-models/02-project-tables.md)

