/**
 * 项目阶段进度 API
 * PUT /api/projects/:id/stages - 更新阶段进度
 */
import { NextRequest, NextResponse } from 'next/server';
import { updateStageProgress } from '@/lib/db/project-stages';
import { createClient } from '@/lib/supabase/server';
import { verifyAuth } from '@/lib/utils/auth';

export async function PUT(
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

    // 验证必填字段
    if (!body.stages || !Array.isArray(body.stages)) {
      return NextResponse.json(
        { success: false, error: '缺少必填字段：stages' },
        { status: 400 }
      );
    }

    // 更新阶段进度
    const result = await updateStageProgress(params.id, body.stages, user.id);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('更新阶段进度失败:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : '更新阶段进度失败',
      },
      { status: 500 }
    );
  }
}

