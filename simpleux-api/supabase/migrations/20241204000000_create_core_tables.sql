-- 核心业务表迁移文件
-- 创建时间: 2024-12-04
-- 说明: 创建用户、部门、角色、权限等核心表
-- 注意: 此迁移文件需要在所有业务表之前执行

-- 1. 创建用户扩展表（profiles）
-- 扩展 Supabase Auth 的用户表，存储用户的业务信息
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  dingtalk_user_id TEXT UNIQUE,
  name TEXT NOT NULL,
  employee_level TEXT NOT NULL,
  position TEXT,
  city_type TEXT,
  department TEXT,
  status TEXT NOT NULL DEFAULT '在职',
  daily_price NUMERIC(10,2),
  daily_cost NUMERIC(10,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT chk_profiles_employee_level CHECK (
    employee_level IN ('P0', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'P9', 'M0', 'M1', 'M2', 'M3', 'M4', 'M5')
  ),
  CONSTRAINT chk_profiles_city_type CHECK (city_type IN ('Chengdu', 'Hangzhou')),
  CONSTRAINT chk_profiles_status CHECK (status IN ('在职', '离职'))
);

-- 创建 profiles 表的索引
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_dingtalk_user_id ON profiles(dingtalk_user_id) WHERE dingtalk_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_department ON profiles(department);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_employee_level ON profiles(employee_level);
CREATE INDEX IF NOT EXISTS idx_profiles_city_type ON profiles(city_type);
CREATE INDEX IF NOT EXISTS idx_profiles_level_city ON profiles(employee_level, city_type);

-- 2. 创建部门表（departments）
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dingtalk_dept_id TEXT UNIQUE,
  name TEXT NOT NULL UNIQUE,
  parent_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  code TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 创建 departments 表的索引
CREATE UNIQUE INDEX IF NOT EXISTS idx_departments_dingtalk_dept_id ON departments(dingtalk_dept_id) WHERE dingtalk_dept_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_departments_name ON departments(name);
CREATE INDEX IF NOT EXISTS idx_departments_parent_id ON departments(parent_id);

-- 3. 创建角色表（roles）
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 创建 roles 表的索引
CREATE UNIQUE INDEX IF NOT EXISTS idx_roles_code ON roles(code);

-- 插入系统角色
INSERT INTO roles (code, name, description, is_system) VALUES
  ('admin', '系统管理员', '拥有系统所有权限，负责系统配置和维护', true),
  ('director', '总监', '可以查看和管理所有部门的数据，审批所有部门的申请。包括设计总监、总经理等', true),
  ('department_head', '部门主管', '可以查看和管理本部门的数据，审批本部门的申请。包括体验组主管、驻场服务部主管、核心业务拓展部主管等', true),
  ('employee', '员工', '可以查看分配给自己的任务，录入实际工时，查看个人业绩和工时统计。任何人都可能是某个项目的项目经理，项目经理权限通过项目的 manager_id 字段判断', true)
ON CONFLICT (code) DO NOTHING;

-- 4. 创建用户角色关联表（user_roles）
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, role_id)
);

-- 创建 user_roles 表的索引
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);

-- 5. 创建 updated_at 触发器函数（如果不存在）
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. 为所有表创建 updated_at 触发器
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_departments_updated_at
  BEFORE UPDATE ON departments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roles_updated_at
  BEFORE UPDATE ON roles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 7. 启用 RLS（Row Level Security）
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- 8. 创建开发环境的临时策略（允许所有操作）
-- 注意：生产环境需要替换为更严格的策略
CREATE POLICY "Allow all operations for development" ON profiles
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations for development" ON departments
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations for development" ON roles
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations for development" ON user_roles
  FOR ALL
  USING (true)
  WITH CHECK (true);

