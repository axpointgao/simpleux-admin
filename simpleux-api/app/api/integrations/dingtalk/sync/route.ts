/**
 * 钉钉同步 API
 * POST /api/integrations/dingtalk/sync - 触发钉钉数据同步
 * GET /api/integrations/dingtalk/sync/status - 查询同步状态
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAuth } from '@/lib/utils/auth';

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
    const { type = 'full', scope = 'all' } = body;

    // TODO: 实现钉钉同步逻辑
    // 这里需要调用钉钉API，同步组织架构和人员信息
    // 暂时返回模拟数据

    return NextResponse.json({
      success: true,
      message: '同步完成',
      stats: {
        departments: {
          created: 0,
          updated: 0,
          deleted: 0,
        },
        users: {
          created: 0,
          updated: 0,
          left: 0,
        },
      },
    });
  } catch (error) {
    console.error('钉钉同步失败:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : '钉钉同步失败',
      },
      { status: 500 }
    );
  }
}

// GET 方法在 status/route.ts 中实现

