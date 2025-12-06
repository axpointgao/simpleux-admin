/**
 * 计件项目相关 API
 */
import apiClient from './config';
import { FrameworkAgreement } from '@/types/framework';

// 计件项目查询参数
export interface GetFrameworksParams {
  current?: number;
  pageSize?: number;
  keyword?: string;
  manager?: string[];
  group?: string[];
  clientDept?: string[];
}

// 计件项目查询结果
export interface GetFrameworksResult {
  data: FrameworkAgreement[];
  total: number;
}

// 计件项目创建/更新数据
export interface FrameworkCreateInput {
  name: string;
  managerId: string;
  managerName: string;
  group: string;
  bizManager?: string;
  clientDept?: string;
}

/**
 * 获取计件项目列表
 */
export async function getFrameworks(
  params: GetFrameworksParams = {}
): Promise<GetFrameworksResult> {
  const response = (await apiClient.get('/frameworks', {
    params,
  })) as unknown as {
    success: boolean;
    data: FrameworkAgreement[];
    total: number;
  };
  return {
    data: response.data || [],
    total: response.total || 0,
  };
}

/**
 * 获取计件项目详情
 */
export async function getFrameworkById(
  id: string
): Promise<FrameworkAgreement | null> {
  const response = (await apiClient.get(`/frameworks/${id}`)) as unknown as {
    success: boolean;
    data: FrameworkAgreement;
  };
  return response.data || null;
}

/**
 * 创建计件项目
 */
export async function createFramework(
  data: FrameworkCreateInput
): Promise<FrameworkAgreement> {
  const response = (await apiClient.post('/frameworks', data)) as unknown as {
    success: boolean;
    data: FrameworkAgreement;
  };
  return response.data;
}

/**
 * 更新计件项目
 */
export async function updateFramework(
  id: string,
  data: FrameworkCreateInput
): Promise<FrameworkAgreement> {
  const response = (await apiClient.put(
    `/frameworks/${id}`,
    data
  )) as unknown as {
    success: boolean;
    data: FrameworkAgreement;
  };
  return response.data;
}

/**
 * 删除计件项目
 */
export async function deleteFramework(id: string): Promise<void> {
  await apiClient.delete(`/frameworks/${id}`);
}

/**
 * 检查计件项目是否有关联的项目
 */
export async function checkFrameworkHasProjects(id: string): Promise<boolean> {
  const response = (await apiClient.get(
    `/frameworks/${id}/has-projects`
  )) as unknown as {
    success: boolean;
    hasProjects: boolean;
  };
  return response.hasProjects || false;
}
