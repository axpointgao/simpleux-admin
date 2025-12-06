/**
 * 计件项目数据库操作
 */
import { createClient } from '@/lib/supabase/server';
import type {
  FrameworkAgreement,
  FrameworkQueryParams,
  FrameworkCreateInput,
} from '@/lib/types/framework';

export interface GetFrameworksResult {
  data: FrameworkAgreement[];
  total: number;
}

/**
 * 生成计件项目编号：FRAM-YYYYMMDD-XXXX
 */
function generateFrameworkCode(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const randomStr = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `FRAM-${dateStr}-${randomStr}`;
}

/**
 * 获取计件项目列表
 */
export async function getFrameworks(
  params: FrameworkQueryParams = {}
): Promise<GetFrameworksResult> {
  const supabase = await createClient();
  let query = supabase
    .from('framework_agreements')
    .select('*', { count: 'exact' });

  // 筛选条件
  if (params.keyword) {
    query = query.or(`name.ilike.%${params.keyword}%,code.ilike.%${params.keyword}%`);
  }

  if (params.manager && params.manager.length > 0) {
    query = query.in('manager_id', params.manager);
  }

  if (params.group && params.group.length > 0) {
    query = query.in('group', params.group);
  }

  if (params.clientDept && params.clientDept.length > 0) {
    query = query.in('client_dept', params.clientDept);
  }

  // 分页
  const current = params.current || 1;
  const pageSize = params.pageSize || 10;
  const from = (current - 1) * pageSize;
  const to = from + pageSize - 1;

  query = query.range(from, to);

  // 排序：按创建时间倒序
  query = query.order('created_at', { ascending: false });

  const { data, error, count } = await query;

  if (error) {
    console.error('获取计件项目列表失败:', error);
    throw new Error(`获取计件项目列表失败: ${error.message}`);
  }

  return {
    data: (data as FrameworkAgreement[]) || [],
    total: count || 0,
  };
}

/**
 * 根据ID获取计件项目详情
 */
export async function getFrameworkById(
  id: string
): Promise<FrameworkAgreement | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('framework_agreements')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // 未找到记录
      return null;
    }
    console.error('获取计件项目详情失败:', error);
    throw new Error(`获取计件项目详情失败: ${error.message}`);
  }

  return data as FrameworkAgreement;
}

/**
 * 创建计件项目
 */
export async function createFramework(
  input: FrameworkCreateInput,
  userId: string
): Promise<FrameworkAgreement> {
  const supabase = await createClient();

  // 生成计件项目编号
  const code = generateFrameworkCode();

  // 准备插入数据
  const insertData = {
    code,
    name: input.name,
    manager_id: input.managerId,
    manager_name: input.managerName,
    group: input.group,
    biz_manager: input.bizManager || null,
    client_dept: input.clientDept || null,
  };

  const { data, error } = await supabase
    .from('framework_agreements')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('创建计件项目失败:', error);
    throw new Error(`创建计件项目失败: ${error.message}`);
  }

  return data as FrameworkAgreement;
}

/**
 * 更新计件项目
 */
export async function updateFramework(
  id: string,
  input: FrameworkCreateInput,
  userId: string
): Promise<FrameworkAgreement> {
  const supabase = await createClient();

  // 准备更新数据
  const updateData: Partial<FrameworkAgreement> = {
    name: input.name,
    manager_id: input.managerId,
    manager_name: input.managerName,
    group: input.group,
    biz_manager: input.bizManager || null,
    client_dept: input.clientDept || null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('framework_agreements')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('更新计件项目失败:', error);
    throw new Error(`更新计件项目失败: ${error.message}`);
  }

  if (!data) {
    throw new Error('计件项目不存在');
  }

  return data as FrameworkAgreement;
}

/**
 * 删除计件项目
 */
export async function deleteFramework(
  id: string,
  userId: string
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from('framework_agreements')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('删除计件项目失败:', error);
    throw new Error(`删除计件项目失败: ${error.message}`);
  }
}

/**
 * 检查计件项目是否有关联的项目
 */
export async function checkFrameworkHasProjects(
  frameworkId: string
): Promise<boolean> {
  const supabase = await createClient();

  const { data, error, count } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('framework_id', frameworkId);

  if (error) {
    console.error('检查计件项目关联项目失败:', error);
    throw new Error(`检查计件项目关联项目失败: ${error.message}`);
  }

  return (count || 0) > 0;
}

