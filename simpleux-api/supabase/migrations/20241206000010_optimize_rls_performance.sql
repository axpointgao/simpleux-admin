-- 优化 RLS 策略性能
-- 创建时间: 2024-12-06
-- 说明: 优化 RLS 策略，减少函数调用，提升查询性能

-- ============================================
-- 1. 优化 is_system_admin 函数
-- ============================================

-- 使用 CREATE OR REPLACE 直接替换函数，不需要删除（避免影响依赖的 RLS 策略）
CREATE OR REPLACE FUNCTION is_system_admin(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- 使用 EXISTS 而不是 COUNT，更高效
  -- 添加 LIMIT 1，找到第一个就返回，不需要扫描全部
  RETURN EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = p_user_id
      AND r.code = 'admin'
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 为 user_roles 和 roles 表添加索引（如果还没有）
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_roles_code ON roles(code);

-- ============================================
-- 2. 优化 is_department_head 函数
-- ============================================

-- 使用 CREATE OR REPLACE 直接替换函数
CREATE OR REPLACE FUNCTION is_department_head(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = p_user_id
      AND r.code = 'department_head'
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================
-- 3. 优化 get_user_department 函数
-- ============================================

-- 使用 CREATE OR REPLACE 直接替换函数
CREATE OR REPLACE FUNCTION get_user_department(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_department TEXT;
BEGIN
  SELECT department INTO v_department
  FROM profiles
  WHERE id = p_user_id
  LIMIT 1;
  
  RETURN v_department;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 确保 profiles.department 有索引（如果还没有）
CREATE INDEX IF NOT EXISTS idx_profiles_department ON profiles(department) WHERE department IS NOT NULL;

-- ============================================
-- 4. 优化 projects 表的 RLS 策略
-- ============================================

-- 删除旧的查看策略
DROP POLICY IF EXISTS "projects_select_policy" ON projects;

-- 创建优化后的查看策略
-- 优化：先检查简单的条件（created_by, manager_id），再检查复杂的函数
CREATE POLICY "projects_select_policy" ON projects
  FOR SELECT
  USING (
    -- 先检查简单的条件（可以使用索引）
    created_by = auth.uid()
    OR
    manager_id = auth.uid()
    OR
    -- 再检查复杂的函数（如果简单条件都不满足）
    (
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
        LIMIT 1
      )
      OR
      -- 部门主管可以查看本部门的数据
      (
        is_department_head(auth.uid()) 
        AND "group" = get_user_department(auth.uid())
      )
    )
  );

-- ============================================
-- 5. 更新表统计信息
-- ============================================

ANALYZE projects;
ANALYZE user_roles;
ANALYZE roles;
ANALYZE profiles;

