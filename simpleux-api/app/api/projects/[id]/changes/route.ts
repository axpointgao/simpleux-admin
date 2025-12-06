/**
 * 项目变更 API
 * GET /api/projects/:id/changes - 获取项目变更记录
 * POST /api/projects/:id/changes - 提交项目变更申请
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  getProjectChanges,
  submitProjectChange,
} from '@/lib/db/project-changes';
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

    // 获取项目变更记录
    const changes = await getProjectChanges(params.id);

    return NextResponse.json({
      success: true,
      data: changes,
    });
  } catch (error) {
    console.error('获取项目变更记录失败:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : '获取项目变更记录失败',
      },
      { status: 500 }
    );
  }
}

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

    // 验证必填字段
    if (!body.description) {
      return NextResponse.json(
        { success: false, error: '缺少必填字段：description' },
        { status: 400 }
      );
    }

    // 提交项目变更申请
    const change = await submitProjectChange(params.id, body, user.id);

    return NextResponse.json({
      success: true,
      data: change,
    });
  } catch (error) {
    console.error('提交项目变更申请失败:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : '提交项目变更申请失败',
      },
      { status: 500 }
    );
  }
}

