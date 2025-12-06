/**
 * 角色列表 API
 * GET /api/roles - 获取系统角色列表
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAuth } from '@/lib/utils/auth';

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

    const { data, error: rolesError } = await supabase
      .from('roles')
      .select('*')
      .order('code', { ascending: true });

    if (rolesError) {
      console.error('获取角色列表失败:', rolesError);
      throw new Error(`获取角色列表失败: ${rolesError.message}`);
    }

    return NextResponse.json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    console.error('获取角色列表失败:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : '获取角色列表失败',
      },
      { status: 500 }
    );
  }
}

