/**
 * 项目归档数据库操作
 */
import { createClient } from '@/lib/supabase/server';

export interface ArchiveInput {
  description?: string;
}

/**
 * 提交项目归档申请
 */
export async function submitArchive(
  projectId: string,
  input: ArchiveInput,
  userId: string
): Promise<{ success: boolean }> {
  const supabase = await createClient();

  // 更新项目状态为已归档
  const { error } = await supabase
    .from('projects')
    .update({
      status: '已归档',
      actual_end_date: new Date().toISOString().split('T')[0],
      updated_at: new Date().toISOString(),
    })
    .eq('id', projectId);

  if (error) {
    console.error('提交项目归档申请失败:', error);
    throw new Error(`提交项目归档申请失败: ${error.message}`);
  }

  return { success: true };
}

/**
 * 取消项目归档
 */
export async function cancelArchive(
  projectId: string,
  userId: string
): Promise<{ success: boolean }> {
  const supabase = await createClient();

  // 更新项目状态为进行中
  const { error } = await supabase
    .from('projects')
    .update({
      status: '进行中',
      updated_at: new Date().toISOString(),
    })
    .eq('id', projectId);

  if (error) {
    console.error('取消项目归档失败:', error);
    throw new Error(`取消项目归档失败: ${error.message}`);
  }

  return { success: true };
}

