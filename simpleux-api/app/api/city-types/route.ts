/**
 * 城市类型管理 API
 * GET /api/city-types - 获取所有城市类型列表
 * POST /api/city-types - 创建城市类型
 */
import { NextRequest, NextResponse } from 'next/server';
import { getCityTypes, createCityType } from '@/lib/db/city-types';
import { createClientWithAuth } from '@/lib/supabase/server-with-auth';
import { verifyAuth } from '@/lib/utils/auth';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClientWithAuth(request);
    const { user, error } = await verifyAuth(supabase);

    if (error || !user) {
      return NextResponse.json(
        { success: false, error: '未登录' },
        { status: 401 }
      );
    }

    const cityTypes = await getCityTypes(supabase);

    return NextResponse.json({
      success: true,
      data: cityTypes,
    });
  } catch (error) {
    console.error('获取城市类型列表失败:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : '获取城市类型列表失败',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClientWithAuth(request);
    const { user, error } = await verifyAuth(supabase);

    if (error || !user) {
      return NextResponse.json(
        { success: false, error: '未登录' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, display_name, sort_order } = body;

    if (!name || !display_name) {
      return NextResponse.json(
        { success: false, error: '缺少必填字段：name, display_name' },
        { status: 400 }
      );
    }

    const cityType = await createCityType(
      {
        name,
        display_name,
        sort_order,
      },
      supabase
    );

    return NextResponse.json({
      success: true,
      data: cityType,
    });
  } catch (error) {
    console.error('创建城市类型失败:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : '创建城市类型失败',
      },
      { status: 500 }
    );
  }
}

