/**
 * 项目支出数据库操作
 */
import { createClient } from '@/lib/supabase/server';

export interface ProjectExpense {
  labor: any[];
  travel: any[];
  outsource: any[];
}

/**
 * 获取项目支出
 */
export async function getProjectExpenses(
  projectId: string
): Promise<ProjectExpense> {
  const supabase = await createClient();

  // 获取人力支出
  const { data: laborExpenses, error: laborError } = await supabase
    .from('project_expenses_labor')
    .select('*')
    .eq('project_id', projectId)
    .order('work_date', { ascending: false });

  if (laborError) {
    console.error('获取人力支出失败:', laborError);
    throw new Error(`获取人力支出失败: ${laborError.message}`);
  }

  // 获取差旅支出
  const { data: travelExpenses, error: travelError } = await supabase
    .from('project_expenses_travel')
    .select('*')
    .eq('project_id', projectId)
    .order('expense_date', { ascending: false });

  if (travelError) {
    console.error('获取差旅支出失败:', travelError);
    throw new Error(`获取差旅支出失败: ${travelError.message}`);
  }

  // 获取外包支出
  const { data: outsourceExpenses, error: outsourceError } = await supabase
    .from('project_expenses_outsource')
    .select('*')
    .eq('project_id', projectId)
    .order('expense_date', { ascending: false });

  if (outsourceError) {
    console.error('获取外包支出失败:', outsourceError);
    throw new Error(`获取外包支出失败: ${outsourceError.message}`);
  }

  return {
    labor: laborExpenses || [],
    travel: travelExpenses || [],
    outsource: outsourceExpenses || [],
  };
}

