/**
 * 部门列表 API
 * GET /api/departments - 获取部门列表
 * GET /api/departments?tree=true - 获取部门树形结构
 */
import { NextRequest, NextResponse } from 'next/server';
import { getDepartments, getDepartmentTree } from '@/lib/db/departments';
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

    const searchParams = request.nextUrl.searchParams;
    const isTree = searchParams.get('tree') === 'true';

    if (isTree) {
      const tree = await getDepartmentTree();
      return NextResponse.json({
        success: true,
        data: tree,
      });
    } else {
      const departments = await getDepartments();
      return NextResponse.json({
        success: true,
        data: departments,
      });
    }
  } catch (error) {
    console.error('获取部门列表失败:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : '获取部门列表失败',
      },
      { status: 500 }
    );
  }
}

