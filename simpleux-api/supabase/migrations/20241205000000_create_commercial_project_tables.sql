-- 商业项目相关表迁移文件
-- 创建时间: 2024-12-05
-- 说明: 创建项目管理和计件项目相关的所有表

-- 1. 创建计件项目表（framework_agreements）
-- 注意：此表需要在 projects 表之前创建，因为 projects 表有外键引用它
CREATE TABLE IF NOT EXISTS framework_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  manager_id UUID NOT NULL,
  manager_name TEXT NOT NULL,
  biz_manager TEXT,
  "group" TEXT NOT NULL,
  client_dept TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 创建计件项目表的索引
CREATE UNIQUE INDEX IF NOT EXISTS idx_framework_agreements_code ON framework_agreements(code);
CREATE INDEX IF NOT EXISTS idx_framework_agreements_group ON framework_agreements("group");
CREATE INDEX IF NOT EXISTS idx_framework_agreements_manager_id ON framework_agreements(manager_id);

-- 2. 创建项目主表（projects）
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT '待启动',
  is_pending_entry BOOLEAN NOT NULL DEFAULT false,
  manager_id UUID NOT NULL,
  manager_name TEXT NOT NULL,
  "group" TEXT NOT NULL,
  biz_manager TEXT,
  client_dept TEXT,
  plan_start_date DATE NOT NULL,
  plan_end_date DATE NOT NULL,
  actual_start_date DATE,
  actual_end_date DATE,
  progress INTEGER NOT NULL DEFAULT 0,
  contract_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
  demand_code TEXT,
  demand_name TEXT,
  framework_id UUID REFERENCES framework_agreements(id) ON DELETE SET NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT chk_projects_type CHECK (type IN ('项目制', '计件制', '离岸制', '驻场制')),
  CONSTRAINT chk_projects_status CHECK (status IN ('待启动', '进行中', '待确认', '已确认', '已归档')),
  CONSTRAINT chk_projects_progress CHECK (progress >= 0 AND progress <= 100)
);

-- 创建项目表的索引
CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_code ON projects(code);
CREATE INDEX IF NOT EXISTS idx_projects_type ON projects(type);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_group ON projects("group");
CREATE INDEX IF NOT EXISTS idx_projects_manager_id ON projects(manager_id);
CREATE INDEX IF NOT EXISTS idx_projects_framework_id ON projects(framework_id);

