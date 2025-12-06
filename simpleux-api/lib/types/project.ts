/**
 * 项目相关类型定义
 */

// 项目类型
export type ProjectType = '项目制' | '计件制' | '离岸制' | '驻场制';

// 项目状态
export type ProjectStatus =
  | '待启动'
  | '进行中'
  | '待确认'
  | '已确认'
  | '已归档';

// 项目查询参数
export interface ProjectQueryParams {
  name?: string;
  type?: ProjectType[];
  status?: ProjectStatus[];
  group?: string[];
  showArchived?: boolean;
  current?: number;
  pageSize?: number;
}

// 项目创建/更新输入
export interface ProjectCreateInput {
  name: string;
  type: ProjectType;
  managerId: string;
  managerName: string;
  group: string;
  bizManager?: string;
  clientDept?: string;
  planStartDate?: string;
  planEndDate?: string;
  contractAmount?: number;
  demandCode?: string;
  demandName?: string;
  frameworkId?: string;
  laborBudget?: any[];
  travelBudget?: any[];
  outsourceBudget?: any[];
  stages?: any[];
}

// 项目数据（数据库返回）
export interface Project {
  id: string;
  code: string;
  name: string;
  type: ProjectType;
  status: ProjectStatus;
  is_pending_entry: boolean;
  manager_id: string;
  manager_name: string;
  group: string;
  biz_manager?: string;
  client_dept?: string;
  plan_start_date: string;
  plan_end_date: string;
  actual_start_date?: string;
  actual_end_date?: string;
  progress: number;
  contract_amount: number;
  completed_amount?: number; // 已完成金额
  accepted_amount?: number; // 已确认金额
  demand_code?: string;
  demand_name?: string;
  framework_id?: string;
  framework_name?: string; // 计件项目名称
  labor_budget_total?: number; // 人力预算总额
  labor_expense_total?: number; // 人力支出总额
  travel_budget_total?: number; // 差旅预算总额
  travel_expense_total?: number; // 差旅支出总额
  outsource_budget_total?: number; // 外包预算总额
  outsource_expense_total?: number; // 外包支出总额
  estimated_profit_rate?: number; // 预计利润率
  actual_profit_rate?: number; // 实际利润率
  created_by: string;
  created_at: string;
  updated_at: string;
}


