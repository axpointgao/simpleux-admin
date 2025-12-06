/**
 * 计件项目详情、更新和删除 API
 * GET /api/frameworks/:id - 获取计件项目详情
 * PUT /api/frameworks/:id - 更新计件项目
 * DELETE /api/frameworks/:id - 删除计件项目
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  getFrameworkById,
  updateFramework,
  deleteFramework,
} from '@/lib/db/frameworks';
import { createClient } from '@/lib/supabase/server';
import { verifyAuth } from '@/lib/utils/auth';
import type { FrameworkCreateInput } from '@/lib/types/framework';

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

    // 获取计件项目详情
    const framework = await getFrameworkById(params.id);

    if (!framework) {
      return NextResponse.json(
        { success: false, error: '计件项目不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: framework,
    });
  } catch (error) {
    console.error('获取计件项目详情失败:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : '获取计件项目详情失败',
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
    const body: FrameworkCreateInput = await request.json();

    // 验证必填字段
    if (!body.name || !body.managerId || !body.group) {
      return NextResponse.json(
        { success: false, error: '缺少必填字段' },
        { status: 400 }
      );
    }

    // 更新计件项目
    const framework = await updateFramework(params.id, body, user.id);

    return NextResponse.json({
      success: true,
      data: framework,
    });
  } catch (error) {
    console.error('更新计件项目失败:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : '更新计件项目失败',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // 删除计件项目
    await deleteFramework(params.id, user.id);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('删除计件项目失败:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : '删除计件项目失败',
      },
      { status: 500 }
    );
  }
}

