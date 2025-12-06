-- 验证迁移执行结果
-- 创建时间: 2024-12-06
-- 说明: 检查城市类型表创建和成本标准表简化是否成功

DO $$
DECLARE
  v_count INTEGER;
  v_column_count INTEGER;
  v_func_exists BOOLEAN;
  v_view_exists BOOLEAN;
  v_city_name TEXT;
  v_info TEXT;
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '迁移执行结果验证';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  -- ============================================
  -- 1. 检查城市类型表
  -- ============================================
  RAISE NOTICE '=== 1. 城市类型表检查 ===';
  
  SELECT COUNT(*) INTO v_count 
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
    AND table_name = 'city_types';
  
  IF v_count > 0 THEN
    RAISE NOTICE '✅ city_types 表已创建';
    
    -- 检查城市类型数据
    SELECT COUNT(*) INTO v_count FROM city_types;
    RAISE NOTICE '   城市类型数量: %', v_count;
    
    -- 显示城市类型列表
    RAISE NOTICE '   城市类型列表:';
    FOR v_city_name IN SELECT name FROM city_types ORDER BY sort_order LOOP
      RAISE NOTICE '     - %', v_city_name;
    END LOOP;
  ELSE
    RAISE NOTICE '❌ city_types 表未创建';
  END IF;
  
  RAISE NOTICE '';

  -- ============================================
  -- 2. 检查成本标准表结构
  -- ============================================
  RAISE NOTICE '=== 2. 成本标准表结构检查 ===';
  
  -- 检查 effective_to 字段是否已删除
  SELECT COUNT(*) INTO v_count
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'cost_standards'
    AND column_name = 'effective_to';
  
  IF v_count = 0 THEN
    RAISE NOTICE '✅ effective_to 字段已删除';
  ELSE
    RAISE NOTICE '❌ effective_to 字段仍然存在';
  END IF;
  
  -- 检查 is_active 字段是否已删除
  SELECT COUNT(*) INTO v_count
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'cost_standards'
    AND column_name = 'is_active';
  
  IF v_count = 0 THEN
    RAISE NOTICE '✅ is_active 字段已删除';
  ELSE
    RAISE NOTICE '❌ is_active 字段仍然存在';
  END IF;
  
  -- 检查 effective_from 字段是否存在
  SELECT COUNT(*) INTO v_count
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'cost_standards'
    AND column_name = 'effective_from';
  
  IF v_count > 0 THEN
    RAISE NOTICE '✅ effective_from 字段存在';
  ELSE
    RAISE NOTICE '❌ effective_from 字段不存在';
  END IF;
  
  RAISE NOTICE '';

  -- ============================================
  -- 3. 检查 get_cost_standard 函数
  -- ============================================
  RAISE NOTICE '=== 3. get_cost_standard 函数检查 ===';
  
  SELECT EXISTS (
    SELECT 1 
    FROM pg_proc 
    WHERE proname = 'get_cost_standard'
  ) INTO v_func_exists;
  
  IF v_func_exists THEN
    RAISE NOTICE '✅ get_cost_standard 函数存在';
    
    -- 检查函数是否使用了新的逻辑（不包含 is_active 和 effective_to）
    SELECT COUNT(*) INTO v_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
      AND p.proname = 'get_cost_standard'
      AND p.prosrc NOT LIKE '%is_active%'
      AND p.prosrc NOT LIKE '%effective_to%';
    
    IF v_count > 0 THEN
      RAISE NOTICE '✅ 函数已更新（不包含 is_active 和 effective_to）';
    ELSE
      RAISE NOTICE '⚠️  函数可能仍包含旧逻辑';
    END IF;
  ELSE
    RAISE NOTICE '❌ get_cost_standard 函数不存在';
  END IF;
  
  RAISE NOTICE '';

  -- ============================================
  -- 4. 检查 active_cost_standards_view 视图
  -- ============================================
  RAISE NOTICE '=== 4. active_cost_standards_view 视图检查 ===';
  
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.views 
    WHERE table_schema = 'public' 
      AND table_name = 'active_cost_standards_view'
  ) INTO v_view_exists;
  
  IF v_view_exists THEN
    RAISE NOTICE '✅ active_cost_standards_view 视图已重新创建';
    
    -- 检查视图定义是否包含 status 字段
    SELECT COUNT(*) INTO v_count
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'active_cost_standards_view'
      AND column_name = 'status';
    
    IF v_count > 0 THEN
      RAISE NOTICE '✅ 视图包含 status 字段';
    ELSE
      RAISE NOTICE '⚠️  视图不包含 status 字段';
    END IF;
  ELSE
    RAISE NOTICE '❌ active_cost_standards_view 视图不存在';
  END IF;
  
  RAISE NOTICE '';

  -- ============================================
  -- 5. 检查成本标准数据
  -- ============================================
  RAISE NOTICE '=== 5. 成本标准数据检查 ===';
  
  SELECT COUNT(*) INTO v_count FROM cost_standards;
  RAISE NOTICE '   成本标准记录数: %', v_count;
  
  IF v_count > 0 THEN
    RAISE NOTICE '   示例数据（前3条）:';
    FOR v_info IN 
      SELECT 
        employee_level || ' - ' || city_type || ' - ' || daily_cost || '元' as info
      FROM cost_standards 
      ORDER BY created_at DESC 
      LIMIT 3
    LOOP
      RAISE NOTICE '     - %', v_info;
    END LOOP;
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '验证完成';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
END $$;

