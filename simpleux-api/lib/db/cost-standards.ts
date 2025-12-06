/**
 * 成本标准数据库操作
 */
import { createClient } from '@/lib/supabase/server';

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
  params: CostStandardQueryParams = {},
  supabaseClient?: any
): Promise<GetCostStandardsResult> {
  // 优先使用传入的客户端（带认证），如果没有则创建新客户端
  const supabase = supabaseClient || (await createClient());
  
  // 调试：检查认证状态
  if (process.env.NODE_ENV === 'development') {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('getCostStandards - 当前用户:', user?.id, user?.email);
    if (userError) {
      console.warn('getCostStandards - 获取用户失败:', userError.message);
    }
  }
  
  let query = supabase.from('cost_standards').select('*', { count: 'exact' });

  // 筛选条件
  if (params.employee_level && params.employee_level.length > 0) {
    query = query.in('employee_level', params.employee_level);
  }

  if (params.city_type && params.city_type.length > 0) {
    query = query.in('city_type', params.city_type);
  }

  // 排序：按员工级别、城市类型分组，然后按生效日期倒序（最新的在前面）
  query = query.order('employee_level', { ascending: true });
  query = query.order('city_type', { ascending: true });
  query = query.order('effective_from', { ascending: false });

  // 成本标准数据量很小（最多一年调整一次），直接获取所有数据，不分页
  const { data, error, count } = await query;

  if (error) {
    console.error('获取成本标准列表失败:', error);
    console.error('错误详情:', JSON.stringify(error, null, 2));
    console.error('错误代码:', error.code);
    console.error('错误消息:', error.message);
    console.error('错误提示:', error.hint);
    throw new Error(`获取成本标准列表失败: ${error.message}`);
  }

  // 调试：打印查询结果
  if (process.env.NODE_ENV === 'development') {
    console.log('getCostStandards - 查询结果:', {
      dataCount: data?.length || 0,
      total: count || 0,
      firstItem: data?.[0] || null,
      hasError: !!error,
      errorDetails: error ? {
        code: error.code,
        message: error.message,
        hint: error.hint,
        details: error.details,
      } : null,
    });
  }

  // 计算状态：生效/失效/未生效
  // 数据量很小，直接在内存中计算，简单高效
  const currentDate = new Date().toISOString().split('T')[0];
  
  if (!data || data.length === 0) {
    return {
      data: [] as CostStandard[],
      total: count || 0,
    };
  }
  
  // 找出每个 (employee_level, city_type) 组合的最新生效日期（<= 当前日期）
  const maxEffectiveFromMap = new Map<string, string>();
  data.forEach((item: any) => {
    if (item.effective_from <= currentDate) {
      const key = `${item.employee_level}_${item.city_type}`;
      const existing = maxEffectiveFromMap.get(key);
      if (!existing || item.effective_from > existing) {
        maxEffectiveFromMap.set(key, item.effective_from);
      }
    }
  });
  
  // 计算状态
  const dataWithStatus = data.map((item: any) => {
    const effectiveFrom = item.effective_from;
    let status: '生效' | '失效' | '未生效' = '未生效';
    
    if (effectiveFrom <= currentDate) {
      const key = `${item.employee_level}_${item.city_type}`;
      const maxEffectiveFrom = maxEffectiveFromMap.get(key);
      
      if (maxEffectiveFrom && effectiveFrom === maxEffectiveFrom) {
        status = '生效';
      } else {
        status = '失效';
      }
    } else {
      status = '未生效';
    }
    
    return {
      ...item,
      status,
    };
  });

  return {
    data: dataWithStatus as CostStandard[],
    total: count || 0,
  };
}

/**
 * 根据ID获取成本标准详情
 */
export async function getCostStandardById(
  id: string,
  supabaseClient?: any
): Promise<CostStandard | null> {
  const supabase = supabaseClient || (await createClient());
  const { data, error } = await supabase
    .from('cost_standards')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('获取成本标准详情失败:', error);
    throw new Error(`获取成本标准详情失败: ${error.message}`);
  }

  return data as CostStandard;
}

/**
 * 创建成本标准
 */
export async function createCostStandard(
  input: CostStandardCreateInput,
  userId: string,
  supabaseClient?: any
): Promise<CostStandard> {
  const supabase = supabaseClient || (await createClient());

  const insertData = {
    employee_level: input.employee_level,
    city_type: input.city_type,
    daily_cost: input.daily_cost,
    effective_from: input.effective_from,
    created_by: userId,
  };

  const { data, error } = await supabase
    .from('cost_standards')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('创建成本标准失败:', error);
    throw new Error(`创建成本标准失败: ${error.message}`);
  }

  return data as CostStandard;
}

/**
 * 更新成本标准
 */
export async function updateCostStandard(
  id: string,
  input: CostStandardUpdateInput,
  supabaseClient?: any
): Promise<CostStandard> {
  const supabase = supabaseClient || (await createClient());

  const updateData: Partial<CostStandard> = {
    ...input,
    updated_at: new Date().toISOString(),
  };

  // 移除 undefined 值
  Object.keys(updateData).forEach((key) => {
    if (updateData[key as keyof typeof updateData] === undefined) {
      delete updateData[key as keyof typeof updateData];
    }
  });

  const { data, error } = await supabase
    .from('cost_standards')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('更新成本标准失败:', error);
    throw new Error(`更新成本标准失败: ${error.message}`);
  }

  if (!data) {
    throw new Error('成本标准不存在');
  }

  return data as CostStandard;
}

/**
 * 删除成本标准
 */
export async function deleteCostStandard(
  id: string,
  supabaseClient?: any
): Promise<void> {
  const supabase = supabaseClient || (await createClient());

  const { error } = await supabase
    .from('cost_standards')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('删除成本标准失败:', error);
    throw new Error(`删除成本标准失败: ${error.message}`);
  }
}

/**
 * 获取所有城市类型列表（从 city_types 表获取，返回名称数组）
 * @param supabaseClient Supabase 客户端
 * @deprecated 请使用 @/lib/db/city-types 中的 getCityTypes 函数
 */
export async function getCityTypes(
  supabaseClient?: any
): Promise<string[]> {
  const supabase = supabaseClient || (await createClient());

  const { data, error } = await supabase
    .from('city_types')
    .select('name')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    console.error('获取城市类型列表失败:', error);
    throw new Error(`获取城市类型列表失败: ${error.message}`);
  }

  return (data || []).map((item: any) => item.name);
}

