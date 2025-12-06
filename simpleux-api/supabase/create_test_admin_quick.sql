-- 快速创建测试管理员用户
-- 使用方法：
-- 1. 先在 Supabase Dashboard > Authentication > Users 中创建用户，获取 User UID
-- 2. 将下面的 YOUR_USER_ID_HERE 替换为实际 User UID
-- 3. 执行此脚本

DO $$
DECLARE
  v_user_id UUID := '9a7958c1-11c6-4764-8562-b3ff27fe3c58'::UUID; -- ⚠️ 请替换为实际用户 ID
  v_admin_role_id UUID;
BEGIN
  -- 创建/更新 profiles 表记录
  INSERT INTO profiles (
    id, name, employee_level, city_type, status, created_at, updated_at
  ) VALUES (
    v_user_id, 
    '测试管理员', 
    'M0',           -- 管理员级别
    'Chengdu',      -- 城市类型（Chengdu 或 Hangzhou）
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
  
  RAISE NOTICE '✅ 用户记录已创建/更新';
  
  -- 获取 admin 角色 ID
  SELECT id INTO v_admin_role_id 
  FROM roles 
  WHERE code = 'admin';
  
  IF v_admin_role_id IS NULL THEN
    RAISE EXCEPTION '❌ admin 角色不存在，请先执行核心表迁移';
  END IF;
  
  -- 分配 admin 角色
  INSERT INTO user_roles (user_id, role_id, created_by, created_at)
  VALUES (v_user_id, v_admin_role_id, v_user_id, now())
  ON CONFLICT (user_id, role_id) DO NOTHING;
  
  RAISE NOTICE '✅ admin 角色已分配';
  RAISE NOTICE '✅ 测试管理员用户创建成功！';
  RAISE NOTICE '   用户 ID: %', v_user_id;
  RAISE NOTICE '   用户名: 测试管理员';
  RAISE NOTICE '   角色: admin (系统管理员)';
  
END $$;

