/**
 * 项目详情和更新 API
 * GET /api/projects/:id - 获取项目详情
 * PUT /api/projects/:id - 更新项目
 */
import { NextRequest, NextResponse } from 'next/server';
import { getProjectById, updateProject } from '@/lib/db/projects';
import { createClientWithAuth } from '@/lib/supabase/server-with-auth';
import { verifyAuth } from '@/lib/utils/auth';
import type { ProjectCreateInput } from '@/lib/types/project';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 从请求头获取 token 创建 Supabase 客户端
    const supabase = await createClientWithAuth(request);
    const { user, error } = await verifyAuth(supabase);

    if (error || !user) {
      return NextResponse.json(
        { success: false, error: '未登录' },
        { status: 401 }
      );
    }

    // 获取项目详情（传入带认证的 supabase 客户端）
    const project = await getProjectById(params.id, supabase);

    if (!project) {
      return NextResponse.json(
        { success: false, error: '项目不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: project,
    });
  } catch (error) {
    console.error('获取项目详情失败:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : '获取项目详情失败',
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 从请求头获取 token 创建 Supabase 客户端
    const supabase = await createClientWithAuth(request);
    const { user, error } = await verifyAuth(supabase);

    if (error || !user) {
      return NextResponse.json(
        { success: false, error: '未登录' },
        { status: 401 }
      );
    }

    // 解析请求体
    const body: ProjectCreateInput = await request.json();

    // 验证必填字段
    if (!body.name || !body.type || !body.managerId || !body.group) {
      return NextResponse.json(
        { success: false, error: '缺少必填字段' },
        { status: 400 }
      );
    }

    // 更新项目（传入带认证的 supabase 客户端）
    const project = await updateProject(params.id, body, user.id, supabase);

    return NextResponse.json({
      success: true,
      data: project,
    });
  } catch (error) {
    console.error('更新项目失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '更新项目失败',
      },
      { status: 500 }
    );
  }
}

