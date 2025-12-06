-- 配置生产环境的 RLS 策略
-- 创建时间: 2024-12-06
-- 说明: 为商业项目相关表配置生产环境的 Row Level Security 策略
-- 注意: 此迁移文件会删除开发环境的临时策略，并创建生产环境的权限策略
-- 前置要求: 必须先执行 20241206000005_add_created_by_to_framework_agreements.sql

-- 1. 删除开发环境的临时策略
DROP POLICY IF EXISTS "Allow all operations for development" ON framework_agreements;
DROP POLICY IF EXISTS "Allow all operations for development" ON projects;
DROP POLICY IF EXISTS "Allow all operations for development" ON project_budgets_labor;
DROP POLICY IF EXISTS "Allow all operations for development" ON project_budgets_travel;
DROP POLICY IF EXISTS "Allow all operations for development" ON project_budgets_outsource;
DROP POLICY IF EXISTS "Allow all operations for development" ON project_expenses_labor;
DROP POLICY IF EXISTS "Allow all operations for development" ON project_expenses_travel;
DROP POLICY IF EXISTS "Allow all operations for development" ON project_expenses_outsource;
DROP POLICY IF EXISTS "Allow all operations for development" ON project_changes;
DROP POLICY IF EXISTS "Allow all operations for development" ON cost_standards;

-- 2. 创建辅助函数：检查用户是否为系统管理员
-- 假设系统管理员角色代码为 'admin'
CREATE OR REPLACE FUNCTION is_system_admin(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = p_user_id
      AND r.code = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. 创建辅助函数：检查用户是否为部门主管
-- 假设部门主管角色代码为 'department_head'
CREATE OR REPLACE FUNCTION is_department_head(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = p_user_id
      AND r.code = 'department_head'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 创建辅助函数：获取用户部门
CREATE OR REPLACE FUNCTION get_user_department(p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_department TEXT;
BEGIN
  SELECT department INTO v_department
  FROM profiles
  WHERE id = p_user_id;
  
  RETURN v_department;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. 配置 framework_agreements 表的 RLS 策略
-- ============================================

-- 查看策略：用户可以查看自己相关的数据，部门主管可以查看本部门的数据，系统管理员可以查看所有数据
CREATE POLICY "framework_agreements_select_policy" ON framework_agreements
  FOR SELECT
  USING (
    -- 系统管理员可以查看所有数据
    is_system_admin(auth.uid())
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

-- 插入策略：用户可以创建数据，系统管理员可以创建所有数据
CREATE POLICY "framework_agreements_insert_policy" ON framework_agreements
  FOR INSERT
  WITH CHECK (
    -- 系统管理员可以创建所有数据
    is_system_admin(auth.uid())
    OR
    -- 用户可以创建数据（创建人必须是当前用户）
    created_by = auth.uid()
  );

-- 更新策略：用户可以更新自己创建的数据，部门主管可以更新本部门的数据，系统管理员可以更新所有数据
CREATE POLICY "framework_agreements_update_policy" ON framework_agreements
  FOR UPDATE
  USING (
    -- 系统管理员可以更新所有数据
    is_system_admin(auth.uid())
    OR
    -- 用户可以更新自己创建的数据
    created_by = auth.uid()
    OR
    -- 部门主管可以更新本部门的数据
    (is_department_head(auth.uid()) AND "group" = get_user_department(auth.uid()))
  )
  WITH CHECK (
    -- 系统管理员可以更新所有数据
    is_system_admin(auth.uid())
    OR
    -- 用户可以更新自己创建的数据
    created_by = auth.uid()
    OR
    -- 部门主管可以更新本部门的数据
    (is_department_head(auth.uid()) AND "group" = get_user_department(auth.uid()))
  );

-- 删除策略：用户可以删除自己创建的数据，系统管理员可以删除所有数据
CREATE POLICY "framework_agreements_delete_policy" ON framework_agreements
  FOR DELETE
  USING (
    -- 系统管理员可以删除所有数据
    is_system_admin(auth.uid())
    OR
    -- 用户可以删除自己创建的数据
    created_by = auth.uid()
  );

-- ============================================
-- 6. 配置 projects 表的 RLS 策略
-- ============================================

-- 查看策略
CREATE POLICY "projects_select_policy" ON projects
  FOR SELECT
  USING (
    is_system_admin(auth.uid())
    OR
    created_by = auth.uid()
    OR
    manager_id = auth.uid()
    OR
    (is_department_head(auth.uid()) AND "group" = get_user_department(auth.uid()))
  );

-- 插入策略
CREATE POLICY "projects_insert_policy" ON projects
  FOR INSERT
  WITH CHECK (
    is_system_admin(auth.uid())
    OR
    created_by = auth.uid()
  );

-- 更新策略
CREATE POLICY "projects_update_policy" ON projects
  FOR UPDATE
  USING (
    is_system_admin(auth.uid())
    OR
    created_by = auth.uid()
    OR
    manager_id = auth.uid()
    OR
    (is_department_head(auth.uid()) AND "group" = get_user_department(auth.uid()))
  )
  WITH CHECK (
    is_system_admin(auth.uid())
    OR
    created_by = auth.uid()
    OR
    manager_id = auth.uid()
    OR
    (is_department_head(auth.uid()) AND "group" = get_user_department(auth.uid()))
  );

-- 删除策略（软删除，实际不允许物理删除）
CREATE POLICY "projects_delete_policy" ON projects
  FOR DELETE
  USING (
    is_system_admin(auth.uid())
  );

-- ============================================
-- 7. 配置 project_budgets_labor 表的 RLS 策略
-- ============================================

-- 查看策略：可以查看关联项目的预算
CREATE POLICY "project_budgets_labor_select_policy" ON project_budgets_labor
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_budgets_labor.project_id
        AND (
          is_system_admin(auth.uid())
          OR p.created_by = auth.uid()
          OR p.manager_id = auth.uid()
          OR (is_department_head(auth.uid()) AND p."group" = get_user_department(auth.uid()))
        )
    )
  );

-- 插入策略
CREATE POLICY "project_budgets_labor_insert_policy" ON project_budgets_labor
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_budgets_labor.project_id
        AND (
          is_system_admin(auth.uid())
          OR p.created_by = auth.uid()
          OR p.manager_id = auth.uid()
        )
    )
  );

