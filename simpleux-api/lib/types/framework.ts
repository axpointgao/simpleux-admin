/**
 * 计件项目相关类型定义
 */

// 计件项目查询参数
export interface FrameworkQueryParams {
  current?: number;
  pageSize?: number;
  keyword?: string;
  manager?: string[];
  group?: string[];
  clientDept?: string[];
}

// 计件项目创建/更新输入
export interface FrameworkCreateInput {
  name: string;
  managerId: string;
  managerName: string;
  group: string;
  bizManager?: string;
  clientDept?: string;
}

// 计件项目数据（数据库返回）
export interface FrameworkAgreement {
  id: string;
  code: string;
  name: string;
  manager_id: string;
  manager_name: string;
  biz_manager?: string;
  group: string;
  client_dept?: string;
  created_at: string;
  updated_at: string;
}

