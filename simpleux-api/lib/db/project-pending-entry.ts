/**
 * 项目补录数据库操作
 */
import { createClient } from '@/lib/supabase/server';

export interface PendingEntryInput {
  contractAmount: number;
  description?: string;
}

/**
 * 提交项目补录申请
 */
export async function submitPendingEntry(
  projectId: string,
  input: PendingEntryInput,
  userId: string
): Promise<{ success: boolean }> {
  const supabase = await createClient();

  // 更新项目的待补录标记和业绩金额
  const { error } = await supabase
    .from('projects')
    .update({
      is_pending_entry: true,
      contract_amount: input.contractAmount,
      updated_at: new Date().toISOString(),
    })
    .eq('id', projectId);

  if (error) {
    console.error('提交项目补录申请失败:', error);
    throw new Error(`提交项目补录申请失败: ${error.message}`);
  }

  return { success: true };
}

