/**
 * 用户数据库操作
 */
import { createClient } from '@/lib/supabase/server';

export interface User {
  id: string;
  dingtalk_user_id?: string;
  name: string;
  employee_level: string; // P0-P9, M0-M5
  position?: string;
  city_type?: string; // Chengdu/Hangzhou
  department?: string;
  status: string; // 在职/离职
  daily_price?: number;
  daily_cost?: number;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  user_id: string;
  role_id: string;
  role_code: string;
  role_name: string;
}

export interface UserWithRoles extends User {
  roles: Array<{
    id: string;
    code: string;
    name: string;
  }>;
}

export interface UserQueryParams {
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
  data: UserWithRoles[];
  total: number;
}

export interface UserUpdateInput {
  employee_level?: string;
  city_type?: string;
  role_ids?: string[];
}

/**
 * 获取用户列表
 */
export async function getUsers(
  params: UserQueryParams = {}
): Promise<GetUsersResult> {
  const supabase = await createClient();
  
  // 先获取用户列表
  let query = supabase
    .from('profiles')
    .select('*', { count: 'exact' });

  // 筛选条件
  if (params.keyword) {
    query = query.or(`name.ilike.%${params.keyword}%,position.ilike.%${params.keyword}%`);
  }

  if (params.department && params.department.length > 0) {
    query = query.in('department', params.department);
  }

  if (params.employee_level && params.employee_level.length > 0) {
    query = query.in('employee_level', params.employee_level);
  }

  if (params.city_type && params.city_type.length > 0) {
    query = query.in('city_type', params.city_type);
  }

  if (params.status && params.status.length > 0) {
    query = query.in('status', params.status);
  }

  // 分页
  const current = params.current || 1;
  const pageSize = params.pageSize || 10;
  const from = (current - 1) * pageSize;
  const to = from + pageSize - 1;

  query = query.range(from, to);

  // 排序：按创建时间倒序
  query = query.order('created_at', { ascending: false });

  const { data: users, error: usersError, count } = await query;

  if (usersError) {
    console.error('获取用户列表失败:', usersError);
    throw new Error(`获取用户列表失败: ${usersError.message}`);
  }

  if (!users || users.length === 0) {
    return {
      data: [],
      total: count || 0,
    };
  }

  // 获取所有用户的角色
  const userIds = users.map((u) => u.id);
  const { data: userRoles, error: rolesError } = await supabase
    .from('user_roles')
    .select(`
      user_id,
      role_id,
      roles (
        id,
        code,
        name
      )
    `)
    .in('user_id', userIds);

  if (rolesError) {
    console.error('获取用户角色失败:', rolesError);
    // 不抛出错误，继续处理
  }

  // 构建用户角色映射
  const roleMap = new Map<string, Array<{ id: string; code: string; name: string }>>();
  if (userRoles) {
    userRoles.forEach((ur: any) => {
      if (!roleMap.has(ur.user_id)) {
        roleMap.set(ur.user_id, []);
      }
      if (ur.roles) {
        roleMap.get(ur.user_id)!.push({
          id: ur.roles.id,
          code: ur.roles.code,
          name: ur.roles.name,
        });
      }
    });
  }

  // 合并用户和角色数据
  const usersWithRoles: UserWithRoles[] = users.map((user: any) => ({
    ...user,
    roles: roleMap.get(user.id) || [],
  }));

  // 如果指定了角色筛选，进行过滤
  let filteredUsers = usersWithRoles;
  if (params.role && params.role.length > 0) {
    filteredUsers = usersWithRoles.filter((user) =>
      user.roles.some((r) => params.role!.includes(r.code))
    );
  }

  return {
    data: filteredUsers,
    total: count || 0,
  };
}

/**
 * 获取用户详情
 */
export async function getUserById(id: string): Promise<UserWithRoles | null> {
  const supabase = await createClient();

  const { data: user, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('获取用户详情失败:', error);
    throw new Error(`获取用户详情失败: ${error.message}`);
  }

  if (!user) {
    return null;
  }

  // 获取用户角色
  const { data: userRoles } = await supabase
    .from('user_roles')
    .select(`
      role_id,
      roles (
        id,
        code,
        name
      )
    `)
    .eq('user_id', id);

  const roles = userRoles
    ? userRoles.map((ur: any) => ({
        id: ur.roles.id,
        code: ur.roles.code,
        name: ur.roles.name,
      }))
    : [];

  return {
    ...user,
    roles,
  };
}

/**
 * 更新用户信息
 */
export async function updateUser(
  id: string,
  data: UserUpdateInput
): Promise<UserWithRoles> {
  const supabase = await createClient();

  // 更新用户基础信息
  const updateData: any = {};
  if (data.employee_level !== undefined) {
    updateData.employee_level = data.employee_level;
  }
  if (data.city_type !== undefined) {
    updateData.city_type = data.city_type;
  }

  if (Object.keys(updateData).length > 0) {
    const { error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', id);

    if (updateError) {
      console.error('更新用户信息失败:', updateError);
      throw new Error(`更新用户信息失败: ${updateError.message}`);
    }
  }

  // 更新用户角色
  if (data.role_ids !== undefined) {
    // 先删除现有角色
    const { error: deleteError } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', id);

    if (deleteError) {
      console.error('删除用户角色失败:', deleteError);
      throw new Error(`删除用户角色失败: ${deleteError.message}`);
    }

    // 添加新角色
    if (data.role_ids.length > 0) {
      const roleInserts = data.role_ids.map((roleId) => ({
        user_id: id,
        role_id: roleId,
      }));

      const { error: insertError } = await supabase
        .from('user_roles')
        .insert(roleInserts);

      if (insertError) {
        console.error('添加用户角色失败:', insertError);
        throw new Error(`添加用户角色失败: ${insertError.message}`);
      }
    }
  }

  // 返回更新后的用户信息
  return getUserById(id);
}

/**
 * 批量更新用户信息
 */
export async function batchUpdateUsers(
  userIds: string[],
  data: UserUpdateInput
): Promise<void> {
  for (const userId of userIds) {
    await updateUser(userId, data);
  }
}

