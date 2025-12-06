-- 为 framework_agreements 表添加 created_by 字段
-- 创建时间: 2024-12-06
-- 说明: framework_agreements 表缺少 created_by 字段，但 RLS 策略需要使用它
-- 注意: 此迁移文件需要在执行 RLS 策略之前执行

-- 添加 created_by 字段
ALTER TABLE framework_agreements
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- 为现有数据设置默认值（使用 manager_id 作为 created_by）
-- 注意：只更新那些 manager_id 在 profiles 表中存在的记录
-- 如果 manager_id 不在 profiles 表中，created_by 将保持为 NULL
UPDATE framework_agreements
SET created_by = manager_id
WHERE created_by IS NULL
  AND manager_id IN (SELECT id FROM profiles);

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_framework_agreements_created_by 
ON framework_agreements(created_by);

-- 添加注释
COMMENT ON COLUMN framework_agreements.created_by IS '创建人ID，用于权限控制和审计';

