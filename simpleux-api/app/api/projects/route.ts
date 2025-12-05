/**
 * 项目列表和创建 API
 * GET /api/projects - 获取项目列表
 * POST /api/projects - 创建项目
 */
import { NextRequest, NextResponse } from 'next/server';
import { getProjects, createProject } from '@/lib/db/projects';
import { createClient } from '@/lib/supabase/server';
import { verifyAuth } from '@/lib/utils/auth';
import type {
  ProjectQueryParams,
  ProjectCreateInput,
  ProjectType,
  ProjectStatus,
} from '@/lib/types/project';

export async function GET(request: NextRequest) {
  try {
    // 验证用户登录（开发模式下跳过）
    const supabase = await createClient();
    const { user, error } = await verifyAuth(supabase);

    if (error || !user) {
      return NextResponse.json(
        { success: false, error: '未登录' },
        { status: 401 }
      );
    }

    // 解析查询参数
    const searchParams = request.nextUrl.searchParams;
    const params: ProjectQueryParams = {
      name: searchParams.get('name') || undefined,
      type: searchParams.get('type')
        ? (searchParams.get('type')!.split(',') as ProjectType[])
        : undefined,
      status: searchParams.get('status')
        ? (searchParams.get('status')!.split(',') as ProjectStatus[])
        : undefined,
      group: searchParams.get('group')
        ? searchParams.get('group')!.split(',')
        : undefined,
      showArchived: searchParams.get('showArchived') === 'true',
      current: searchParams.get('current')
        ? parseInt(searchParams.get('current')!)
        : 1,
      pageSize: searchParams.get('pageSize')
        ? parseInt(searchParams.get('pageSize')!)
        : 10,
    };

    // 查询项目列表
    const result = await getProjects(params);

    return NextResponse.json({
      success: true,
      data: result.data,
      total: result.total,
    });
  } catch (error) {
    console.error('获取项目列表失败:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : '获取项目列表失败',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // 验证用户登录（开发模式下跳过）
    const supabase = await createClient();
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

    // 创建项目
    const project = await createProject(body, user.id);

    return NextResponse.json({
      success: true,
      data: project,
    });
  } catch (error) {
    console.error('创建项目失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '创建项目失败',
      },
      { status: 500 }
    );
  }
}

