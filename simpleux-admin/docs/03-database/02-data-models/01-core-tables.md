# 核心业务表设计

## 一、用户和部门表

### 1.1 profiles（用户扩展表）

**表说明**：扩展Supabase Auth的用户表，存储用户的业务信息。

**字段定义**：

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | uuid | PK, FK → auth.users.id | 用户ID（关联Supabase Auth） |
| dingtalk_user_id | text | UNIQUE, NULL | 钉钉用户ID |
| name | text | NOT NULL | 用户姓名 |
| employee_level | text | NOT NULL | 级别（P0-P9, M0-M5） |
| position | text | NULL | 职位（交互/视觉/体验/管理） |
| city_type | text | NULL | 城市类型（Chengdu/Hangzhou） |
| department | text | NULL | 部门（从钉钉同步） |
| status | text | NOT NULL, DEFAULT '在职' | 状态（在职/离职） |
| daily_price | numeric(10,2) | NULL | 人日单价 |
| daily_cost | numeric(10,2) | NULL | 人月成本（自动计算：daily_price * 21.75） |
| created_at | timestamp | NOT NULL, DEFAULT now() | 创建时间 |
| updated_at | timestamp | NOT NULL, DEFAULT now() | 更新时间 |

**索引**：
- PRIMARY KEY (id)
- UNIQUE INDEX idx_profiles_dingtalk_user_id (dingtalk_user_id)
- INDEX idx_profiles_department (department)
- INDEX idx_profiles_status (status)

**RLS策略**：
- 用户只能查看和编辑自己的记录
- 部门主管可以查看本部门的用户
- 系统管理员可以查看所有用户

### 1.2 departments（部门表）

**表说明**：存储部门信息，从钉钉同步或手动维护。

**字段定义**：

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | uuid | PK | 部门ID |
| dingtalk_dept_id | text | UNIQUE, NULL | 钉钉部门ID |
| name | text | NOT NULL, UNIQUE | 部门名称 |
| parent_id | uuid | FK → departments.id, NULL | 父部门ID |
| code | text | NULL | 部门代码 |
| is_active | boolean | NOT NULL, DEFAULT true | 是否启用 |
| created_at | timestamp | NOT NULL, DEFAULT now() | 创建时间 |
| updated_at | timestamp | NOT NULL, DEFAULT now() | 更新时间 |

**索引**：
- PRIMARY KEY (id)
- UNIQUE INDEX idx_departments_dingtalk_dept_id (dingtalk_dept_id)
- UNIQUE INDEX idx_departments_name (name)
- INDEX idx_departments_parent_id (parent_id)

**RLS策略**：
- 所有用户都可以查看部门列表
- 只有系统管理员可以编辑部门

## 二、角色和权限表

### 2.1 roles（角色表）

**表说明**：存储系统角色信息。

**字段定义**：

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | uuid | PK | 角色ID |
| code | text | NOT NULL, UNIQUE | 角色代码（admin/manager/employee等） |
| name | text | NOT NULL | 角色名称 |
| description | text | NULL | 角色描述 |
| is_system | boolean | NOT NULL, DEFAULT false | 是否系统角色 |
| created_at | timestamp | NOT NULL, DEFAULT now() | 创建时间 |
| updated_at | timestamp | NOT NULL, DEFAULT now() | 更新时间 |

**索引**：
- PRIMARY KEY (id)
- UNIQUE INDEX idx_roles_code (code)

**RLS策略**：
- 所有用户都可以查看角色列表
- 只有系统管理员可以编辑角色

### 2.2 permissions（权限表）

**表说明**：存储系统权限信息。

**字段定义**：

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | uuid | PK | 权限ID |
| code | text | NOT NULL, UNIQUE | 权限代码（module.action格式） |
| name | text | NOT NULL | 权限名称 |
| module | text | NOT NULL | 所属模块（project/performance等） |
| action | text | NOT NULL | 操作类型（create/edit/delete/view） |
| description | text | NULL | 权限描述 |
| created_at | timestamp | NOT NULL, DEFAULT now() | 创建时间 |
| updated_at | timestamp | NOT NULL, DEFAULT now() | 更新时间 |

**索引**：
- PRIMARY KEY (id)
- UNIQUE INDEX idx_permissions_code (code)
- INDEX idx_permissions_module (module)

**RLS策略**：
- 所有用户都可以查看权限列表
- 只有系统管理员可以编辑权限

### 2.3 role_permissions（角色权限关联表）

**表说明**：存储角色和权限的关联关系。

**字段定义**：

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | uuid | PK | 关联ID |
| role_id | uuid | FK → roles.id, NOT NULL | 角色ID |
| permission_id | uuid | FK → permissions.id, NOT NULL | 权限ID |
| created_at | timestamp | NOT NULL, DEFAULT now() | 创建时间 |

**索引**：
- PRIMARY KEY (id)
- UNIQUE INDEX idx_role_permissions_unique (role_id, permission_id)
- INDEX idx_role_permissions_role_id (role_id)
- INDEX idx_role_permissions_permission_id (permission_id)

**RLS策略**：
- 所有用户都可以查看关联关系
- 只有系统管理员可以编辑关联关系

### 2.4 user_roles（用户角色关联表）

**表说明**：存储用户和角色的关联关系。

**字段定义**：

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | uuid | PK | 关联ID |
| user_id | uuid | FK → profiles.id, NOT NULL | 用户ID |
| role_id | uuid | FK → roles.id, NOT NULL | 角色ID |
| created_at | timestamp | NOT NULL, DEFAULT now() | 创建时间 |

