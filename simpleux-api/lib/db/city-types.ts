/**
 * 城市类型数据库操作
 */
import { createClient } from '@/lib/supabase/server';

export interface CityType {
  id: string;
  name: string;
  display_name: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CityTypeCreateInput {
  name: string;
  display_name: string;
  sort_order?: number;
}

export interface CityTypeUpdateInput {
  name?: string;
  display_name?: string;
  sort_order?: number;
}

/**
 * 获取所有城市类型列表
 */
export async function getCityTypes(
  supabaseClient?: any
): Promise<CityType[]> {
  const supabase = supabaseClient || (await createClient());

  const { data, error } = await supabase
    .from('city_types')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    console.error('获取城市类型列表失败:', error);
    throw new Error(`获取城市类型列表失败: ${error.message}`);
  }

  return (data as CityType[]) || [];
}

/**
 * 根据ID获取城市类型详情
 */
export async function getCityTypeById(
  id: string,
  supabaseClient?: any
): Promise<CityType | null> {
  const supabase = supabaseClient || (await createClient());

  const { data, error } = await supabase
    .from('city_types')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('获取城市类型详情失败:', error);
    throw new Error(`获取城市类型详情失败: ${error.message}`);
  }

  return data as CityType;
}

/**
 * 创建城市类型
 */
export async function createCityType(
  input: CityTypeCreateInput,
  supabaseClient?: any
): Promise<CityType> {
  const supabase = supabaseClient || (await createClient());

  const insertData = {
    name: input.name,
    display_name: input.display_name,
    sort_order: input.sort_order || 0,
  };

  const { data, error } = await supabase
    .from('city_types')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('创建城市类型失败:', error);
    throw new Error(`创建城市类型失败: ${error.message}`);
  }

  return data as CityType;
}

/**
 * 更新城市类型
 */
export async function updateCityType(
  id: string,
  input: CityTypeUpdateInput,
  supabaseClient?: any
): Promise<CityType> {
  const supabase = supabaseClient || (await createClient());

  const updateData: Partial<CityType> = {
    ...input,
    updated_at: new Date().toISOString(),
  };

  // 移除 undefined 值
  Object.keys(updateData).forEach((key) => {
    if (updateData[key as keyof CityType] === undefined) {
      delete updateData[key as keyof CityType];
    }
  });

  const { data, error } = await supabase
    .from('city_types')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('更新城市类型失败:', error);
    throw new Error(`更新城市类型失败: ${error.message}`);
  }

  return data as CityType;
}

/**
 * 删除城市类型
 */
export async function deleteCityType(
  id: string,
  supabaseClient?: any
): Promise<void> {
  const supabase = supabaseClient || (await createClient());

  const { error } = await supabase.from('city_types').delete().eq('id', id);

  if (error) {
    console.error('删除城市类型失败:', error);
    throw new Error(`删除城市类型失败: ${error.message}`);
  }
}

