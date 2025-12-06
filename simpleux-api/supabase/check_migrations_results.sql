-- 数据库迁移执行状态检查脚本（返回结果集版本）
-- 用于检查所有迁移文件是否已正确执行
-- 使用方法：在 Supabase Dashboard 的 SQL Editor 中执行此脚本
-- 结果会直接显示在 Results 标签页中

-- ============================================
-- 1. 检查核心表（20241204000000_create_core_tables.sql）
-- ============================================
SELECT 
  '1. 核心表检查' AS category,
  'profiles 表' AS item,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') 
    THEN '✅ 存在'
    ELSE '❌ 不存在'
  END AS status
UNION ALL
SELECT 
  '1. 核心表检查',
  'departments 表',
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'departments') 
    THEN '✅ 存在'
    ELSE '❌ 不存在'
  END
UNION ALL
SELECT 
  '1. 核心表检查',
  'roles 表',
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'roles') 
    THEN '✅ 存在'
    ELSE '❌ 不存在'
  END
UNION ALL
SELECT 
  '1. 核心表检查',
  'user_roles 表',
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_roles') 
    THEN '✅ 存在'
    ELSE '❌ 不存在'
  END
UNION ALL
SELECT 
  '1. 核心表检查',
  '系统角色预置',
  CASE 
    WHEN (SELECT COUNT(*) FROM roles WHERE code IN ('admin', 'director', 'department_head', 'employee')) >= 4
    THEN '✅ 已预置'
    ELSE '❌ 未预置'
  END

-- ============================================
-- 2. 检查商业项目表（20241205000000_create_commercial_project_tables.sql）
-- ============================================
UNION ALL
SELECT 
  '2. 商业项目表检查',
  'framework_agreements 表',
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'framework_agreements') 
    THEN '✅ 存在'
    ELSE '❌ 不存在'
  END
UNION ALL
SELECT 
  '2. 商业项目表检查',
  'projects 表',
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'projects') 
    THEN '✅ 存在'
    ELSE '❌ 不存在'
  END
UNION ALL
SELECT 
  '2. 商业项目表检查',
  'project_stages 表',
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'project_stages') 
    THEN '✅ 存在'
    ELSE '❌ 不存在'
  END
UNION ALL
SELECT 
  '2. 商业项目表检查',
  'project_budgets_labor 表',
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'project_budgets_labor') 
    THEN '✅ 存在'
    ELSE '❌ 不存在'
  END
UNION ALL
SELECT 
  '2. 商业项目表检查',
  'project_budgets_travel 表',
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'project_budgets_travel') 
    THEN '✅ 存在'
    ELSE '❌ 不存在'
  END
UNION ALL
SELECT 
  '2. 商业项目表检查',
  'project_budgets_outsource 表',
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'project_budgets_outsource') 
    THEN '✅ 存在'
    ELSE '❌ 不存在'
  END
UNION ALL
SELECT 
  '2. 商业项目表检查',
  'project_expenses_labor 表',
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'project_expenses_labor') 
    THEN '✅ 存在'
    ELSE '❌ 不存在'
  END
UNION ALL
SELECT 
  '2. 商业项目表检查',
  'project_expenses_travel 表',
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'project_expenses_travel') 
    THEN '✅ 存在'
    ELSE '❌ 不存在'
  END
UNION ALL
SELECT 
  '2. 商业项目表检查',
  'project_expenses_outsource 表',
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'project_expenses_outsource') 
    THEN '✅ 存在'
    ELSE '❌ 不存在'
  END
UNION ALL
SELECT 
  '2. 商业项目表检查',
  'project_changes 表',
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'project_changes') 
    THEN '✅ 存在'
    ELSE '❌ 不存在'
  END

-- ============================================
-- 3. 检查项目汇总触发器函数（20241206000000_add_project_summary_triggers.sql）
-- ============================================
UNION ALL
SELECT 
  '3. 触发器函数检查',
  'update_project_budget_expense_totals 函数',
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public' AND p.proname = 'update_project_budget_expense_totals'
    )
    THEN '✅ 存在'
    ELSE '❌ 不存在'
  END
UNION ALL
SELECT 
  '3. 触发器函数检查',
  'trigger_update_project_labor_budget_totals 函数',
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public' AND p.proname = 'trigger_update_project_labor_budget_totals'
    )
    THEN '✅ 存在'
    ELSE '❌ 不存在'
  END
UNION ALL
SELECT 
  '3. 触发器函数检查',
  'sync_framework_name 函数',
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public' AND p.proname = 'sync_framework_name'
    )
    THEN '✅ 存在'
    ELSE '❌ 不存在'
  END
UNION ALL
SELECT 
  '3. 触发器函数检查',
  'init_framework_name 函数',
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public' AND p.proname = 'init_framework_name'
    )
    THEN '✅ 存在'
    ELSE '❌ 不存在'
  END

