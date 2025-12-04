/**
 * 商业项目相关类型定义
 */

// 项目类型
export type ProjectType = '项目制' | '计件制' | '离岸制' | '驻场制';

// 项目状态（严格按照文档定义）
export type ProjectStatus =
  | '待启动'
  | '进行中'
  | '待确认'
  | '已确认'
  | '已归档';

// 商业项目（严格按照文档定义）
export interface Project {
  id: string; // uuid
  code: string; // 项目编号（PROJ-YYYY-XXX）
  name: string; // 项目名称
  type: ProjectType; // 项目类型（项目制/计件制/离岸制/驻场制）
  status: ProjectStatus; // 项目状态（待启动/进行中/待确认/已确认/已归档）
  isPendingEntry: boolean; // 待补录标记 对应数据库 is_pending_entry (boolean, NOT NULL, DEFAULT false)
  managerId: string; // 项目经理ID 对应数据库 manager_id (uuid, FK → profiles.id, NOT NULL)
  managerName: string; // 项目经理姓名 对应数据库 manager_name (text, NOT NULL)
  group: string; // 归属部门 对应数据库 group (text, NOT NULL)
  bizManager?: string; // 商务经理 对应数据库 biz_manager (text, NULL)
  clientDept?: string; // 客户部 对应数据库 client_dept (text, NULL)
  planStartDate: string; // 计划开始日期 对应数据库 plan_start_date (date, NOT NULL)
  planEndDate: string; // 计划结束日期 对应数据库 plan_end_date (date, NOT NULL)
  actualStartDate?: string; // 实际开始日期 对应数据库 actual_start_date (date, NULL)
  actualEndDate?: string; // 实际结束日期 对应数据库 actual_end_date (date, NULL)
  progress: number; // 项目进度（0-100）对应数据库 progress (integer, NOT NULL, DEFAULT 0)
  contractAmount: number; // 业绩金额 对应数据库 contract_amount (numeric(15,2), NOT NULL, DEFAULT 0)
  completedAmount?: number; // 完成金额（进度 × 业绩金额，项目制/计件制自动计算）- 计算字段，不在数据库表中
  acceptedAmount?: number; // 验收金额 - 计算字段，不在数据库表中
  demandCode?: string; // 需求编号 对应数据库 demand_code (text, NULL)
  demandName?: string; // 需求名称 对应数据库 demand_name (text, NULL)
  frameworkId?: string; // 框架协议ID 对应数据库 framework_id (uuid, FK → framework_agreements.id, NULL)
  frameworkName?: string; // 框架协议名称（主项目名称，计件制专用）
  // 预算和支出汇总（用于列表显示）
  laborBudgetTotal?: number; // 人力预算总额（元）
  laborExpenseTotal?: number; // 人力支出总额（元）
  travelBudgetTotal?: number; // 差旅预算总额（元）
  travelExpenseTotal?: number; // 差旅支出总额（元）
  outsourceBudgetTotal?: number; // 外包预算总额（元）
  outsourceExpenseTotal?: number; // 外包支出总额（元）
  estimatedProfitRate?: number; // 预估利润率（%）
  actualProfitRate?: number; // 实际利润率（%）
  createdBy: string; // 创建人ID 对应数据库 created_by (uuid, FK → profiles.id, NOT NULL)
  createdAt: string; // 创建时间 对应数据库 created_at (timestamp, NOT NULL, DEFAULT now())
  updatedAt: string; // 更新时间 对应数据库 updated_at (timestamp, NOT NULL, DEFAULT now())
  // 阶段信息（项目制/计件制）
  stages?: ProjectStage[]; // 阶段列表
}

// 项目阶段
export interface ProjectStage {
  id: string; // 阶段ID
  name: string; // 阶段名称
  percentage: number; // 占比（0-100）
  status: 'pending' | 'in_progress' | 'completed'; // 阶段状态
  completionPercentage: number; // 阶段完成百分比（0-100）
  completedAt?: string; // 完成时间
  completedBy?: string; // 完成人
  attachmentUrl?: string; // 完成附件URL
}

// 项目预算 - 人力
// 文档字段：employeeLevel、cityType、days、unitCost、amount
export interface ProjectBudgetLabor {
  id: string;
  projectId: string;
  employeeLevel: string; // 员工级别 (P0-P9, M0-M5) 对应数据库 employee_level，文档字段：employeeLevel
  cityType: 'Chengdu' | 'Hangzhou'; // 城市类型 对应数据库 city_type，文档字段：cityType
  days: number; // 人日数 对应数据库 days (numeric(10,2))，文档字段：days
  unitCost: number; // 单价（元/人日）对应数据库 unit_cost，文档字段：unitCost
  totalCost: number; // 总价（元）对应数据库 total_cost，文档字段：amount
  createdAt: string; // 创建时间
  updatedAt: string; // 更新时间
}

// 项目预算 - 差旅
// 文档字段：item、transportBig、stay、transportSmall、allowance、other、amount
export interface ProjectBudgetTravel {
  id: string;
  projectId: string;
  item: string; // 差旅事项 对应数据库 item，文档字段：item
  transportBig: number; // 大交通费用（元）对应数据库 transport_big，文档字段：transportBig
  stay: number; // 住宿费用（元）对应数据库 stay，文档字段：stay
  transportSmall: number; // 小交通费用（元）对应数据库 transport_small，文档字段：transportSmall
  allowance: number; // 补助费用（元）对应数据库 allowance，文档字段：allowance
  other: number; // 其他费用（元）对应数据库 other，文档字段：other
  totalCost: number; // 总价（元）对应数据库 total_cost，文档字段：amount
  createdAt: string; // 创建时间
  updatedAt: string; // 更新时间
}