**索引**：
- PRIMARY KEY (id)
- UNIQUE INDEX idx_user_roles_unique (user_id, role_id)
- INDEX idx_user_roles_user_id (user_id)
- INDEX idx_user_roles_role_id (role_id)

**RLS策略**：
- 用户只能查看自己的角色
- 部门主管可以查看本部门用户的角色
- 只有系统管理员可以编辑关联关系

## 三、节假日表

### 3.1 holidays（节假日表）

**表说明**：存储节假日信息，用于工时计算。

**字段定义**：

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | uuid | PK | 节假日ID |
| date | date | NOT NULL, UNIQUE | 日期（YYYY-MM-DD） |
| name | text | NOT NULL | 节假日名称 |
| type | text | NOT NULL, DEFAULT 'holiday' | 类型（holiday/workday） |
| year | integer | NOT NULL | 年份（用于快速查询） |
| created_by | uuid | FK → profiles.id, NOT NULL | 创建人ID |
| created_at | timestamp | NOT NULL, DEFAULT now() | 创建时间 |
| updated_at | timestamp | NOT NULL, DEFAULT now() | 更新时间 |

**索引**：
- PRIMARY KEY (id)
- UNIQUE INDEX idx_holidays_date (date)
- INDEX idx_holidays_year (year)
- INDEX idx_holidays_type (type)

**RLS策略**：
- 所有用户都可以查看节假日
- 只有系统管理员可以编辑节假日

## 四、客户部表

### 4.1 client_departments（客户部表）

**表说明**：存储客户部信息，不在钉钉组织架构中，需要手动维护。

**字段定义**：

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | uuid | PK | 客户部ID |
| code | text | NOT NULL, UNIQUE | 客户部代码 |
| name | text | NOT NULL, UNIQUE | 客户部名称 |
| description | text | NULL | 客户部描述 |
| is_active | boolean | NOT NULL, DEFAULT true | 是否启用 |
| created_at | timestamp | NOT NULL, DEFAULT now() | 创建时间 |
| updated_at | timestamp | NOT NULL, DEFAULT now() | 更新时间 |

**索引**：
- PRIMARY KEY (id)
- UNIQUE INDEX idx_client_departments_code (code)
- UNIQUE INDEX idx_client_departments_name (name)

**RLS策略**：
- 所有用户都可以查看客户部列表
- 只有系统管理员可以编辑客户部

## 五、供应商表

### 5.1 suppliers（供应商表）

**表说明**：存储供应商信息，用于外包预算和支出。

**字段定义**：

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | uuid | PK | 供应商ID |
| name | text | NOT NULL, UNIQUE | 供应商名称 |
| contact | text | NULL | 联系人 |
| phone | text | NULL | 联系电话 |
| email | text | NULL | 邮箱 |
| address | text | NULL | 地址 |
| is_active | boolean | NOT NULL, DEFAULT true | 是否启用 |
| created_at | timestamp | NOT NULL, DEFAULT now() | 创建时间 |
| updated_at | timestamp | NOT NULL, DEFAULT now() | 更新时间 |

**索引**：
- PRIMARY KEY (id)
- UNIQUE INDEX idx_suppliers_name (name)

**RLS策略**：
- 所有用户都可以查看供应商列表
- 只有系统管理员可以编辑供应商

## 六、数据完整性约束

### 6.1 外键约束

**profiles表**：
- `id` → `auth.users.id` (CASCADE DELETE)

**departments表**：
- `parent_id` → `departments.id` (SET NULL ON DELETE)

**role_permissions表**：
- `role_id` → `roles.id` (CASCADE DELETE)
- `permission_id` → `permissions.id` (CASCADE DELETE)

**user_roles表**：
- `user_id` → `profiles.id` (CASCADE DELETE)
- `role_id` → `roles.id` (CASCADE DELETE)

### 6.2 检查约束

**profiles表**：
- `employee_level` IN ('P0', 'P1', ..., 'P9', 'M0', ..., 'M5')
- `status` IN ('在职', '离职')
- `city_type` IN ('Chengdu', 'Hangzhou')

**holidays表**：
- `type` IN ('holiday', 'workday')

## 七、触发器

### 7.1 自动更新时间戳

**触发器**：`update_updated_at_column`
- 自动更新`updated_at`字段
- 应用于所有表的`updated_at`字段

### 7.2 自动计算人日成本

**触发器**：`calculate_daily_cost`
- 当`daily_price`更新时，自动计算`daily_cost = daily_price * 21.75`
- 应用于`profiles`表

## 八、视图

### 8.1 user_permissions_view（用户权限视图）

**视图说明**：聚合用户的所有权限（通过角色）。

**SQL**：
```sql
CREATE VIEW user_permissions_view AS
SELECT 
  ur.user_id,
  p.code as permission_code,
  p.name as permission_name,
  p.module,
  p.action
FROM user_roles ur
JOIN role_permissions rp ON ur.role_id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id;
```

## 九、函数

### 9.1 权限检查函数

**函数名**：`check_user_permission(user_id, permission_code)`
- 检查用户是否拥有指定权限
- 返回boolean

### 9.2 工作日计算函数

**函数名**：`calculate_workdays(start_date, end_date)`
- 计算日期区间内的工作日数量
- 排除周末和节假日
- 返回integer

