# 数据库设计概述

## 一、数据库选型

### 1.1 选择PostgreSQL

本系统使用 **PostgreSQL** 作为主数据库，通过 **Supabase** 平台进行管理和访问。

**选择理由**：
- **关系型数据库**：支持复杂的关系和事务
- **JSON支持**：支持JSON和JSONB数据类型，灵活存储非结构化数据
- **强大功能**：支持全文搜索、数组、自定义类型等高级功能
- **开源免费**：开源数据库，成本低
- **生态丰富**：丰富的工具和库支持
- **Supabase集成**：Supabase基于PostgreSQL，提供完整的后端服务

### 1.2 Supabase平台

**Supabase优势**：
- **自动API生成**：自动生成RESTful API
- **认证服务**：内置用户认证和授权
- **Row Level Security**：数据库级别的权限控制
- **管理界面**：友好的数据库管理界面
- **备份和恢复**：自动备份和恢复功能
- **开发体验好**：完整的 TypeScript 支持，开发效率高

## 二、命名规范

### 2.1 表命名规范

**规则**：
- 使用小写字母
- 多个单词使用下划线分隔
- 使用复数形式（如：`projects`、`users`）
- 表名要有意义，能清晰表达表的用途

**示例**：
- `projects`：项目表
- `project_budgets_labor`：项目人力预算表
- `project_expenses_travel`：项目差旅支出表
- `performance_records`：业绩记录表

### 2.2 字段命名规范

**规则**：
- 使用小写字母
- 多个单词使用下划线分隔
- 使用有意义的字段名
- 主键统一使用 `id`
- 外键使用 `表名_id` 格式（如：`project_id`）
- 时间字段使用 `created_at`、`updated_at`、`deleted_at` 等

**示例**：
- `id`：主键
- `project_id`：项目ID（外键）
- `employee_level`：员工级别
- `created_at`：创建时间
- `updated_at`：更新时间

### 2.3 索引命名规范

**规则**：
- 唯一索引：`idx_表名_字段名_unique`
- 普通索引：`idx_表名_字段名`
- 复合索引：`idx_表名_字段1_字段2`

**示例**：
- `idx_projects_code_unique`：项目编号唯一索引
- `idx_projects_status`：项目状态索引
- `idx_project_expenses_labor_project_id_month`：项目人力支出复合索引

### 2.4 约束命名规范

**规则**：
- 主键约束：`pk_表名`
- 外键约束：`fk_表名_关联表名`
- 唯一约束：`uk_表名_字段名`
- 检查约束：`ck_表名_字段名`

**示例**：
- `pk_projects`：项目表主键约束
- `fk_project_budgets_labor_project_id`：项目人力预算表外键约束
- `uk_projects_code`：项目编号唯一约束

## 三、设计原则

### 3.1 数据库设计原则

**1. 规范化设计**：
- 遵循第三范式（3NF）
- 避免数据冗余
- 保持数据一致性

**2. 性能优化**：
- 合理使用索引
- 避免过度规范化
- 考虑查询性能

**3. 可扩展性**：
- 预留扩展字段
- 使用JSON字段存储灵活数据
- 支持水平扩展

**4. 数据完整性**：
- 使用外键约束
- 使用检查约束
- 使用唯一约束

**5. 安全性**：
- 使用Row Level Security (RLS)
- 敏感数据加密
- 审计日志记录

### 3.2 字段设计原则

**1. 数据类型选择**：
- 使用合适的数据类型
- 避免使用过大的数据类型
- 使用枚举类型（ENUM）存储固定值

**2. 默认值设置**：
- 为字段设置合理的默认值
- 使用 `NOT NULL` 约束必填字段
- 使用 `DEFAULT` 设置默认值

**3. 时间字段**：
- 统一使用 `TIMESTAMP WITH TIME ZONE`
- 自动设置 `created_at` 和 `updated_at`
- 使用 `deleted_at` 实现软删除

### 3.3 关系设计原则

**1. 外键约束**：
- 使用外键维护数据完整性
- 设置级联删除或限制删除
- 使用索引优化外键查询

**2. 关联关系**：
- 一对一关系：使用外键
- 一对多关系：在多的一方使用外键
- 多对多关系：使用中间表

**3. 级联操作**：
- `CASCADE`：级联删除/更新
- `RESTRICT`：限制删除/更新
- `SET NULL`：设置为NULL

## 四、数据库结构

### 4.1 核心业务表

**用户和部门表**：
- `profiles`：用户扩展表
- `departments`：部门表（从钉钉同步）

**角色和权限表**：
- `roles`：角色表
- `permissions`：权限表
- `role_permissions`：角色权限关联表
- `user_roles`：用户角色关联表

### 4.2 业务表

**项目相关表**：
- `projects`：项目主表
- `framework_agreements`：框架协议表
- `project_budgets_labor`：项目人力预算表
- `project_budgets_travel`：项目差旅预算表
- `project_budgets_outsource`：项目外包预算表
- `project_expenses_labor`：项目人力支出表
- `project_expenses_travel`：项目差旅支出表
- `project_expenses_outsource`：项目外包支出表
- `project_changes`：项目变更记录表

