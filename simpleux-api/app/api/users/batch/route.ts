/**
 * 批量更新用户 API
 * POST /api/users/batch - 批量更新用户信息
 */
import { NextRequest, NextResponse } from 'next/server';
import { batchUpdateUsers } from '@/lib/db/users';
import { createClient } from '@/lib/supabase/server';
import { verifyAuth } from '@/lib/utils/auth';
import type { UserUpdateInput } from '@/lib/db/users';

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

    const body = await request.json();
    const { user_ids, ...updateData }: { user_ids: string[] } & UserUpdateInput = body;

    if (!user_ids || !Array.isArray(user_ids) || user_ids.length === 0) {
      return NextResponse.json(
        { success: false, error: '用户ID列表不能为空' },
        { status: 400 }
      );
    }

    // 验证必填字段
    if (updateData.employee_level && !['P0', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'P9', 'M0', 'M1', 'M2', 'M3', 'M4', 'M5'].includes(updateData.employee_level)) {
      return NextResponse.json(
        { success: false, error: '员工等级无效' },
        { status: 400 }
      );
    }

    if (updateData.city_type && !['Chengdu', 'Hangzhou'].includes(updateData.city_type)) {
      return NextResponse.json(
        { success: false, error: '城市类型无效' },
        { status: 400 }
      );
    }

    await batchUpdateUsers(user_ids, updateData);

    return NextResponse.json({
      success: true,
      message: '批量更新成功',
    });
  } catch (error) {
    console.error('批量更新用户失败:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : '批量更新用户失败',
      },
      { status: 500 }
    );
  }
}