-- 更新策略
CREATE POLICY "project_budgets_labor_update_policy" ON project_budgets_labor
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_budgets_labor.project_id
        AND (
          is_system_admin(auth.uid())
          OR p.created_by = auth.uid()
          OR p.manager_id = auth.uid()
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_budgets_labor.project_id
        AND (
          is_system_admin(auth.uid())
          OR p.created_by = auth.uid()
          OR p.manager_id = auth.uid()
        )
    )
  );

-- 删除策略
CREATE POLICY "project_budgets_labor_delete_policy" ON project_budgets_labor
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_budgets_labor.project_id
        AND (
          is_system_admin(auth.uid())
          OR p.created_by = auth.uid()
          OR p.manager_id = auth.uid()
        )
    )
  );

-- ============================================
-- 8. 配置 project_budgets_travel 表的 RLS 策略
-- ============================================

CREATE POLICY "project_budgets_travel_select_policy" ON project_budgets_travel
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_budgets_travel.project_id
        AND (
          is_system_admin(auth.uid())
          OR p.created_by = auth.uid()
          OR p.manager_id = auth.uid()
          OR (is_department_head(auth.uid()) AND p."group" = get_user_department(auth.uid()))
        )
    )
  );

CREATE POLICY "project_budgets_travel_insert_policy" ON project_budgets_travel
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_budgets_travel.project_id
        AND (
          is_system_admin(auth.uid())
          OR p.created_by = auth.uid()
          OR p.manager_id = auth.uid()
        )
    )
  );

CREATE POLICY "project_budgets_travel_update_policy" ON project_budgets_travel
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_budgets_travel.project_id
        AND (
          is_system_admin(auth.uid())
          OR p.created_by = auth.uid()
          OR p.manager_id = auth.uid()
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_budgets_travel.project_id
        AND (
          is_system_admin(auth.uid())
          OR p.created_by = auth.uid()
          OR p.manager_id = auth.uid()
        )
    )
  );

CREATE POLICY "project_budgets_travel_delete_policy" ON project_budgets_travel
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_budgets_travel.project_id
        AND (
          is_system_admin(auth.uid())
          OR p.created_by = auth.uid()
          OR p.manager_id = auth.uid()
        )
    )
  );

-- ============================================
-- 9. 配置 project_budgets_outsource 表的 RLS 策略
-- ============================================

