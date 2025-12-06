/**
 * 用户详情和更新 API
 * GET /api/users/[id] - 获取用户详情
 * PUT /api/users/[id] - 更新用户信息
 */
import { NextRequest, NextResponse } from 'next/server';
import { getUserById, updateUser } from '@/lib/db/users';
import { createClient } from '@/lib/supabase/server';
import { verifyAuth } from '@/lib/utils/auth';
import type { UserUpdateInput } from '@/lib/db/users';

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

    const userData = await getUserById(params.id);

    if (!userData) {
      return NextResponse.json(
        { success: false, error: '用户不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: userData,
    });
  } catch (error) {
    console.error('获取用户详情失败:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : '获取用户详情失败',
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

    const body: UserUpdateInput = await request.json();

    // 验证必填字段
    if (body.employee_level && !['P0', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'P9', 'M0', 'M1', 'M2', 'M3', 'M4', 'M5'].includes(body.employee_level)) {
      return NextResponse.json(
        { success: false, error: '员工等级无效' },
        { status: 400 }
      );
    }

    if (body.city_type && !['Chengdu', 'Hangzhou'].includes(body.city_type)) {
      return NextResponse.json(
        { success: false, error: '城市类型无效' },
        { status: 400 }
      );
    }

    const updatedUser = await updateUser(params.id, body);

    return NextResponse.json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    console.error('更新用户信息失败:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : '更新用户信息失败',
      },
      { status: 500 }
    );
  }
}

