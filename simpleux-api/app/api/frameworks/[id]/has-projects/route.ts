/**
 * 检查计件项目是否有关联的项目 API
 * GET /api/frameworks/:id/has-projects - 检查计件项目是否有关联的项目
 */
import { NextRequest, NextResponse } from 'next/server';
import { checkFrameworkHasProjects } from '@/lib/db/frameworks';
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

    // 检查是否有关联的项目
    const hasProjects = await checkFrameworkHasProjects(params.id);

    return NextResponse.json({
      success: true,
      hasProjects,
    });
  } catch (error) {
    console.error('检查计件项目关联项目失败:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : '检查计件项目关联项目失败',
      },
      { status: 500 }
    );
  }
}

