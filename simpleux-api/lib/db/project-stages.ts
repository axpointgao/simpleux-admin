/**
 * 项目阶段数据库操作
 */
import { createClient } from '@/lib/supabase/server';

export interface ProjectStage {
  id?: string;
  name: string;
  percentage: number; // 阶段权重（0-100）
  status?: 'pending' | 'in_progress' | 'completed';
  completion_percentage?: number; // 完成百分比（0-100）
  completed_at?: string;
  completed_by?: string;
  attachment_url?: string;
}

export interface ProjectStageDB {
  id: string;
  project_id: string;
  name: string;
  percentage: number;
  status: 'pending' | 'in_progress' | 'completed';
  completion_percentage: number;
  completed_at: string | null;
  completed_by: string | null;
  attachment_url: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * 更新阶段进度
 */
export async function updateStageProgress(
  projectId: string,
  stages: ProjectStage[],
  userId: string
): Promise<{ success: boolean }> {
  const supabase = await createClient();

  // 先删除该项目的所有阶段
  const { error: deleteError } = await supabase
    .from('project_stages')
    .delete()
    .eq('project_id', projectId);

  if (deleteError) {
    console.error('删除旧阶段失败:', deleteError);
    throw new Error(`删除旧阶段失败: ${deleteError.message}`);
  }

  // 插入新阶段
  if (stages.length > 0) {
    const stagesToInsert = stages.map((stage) => ({
      project_id: projectId,
      name: stage.name,
      percentage: stage.percentage || 0,
      status: (stage.status || 'pending') as 'pending' | 'in_progress' | 'completed',
      completion_percentage: stage.completion_percentage || 0,
      completed_at: stage.completed_at || null,
      completed_by: stage.completed_by || null,
      attachment_url: stage.attachment_url || null,
    }));

    const { error: insertError } = await supabase
      .from('project_stages')
      .insert(stagesToInsert);

    if (insertError) {
      console.error('插入阶段失败:', insertError);
      throw new Error(`插入阶段失败: ${insertError.message}`);
    }
  }

  // 计算项目总进度（根据阶段权重和完成百分比）
  let totalProgress = 0;
  if (stages.length > 0) {
    const totalWeight = stages.reduce((sum, stage) => sum + (stage.percentage || 0), 0);
    if (totalWeight > 0) {
      const weightedProgress = stages.reduce(
        (sum, stage) =>
          sum +
          ((stage.percentage || 0) * (stage.completion_percentage || 0)) / 100,
        0
      );
      totalProgress = Math.round((weightedProgress / totalWeight) * 100);
    } else {
      // 如果没有权重，使用平均完成百分比
      totalProgress = Math.round(
        stages.reduce((sum, stage) => sum + (stage.completion_percentage || 0), 0) /
          stages.length
      );
    }
  }

  // 更新项目进度
  const { error: projectError } = await supabase
    .from('projects')
    .update({
      progress: totalProgress,
      updated_at: new Date().toISOString(),
    })
    .eq('id', projectId);

  if (projectError) {
    console.error('更新项目进度失败:', projectError);
    throw new Error(`更新项目进度失败: ${projectError.message}`);
  }

  return { success: true };
}

/**
 * 获取项目阶段列表
 */
export async function getProjectStages(
  projectId: string
): Promise<ProjectStageDB[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('project_stages')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('获取项目阶段失败:', error);
    throw new Error(`获取项目阶段失败: ${error.message}`);
  }

  return (data as ProjectStageDB[]) || [];
}

