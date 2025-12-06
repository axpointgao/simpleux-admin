/**
 * 项目预算数据库操作
 */
import { createClient } from '@/lib/supabase/server';

export interface ProjectBudget {
  labor: any[];
  travel: any[];
  outsource: any[];
}

/**
 * 获取项目预算
 */
export async function getProjectBudgets(
  projectId: string
): Promise<ProjectBudget> {
  const supabase = await createClient();

  // 获取人力预算
  const { data: laborBudgets, error: laborError } = await supabase
    .from('project_budgets_labor')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });

  if (laborError) {
    console.error('获取人力预算失败:', laborError);
    throw new Error(`获取人力预算失败: ${laborError.message}`);
  }

  // 获取差旅预算
  const { data: travelBudgets, error: travelError } = await supabase
    .from('project_budgets_travel')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });

  if (travelError) {
    console.error('获取差旅预算失败:', travelError);
    throw new Error(`获取差旅预算失败: ${travelError.message}`);
  }

  // 获取外包预算
  const { data: outsourceBudgets, error: outsourceError } = await supabase
    .from('project_budgets_outsource')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });

  if (outsourceError) {
    console.error('获取外包预算失败:', outsourceError);
    throw new Error(`获取外包预算失败: ${outsourceError.message}`);
  }

  return {
    labor: laborBudgets || [],
    travel: travelBudgets || [],
    outsource: outsourceBudgets || [],
  };
}