CREATE POLICY "project_budgets_outsource_select_policy" ON project_budgets_outsource
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_budgets_outsource.project_id
        AND (
          is_system_admin(auth.uid())
          OR p.created_by = auth.uid()
          OR p.manager_id = auth.uid()
          OR (is_department_head(auth.uid()) AND p."group" = get_user_department(auth.uid()))
        )
    )
  );

CREATE POLICY "project_budgets_outsource_insert_policy" ON project_budgets_outsource
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_budgets_outsource.project_id
        AND (
          is_system_admin(auth.uid())
          OR p.created_by = auth.uid()
          OR p.manager_id = auth.uid()
        )
    )
  );

CREATE POLICY "project_budgets_outsource_update_policy" ON project_budgets_outsource
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_budgets_outsource.project_id
        AND (
          is_system_admin(auth.uid())
          OR p.created_by = auth.uid()
          OR p.manager_id = auth.uid()
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_budgets_outsource.project_id
        AND (
          is_system_admin(auth.uid())
          OR p.created_by = auth.uid()
          OR p.manager_id = auth.uid()
        )
    )
  );

CREATE POLICY "project_budgets_outsource_delete_policy" ON project_budgets_outsource
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_budgets_outsource.project_id
        AND (
          is_system_admin(auth.uid())
          OR p.created_by = auth.uid()
          OR p.manager_id = auth.uid()
        )
    )
  );

-- ============================================
-- 10. 配置 project_expenses_labor 表的 RLS 策略
-- ============================================

CREATE POLICY "project_expenses_labor_select_policy" ON project_expenses_labor
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_expenses_labor.project_id
        AND (
          is_system_admin(auth.uid())
          OR p.created_by = auth.uid()
          OR p.manager_id = auth.uid()
          OR project_expenses_labor.employee_id = auth.uid()
          OR (is_department_head(auth.uid()) AND p."group" = get_user_department(auth.uid()))
        )
    )
  );

CREATE POLICY "project_expenses_labor_insert_policy" ON project_expenses_labor
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_expenses_labor.project_id
        AND (
          is_system_admin(auth.uid())
          OR p.created_by = auth.uid()
          OR p.manager_id = auth.uid()
          OR project_expenses_labor.employee_id = auth.uid()
        )
    )
  );

CREATE POLICY "project_expenses_labor_update_policy" ON project_expenses_labor
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_expenses_labor.project_id
        AND (
          is_system_admin(auth.uid())
          OR p.created_by = auth.uid()
          OR p.manager_id = auth.uid()
          OR project_expenses_labor.employee_id = auth.uid()
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_expenses_labor.project_id
        AND (
          is_system_admin(auth.uid())
          OR p.created_by = auth.uid()
          OR p.manager_id = auth.uid()
          OR project_expenses_labor.employee_id = auth.uid()
        )
    )
  );

CREATE POLICY "project_expenses_labor_delete_policy" ON project_expenses_labor
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_expenses_labor.project_id
        AND (
          is_system_admin(auth.uid())
          OR p.created_by = auth.uid()
          OR p.manager_id = auth.uid()
        )
    )
  );

-- ============================================
-- 11. 配置 project_expenses_travel 表的 RLS 策略
-- ============================================

CREATE POLICY "project_expenses_travel_select_policy" ON project_expenses_travel
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_expenses_travel.project_id
        AND (
          is_system_admin(auth.uid())
          OR p.created_by = auth.uid()
          OR p.manager_id = auth.uid()
          OR (is_department_head(auth.uid()) AND p."group" = get_user_department(auth.uid()))
        )
    )
  );

CREATE POLICY "project_expenses_travel_insert_policy" ON project_expenses_travel
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_expenses_travel.project_id
        AND (
          is_system_admin(auth.uid())
          OR p.created_by = auth.uid()
          OR p.manager_id = auth.uid()
        )
    )
  );

CREATE POLICY "project_expenses_travel_update_policy" ON project_expenses_travel
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_expenses_travel.project_id
        AND (
          is_system_admin(auth.uid())
          OR p.created_by = auth.uid()
          OR p.manager_id = auth.uid()
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_expenses_travel.project_id
        AND (
          is_system_admin(auth.uid())
          OR p.created_by = auth.uid()
          OR p.manager_id = auth.uid()
        )
    )
  );

