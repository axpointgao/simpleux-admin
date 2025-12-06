-- 数据库迁移执行状态检查脚本
-- 用于检查所有迁移文件是否已正确执行
-- 使用方法：在 Supabase Dashboard 的 SQL Editor 中执行此脚本

DO $$
DECLARE
  v_count INTEGER;
  v_func_count INTEGER;
  v_trigger_count INTEGER;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '数据库迁移执行状态检查';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  -- ============================================
  -- 1. 检查核心表（20241204000000_create_core_tables.sql）
  -- ============================================
  RAISE NOTICE '=== 1. 核心表检查（20241204000000_create_core_tables.sql） ===';
  
  SELECT COUNT(*) INTO v_count FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles';
  RAISE NOTICE '% profiles 表', CASE WHEN v_count > 0 THEN '✅' ELSE '❌' END;
  
  SELECT COUNT(*) INTO v_count FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'departments';
  RAISE NOTICE '% departments 表', CASE WHEN v_count > 0 THEN '✅' ELSE '❌' END;
  
  SELECT COUNT(*) INTO v_count FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'roles';
  RAISE NOTICE '% roles 表', CASE WHEN v_count > 0 THEN '✅' ELSE '❌' END;
  
  SELECT COUNT(*) INTO v_count FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_roles';
  RAISE NOTICE '% user_roles 表', CASE WHEN v_count > 0 THEN '✅' ELSE '❌' END;
  
  SELECT COUNT(*) INTO v_count FROM roles WHERE code IN ('admin', 'director', 'department_head', 'employee');
  RAISE NOTICE '% 系统角色已预置（% 个）', CASE WHEN v_count >= 4 THEN '✅' ELSE '❌' END, v_count;
  
  RAISE NOTICE '';

  -- ============================================
  -- 2. 检查商业项目表（20241205000000_create_commercial_project_tables.sql）
  -- ============================================
  RAISE NOTICE '=== 2. 商业项目表检查（20241205000000_create_commercial_project_tables.sql） ===';
  
  SELECT COUNT(*) INTO v_count FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'framework_agreements';
  RAISE NOTICE '% framework_agreements 表', CASE WHEN v_count > 0 THEN '✅' ELSE '❌' END;
  
  SELECT COUNT(*) INTO v_count FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'projects';
  RAISE NOTICE '% projects 表', CASE WHEN v_count > 0 THEN '✅' ELSE '❌' END;
  
  SELECT COUNT(*) INTO v_count FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'project_stages';
  RAISE NOTICE '% project_stages 表', CASE WHEN v_count > 0 THEN '✅' ELSE '❌' END;
  
  SELECT COUNT(*) INTO v_count FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'project_budgets_labor';
  RAISE NOTICE '% project_budgets_labor 表', CASE WHEN v_count > 0 THEN '✅' ELSE '❌' END;
  
  SELECT COUNT(*) INTO v_count FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'project_budgets_travel';
  RAISE NOTICE '% project_budgets_travel 表', CASE WHEN v_count > 0 THEN '✅' ELSE '❌' END;
  
  SELECT COUNT(*) INTO v_count FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'project_budgets_outsource';
  RAISE NOTICE '% project_budgets_outsource 表', CASE WHEN v_count > 0 THEN '✅' ELSE '❌' END;
  
  SELECT COUNT(*) INTO v_count FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'project_expenses_labor';
  RAISE NOTICE '% project_expenses_labor 表', CASE WHEN v_count > 0 THEN '✅' ELSE '❌' END;
  
  SELECT COUNT(*) INTO v_count FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'project_expenses_travel';
  RAISE NOTICE '% project_expenses_travel 表', CASE WHEN v_count > 0 THEN '✅' ELSE '❌' END;
  
  SELECT COUNT(*) INTO v_count FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'project_expenses_outsource';
  RAISE NOTICE '% project_expenses_outsource 表', CASE WHEN v_count > 0 THEN '✅' ELSE '❌' END;
  
  SELECT COUNT(*) INTO v_count FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'project_changes';
  RAISE NOTICE '% project_changes 表', CASE WHEN v_count > 0 THEN '✅' ELSE '❌' END;
  
  RAISE NOTICE '';

  -- ============================================
  -- 3. 检查项目汇总触发器函数（20241206000000_add_project_summary_triggers.sql）
  -- ============================================
  RAISE NOTICE '=== 3. 项目汇总触发器函数检查（20241206000000_add_project_summary_triggers.sql） ===';
  
  SELECT COUNT(*) INTO v_func_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public' AND p.proname = 'update_project_budget_expense_totals';
  RAISE NOTICE '% update_project_budget_expense_totals 函数', CASE WHEN v_func_count > 0 THEN '✅' ELSE '❌' END;
  
  SELECT COUNT(*) INTO v_func_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public' AND p.proname = 'trigger_update_project_labor_budget_totals';
  RAISE NOTICE '% trigger_update_project_labor_budget_totals 函数', CASE WHEN v_func_count > 0 THEN '✅' ELSE '❌' END;
  
  SELECT COUNT(*) INTO v_func_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public' AND p.proname = 'trigger_update_project_framework_name';
  RAISE NOTICE '% trigger_update_project_framework_name 函数', CASE WHEN v_func_count > 0 THEN '✅' ELSE '❌' END;
  
  RAISE NOTICE '';

  -- ============================================
  -- 4. 检查项目汇总触发器（20241206000000_add_project_summary_triggers.sql）
  -- ============================================
  RAISE NOTICE '=== 4. 项目汇总触发器检查（20241206000000_add_project_summary_triggers.sql） ===';
  
  SELECT COUNT(*) INTO v_trigger_count
  FROM pg_trigger t
  JOIN pg_class c ON t.tgrelid = c.oid
  WHERE c.relname = 'project_budgets_labor' AND t.tgname = 'trigger_update_project_labor_budget_totals';
  RAISE NOTICE '% project_budgets_labor 触发器', CASE WHEN v_trigger_count > 0 THEN '✅' ELSE '❌' END;
  
  SELECT COUNT(*) INTO v_trigger_count
  FROM pg_trigger t
  JOIN pg_class c ON t.tgrelid = c.oid
  WHERE c.relname = 'project_expenses_labor' AND t.tgname = 'trigger_update_project_labor_expense_totals';
  RAISE NOTICE '% project_expenses_labor 触发器', CASE WHEN v_trigger_count > 0 THEN '✅' ELSE '❌' END;
  
  SELECT COUNT(*) INTO v_trigger_count
  FROM pg_trigger t
  JOIN pg_class c ON t.tgrelid = c.oid
  WHERE c.relname = 'framework_agreements' AND t.tgname = 'trigger_update_project_framework_name';
  RAISE NOTICE '% framework_agreements 触发器', CASE WHEN v_trigger_count > 0 THEN '✅' ELSE '❌' END;
  
  RAISE NOTICE '';

  -- ============================================
  -- 5. 检查成本标准表（20241206000002_create_cost_standards_and_trigger.sql）
  -- ============================================
  RAISE NOTICE '=== 5. 成本标准表检查（20241206000002_create_cost_standards_and_trigger.sql） ===';
  
  SELECT COUNT(*) INTO v_count FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cost_standards';
  RAISE NOTICE '% cost_standards 表', CASE WHEN v_count > 0 THEN '✅' ELSE '❌' END;
  
  SELECT COUNT(*) INTO v_func_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public' AND p.proname = 'get_cost_standard';
  RAISE NOTICE '% get_cost_standard 函数', CASE WHEN v_func_count > 0 THEN '✅' ELSE '❌' END;
  
  SELECT COUNT(*) INTO v_func_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public' AND p.proname = 'calculate_labor_expense_cost';
  RAISE NOTICE '% calculate_labor_expense_cost 函数', CASE WHEN v_func_count > 0 THEN '✅' ELSE '❌' END;
  
  SELECT COUNT(*) INTO v_trigger_count
  FROM pg_trigger t
  JOIN pg_class c ON t.tgrelid = c.oid
  WHERE c.relname = 'project_expenses_labor' AND t.tgname = 'trigger_calculate_labor_expense_cost';
  RAISE NOTICE '% project_expenses_labor 成本计算触发器', CASE WHEN v_trigger_count > 0 THEN '✅' ELSE '❌' END;
  
  RAISE NOTICE '';

  -- ============================================
  -- 6. 检查RLS策略辅助函数（20241206000003_configure_production_rls_policies.sql）
  -- ============================================
  RAISE NOTICE '=== 6. RLS策略辅助函数检查（20241206000003_configure_production_rls_policies.sql） ===';
  
  SELECT COUNT(*) INTO v_func_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public' AND p.proname = 'is_system_admin';
  RAISE NOTICE '% is_system_admin 函数', CASE WHEN v_func_count > 0 THEN '✅' ELSE '❌' END;
  
  SELECT COUNT(*) INTO v_func_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public' AND p.proname = 'is_department_head';
  RAISE NOTICE '% is_department_head 函数', CASE WHEN v_func_count > 0 THEN '✅' ELSE '❌' END;
  
  SELECT COUNT(*) INTO v_func_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public' AND p.proname = 'get_user_department';
  RAISE NOTICE '% get_user_department 函数', CASE WHEN v_func_count > 0 THEN '✅' ELSE '❌' END;
  
  RAISE NOTICE '';

  -- ============================================
  -- 7. 检查RLS策略（20241206000003_configure_production_rls_policies.sql）
  -- ============================================
  RAISE NOTICE '=== 7. RLS策略检查（20241206000003_configure_production_rls_policies.sql） ===';
  
  SELECT COUNT(*) INTO v_count
  FROM pg_policies 
  WHERE schemaname = 'public' 
    AND tablename = 'projects'
    AND (policyname LIKE '%admin%' OR policyname LIKE '%director%');
  IF v_count > 0 THEN
    RAISE NOTICE '✅ projects 表RLS策略已配置（生产环境策略）';
  ELSE
    SELECT COUNT(*) INTO v_count
    FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'projects'
      AND policyname = 'Allow all operations for development';
    IF v_count > 0 THEN
      RAISE NOTICE '⚠️  projects 表使用开发环境策略（需要执行生产环境RLS策略迁移）';
    ELSE
      RAISE NOTICE '❌ projects 表RLS策略未配置';
    END IF;
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '检查完成';
  RAISE NOTICE '========================================';
END $$;
