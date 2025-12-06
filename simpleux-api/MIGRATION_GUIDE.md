# 数据库迁移执行指南

## ✅ 连接测试结果

根据测试结果，Supabase 连接配置正确，但数据库表尚未创建。

## 📋 执行迁移步骤

### 方法1：使用 Supabase Dashboard（推荐，最简单）

1. **登录 Supabase Dashboard**
   - 访问：https://app.supabase.com
   - 登录你的账号

2. **进入项目**
   - 找到项目：`sfrjdhibhujfhaisjrfv`
   - 点击进入项目

3. **打开 SQL Editor**
   - 点击左侧菜单 "SQL Editor"
   - 点击 "New query"

4. **执行迁移文件**
   - 打开文件：`supabase/migrations/20241204000000_create_commercial_project_tables.sql`
   - 复制全部内容（418行）
   - 粘贴到 SQL Editor 中
   - 点击右上角 "Run" 按钮执行

5. **验证迁移**
   - 执行后应该看到 "Success. No rows returned"
   - 在左侧菜单 "Table Editor" 中应该能看到创建的表

### 方法2：使用 Supabase CLI

```bash
# 1. 安装 Supabase CLI
npm install -g supabase

# 2. 登录 Supabase
supabase login

# 3. 链接到你的项目
cd simpleux-api
supabase link --project-ref sfrjdhibhujfhaisjrfv

# 4. 应用迁移
supabase db push
```

### 方法3：直接执行 SQL（如果有数据库访问权限）

```bash
# 使用 psql 连接并执行
psql "postgresql://postgres:[YOUR-PASSWORD]@db.sfrjdhibhujfhaisjrfv.supabase.co:5432/postgres" \
  -f supabase/migrations/20241204000000_create_commercial_project_tables.sql
```

## 🔍 验证迁移是否成功

执行迁移后，运行测试脚本验证：

```bash
npm run test:db
```

应该看到所有表都显示 ✅。

或者直接在 Supabase Dashboard 的 SQL Editor 中执行：

```sql
-- 检查表是否创建成功
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (table_name LIKE 'project%' OR table_name = 'framework_agreements')
ORDER BY table_name;
```

应该返回 9 个表：
- framework_agreements
- projects
- project_stages
- project_budgets_labor
- project_budgets_travel
- project_budgets_outsource
- project_expenses_travel
- project_expenses_outsource
- project_changes

## ⚠️ 注意事项

### 1. 外键依赖

迁移文件中的外键约束可能需要以下表存在：
- `profiles` - 用户表（用于 `projects.manager_id`）
- `approvals` - 审批表（可选，用于 `project_changes.approval_id`）
- `suppliers` - 供应商表（可选，用于外包预算和支出）

如果这些表不存在：
- 可以先注释掉相关外键约束
- 或者先创建这些基础表

### 2. 执行顺序

迁移文件中的 SQL 语句已经按正确顺序排列：
1. 创建表
2. 创建索引
3. 创建触发器
4. 创建视图
5. 创建函数

请按顺序执行，不要跳过任何部分。

### 3. 错误处理

如果执行时遇到错误：
- **外键约束错误**：检查依赖表是否存在
- **权限错误**：确保使用 Service Role Key 或具有足够权限的账号
- **语法错误**：检查 SQL 文件是否完整复制

## 🎯 下一步

迁移成功后：
1. ✅ 运行 `npm run test:db` 验证所有表
2. ✅ 启动 API 服务：`npm run dev`
3. ✅ 测试 API 接口功能

## 📚 相关文档

- [数据库配置指南](./DATABASE_SETUP.md)
- [数据库配置完成](./DATABASE_CONFIGURATION.md)
- [API 文档](./API.md)

