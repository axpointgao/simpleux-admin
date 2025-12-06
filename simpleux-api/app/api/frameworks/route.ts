/**
 * 计件项目列表和创建 API
 * GET /api/frameworks - 获取计件项目列表
 * POST /api/frameworks - 创建计件项目
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  getFrameworks,
  createFramework,
} from '@/lib/db/frameworks';
import { createClient } from '@/lib/supabase/server';
import { verifyAuth } from '@/lib/utils/auth';
import type {
  FrameworkQueryParams,
  FrameworkCreateInput,
} from '@/lib/types/framework';

export async function GET(request: NextRequest) {
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

    // 解析查询参数
    const searchParams = request.nextUrl.searchParams;
    const params: FrameworkQueryParams = {
      keyword: searchParams.get('keyword') || undefined,
      manager: searchParams.get('manager')
        ? searchParams.get('manager')!.split(',')
        : undefined,
      group: searchParams.get('group')
        ? searchParams.get('group')!.split(',')
        : undefined,
      clientDept: searchParams.get('clientDept')
        ? searchParams.get('clientDept')!.split(',')
        : undefined,
      current: searchParams.get('current')
        ? parseInt(searchParams.get('current')!)
        : 1,
      pageSize: searchParams.get('pageSize')
        ? parseInt(searchParams.get('pageSize')!)
        : 10,
    };

    // 查询计件项目列表
    const result = await getFrameworks(params);

    return NextResponse.json({
      success: true,
      data: result.data,
      total: result.total,
    });
  } catch (error) {
    console.error('获取计件项目列表失败:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : '获取计件项目列表失败',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    // 创建计件项目
    const framework = await createFramework(body, user.id);

    return NextResponse.json({
      success: true,
      data: framework,
    });
  } catch (error) {
    console.error('创建计件项目失败:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : '创建计件项目失败',
      },
      { status: 500 }
    );
  }
}

