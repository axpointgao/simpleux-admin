/**
 * 成本标准 API
 */
import apiClient from './config';

export interface CostStandard {
  id: string;
  employee_level: string;
  city_type: string;
  daily_cost: number;
  effective_from: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  // 计算字段：状态（生效/失效/未生效）
  status?: '生效' | '失效' | '未生效';
}

export interface CostStandardCreateInput {
  employee_level: string;
  city_type: string;
  daily_cost: number;
  effective_from: string;
}

export interface CostStandardUpdateInput {
  employee_level?: string;
  city_type?: string;
  daily_cost?: number;
  effective_from?: string;
}

export interface CostStandardQueryParams {
  employee_level?: string[];
  city_type?: string[];
  current?: number;
  pageSize?: number;
}

export interface GetCostStandardsResult {
  data: CostStandard[];
  total: number;
}

/**
 * 获取成本标准列表
 */
export async function getCostStandards(
  params?: CostStandardQueryParams
): Promise<GetCostStandardsResult> {
  const searchParams = new URLSearchParams();

  if (params?.employee_level) {
    searchParams.append('employee_level', params.employee_level.join(','));
  }
  if (params?.city_type) {
    searchParams.append('city_type', params.city_type.join(','));
  }
  if (params?.current) {
    searchParams.append('current', params.current.toString());
  }
  if (params?.pageSize) {
    searchParams.append('pageSize', params.pageSize.toString());
  }

  // 注意：响应拦截器已经返回了 data，所以 response 就是后端返回的数据对象
  // 后端返回格式：{ success: true, data: [...], total: 3 }
  // 所以 response 的类型应该是后端返回的数据对象类型，而不是 AxiosResponse
  const response = (await apiClient.get<{
    success: boolean;
    data: CostStandard[];
    total: number;
  }>(`/cost-standards?${searchParams.toString()}`)) as unknown as {
    success: boolean;
    data: CostStandard[];
    total: number;
  };

  // 调试：打印响应数据
  if (process.env.NODE_ENV === 'development') {
    console.log('getCostStandards API - 原始响应:', response);
    console.log('getCostStandards API - response.data:', response.data);
    console.log('getCostStandards API - response.total:', response.total);
  }

  return {
    data: response.data || [],
    total: response.total || 0,
  };
}

/**
 * 根据ID获取成本标准详情
 */
export async function getCostStandardById(id: string): Promise<CostStandard> {
  const response = await apiClient.get<{
    success: boolean;
    data: CostStandard;
  }>(`/cost-standards/${id}`);

  return response.data.data;
}

/**
 * 创建成本标准
 */
export async function createCostStandard(
  input: CostStandardCreateInput
): Promise<CostStandard> {
  const response = await apiClient.post<{
    success: boolean;
    data: CostStandard;
  }>('/cost-standards', input);

  return response.data.data;
}

/**
 * 更新成本标准
 */
export async function updateCostStandard(
  id: string,
  input: CostStandardUpdateInput
): Promise<CostStandard> {
  const response = await apiClient.put<{
    success: boolean;
    data: CostStandard;
  }>(`/cost-standards/${id}`, input);

  return response.data.data;
}

/**
 * 删除成本标准
 */
export async function deleteCostStandard(id: string): Promise<void> {
  await apiClient.delete(`/cost-standards/${id}`);
}

/**
 * 获取所有城市类型列表
 */
export async function getCityTypes(): Promise<string[]> {
  const response = (await apiClient.get<{
    success: boolean;
    data: string[];
  }>('/cost-standards/city-types')) as unknown as {
    success: boolean;
    data: string[];
  };

  // 调试：打印响应数据
  if (process.env.NODE_ENV === 'development') {
    console.log('getCityTypes API - 原始响应:', response);
    console.log('getCityTypes API - response.data:', response.data);
  }

  return response.data || [];
}

/**
 * 创建城市类型
 */
export async function createCityType(
  name: string,
  displayName?: string
): Promise<void> {
  const response = await apiClient.post<{
    success: boolean;
    data: any;
  }>('/city-types', {
    name,
    display_name: displayName || name,
  });

  return response.data.data;
}