-- ============================================
-- 4. 检查项目汇总触发器（20241206000000_add_project_summary_triggers.sql）
-- ============================================
UNION ALL
SELECT 
  '4. 触发器检查',
  'project_budgets_labor 触发器',
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_trigger t
      JOIN pg_class c ON t.tgrelid = c.oid
      WHERE c.relname = 'project_budgets_labor' AND t.tgname = 'trigger_update_project_labor_budget_totals'
    )
    THEN '✅ 存在'
    ELSE '❌ 不存在'
  END
UNION ALL
SELECT 
  '4. 触发器检查',
  'project_expenses_labor 触发器',
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_trigger t
      JOIN pg_class c ON t.tgrelid = c.oid
      WHERE c.relname = 'project_expenses_labor' AND t.tgname = 'trigger_update_project_labor_expense_totals'
    )
    THEN '✅ 存在'
    ELSE '❌ 不存在'
  END
UNION ALL
SELECT 
  '4. 触发器检查',
  'framework_agreements 触发器 (trigger_sync_framework_name)',
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_trigger t
      JOIN pg_class c ON t.tgrelid = c.oid
      WHERE c.relname = 'framework_agreements' AND t.tgname = 'trigger_sync_framework_name'
    )
    THEN '✅ 存在'
    ELSE '❌ 不存在'
  END
UNION ALL
SELECT 
  '4. 触发器检查',
  'projects 触发器 (trigger_init_framework_name)',
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_trigger t
      JOIN pg_class c ON t.tgrelid = c.oid
      WHERE c.relname = 'projects' AND t.tgname = 'trigger_init_framework_name'
    )
    THEN '✅ 存在'
    ELSE '❌ 不存在'
  END

-- ============================================
-- 5. 检查成本标准表（20241206000002_create_cost_standards_and_trigger.sql）
-- ============================================
UNION ALL
SELECT 
  '5. 成本标准表检查',
  'cost_standards 表',
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'cost_standards') 
    THEN '✅ 存在'
    ELSE '❌ 不存在'
  END
UNION ALL
SELECT 
  '5. 成本标准表检查',
  'get_cost_standard 函数',
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public' AND p.proname = 'get_cost_standard'
    )
    THEN '✅ 存在'
    ELSE '❌ 不存在'
  END
UNION ALL
SELECT 
  '5. 成本标准表检查',
  'calculate_labor_expense_cost 函数',
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public' AND p.proname = 'calculate_labor_expense_cost'
    )
    THEN '✅ 存在'
    ELSE '❌ 不存在'
  END
UNION ALL
SELECT 
  '5. 成本标准表检查',
  'project_expenses_labor 成本计算触发器',
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_trigger t
      JOIN pg_class c ON t.tgrelid = c.oid
      WHERE c.relname = 'project_expenses_labor' AND t.tgname = 'calculate_project_expenses_labor_cost'
    )
    THEN '✅ 存在'
    ELSE '❌ 不存在'
  END

-- ============================================
-- 6. 检查RLS策略辅助函数（20241206000003_configure_production_rls_policies.sql）
-- ============================================
UNION ALL
SELECT 
  '6. RLS策略函数检查',
  'is_system_admin 函数',
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public' AND p.proname = 'is_system_admin'
    )
    THEN '✅ 存在'
    ELSE '❌ 不存在'
  END
UNION ALL
SELECT 
  '6. RLS策略函数检查',
  'is_department_head 函数',
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public' AND p.proname = 'is_department_head'
    )
    THEN '✅ 存在'
    ELSE '❌ 不存在'
  END
UNION ALL
SELECT 
  '6. RLS策略函数检查',
  'get_user_department 函数',
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public' AND p.proname = 'get_user_department'
    )
    THEN '✅ 存在'
    ELSE '❌ 不存在'
  END

-- ============================================
-- 7. 检查RLS策略（20241206000003_configure_production_rls_policies.sql）
-- ============================================
UNION ALL
SELECT 
  '7. RLS策略检查',
  'projects 表RLS策略',
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' 
        AND tablename = 'projects'
        AND policyname LIKE '%_policy'
        AND policyname != 'Allow all operations for development'
    )
    THEN '✅ 生产环境策略已配置'
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' 
        AND tablename = 'projects'
        AND policyname = 'Allow all operations for development'
    )
    THEN '⚠️ 使用开发环境策略'
    ELSE '❌ 未配置'
  END
UNION ALL
SELECT 
  '7. RLS策略检查',
  'framework_agreements 表RLS策略',
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' 
        AND tablename = 'framework_agreements'
        AND policyname LIKE '%_policy'
        AND policyname != 'Allow all operations for development'
    )
    THEN '✅ 生产环境策略已配置'
    WHEN EXISTS (
      SELECT 1 FROM pg_policies 
      WHERE schemaname = 'public' 
        AND tablename = 'framework_agreements'
        AND policyname = 'Allow all operations for development'
    )
    THEN '⚠️ 使用开发环境策略'
    ELSE '❌ 未配置'
  END

ORDER BY category, item;

