/**
 * 项目补录申请 API
 * POST /api/projects/:id/pending-entry - 提交项目补录申请
 */
import { NextRequest, NextResponse } from 'next/server';
import { submitPendingEntry } from '@/lib/db/project-pending-entry';
import { createClient } from '@/lib/supabase/server';
import { verifyAuth } from '@/lib/utils/auth';

export async function POST(
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

    // 解析请求体
    const body = await request.json();

    // 验证必填字段
    if (!body.contractAmount) {
      return NextResponse.json(
        { success: false, error: '缺少必填字段：contractAmount' },
        { status: 400 }
      );
    }

    // 提交项目补录申请
    const result = await submitPendingEntry(params.id, body, user.id);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('提交项目补录申请失败:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : '提交项目补录申请失败',
      },
      { status: 500 }
    );
  }
}

