/**
 * 用户列表 API
 * GET /api/users - 获取用户列表
 */
import { NextRequest, NextResponse } from 'next/server';
import { getUsers } from '@/lib/db/users';
import { createClient } from '@/lib/supabase/server';
import { verifyAuth } from '@/lib/utils/auth';
import type { UserQueryParams } from '@/lib/db/users';

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
    const params: UserQueryParams = {
      keyword: searchParams.get('keyword') || undefined,
      department: searchParams.get('department')
        ? searchParams.get('department')!.split(',')
        : undefined,
      employee_level: searchParams.get('employee_level')
        ? searchParams.get('employee_level')!.split(',')
        : undefined,
      city_type: searchParams.get('city_type')
        ? searchParams.get('city_type')!.split(',')
        : undefined,
      status: searchParams.get('status')
        ? searchParams.get('status')!.split(',')
        : undefined,
      role: searchParams.get('role')
        ? searchParams.get('role')!.split(',')
        : undefined,
      current: searchParams.get('current')
        ? parseInt(searchParams.get('current')!)
        : 1,
      pageSize: searchParams.get('pageSize')
        ? parseInt(searchParams.get('pageSize')!)
        : 10,
    };

    // 查询用户列表
    const result = await getUsers(params);

    return NextResponse.json({
      success: true,
      data: result.data,
      total: result.total,
    });
  } catch (error) {
    console.error('获取用户列表失败:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : '获取用户列表失败',
      },
      { status: 500 }
    );
  }
}

