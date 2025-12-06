-- 清理 cost_standards 表的旧 RLS 策略
-- 创建时间: 2024-12-06
-- 说明: 删除旧的开发环境策略，确保只使用生产环境的策略

-- 删除旧的开发环境策略（如果存在）
DROP POLICY IF EXISTS "Allow all operations for development" ON cost_standards;

-- 确保使用正确的策略
-- 如果策略不存在，创建它们
DO $$
BEGIN
  -- 检查并创建 SELECT 策略
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'cost_standards' 
    AND policyname = 'cost_standards_select_policy'
  ) THEN
    CREATE POLICY "cost_standards_select_policy" ON cost_standards
      FOR SELECT
      USING (true);
  END IF;

  -- 检查并创建 INSERT 策略
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'cost_standards' 
    AND policyname = 'cost_standards_insert_policy'
  ) THEN
    CREATE POLICY "cost_standards_insert_policy" ON cost_standards
      FOR INSERT
      WITH CHECK (
        is_system_admin(auth.uid())
        AND created_by = auth.uid()
      );
  END IF;

  -- 检查并创建 UPDATE 策略
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'cost_standards' 
    AND policyname = 'cost_standards_update_policy'
  ) THEN
    CREATE POLICY "cost_standards_update_policy" ON cost_standards
      FOR UPDATE
      USING (is_system_admin(auth.uid()))
      WITH CHECK (is_system_admin(auth.uid()));
  END IF;

  -- 检查并创建 DELETE 策略
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'cost_standards' 
    AND policyname = 'cost_standards_delete_policy'
  ) THEN
    CREATE POLICY "cost_standards_delete_policy" ON cost_standards
      FOR DELETE
      USING (is_system_admin(auth.uid()));
  END IF;
END $$;

