-- 删除成本标准测试数据
-- 在 Supabase Dashboard 的 SQL Editor 中执行

-- ============================================
-- 清理成本标准测试数据
-- ============================================

-- 删除所有成本标准数据
DELETE FROM cost_standards;

-- 显示清理结果
DO $$
DECLARE
  v_remaining_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_remaining_count FROM cost_standards;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '成本标准数据清理完成';
  RAISE NOTICE '========================================';
  RAISE NOTICE '剩余记录数: %', v_remaining_count;
  RAISE NOTICE '';
  
  IF v_remaining_count = 0 THEN
    RAISE NOTICE '✅ 所有成本标准数据已成功删除';
  ELSE
    RAISE NOTICE '⚠️  仍有 % 条记录未删除', v_remaining_count;
  END IF;
END $$;

