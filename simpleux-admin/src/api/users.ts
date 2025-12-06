/**
 * 用户管理相关 API
 */
import apiClient from './config';

export interface User {
  id: string;
  dingtalk_user_id?: string;
  name: string;
  employee_level: string;
  position?: string;
  city_type?: string;
  department?: string;
  status: string;
  daily_price?: number;
  daily_cost?: number;
  created_at: string;
  updated_at: string;
  roles: Array<{
    id: string;
    code: string;
    name: string;
  }>;
}

export interface GetUsersParams {
  current?: number;
  pageSize?: number;
  keyword?: string;
  department?: string[];
  employee_level?: string[];
  city_type?: string[];
  status?: string[];
  role?: string[];
}

export interface GetUsersResult {
  data: User[];
  total: number;
}

export interface UserUpdateInput {
  employee_level?: string;
  city_type?: string;
  role_ids?: string[];
}

export interface BatchUpdateUsersInput {
  user_ids: string[];
  employee_level?: string;
  city_type?: string;
  role_ids?: string[];
}

export interface Department {
  id: string;
  dingtalk_dept_id?: string;
  name: string;
  parent_id?: string;
  code?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DepartmentTreeNode extends Department {
  children?: DepartmentTreeNode[];
  user_count?: number;
}

export interface Role {
  id: string;
  code: string;
  name: string;
  description?: string;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export interface DingtalkSyncRequest {
  type: 'full' | 'incremental';
  scope?: 'departments' | 'users' | 'all';
}

export interface DingtalkSyncResponse {
  success: boolean;
  message: string;
  stats: {
    departments: {
      created: number;
      updated: number;
      deleted: number;
    };
    users: {
      created: number;
      updated: number;
      left: number;
    };
  };
}

export interface DingtalkSyncStatus {
  isRunning: boolean;
  lastSyncTime: string | null;
  lastSyncStatus: 'success' | 'failed' | 'partial' | null;
  lastSyncStats: DingtalkSyncResponse['stats'] | null;
}

/**
 * 获取用户列表
 */
export async function getUsers(
  params: GetUsersParams = {}
): Promise<GetUsersResult> {
  const response = (await apiClient.get('/users', { params })) as unknown as {
    success: boolean;
    data: User[];
    total: number;
  };
  return {
    data: response.data || [],
    total: response.total || 0,
  };
}

/**
 * 获取用户详情
 */
export async function getUserById(id: string): Promise<User | null> {
  const response = (await apiClient.get(`/users/${id}`)) as unknown as {
    success: boolean;
    data: User;
  };
  return response.data || null;
}

/**
 * 更新用户信息
 */
export async function updateUser(
  id: string,
  data: UserUpdateInput
): Promise<User> {
  const response = (await apiClient.put(`/users/${id}`, data)) as unknown as {
    success: boolean;
    data: User;
  };
  return response.data;
}

/**
 * 批量更新用户信息
 */
export async function batchUpdateUsers(
  data: BatchUpdateUsersInput
): Promise<void> {
  await apiClient.post('/users/batch', data);
}

/**
 * 获取部门列表
 */
export async function getDepartments(): Promise<Department[]> {
  const response = (await apiClient.get('/departments')) as unknown as {
    success: boolean;
    data: Department[];
  };
  return response.data || [];
}

/**
 * 获取部门树形结构
 */
export async function getDepartmentTree(): Promise<DepartmentTreeNode[]> {
  const response = (await apiClient.get('/departments', {
    params: { tree: true },
  })) as unknown as {
    success: boolean;
    data: DepartmentTreeNode[];
  };
  return response.data || [];
}

/**
 * 获取角色列表
 */
export async function getRoles(): Promise<Role[]> {
  const response = (await apiClient.get('/roles')) as unknown as {
    success: boolean;
    data: Role[];
  };
  return response.data || [];
}

/**
 * 触发钉钉同步
 */
export async function syncDingtalk(
  data: DingtalkSyncRequest
): Promise<DingtalkSyncResponse> {
  const response = (await apiClient.post(
    '/integrations/dingtalk/sync',
    data
  )) as unknown as {
    success: boolean;
    message: string;
    stats: DingtalkSyncResponse['stats'];
  };
  return {
    success: response.success,
    message: response.message || '同步完成',
    stats: response.stats,
  };
}

/**
 * 查询钉钉同步状态
 */
export async function getDingtalkSyncStatus(): Promise<DingtalkSyncStatus> {
  const response = (await apiClient.get(
    '/integrations/dingtalk/sync/status'
  )) as unknown as {
    success: boolean;
    data: DingtalkSyncStatus;
  };
  return (
    response.data || {
      isRunning: false,
      lastSyncTime: null,
      lastSyncStatus: null,
      lastSyncStats: null,
    }
  );
}
