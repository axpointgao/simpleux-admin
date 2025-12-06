/**
 * 获取所有城市类型列表 API
 * GET /api/cost-standards/city-types - 从 city_types 表获取所有城市类型列表
 */
import { NextRequest, NextResponse } from 'next/server';
import { getCityTypes } from '@/lib/db/city-types';
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
    
    // 只返回名称数组，减少数据传输量
    const cityNames = cityTypes.map(ct => ct.name);

    return NextResponse.json({
      success: true,
      data: cityNames,
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

