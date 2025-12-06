/**
 * 项目归档 API
 * POST /api/projects/:id/archive - 提交项目归档申请
 */
import { NextRequest, NextResponse } from 'next/server';
import { submitArchive } from '@/lib/db/project-archive';
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

    // 解析请求体
    const body = await request.json();

    // 提交项目归档申请
    const result = await submitArchive(params.id, body, user.id);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('提交项目归档申请失败:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : '提交项目归档申请失败',
      },
      { status: 500 }
    );
  }
}

