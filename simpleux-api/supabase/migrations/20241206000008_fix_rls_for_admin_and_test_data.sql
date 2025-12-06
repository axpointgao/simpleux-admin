-- 修复 RLS 策略，确保管理员可以查看所有数据，并允许查看测试数据
-- 创建时间: 2024-12-06
-- 说明: 修复 RLS 策略，确保系统管理员可以查看所有项目数据（包括测试数据）

-- ============================================
-- 1. 更新 projects 表的查看策略，添加总监角色支持
-- ============================================

-- 删除旧的查看策略
DROP POLICY IF EXISTS "projects_select_policy" ON projects;

-- 创建新的查看策略（支持管理员、总监查看所有数据）
CREATE POLICY "projects_select_policy" ON projects
  FOR SELECT
  USING (
    -- 系统管理员可以查看所有数据
    is_system_admin(auth.uid())
    OR
    -- 总监可以查看所有数据
    EXISTS (
      SELECT 1
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
        AND r.code = 'director'
    )
    OR
    -- 用户可以查看自己创建的数据
    created_by = auth.uid()
    OR
    -- 用户可以查看自己作为项目经理的数据
    manager_id = auth.uid()
    OR
    -- 部门主管可以查看本部门的数据
    (is_department_head(auth.uid()) AND "group" = get_user_department(auth.uid()))
  );

-- ============================================
-- 2. 更新 framework_agreements 表的查看策略，添加总监角色支持
-- ============================================

-- 删除旧的查看策略
DROP POLICY IF EXISTS "framework_agreements_select_policy" ON framework_agreements;

-- 创建新的查看策略（支持管理员、总监查看所有数据）
CREATE POLICY "framework_agreements_select_policy" ON framework_agreements
  FOR SELECT
  USING (
    -- 系统管理员可以查看所有数据
    is_system_admin(auth.uid())
    OR
    -- 总监可以查看所有数据
    EXISTS (
      SELECT 1
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
        AND r.code = 'director'
    )
    OR
    -- 用户可以查看自己创建的数据
    created_by = auth.uid()
    OR
    -- 用户可以查看自己作为项目经理的数据
    manager_id = auth.uid()
    OR
    -- 部门主管可以查看本部门的数据
    (is_department_head(auth.uid()) AND "group" = get_user_department(auth.uid()))
  );

-- ============================================
-- 3. 为测试数据设置 created_by（如果为 NULL）
-- ============================================

-- 为没有 created_by 的项目设置一个默认值（使用第一个管理员用户）
-- 注意：这只是一个临时方案，实际应该根据业务需求设置正确的创建人
DO $$
DECLARE
  v_admin_user_id UUID;
BEGIN
  -- 获取第一个管理员用户 ID
  SELECT ur.user_id INTO v_admin_user_id
  FROM user_roles ur
  JOIN roles r ON ur.role_id = r.id
  WHERE r.code = 'admin'
  LIMIT 1;
  
  -- 如果有管理员用户，为没有 created_by 的项目设置 created_by
  IF v_admin_user_id IS NOT NULL THEN
    UPDATE projects
    SET created_by = v_admin_user_id
    WHERE created_by IS NULL;
    
    UPDATE framework_agreements
    SET created_by = v_admin_user_id
    WHERE created_by IS NULL;
    
    RAISE NOTICE '已为测试数据设置 created_by: %', v_admin_user_id;
  ELSE
    RAISE NOTICE '未找到管理员用户，跳过 created_by 设置';
  END IF;
END $$;

