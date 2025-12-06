/**
 * 钉钉同步状态 API
 * GET /api/integrations/dingtalk/sync/status - 查询同步状态
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

    // TODO: 查询同步状态
    // 暂时返回模拟数据

    return NextResponse.json({
      success: true,
      data: {
        isRunning: false,
        lastSyncTime: null,
        lastSyncStatus: null,
        lastSyncStats: null,
      },
    });
  } catch (error) {
    console.error('查询同步状态失败:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : '查询同步状态失败',
      },
      { status: 500 }
    );
  }
}

