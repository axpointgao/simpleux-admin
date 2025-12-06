# 数据库配置完成

## ✅ 已完成

### 1. 数据库迁移文件

已创建完整的数据库迁移文件：
- **位置**: `supabase/migrations/20241204000000_create_commercial_project_tables.sql`
- **内容**: 包含所有商业项目相关的表、索引、约束、触发器和视图

### 2. 创建的表（9个）

1. ✅ `framework_agreements` - 框架协议表
2. ✅ `projects` - 项目主表
3. ✅ `project_stages` - 项目阶段表
4. ✅ `project_budgets_labor` - 项目人力预算表
5. ✅ `project_budgets_travel` - 项目差旅预算表
6. ✅ `project_budgets_outsource` - 项目外包预算表
7. ✅ `project_expenses_travel` - 项目差旅支出表
8. ✅ `project_expenses_outsource` - 项目外包支出表
9. ✅ `project_changes` - 项目变更记录表

### 3. 自动功能

#### 触发器（4个）
- ✅ 自动计算人力预算总价
- ✅ 自动计算差旅预算总价
- ✅ 自动计算差旅支出总金额
- ✅ 自动更新所有表的 `updated_at` 字段

#### 视图（1个）
- ✅ `project_stats_view` - 项目统计视图

#### 函数（1个）
- ✅ `calculate_project_profit(project_id)` - 计算项目利润

### 4. 索引优化

所有表都创建了必要的索引：
- 主键索引（自动）
- 外键索引
- 查询字段索引（status, type, group 等）
- 复合索引（用于多条件查询）

### 5. 数据完整性

- ✅ 检查约束（项目类型、状态、进度范围等）
- ✅ 外键约束（级联删除、限制删除等）
- ✅ 唯一约束（项目编号、框架协议编号等）

## 📋 下一步操作

### 1. 执行迁移

选择以下方式之一执行迁移：

#### 方式1：Supabase Dashboard（推荐）
1. 登录 [Supabase Dashboard](https://app.supabase.com)
2. 进入你的项目
3. 点击左侧菜单 "SQL Editor"
4. 打开文件 `supabase/migrations/20241204000000_create_commercial_project_tables.sql`
5. 复制全部内容并粘贴到 SQL Editor
6. 点击 "Run" 执行

#### 方式2：Supabase CLI
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

### 2. 验证迁移

执行以下 SQL 验证迁移是否成功：

```sql
-- 检查表是否创建成功
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (table_name LIKE 'project%' OR table_name = 'framework_agreements')
ORDER BY table_name;

-- 应该返回 9 个表
```

### 3. 配置环境变量

在 `simpleux-api/.env.local` 中配置：

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 4. 测试 API

启动后端服务并测试 API：

```bash
cd simpleux-api
npm run dev
```

## ⚠️ 注意事项

### 1. 依赖表

以下表需要先创建（如果不存在）：
- `profiles` - 用户表（用于 `projects.manager_id` 和 `projects.created_by`）
- `approvals` - 审批表（用于 `project_changes.approval_id`，可选）
- `suppliers` - 供应商表（用于外包预算和支出，可选）

**解决方案**：
- 如果这些表不存在，可以先注释掉相关外键约束
- 或者先创建这些基础表

### 2. RLS 策略

当前迁移中 RLS 策略被注释掉了，因为需要：
- `profiles` 表存在
- 权限系统完善

等基础表创建后，可以启用 RLS 策略。

### 3. 保留关键字

`group` 是 PostgreSQL 的保留关键字，在迁移文件中已使用双引号处理：
- 表定义：`"group" TEXT NOT NULL`
- 索引创建：`ON framework_agreements("group")`

在查询时也需要使用引号：`SELECT "group" FROM projects`

## 📚 相关文档

- [数据库迁移说明](./supabase/README.md)
- [数据库配置指南](./DATABASE_SETUP.md)
- [API 文档](./API.md)
- [开发总结](./SUMMARY.md)

## 🔍 故障排查

### 问题1：外键约束错误

**错误**: `foreign key constraint "fk_projects_manager_id" does not exist`

**解决**: 确保 `profiles` 表已创建，或者暂时注释掉外键约束。

### 问题2：保留关键字错误

**错误**: `syntax error at or near "group"`

**解决**: 确保在 SQL 中使用双引号：`"group"` 而不是 `group`。

### 问题3：触发器错误

**错误**: `function calculate_labor_budget_total() does not exist`

**解决**: 确保按顺序执行所有 SQL 语句，函数定义在触发器之前。

## ✨ 特性说明

### 自动计算

- **人力预算总价**: `total_cost = days * unit_cost`（自动计算）
- **差旅预算总价**: `total_cost = 各项费用之和`（自动计算）
- **差旅支出总金额**: `total_amount = 各项费用之和`（自动计算）

### 数据统计

- **项目统计视图**: 自动聚合预算和支出数据
- **利润计算函数**: 根据项目状态自动选择使用预算或实际支出

### 数据完整性

- **级联删除**: 删除项目时自动删除相关预算和支出
- **检查约束**: 确保数据类型和范围正确
- **唯一约束**: 防止重复的项目编号和框架协议编号

## 🎉 完成

数据库配置已完成！现在可以：
1. 执行迁移文件创建表结构
2. 配置环境变量连接 Supabase
3. 测试 API 接口功能