// 项目预算 - 外包
// 文档字段：item、vendor、amount
export interface ProjectBudgetOutsource {
  id: string;
  projectId: string;
  item: string; // 外包事项 对应数据库 item，文档字段：item
  supplierId?: string; // 供应商ID 对应数据库 supplier_id (可为NULL)
  supplierName?: string; // 供应商名称 对应数据库 supplier_name (可为NULL)，文档字段：vendor
  amount: number; // 金额（元）对应数据库 amount，文档字段：amount
  createdAt: string; // 创建时间
  updatedAt: string; // 更新时间
}

// 项目支出 - 人力
// 文档字段：month、employeeName、employeeLevel、plannedHours、hours、amount
// 说明：month 用于统计展示（从 workDate 提取），plannedHours 为计划工时（可选），amount 即 calculatedCost
export interface ProjectExpenseLabor {
  id: string;
  projectId: string;
  employeeId: string; // 员工ID 对应数据库 employee_id
  employeeName: string; // 员工姓名 对应数据库 employee_name (NOT NULL)，文档字段：employeeName
  employeeLevel: string; // 员工级别 对应数据库 employee_level (NOT NULL)，文档字段：employeeLevel
  workDate: string; // 工作日期 (date) 对应数据库 work_date
  month?: string; // 统计月份 (YYYY-MM) 从 workDate 提取，用于统计展示，文档字段：month
  plannedHours?: number; // 计划工时（小时）文档字段：plannedHours（可选，用于对比）
  hours: number; // 实际工时（小时）对应数据库 hours (numeric(10,2))，文档字段：hours
  calculatedCost: number; // 计算成本（元）对应数据库 calculated_cost，文档字段：amount
  createdAt: string; // 创建时间
  updatedAt: string; // 更新时间
}

// 项目支出 - 差旅
// 文档字段：month、item、transportBig、stay、transportSmall、allowance、other、amount
// 说明：month 用于统计展示（从 expenseDate 提取），amount 即 totalAmount
export interface ProjectExpenseTravel {
  id: string;
  projectId: string;
  item: string; // 差旅事项 对应数据库 item，文档字段：item
  expenseDate: string; // 支出日期 (date) 对应数据库 expense_date
  month?: string; // 统计月份 (YYYY-MM) 从 expenseDate 提取，用于统计展示，文档字段：month
  transportBig: number; // 大交通费用（元）对应数据库 transport_big，文档字段：transportBig
  stay: number; // 住宿费用（元）对应数据库 stay，文档字段：stay
  transportSmall: number; // 小交通费用（元）对应数据库 transport_small，文档字段：transportSmall
  allowance: number; // 补助费用（元）对应数据库 allowance，文档字段：allowance
  other: number; // 其他费用（元）对应数据库 other，文档字段：other
  totalAmount: number; // 总金额（元）对应数据库 total_amount，文档字段：amount
  createdAt: string; // 创建时间
  updatedAt: string; // 更新时间
}

// 项目支出 - 外包
// 文档字段：month、item、vendor、amount
// 说明：month 用于统计展示（从 expenseDate 提取），vendor 即 supplierName
export interface ProjectExpenseOutsource {
  id: string;
  projectId: string;
  item: string; // 外包事项 对应数据库 item，文档字段：item
  supplierId?: string; // 供应商ID 对应数据库 supplier_id (可为NULL)
  supplierName?: string; // 供应商名称 对应数据库 supplier_name (可为NULL)，文档字段：vendor
  amount: number; // 金额（元）对应数据库 amount，文档字段：amount
  expenseDate: string; // 支出日期 (date) 对应数据库 expense_date
  month?: string; // 统计月份 (YYYY-MM) 从 expenseDate 提取，用于统计展示，文档字段：month
  createdAt: string; // 创建时间
  updatedAt: string; // 更新时间
}

// 项目变更记录
export interface ProjectChange {
  id: string;
  projectId: string;
  changeType: 'project' | 'demand'; // 变更类型 对应数据库 change_type (project/demand)
  changeDate: string; // 变更日期 (date) 对应数据库 change_date
  contractAmount?: number; // 变更后的业绩金额 对应数据库 contract_amount (可为NULL)
  costBudget?: number; // 变更后的成本预算 对应数据库 cost_budget (可为NULL)
  laborBudgetHours?: number; // 变更后的工时预算 对应数据库 labor_budget_hours (可为NULL)
  travelBudget?: number; // 变更后的差旅预算 对应数据库 travel_budget (可为NULL)
  outsourceBudget?: number; // 变更后的外包预算 对应数据库 outsource_budget (可为NULL)
  description: string; // 变更说明
  attachmentUrl?: string; // 变更附件URL 对应数据库 attachment_url (可为NULL)
  approvalId?: string; // 关联的审批ID 对应数据库 approval_id (可为NULL)
  createdBy: string; // 创建人ID 对应数据库 created_by
  createdAt: string; // 创建时间
}

// 项目查询参数
export interface ProjectQueryParams {
  type?: ProjectType[];
  status?: ProjectStatus[];
  group?: string[];
  clientDepartment?: string[];
  projectManager?: string[];
  name?: string; // 项目名称（模糊搜索）
  startDate?: string; // 创建时间开始
  endDate?: string; // 创建时间结束
  current?: number; // 当前页
  pageSize?: number; // 每页数量
}
