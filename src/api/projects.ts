/**
 * 项目相关 API
 */
import apiClient from './config';
import { Project, ProjectType, ProjectStatus } from '@/types';

// 项目查询参数
export interface GetProjectsParams {
  name?: string;
  type?: ProjectType[];
  status?: ProjectStatus[];
  group?: string[];
  showArchived?: boolean;
  current?: number;
  pageSize?: number;
}

// 项目查询结果
export interface GetProjectsResult {
  data: Project[];
  total: number;
}

// 项目创建/更新数据
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
  // 计件制特殊字段
  demandCode?: string;
  demandName?: string;
  frameworkId?: string;
  // 预算
  laborBudget?: any[];
  travelBudget?: any[];
  outsourceBudget?: any[];
  // 阶段
  stages?: any[];
}

/**
 * 获取项目列表
 */
export async function getProjects(
  params: GetProjectsParams = {}
): Promise<GetProjectsResult> {
  const response = (await apiClient.get('/projects', {
    params,
  })) as unknown as {
    success: boolean;
    data: Project[];
    total: number;
  };
  return {
    data: response.data || [],
    total: response.total || 0,
  };
}

/**
 * 获取项目详情
 */
export async function getProjectById(id: string): Promise<Project | null> {
  const response = (await apiClient.get(`/projects/${id}`)) as unknown as {
    success: boolean;
    data: Project;
  };
  return response.data || null;
}

/**
 * 创建项目
 */
export async function createProject(
  data: ProjectCreateInput
): Promise<Project> {
  const response = (await apiClient.post('/projects', data)) as unknown as {
    success: boolean;
    data: Project;
  };
  return response.data;
}

/**
 * 更新项目（通过变更流程）
 */
export async function updateProject(
  id: string,
  data: ProjectCreateInput
): Promise<Project> {
  const response = (await apiClient.put(
    `/projects/${id}`,
    data
  )) as unknown as {
    success: boolean;
    data: Project;
  };
  return response.data;
}

/**
 * 获取项目预算
 */
export async function getProjectBudgets(id: string): Promise<any> {
  const response = (await apiClient.get(
    `/projects/${id}/budgets`
  )) as unknown as {
    success: boolean;
    data: any;
  };
  return response.data;
}

/**
 * 获取项目支出
 */
export async function getProjectExpenses(id: string): Promise<any> {
  const response = (await apiClient.get(
    `/projects/${id}/expenses`
  )) as unknown as {
    success: boolean;
    data: any;
  };
  return response.data;
}

/**
 * 获取项目变更记录
 */
export async function getProjectChanges(id: string): Promise<any[]> {
  const response = (await apiClient.get(
    `/projects/${id}/changes`
  )) as unknown as {
    success: boolean;
    data: any[];
  };
  return response.data || [];
}

/**
 * 提交项目变更申请
 */
export async function submitProjectChange(
  id: string,
  data: {
    changeType?: string;
    description: string;
    attachmentUrl: string;
    [key: string]: any;
  }
): Promise<any> {
  const response = (await apiClient.post(
    `/projects/${id}/changes`,
    data
  )) as unknown as {
    success: boolean;
    data: any;
  };
  return response.data;
}

/**
 * 提交项目补录申请
 */
export async function submitPendingEntry(
  id: string,
  data: {
    contractAmount: number;
    laborBudget?: any[];
    travelBudget?: any[];
    outsourceBudget?: any[];
  }
): Promise<any> {
  const response = (await apiClient.post(
    `/projects/${id}/pending-entry`,
    data
  )) as unknown as {
    success: boolean;
    data: any;
  };
  return response.data;
}

/**
 * 提交设计确认申请
 */
export async function submitDesignConfirm(
  id: string,
  data: {
    description?: string;
    attachmentUrl: string;
  }
): Promise<any> {
  const response = (await apiClient.post(
    `/projects/${id}/design-confirm`,
    data
  )) as unknown as {
    success: boolean;
    data: any;
  };
  return response.data;
}

/**
 * 提交项目归档申请
 */
export async function submitArchive(
  id: string,
  data: {
    description?: string;
  }
): Promise<any> {
  const response = (await apiClient.post(
    `/projects/${id}/archive`,
    data
  )) as unknown as {
    success: boolean;
    data: any;
  };
  return response.data;
}

/**
 * 取消项目归档
 */
export async function cancelArchive(id: string): Promise<any> {
  const response = (await apiClient.post(
    `/projects/${id}/cancel-archive`
  )) as unknown as {
    success: boolean;
    data: any;
  };
  return response.data;
}

/**
 * 更新阶段进度
 */
export async function updateStageProgress(
  id: string,
  data: {
    stages: any[];
  }
): Promise<any> {
  const response = (await apiClient.put(
    `/projects/${id}/stages`,
    data
  )) as unknown as {
    success: boolean;
    data: any;
  };
  return response.data;
}