CREATE POLICY "project_expenses_travel_delete_policy" ON project_expenses_travel
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_expenses_travel.project_id
        AND (
          is_system_admin(auth.uid())
          OR p.created_by = auth.uid()
          OR p.manager_id = auth.uid()
        )
    )
  );

-- ============================================
-- 12. 配置 project_expenses_outsource 表的 RLS 策略
-- ============================================

CREATE POLICY "project_expenses_outsource_select_policy" ON project_expenses_outsource
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_expenses_outsource.project_id
        AND (
          is_system_admin(auth.uid())
          OR p.created_by = auth.uid()
          OR p.manager_id = auth.uid()
          OR (is_department_head(auth.uid()) AND p."group" = get_user_department(auth.uid()))
        )
    )
  );

CREATE POLICY "project_expenses_outsource_insert_policy" ON project_expenses_outsource
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_expenses_outsource.project_id
        AND (
          is_system_admin(auth.uid())
          OR p.created_by = auth.uid()
          OR p.manager_id = auth.uid()
        )
    )
  );

CREATE POLICY "project_expenses_outsource_update_policy" ON project_expenses_outsource
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_expenses_outsource.project_id
        AND (
          is_system_admin(auth.uid())
          OR p.created_by = auth.uid()
          OR p.manager_id = auth.uid()
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_expenses_outsource.project_id
        AND (
          is_system_admin(auth.uid())
          OR p.created_by = auth.uid()
          OR p.manager_id = auth.uid()
        )
    )
  );

CREATE POLICY "project_expenses_outsource_delete_policy" ON project_expenses_outsource
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_expenses_outsource.project_id
        AND (
          is_system_admin(auth.uid())
          OR p.created_by = auth.uid()
          OR p.manager_id = auth.uid()
        )
    )
  );

-- ============================================
-- 13. 配置 project_changes 表的 RLS 策略
-- ============================================

CREATE POLICY "project_changes_select_policy" ON project_changes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_changes.project_id
        AND (
          is_system_admin(auth.uid())
          OR p.created_by = auth.uid()
          OR p.manager_id = auth.uid()
          OR project_changes.created_by = auth.uid()
          OR (is_department_head(auth.uid()) AND p."group" = get_user_department(auth.uid()))
        )
    )
  );

CREATE POLICY "project_changes_insert_policy" ON project_changes
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_changes.project_id
        AND (
          is_system_admin(auth.uid())
          OR p.created_by = auth.uid()
          OR p.manager_id = auth.uid()
        )
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "project_changes_update_policy" ON project_changes
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_changes.project_id
        AND (
          is_system_admin(auth.uid())
          OR project_changes.created_by = auth.uid()
        )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects p
      WHERE p.id = project_changes.project_id
        AND (
          is_system_admin(auth.uid())
          OR project_changes.created_by = auth.uid()
        )
    )
  );

CREATE POLICY "project_changes_delete_policy" ON project_changes
  FOR DELETE
  USING (
    is_system_admin(auth.uid())
    OR created_by = auth.uid()
  );

-- ============================================
-- 14. 配置 cost_standards 表的 RLS 策略
-- ============================================

-- 查看策略：所有用户都可以查看成本标准
CREATE POLICY "cost_standards_select_policy" ON cost_standards
  FOR SELECT
  USING (true);

-- 插入策略：只有系统管理员可以创建成本标准
CREATE POLICY "cost_standards_insert_policy" ON cost_standards
  FOR INSERT
  WITH CHECK (
    is_system_admin(auth.uid())
    AND created_by = auth.uid()
  );

-- 更新策略：只有系统管理员可以更新成本标准
CREATE POLICY "cost_standards_update_policy" ON cost_standards
  FOR UPDATE
  USING (is_system_admin(auth.uid()))
  WITH CHECK (is_system_admin(auth.uid()));

-- 删除策略：只有系统管理员可以删除成本标准
CREATE POLICY "cost_standards_delete_policy" ON cost_standards
  FOR DELETE
  USING (is_system_admin(auth.uid()));

-- 15. 注释说明
COMMENT ON FUNCTION is_system_admin IS '检查用户是否为系统管理员';
COMMENT ON FUNCTION is_department_head IS '检查用户是否为部门主管';
COMMENT ON FUNCTION get_user_department IS '获取用户所属部门';

