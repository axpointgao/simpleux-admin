/**
 * 项目列表和创建 API
 * GET /api/projects - 获取项目列表
 * POST /api/projects - 创建项目
 */
import { NextRequest, NextResponse } from 'next/server';
import { getProjects, createProject } from '@/lib/db/projects';
import { createClientWithAuth, getTokenFromRequest } from '@/lib/supabase/server-with-auth';
import { verifyAuth } from '@/lib/utils/auth';
import type {
  ProjectQueryParams,
  ProjectCreateInput,
  ProjectType,
  ProjectStatus,
} from '@/lib/types/project';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  let dbQueryTime = 0;
  let authTime = 0;

  try {
    // 性能监控：记录认证时间
    const authStart = Date.now();
    const supabase = await createClientWithAuth(request);
    const token = getTokenFromRequest(request);
    const { user, error } = await verifyAuth(supabase, token);
    authTime = Date.now() - authStart;

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

    // 性能监控：记录数据库查询时间
    const dbStart = Date.now();
    const result = await getProjects(params, supabase);
    dbQueryTime = Date.now() - dbStart;

    const totalTime = Date.now() - startTime;

    // 性能监控：记录慢请求
    if (totalTime > 1000 || dbQueryTime > 500) {
      console.warn(`⚠️ 慢请求: GET /api/projects - 总耗时: ${totalTime}ms, 认证: ${authTime}ms, 数据库查询: ${dbQueryTime}ms`);
    } else if (process.env.NODE_ENV === 'development') {
      console.log(`✅ GET /api/projects - 总耗时: ${totalTime}ms, 认证: ${authTime}ms, 数据库查询: ${dbQueryTime}ms`);
    }

    // 添加 Server Timing 头（用于浏览器性能分析）
    const headers = new Headers();
    headers.set('Server-Timing', `auth;dur=${authTime},db;dur=${dbQueryTime},total;dur=${totalTime}`);

    return NextResponse.json(
      {
        success: true,
        data: result.data,
        total: result.total,
      },
      { headers }
    );
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`❌ 获取项目列表失败 (${totalTime}ms):`, error);
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

    // 创建项目（传入带认证的 supabase 客户端）
    const project = await createProject(body, user.id, supabase);

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

