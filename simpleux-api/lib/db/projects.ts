/**
 * 项目数据库操作
 */
import { createClient } from '@/lib/supabase/server';
import { measureQuery } from '@/lib/utils/db-performance';
import type {
  Project,
  ProjectQueryParams,
  ProjectCreateInput,
} from '@/lib/types/project';

export interface GetProjectsResult {
  data: Project[];
  total: number;
}

/**
 * 生成项目编号：PROJ-YYYYMMDD-XXXX
 */
function generateProjectCode(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const randomStr = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `PROJ-${dateStr}-${randomStr}`;
}

/**
 * 生成需求编号：DEM-YYYYMMDD-XXXX
 */
function generateDemandCode(): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
  const randomStr = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `DEM-${dateStr}-${randomStr}`;
}

/**
 * 获取项目列表
 */
export async function getProjects(
  params: ProjectQueryParams = {},
  supabaseClient?: any
): Promise<GetProjectsResult> {
  // 如果传入了客户端，使用传入的；否则创建新的
  const supabase = supabaseClient || (await createClient());
  
  // 性能优化：只查询列表需要的字段，减少数据传输
  const fields = [
    'id',
    'code',
    'name',
    'type',
    'status',
    'manager_id',
    'manager_name',
    'group',
    'client_dept',
    'biz_manager',
    'framework_id',
    'framework_name',
    'demand_code',
    'contract_amount',
    'labor_budget_total',
    'labor_expense_total',
    'estimated_profit_rate',
    'actual_profit_rate',
    'is_pending_entry',
    'created_at',
    'updated_at',
  ].join(',');
  
  let query = supabase.from('projects').select(fields, { count: 'exact' });

  // 筛选条件
  if (params.name) {
    query = query.ilike('name', `%${params.name}%`);
  }

  if (params.type && params.type.length > 0) {
    query = query.in('type', params.type);
  }

  if (params.status && params.status.length > 0) {
    query = query.in('status', params.status);
  }

  if (params.group && params.group.length > 0) {
    query = query.in('group', params.group);
  }

  // 是否显示已归档项目
  // 性能优化：如果只筛选状态，使用 in 而不是 neq（可以使用索引）
  if (!params.showArchived) {
    // 如果已经指定了状态筛选，且不包含'已归档'，就不需要额外过滤
    if (params.status && params.status.length > 0) {
      // 确保状态列表不包含'已归档'
      const filteredStatus = params.status.filter(s => s !== '已归档');
      if (filteredStatus.length > 0) {
        query = query.in('status', filteredStatus);
      } else {
        // 如果所有状态都是'已归档'，返回空结果
        query = query.eq('status', '__never_match__');
      }
    } else {
      // 没有指定状态筛选，排除'已归档'
      query = query.neq('status', '已归档');
    }
  }

  // 排序：按创建时间倒序（使用索引）
  query = query.order('created_at', { ascending: false });

  // 分页（在排序之后）
  const current = params.current || 1;
  const pageSize = params.pageSize || 10;
  const from = (current - 1) * pageSize;
  const to = from + pageSize - 1;

  query = query.range(from, to);

  // 性能监控：记录查询
  const queryDescription = `getProjects(${JSON.stringify(params).substring(0, 100)})`;
  const result = await measureQuery(
    async () => {
      const { data, error, count } = await query;
      return { data, error, count };
    },
    queryDescription
  );
  
  const { data, error, count } = result;

  if (error) {
    console.error('获取项目列表失败:', error);
    throw new Error(`获取项目列表失败: ${error.message}`);
  }

  return {
    data: (data as Project[]) || [],
    total: count || 0,
  };
}

/**
 * 根据ID获取项目详情
 */
export async function getProjectById(id: string): Promise<Project | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // 未找到记录
      return null;
    }
    console.error('获取项目详情失败:', error);
    throw new Error(`获取项目详情失败: ${error.message}`);
  }

  return data as Project;
}

/**
 * 创建项目
 */
export async function createProject(
  input: ProjectCreateInput,
  userId: string,
  supabaseClient?: any
): Promise<Project> {
  const supabase = supabaseClient || (await createClient());

  // 生成项目编号
  const code = generateProjectCode();

  // 如果是计件制项目，自动生成需求编号（强制自动生成，忽略用户输入）
  let demandCode: string | null = null;
  if (input.type === '计件制') {
    demandCode = generateDemandCode();
  }

  // 准备插入数据
  const insertData = {
    code,
    name: input.name,
    type: input.type,
    status: '待启动' as const,
    is_pending_entry: false,
    manager_id: input.managerId,
    manager_name: input.managerName,
    group: input.group,
    biz_manager: input.bizManager || null,
    client_dept: input.clientDept || null,
    plan_start_date: input.planStartDate || new Date().toISOString().split('T')[0],
    plan_end_date: input.planEndDate || new Date().toISOString().split('T')[0],
    actual_start_date: null,
    actual_end_date: null,
    progress: 0,
    contract_amount: input.contractAmount || 0,
    demand_code: demandCode || null,
    demand_name: input.demandName || null,
    framework_id: input.frameworkId || null,
    created_by: userId,
  };

  const { data, error } = await supabase
    .from('projects')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('创建项目失败:', error);
    throw new Error(`创建项目失败: ${error.message}`);
  }

  return data as Project;
}

/**
 * 更新项目
 */
export async function updateProject(
  id: string,
  input: ProjectCreateInput,
  userId: string,
  supabaseClient?: any
): Promise<Project> {
  const supabase = supabaseClient || (await createClient());

  // 准备更新数据
  const updateData: Partial<Project> = {
    name: input.name,
    type: input.type,
    manager_id: input.managerId,
    manager_name: input.managerName,
    group: input.group,
    biz_manager: input.bizManager || undefined,
    client_dept: input.clientDept || undefined,
    plan_start_date: input.planStartDate || undefined,
    plan_end_date: input.planEndDate || undefined,
    contract_amount: input.contractAmount || undefined,
    demand_code: input.demandCode || undefined,
    demand_name: input.demandName || undefined,
    framework_id: input.frameworkId || undefined,
    updated_at: new Date().toISOString(),
  };

  // 移除 undefined 值
  Object.keys(updateData).forEach((key) => {
    if (updateData[key as keyof typeof updateData] === undefined) {
      delete updateData[key as keyof typeof updateData];
    }
  });

  const { data, error } = await supabase
    .from('projects')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('更新项目失败:', error);
    throw new Error(`更新项目失败: ${error.message}`);
  }

  if (!data) {
    throw new Error('项目不存在');
  }

  return data as Project;
}

