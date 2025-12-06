/**
 * 取消项目归档 API
 * POST /api/projects/:id/cancel-archive - 取消项目归档
 */
import { NextRequest, NextResponse } from 'next/server';
import { cancelArchive } from '@/lib/db/project-archive';
import { createClient } from '@/lib/supabase/server';
import { verifyAuth } from '@/lib/utils/auth';

export async function POST(
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

    // 取消项目归档
    const result = await cancelArchive(params.id, user.id);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('取消项目归档失败:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : '取消项目归档失败',
      },
      { status: 500 }
    );
  }
}

