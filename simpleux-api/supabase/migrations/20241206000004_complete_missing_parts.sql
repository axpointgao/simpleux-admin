-- 补全缺失的迁移部分
-- 创建时间: 2024-12-06
-- 说明: 补全项目汇总触发器中缺失的 framework_name 同步功能
-- 注意: 如果这些函数和触发器已存在，此脚本会安全地替换它们

-- ============================================
-- 1. 触发器：同步 framework_name
-- ============================================

CREATE OR REPLACE FUNCTION sync_framework_name()
RETURNS TRIGGER AS $$
BEGIN
  -- 当 framework_agreements.name 更新时，同步更新所有关联项目的 framework_name
  UPDATE projects
  SET framework_name = NEW.name,
      updated_at = now()
  WHERE framework_id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 如果触发器已存在，先删除再创建
DROP TRIGGER IF EXISTS trigger_sync_framework_name ON framework_agreements;

CREATE TRIGGER trigger_sync_framework_name
  AFTER UPDATE OF name ON framework_agreements
  FOR EACH ROW
  EXECUTE FUNCTION sync_framework_name();

-- ============================================
-- 2. 触发器：创建项目时初始化 framework_name
-- ============================================

CREATE OR REPLACE FUNCTION init_framework_name()
RETURNS TRIGGER AS $$
BEGIN
  -- 如果项目有关联的计件项目，初始化 framework_name
  IF NEW.framework_id IS NOT NULL THEN
    SELECT name INTO NEW.framework_name
    FROM framework_agreements
    WHERE id = NEW.framework_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 如果触发器已存在，先删除再创建
DROP TRIGGER IF EXISTS trigger_init_framework_name ON projects;

CREATE TRIGGER trigger_init_framework_name
  BEFORE INSERT OR UPDATE OF framework_id ON projects
  FOR EACH ROW
  EXECUTE FUNCTION init_framework_name();

-- ============================================
-- 3. 为现有项目初始化 framework_name（一次性执行）
-- ============================================

-- 为所有现有项目初始化 framework_name
UPDATE projects
SET framework_name = fa.name,
    updated_at = now()
FROM framework_agreements fa
WHERE projects.framework_id = fa.id
  AND (projects.framework_name IS NULL OR projects.framework_name != fa.name);

