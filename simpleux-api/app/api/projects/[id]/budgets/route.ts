/**
 * 项目预算 API
 * GET /api/projects/:id/budgets - 获取项目预算
 */
import { NextRequest, NextResponse } from 'next/server';
import { getProjectBudgets } from '@/lib/db/project-budgets';
import { createClient } from '@/lib/supabase/server';
import { verifyAuth } from '@/lib/utils/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 验证用户登录
    const supabase = await createClient();
    const { user, error } = await verifyAuth(supabase);

    if (error || !user) {
      return NextResponse.json(
        { success: false, error: '未登录' },
        { status: 401 }
      );
    }

    // 获取项目预算
    const budgets = await getProjectBudgets(params.id);

    return NextResponse.json({
      success: true,
      data: budgets,
    });
  } catch (error) {
    console.error('获取项目预算失败:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : '获取项目预算失败',
      },
      { status: 500 }
    );
  }
}

