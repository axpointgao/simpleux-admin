/**
 * 项目变更数据库操作
 */
import { createClient } from '@/lib/supabase/server';

export interface ProjectChange {
  id: string;
  project_id: string;
  change_type: 'project' | 'demand';
  change_date: string;
  contract_amount?: number;
  cost_budget?: number;
  labor_budget_hours?: number;
  travel_budget?: number;
  outsource_budget?: number;
  description: string;
  attachment_url?: string;
  approval_id?: string;
  created_by: string;
  created_at: string;
}

export interface ProjectChangeInput {
  changeType?: 'project' | 'demand';
  changeDate?: string;
  contractAmount?: number;
  costBudget?: number;
  laborBudgetHours?: number;
  travelBudget?: number;
  outsourceBudget?: number;
  description: string;
  attachmentUrl?: string;
}

/**
 * 获取项目变更记录
 */
export async function getProjectChanges(
  projectId: string
): Promise<ProjectChange[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('project_changes')
    .select('*')
    .eq('project_id', projectId)
    .order('change_date', { ascending: false });

  if (error) {
    console.error('获取项目变更记录失败:', error);
    throw new Error(`获取项目变更记录失败: ${error.message}`);
  }

  return (data as ProjectChange[]) || [];
}

/**
 * 提交项目变更申请
 */
export async function submitProjectChange(
  projectId: string,
  input: ProjectChangeInput,
  userId: string
): Promise<ProjectChange> {
  const supabase = await createClient();

  // 准备插入数据
  const insertData = {
    project_id: projectId,
    change_type: input.changeType || 'project',
    change_date: input.changeDate || new Date().toISOString().split('T')[0],
    contract_amount: input.contractAmount || null,
    cost_budget: input.costBudget || null,
    labor_budget_hours: input.laborBudgetHours || null,
    travel_budget: input.travelBudget || null,
    outsource_budget: input.outsourceBudget || null,
    description: input.description,
    attachment_url: input.attachmentUrl || null,
    approval_id: null,
    created_by: userId,
  };

  const { data, error } = await supabase
    .from('project_changes')
    .insert(insertData)
    .select()
    .single();

  if (error) {
    console.error('提交项目变更申请失败:', error);
    throw new Error(`提交项目变更申请失败: ${error.message}`);
  }

  return data as ProjectChange;
}

