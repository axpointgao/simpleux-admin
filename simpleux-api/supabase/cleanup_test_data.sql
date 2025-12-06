-- 清理测试数据脚本
-- 在 Supabase Dashboard 的 SQL Editor 中执行

-- ============================================
-- 清理测试数据
-- ============================================

-- 删除测试项目的所有相关数据
DELETE FROM project_expenses_labor 
WHERE project_id IN (
  SELECT id FROM projects WHERE code LIKE 'PROJ-TEST-%'
);

DELETE FROM project_expenses_travel 
WHERE project_id IN (
  SELECT id FROM projects WHERE code LIKE 'PROJ-TEST-%'
);

DELETE FROM project_expenses_outsource 
WHERE project_id IN (
  SELECT id FROM projects WHERE code LIKE 'PROJ-TEST-%'
);

DELETE FROM project_budgets_labor 
WHERE project_id IN (
  SELECT id FROM projects WHERE code LIKE 'PROJ-TEST-%'
);

DELETE FROM project_budgets_travel 
WHERE project_id IN (
  SELECT id FROM projects WHERE code LIKE 'PROJ-TEST-%'
);

DELETE FROM project_budgets_outsource 
WHERE project_id IN (
  SELECT id FROM projects WHERE code LIKE 'PROJ-TEST-%'
);

DELETE FROM project_stages 
WHERE project_id IN (
  SELECT id FROM projects WHERE code LIKE 'PROJ-TEST-%'
);

DELETE FROM project_changes 
WHERE project_id IN (
  SELECT id FROM projects WHERE code LIKE 'PROJ-TEST-%'
);

-- 删除测试项目
DELETE FROM projects 
WHERE code LIKE 'PROJ-TEST-%';

-- 删除测试计件项目
DELETE FROM framework_agreements 
WHERE code LIKE 'FRAM-TEST-%';

-- 显示清理结果
DO $$
DECLARE
  v_deleted_projects INTEGER;
  v_deleted_frameworks INTEGER;
BEGIN
  -- 统计已删除的数据（实际上已经删除了，这里只是确认）
  SELECT COUNT(*) INTO v_deleted_projects
  FROM projects
  WHERE code LIKE 'PROJ-TEST-%';
  
  SELECT COUNT(*) INTO v_deleted_frameworks
  FROM framework_agreements
  WHERE code LIKE 'FRAM-TEST-%';
  
  RAISE NOTICE '清理完成！';
  RAISE NOTICE '剩余测试项目数: %', v_deleted_projects;
  RAISE NOTICE '剩余测试计件项目数: %', v_deleted_frameworks;
  
  IF v_deleted_projects = 0 AND v_deleted_frameworks = 0 THEN
    RAISE NOTICE '✅ 所有测试数据已清理完成';
  ELSE
    RAISE NOTICE '⚠️ 仍有测试数据未清理';
  END IF;
END $$;