-- 3. 创建项目人力预算表（project_budgets_labor）
CREATE TABLE IF NOT EXISTS project_budgets_labor (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  employee_level TEXT NOT NULL,
  city_type TEXT NOT NULL,
  days NUMERIC(10,2) NOT NULL,
  unit_cost NUMERIC(10,2) NOT NULL,
  total_cost NUMERIC(15,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 创建项目人力预算表的索引
CREATE INDEX IF NOT EXISTS idx_project_budgets_labor_project_id ON project_budgets_labor(project_id);
CREATE INDEX IF NOT EXISTS idx_project_budgets_labor_employee_level ON project_budgets_labor(employee_level, city_type);

-- 4. 创建项目差旅预算表（project_budgets_travel）
CREATE TABLE IF NOT EXISTS project_budgets_travel (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  item TEXT NOT NULL,
  transport_big NUMERIC(10,2) NOT NULL DEFAULT 0,
  stay NUMERIC(10,2) NOT NULL DEFAULT 0,
  transport_small NUMERIC(10,2) NOT NULL DEFAULT 0,
  allowance NUMERIC(10,2) NOT NULL DEFAULT 0,
  "other" NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_cost NUMERIC(15,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 创建项目差旅预算表的索引
CREATE INDEX IF NOT EXISTS idx_project_budgets_travel_project_id ON project_budgets_travel(project_id);

-- 5. 创建项目外包预算表（project_budgets_outsource）
CREATE TABLE IF NOT EXISTS project_budgets_outsource (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  item TEXT NOT NULL,
  supplier_id UUID,
  supplier_name TEXT,
  amount NUMERIC(15,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 创建项目外包预算表的索引
CREATE INDEX IF NOT EXISTS idx_project_budgets_outsource_project_id ON project_budgets_outsource(project_id);
CREATE INDEX IF NOT EXISTS idx_project_budgets_outsource_supplier_id ON project_budgets_outsource(supplier_id);

-- 6. 创建项目人力支出表（project_expenses_labor）
CREATE TABLE IF NOT EXISTS project_expenses_labor (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL,
  employee_name TEXT NOT NULL,
  employee_level TEXT NOT NULL,
  work_date DATE NOT NULL,
  hours NUMERIC(10,2) NOT NULL,
  calculated_cost NUMERIC(15,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT uq_project_expenses_labor UNIQUE (project_id, employee_id, work_date)
);

-- 创建项目人力支出表的索引
CREATE INDEX IF NOT EXISTS idx_project_expenses_labor_project_id ON project_expenses_labor(project_id);
CREATE INDEX IF NOT EXISTS idx_project_expenses_labor_employee_id ON project_expenses_labor(employee_id);
CREATE INDEX IF NOT EXISTS idx_project_expenses_labor_work_date ON project_expenses_labor(work_date);

-- 7. 创建项目差旅支出表（project_expenses_travel）
CREATE TABLE IF NOT EXISTS project_expenses_travel (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  item TEXT NOT NULL,
  expense_date DATE NOT NULL,
  transport_big NUMERIC(10,2) NOT NULL DEFAULT 0,
  stay NUMERIC(10,2) NOT NULL DEFAULT 0,
  transport_small NUMERIC(10,2) NOT NULL DEFAULT 0,
  allowance NUMERIC(10,2) NOT NULL DEFAULT 0,
  "other" NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(15,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 创建项目差旅支出表的索引
CREATE INDEX IF NOT EXISTS idx_project_expenses_travel_project_id ON project_expenses_travel(project_id);
CREATE INDEX IF NOT EXISTS idx_project_expenses_travel_expense_date ON project_expenses_travel(expense_date);

-- 8. 创建项目外包支出表（project_expenses_outsource）
CREATE TABLE IF NOT EXISTS project_expenses_outsource (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  item TEXT NOT NULL,
  supplier_id UUID,
  supplier_name TEXT,
  amount NUMERIC(15,2) NOT NULL,
  expense_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 创建项目外包支出表的索引
CREATE INDEX IF NOT EXISTS idx_project_expenses_outsource_project_id ON project_expenses_outsource(project_id);
CREATE INDEX IF NOT EXISTS idx_project_expenses_outsource_supplier_id ON project_expenses_outsource(supplier_id);
CREATE INDEX IF NOT EXISTS idx_project_expenses_outsource_expense_date ON project_expenses_outsource(expense_date);

-- 9. 创建项目变更记录表（project_changes）
CREATE TABLE IF NOT EXISTS project_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  change_type TEXT NOT NULL,
  change_date DATE NOT NULL,
  contract_amount NUMERIC(15,2),
  cost_budget NUMERIC(15,2),
  labor_budget_hours NUMERIC(10,2),
  travel_budget NUMERIC(15,2),
  outsource_budget NUMERIC(15,2),
  description TEXT NOT NULL,
  attachment_url TEXT,
  approval_id UUID,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT chk_project_changes_type CHECK (change_type IN ('project', 'demand'))
);

-- 创建项目变更记录表的索引
CREATE INDEX IF NOT EXISTS idx_project_changes_project_id ON project_changes(project_id);
CREATE INDEX IF NOT EXISTS idx_project_changes_change_date ON project_changes(change_date);
CREATE INDEX IF NOT EXISTS idx_project_changes_approval_id ON project_changes(approval_id);

-- 10. 创建触发器函数：自动更新 updated_at 字段
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为所有表创建 updated_at 触发器
CREATE TRIGGER update_framework_agreements_updated_at
  BEFORE UPDATE ON framework_agreements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_budgets_labor_updated_at
  BEFORE UPDATE ON project_budgets_labor
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_budgets_travel_updated_at
  BEFORE UPDATE ON project_budgets_travel
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_budgets_outsource_updated_at
  BEFORE UPDATE ON project_budgets_outsource
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_expenses_labor_updated_at
  BEFORE UPDATE ON project_expenses_labor
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_expenses_travel_updated_at
  BEFORE UPDATE ON project_expenses_travel
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_project_expenses_outsource_updated_at
  BEFORE UPDATE ON project_expenses_outsource
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 11. 创建触发器函数：自动计算总价
-- 项目人力预算表：total_cost = days * unit_cost
CREATE OR REPLACE FUNCTION calculate_labor_budget_total()
RETURNS TRIGGER AS $$
BEGIN
  NEW.total_cost = NEW.days * NEW.unit_cost;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_project_budgets_labor_total
  BEFORE INSERT OR UPDATE ON project_budgets_labor
  FOR EACH ROW
  EXECUTE FUNCTION calculate_labor_budget_total();

-- 项目差旅预算表：total_cost = 各项费用之和
CREATE OR REPLACE FUNCTION calculate_travel_budget_total()
RETURNS TRIGGER AS $$
BEGIN
  NEW.total_cost = COALESCE(NEW.transport_big, 0) + 
                   COALESCE(NEW.stay, 0) + 
                   COALESCE(NEW.transport_small, 0) + 
                   COALESCE(NEW.allowance, 0) + 
                   COALESCE(NEW."other", 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_project_budgets_travel_total
  BEFORE INSERT OR UPDATE ON project_budgets_travel
  FOR EACH ROW
  EXECUTE FUNCTION calculate_travel_budget_total();

-- 项目差旅支出表：total_amount = 各项费用之和
CREATE OR REPLACE FUNCTION calculate_travel_expense_total()
RETURNS TRIGGER AS $$
BEGIN
  NEW.total_amount = COALESCE(NEW.transport_big, 0) + 
                     COALESCE(NEW.stay, 0) + 
                     COALESCE(NEW.transport_small, 0) + 
                     COALESCE(NEW.allowance, 0) + 
                     COALESCE(NEW."other", 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_project_expenses_travel_total
  BEFORE INSERT OR UPDATE ON project_expenses_travel
  FOR EACH ROW
  EXECUTE FUNCTION calculate_travel_expense_total();

-- 注意：人力成本计算（calculated_cost）需要从成本标准表获取 daily_cost
-- 这个触发器需要在成本标准表创建后实现

-- 12. 启用 Row Level Security (RLS)
-- 注意：RLS 策略需要根据实际的权限系统进行配置
-- 这里先启用 RLS，具体的策略需要后续实现

ALTER TABLE framework_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_budgets_labor ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_budgets_travel ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_budgets_outsource ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_expenses_labor ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_expenses_travel ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_expenses_outsource ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_changes ENABLE ROW LEVEL SECURITY;

-- 临时策略：允许所有操作（开发环境）
-- 生产环境需要根据实际需求配置具体的 RLS 策略
CREATE POLICY "Allow all operations for development" ON framework_agreements
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for development" ON projects
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for development" ON project_budgets_labor
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for development" ON project_budgets_travel
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for development" ON project_budgets_outsource
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for development" ON project_expenses_labor
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for development" ON project_expenses_travel
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for development" ON project_expenses_outsource
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations for development" ON project_changes
  FOR ALL USING (true) WITH CHECK (true);