**业绩相关表**：
- `performance_records`：业绩记录表
- `performance_acceptances`：业绩验收表
- `performance_settlements`：业绩结算表
- `performance_payments`：业绩到账表
- `performance_splits`：业绩拆分表

**售前支持相关表**：
- `opportunities`：售前支持主表
- `opportunity_followups`：跟进记录表
- `opportunity_expenses_labor`：售前人力支出表
- `opportunity_expenses_travel`：售前差旅支出表
- `opportunity_expenses_outsource`：售前外包支出表

**专业贡献相关表**：
- `contributions`：专业贡献主表
- `contribution_executors`：专业贡献执行人表
- `contribution_approvals`：专业贡献审批表
- `contribution_acceptances`：专业贡献验收表
- `contribution_ratings`：专业贡献评级表

**任务和工时相关表**：
- `tasks`：任务表
- `planned_work_hours`：计划工时表
- `actual_work_hours`：实际工时表
- `holidays`：节假日表

**审批相关表**：
- `approvals`：审批主表
- `approval_steps`：审批步骤表
- `approval_histories`：审批历史表
- `approval_attachments`：审批附件表

**系统设置相关表**：
- `cost_standards`：人日成本标准表
- `approval_process_templates`：审批流程模板表
- `client_departments`：客户部表
- `suppliers`：供应商表
- `notification_configs`：通知配置表
- `system_parameters`：系统参数表

## 五、索引设计

### 5.1 主键索引

**规则**：
- 所有表都有主键
- 主键使用 `UUID` 类型
- 主键自动创建索引

### 5.2 外键索引

**规则**：
- 所有外键字段创建索引
- 优化关联查询性能

### 5.3 查询索引

**规则**：
- 为常用查询字段创建索引
- 为筛选条件字段创建索引
- 为排序字段创建索引
- 为复合查询创建复合索引

**示例**：
- `idx_projects_status`：项目状态索引
- `idx_projects_group`：项目归属部门索引
- `idx_project_expenses_labor_project_id_month`：项目人力支出复合索引

### 5.4 唯一索引

**规则**：
- 为唯一字段创建唯一索引
- 防止数据重复

**示例**：
- `idx_projects_code_unique`：项目编号唯一索引
- `idx_contributions_code_unique`：专业贡献编号唯一索引

## 六、Row Level Security (RLS)

### 6.1 RLS策略

**规则**：
- 所有业务表启用RLS
- 根据用户角色和部门设置访问策略
- 系统管理员可以访问所有数据

### 6.2 策略类型

**查看策略**：
- 用户可以查看自己相关的数据
- 部门主管可以查看本部门的数据
- 系统管理员可以查看所有数据

**编辑策略**：
- 用户可以编辑自己创建的数据
- 部门主管可以编辑本部门的数据
- 系统管理员可以编辑所有数据

**删除策略**：
- 用户可以删除自己创建的数据（软删除）
- 部门主管可以删除本部门的数据（软删除）
- 系统管理员可以删除所有数据（软删除）

## 七、数据迁移

### 7.1 迁移工具

**Supabase Migrations**：
- 使用Supabase CLI进行数据库迁移
- 迁移文件存储在 `supabase/migrations/` 目录
- 支持版本控制和回滚

### 7.2 迁移规范

**命名规范**：
- 迁移文件命名：`YYYYMMDDHHMMSS_description.sql`
- 使用时间戳确保顺序

**迁移内容**：
- 创建表
- 修改表结构
- 创建索引
- 创建约束
- 数据迁移

### 7.3 迁移流程

1. 创建迁移文件
2. 编写SQL语句
3. 本地测试
4. 提交到版本控制
5. 部署到生产环境

## 八、数据备份和恢复

### 8.1 自动备份

**Supabase自动备份**：
- 每日自动备份
- 备份保留30天
- 支持时间点恢复

### 8.2 手动备份

**备份方式**：
- 使用Supabase Dashboard导出
- 使用pg_dump命令行工具
- 使用Supabase CLI

### 8.3 恢复流程

1. 选择备份时间点
2. 确认恢复范围
3. 执行恢复操作
4. 验证数据完整性

## 九、性能优化

### 9.1 查询优化

**优化策略**：
- 使用索引优化查询
- 避免全表扫描
- 使用EXPLAIN分析查询计划
- 优化慢查询

### 9.2 连接池管理

**连接池配置**：
- 设置合理的连接池大小
- 监控连接数使用情况
- 避免连接泄漏

### 9.3 数据归档

**归档策略**：
- 归档历史数据
- 定期清理过期数据
- 使用分区表（可选）

## 十、监控和维护

### 10.1 数据库监控

**监控指标**：
- 数据库大小
- 连接数
- 查询性能
- 慢查询日志

### 10.2 定期维护

**维护任务**：
- 定期VACUUM和ANALYZE
- 检查索引使用情况
- 优化表结构
- 清理过期数据

### 10.3 问题排查

**排查工具**：
- Supabase Dashboard
- PostgreSQL日志
- 查询性能分析
- 错误日志

