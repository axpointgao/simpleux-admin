# 创建测试管理员用户指南

由于暂时不做钉钉对接，可以通过以下方式创建测试管理员用户：

## 方法 1: 使用 Supabase Dashboard（推荐）

### 步骤 1: 创建 Auth 用户

1. 登录 [Supabase Dashboard](https://app.supabase.com)
2. 选择你的项目
3. 进入 **Authentication** > **Users**
4. 点击 **"Add user"** > **"Create new user"**
5. 填写信息：
   - **Email**: `admin@test.com`（或你喜欢的邮箱）
   - **Password**: 设置一个密码（例如：`password123`）
   - **Auto Confirm User**: ✅ 勾选（自动确认用户，无需邮箱验证）
6. 点击 **"Create user"**
7. **重要**：复制生成的 **User UID**（UUID 格式，例如：`f2a14512-4c3a-4462-9813-d9b9eb35babc`）

### 步骤 2: 创建用户记录和分配角色

1. 进入 **SQL Editor**
2. 打开文件：`create_test_admin_user.sql`
3. 找到 "快速创建脚本" 部分（文件末尾）
4. 取消注释，并将 `YOUR_USER_ID_HERE` 替换为步骤 1 中复制的 User UID
5. 执行脚本

**示例**：
```sql
DO $$
DECLARE
  v_user_id UUID := 'f2a14512-4c3a-4462-9813-d9b9eb35babc'::UUID; -- 替换为实际用户 ID
  v_admin_role_id UUID;
BEGIN
  -- 创建/更新 profiles
  INSERT INTO profiles (
    id, name, employee_level, city_type, status, created_at, updated_at
  ) VALUES (
    v_user_id, '测试管理员', 'M0', 'Chengdu', '在职', now(), now()
  )
  ON CONFLICT (id) DO UPDATE
  SET name = EXCLUDED.name, employee_level = EXCLUDED.employee_level,
      city_type = EXCLUDED.city_type, status = EXCLUDED.status, updated_at = now();
  
  -- 获取 admin 角色 ID
  SELECT id INTO v_admin_role_id FROM roles WHERE code = 'admin';
  
  -- 分配 admin 角色
  INSERT INTO user_roles (user_id, role_id, created_by, created_at)
  VALUES (v_user_id, v_admin_role_id, v_user_id, now())
  ON CONFLICT (user_id, role_id) DO NOTHING;
  
  RAISE NOTICE '测试管理员用户创建成功！用户 ID: %', v_user_id;
END $$;
```

## 方法 2: 使用 Supabase CLI

如果你使用 Supabase CLI，可以通过命令行创建用户：

```bash
# 创建用户（需要 Supabase CLI）
supabase auth users create admin@test.com --password password123
```

然后使用 SQL 脚本完成步骤 2。

## 验证

创建完成后，可以通过以下 SQL 验证：

```sql
-- 查看用户信息
SELECT 
  p.id,
  p.name,
  p.employee_level,
  p.city_type,
  p.status,
  r.code as role_code,
  r.name as role_name
FROM profiles p
JOIN user_roles ur ON p.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE r.code = 'admin';
```

## 登录测试

使用创建的邮箱和密码在前端登录系统，应该可以正常访问所有功能。

## 注意事项

1. **密码安全**：测试环境可以使用简单密码，生产环境必须使用强密码
2. **邮箱验证**：如果未勾选 "Auto Confirm User"，需要验证邮箱才能登录
3. **RLS 策略**：确保 RLS 策略已正确配置，admin 角色可以访问所有数据
4. **多用户**：可以按照相同方式创建更多测试用户（普通员工、部门主管等）

## 创建其他角色的测试用户

如果需要创建其他角色的测试用户，只需修改角色代码：

- `director` - 总监
- `department_head` - 部门主管
- `employee` - 员工

例如，创建部门主管用户：
```sql
-- 将 'admin' 改为 'department_head'
SELECT id INTO v_admin_role_id FROM roles WHERE code = 'department_head';
```

