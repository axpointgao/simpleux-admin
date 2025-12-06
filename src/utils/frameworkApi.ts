/**
 * 框架协议相关 API 调用（使用 Supabase 认证）
 */
import apiClient from './apiClient';
import type { FrameworkAgreement } from '@/types/framework';

const API_BASE = '/frameworks';

/**
 * 获取框架协议列表
 */
export async function getFrameworks(params?: {
  name?: string;
  managerId?: string;
  group?: string;
  current?: number;
  pageSize?: number;
}) {
  const queryParams = new URLSearchParams();

  if (params?.name) queryParams.append('name', params.name);
  if (params?.managerId) queryParams.append('managerId', params.managerId);
  if (params?.group) queryParams.append('group', params.group);
  if (params?.current) queryParams.append('current', params.current.toString());
  if (params?.pageSize)
    queryParams.append('pageSize', params.pageSize.toString());

  const queryString = queryParams.toString();
  const url = queryString ? `${API_BASE}?${queryString}` : API_BASE;

  const response = await apiClient.get(url);
  return response.data;
}

/**
 * 获取框架协议详情
 */
export async function getFrameworkById(id: string) {
  const response = await apiClient.get(`${API_BASE}/${id}`);
  return response.data;
}

/**
 * 创建框架协议
 */
export async function createFramework(data: {
  name: string;
  managerId: string;
  managerName: string;
  group: string;
  bizManager?: string;
  clientDept?: string;
}) {
  const response = await apiClient.post(API_BASE, data);
  return response.data;
}

/**
 * 更新框架协议
 */
export async function updateFramework(
  id: string,
  data: Partial<FrameworkAgreement>
) {
  const response = await apiClient.put(`${API_BASE}/${id}`, data);
  return response.data;
}

/**
 * 获取框架协议关联的项目
 */
export async function getFrameworkProjects(frameworkId: string) {
  const response = await apiClient.get(`${API_BASE}/${frameworkId}/projects`);
  return response.data;
}
