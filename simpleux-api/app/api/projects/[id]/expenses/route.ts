/**
 * 项目支出 API
 * GET /api/projects/:id/expenses - 获取项目支出
 */
import { NextRequest, NextResponse } from 'next/server';
import { getProjectExpenses } from '@/lib/db/project-expenses';
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

    // 获取项目支出
    const expenses = await getProjectExpenses(params.id);

    return NextResponse.json({
      success: true,
      data: expenses,
    });
  } catch (error) {
    console.error('获取项目支出失败:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : '获取项目支出失败',
      },
      { status: 500 }
    );
  }
}

