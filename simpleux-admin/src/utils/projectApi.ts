/**
 * 项目相关 API 调用（使用 Supabase 认证）
 */
import apiClient from './apiClient';
import type { Project, ProjectQueryParams } from '@/types/project';

const API_BASE = '/projects';

/**
 * 获取项目列表
 */
export async function getProjects(params?: ProjectQueryParams) {
  const queryParams = new URLSearchParams();

  if (params?.name) queryParams.append('name', params.name);
  if (params?.type?.length) queryParams.append('type', params.type.join(','));
  if (params?.status?.length)
    queryParams.append('status', params.status.join(','));
  if (params?.group?.length)
    queryParams.append('group', params.group.join(','));
  if (params?.current) queryParams.append('current', params.current.toString());
  if (params?.pageSize)
    queryParams.append('pageSize', params.pageSize.toString());

  const queryString = queryParams.toString();
  const url = queryString ? `${API_BASE}?${queryString}` : API_BASE;

  const response = await apiClient.get(url);
  return response.data;
}

/**
 * 获取项目详情
 */
export async function getProjectById(id: string) {
  const response = await apiClient.get(`${API_BASE}/${id}`);
  return response.data;
}

/**
 * 创建项目
 */
export async function createProject(data: any) {
  const response = await apiClient.post(API_BASE, data);
  return response.data;
}

/**
 * 获取项目预算
 */
export async function getProjectBudgets(projectId: string) {
  const response = await apiClient.get(`${API_BASE}/${projectId}/budgets`);
  return response.data;
}

/**
 * 获取项目支出
 */
export async function getProjectExpenses(projectId: string) {
  const response = await apiClient.get(`${API_BASE}/${projectId}/expenses`);
  return response.data;
}

/**
 * 获取项目阶段
 */
export async function getProjectStages(projectId: string) {
  const response = await apiClient.get(`${API_BASE}/${projectId}/stages`);
  return response.data;
}

/**
 * 更新阶段进度
 */
export async function updateStageProgress(
  projectId: string,
  stageId: string,
  data: {
    completionPercentage?: number;
    status?: string;
    attachmentUrl?: string;
  }
) {
  const response = await apiClient.put(
    `${API_BASE}/${projectId}/stages/${stageId}`,
    data
  );
  return response.data;
}

/**
 * 创建项目变更申请
 */
export async function createProjectChange(projectId: string, data: any) {
  const response = await apiClient.post(
    `${API_BASE}/${projectId}/changes`,
    data
  );
  return response.data;
}

/**
 * 获取项目变更记录
 */
export async function getProjectChanges(projectId: string) {
  const response = await apiClient.get(`${API_BASE}/${projectId}/changes`);
  return response.data;
}

/**
 * 提交补录申请
 */
export async function submitPendingEntry(projectId: string, data: any) {
  const response = await apiClient.post(
    `${API_BASE}/${projectId}/pending-entry`,
    data
  );
  return response.data;
}

/**
 * 发起设计确认
 */
export async function submitDesignConfirm(projectId: string, data: any) {
  const response = await apiClient.post(
    `${API_BASE}/${projectId}/design-confirm`,
    data
  );
  return response.data;
}

/**
 * 发起归档
 */
export async function archiveProject(projectId: string, data?: any) {
  const response = await apiClient.post(
    `${API_BASE}/${projectId}/archive`,
    data || {}
  );
  return response.data;
}

/**
 * 取消归档
 */
export async function cancelArchive(projectId: string) {
  const response = await apiClient.delete(`${API_BASE}/${projectId}/archive`);
  return response.data;
}

/**
 * 创建差旅支出
 */
export async function createTravelExpense(projectId: string, data: any) {
  const response = await apiClient.post(
    `${API_BASE}/${projectId}/expenses/travel`,
    data
  );
  return response.data;
}

/**
 * 更新差旅支出
 */
export async function updateTravelExpense(
  projectId: string,
  expenseId: string,
  data: any
) {
  const response = await apiClient.put(
    `${API_BASE}/${projectId}/expenses/travel/${expenseId}`,
    data
  );
  return response.data;
}

/**
 * 删除差旅支出
 */
export async function deleteTravelExpense(
  projectId: string,
  expenseId: string
) {
  const response = await apiClient.delete(
    `${API_BASE}/${projectId}/expenses/travel/${expenseId}`
  );
  return response.data;
}

/**
 * 创建外包支出
 */
export async function createOutsourceExpense(projectId: string, data: any) {
  const response = await apiClient.post(
    `${API_BASE}/${projectId}/expenses/outsource`,
    data
  );
  return response.data;
}

/**
 * 更新外包支出
 */
export async function updateOutsourceExpense(
  projectId: string,
  expenseId: string,
  data: any
) {
  const response = await apiClient.put(
    `${API_BASE}/${projectId}/expenses/outsource/${expenseId}`,
    data
  );
  return response.data;
}

/**
 * 删除外包支出
 */
export async function deleteOutsourceExpense(
  projectId: string,
  expenseId: string
) {
  const response = await apiClient.delete(
    `${API_BASE}/${projectId}/expenses/outsource/${expenseId}`
  );
  return response.data;
}
