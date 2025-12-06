-- 创建测试管理员用户
-- 创建时间: 2024-12-06
-- 说明: 用于功能测试的管理员用户，不依赖钉钉对接
-- 使用方法: 在 Supabase Dashboard 的 SQL Editor 中执行此脚本

-- ============================================
-- 步骤 1: 在 Supabase Auth 中创建用户
-- ============================================
-- 注意：Supabase Auth 用户需要通过 Dashboard 或 API 创建
-- 方法 1: 使用 Supabase Dashboard
--   1. 进入 Authentication > Users
--   2. 点击 "Add user" > "Create new user"
--   3. 输入邮箱和密码（例如：admin@test.com / password123）
--   4. 记录生成的用户 ID（UUID）
--
-- 方法 2: 使用 SQL（需要超级用户权限）
--   执行以下 SQL（替换邮箱和密码）：
/*
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(), -- 或者使用固定的 UUID，例如：'f2a14512-4c3a-4462-9813-d9b9eb35babc'
  'authenticated',
  'authenticated',
  'admin@test.com', -- 替换为你的邮箱
  crypt('password123', gen_salt('bf')), -- 替换为你的密码
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now(),
  '',
  '',
  '',
  ''
);
*/

-- ============================================
-- 步骤 2: 在 profiles 表中创建用户记录
-- ============================================
-- 注意：请先执行步骤 1，获取用户 ID，然后替换下面的 'YOUR_USER_ID_HERE'

DO $$
DECLARE
  v_user_id UUID;
  v_admin_role_id UUID;
BEGIN
  -- 方法 1: 如果你知道用户邮箱，可以通过邮箱查找用户 ID
  -- SELECT id INTO v_user_id FROM auth.users WHERE email = 'admin@test.com';
  
  -- 方法 2: 如果你已经知道用户 ID，直接使用
  -- v_user_id := 'YOUR_USER_ID_HERE'::UUID;
  
  -- 方法 3: 使用当前认证用户（如果在 Supabase Dashboard 中执行，可能需要手动设置）
  -- v_user_id := auth.uid();
  
  -- 提示：请手动设置 v_user_id
  RAISE NOTICE '请先设置 v_user_id 变量为你在步骤 1 中创建的用户 ID';
  RAISE NOTICE '例如：v_user_id := ''f2a14512-4c3a-4462-9813-d9b9eb35babc''::UUID;';
  
  -- 临时：使用一个示例 UUID（请替换为实际用户 ID）
  -- 取消下面的注释并替换为实际用户 ID
  -- v_user_id := 'f2a14512-4c3a-4462-9813-d9b9eb35babc'::UUID;
  
  -- 如果 v_user_id 未设置，退出
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION '请先设置 v_user_id 变量为实际用户 ID';
  END IF;
  
  -- 在 profiles 表中创建用户记录
  INSERT INTO profiles (
    id,
    name,
    employee_level,
    city_type,
    status,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    '测试管理员',
    'M0', -- 管理员级别
    'Chengdu', -- 可以根据需要修改
    '在职',
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    name = EXCLUDED.name,
    employee_level = EXCLUDED.employee_level,
    city_type = EXCLUDED.city_type,
    status = EXCLUDED.status,
    updated_at = now();
  
  RAISE NOTICE '用户记录已创建/更新：%', v_user_id;
  
  -- ============================================
  -- 步骤 3: 分配 admin 角色
  -- ============================================
  
  -- 获取 admin 角色 ID
  SELECT id INTO v_admin_role_id
  FROM roles
  WHERE code = 'admin';
  
  IF v_admin_role_id IS NULL THEN
    RAISE EXCEPTION 'admin 角色不存在，请先执行核心表迁移';
  END IF;
  
  -- 分配 admin 角色
  INSERT INTO user_roles (
    user_id,
    role_id,
    created_by,
    created_at
  ) VALUES (
    v_user_id,
    v_admin_role_id,
    v_user_id, -- 自己创建自己
    now()
  )
  ON CONFLICT (user_id, role_id) DO NOTHING;
  
  RAISE NOTICE 'admin 角色已分配';
  RAISE NOTICE '完成！用户 ID: %, 邮箱: admin@test.com (请根据实际情况修改)', v_user_id;
  
END $$;

-- ============================================
-- 快速创建脚本（如果你已经知道用户 ID）
-- ============================================
-- 取消下面的注释，替换 YOUR_USER_ID_HERE 为实际用户 ID，然后执行

/*
DO $$
DECLARE
  v_user_id UUID := 'YOUR_USER_ID_HERE'::UUID; -- 替换为实际用户 ID
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
*/

