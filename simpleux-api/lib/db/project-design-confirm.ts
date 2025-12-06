/**
 * 设计确认数据库操作
 */
import { createClient } from '@/lib/supabase/server';

export interface DesignConfirmInput {
  confirmed: boolean;
  description?: string;
}

/**
 * 提交设计确认申请
 */
export async function submitDesignConfirm(
  projectId: string,
  input: DesignConfirmInput,
  userId: string
): Promise<{ success: boolean }> {
  const supabase = await createClient();

  // 更新项目状态
  const newStatus = input.confirmed ? '已确认' : '待确认';

  const { error } = await supabase
    .from('projects')
    .update({
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', projectId);

  if (error) {
    console.error('提交设计确认申请失败:', error);
    throw new Error(`提交设计确认申请失败: ${error.message}`);
  }

  return { success: true };
}

