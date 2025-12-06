/**
 * 成本标准详情、更新和删除 API
 * GET /api/cost-standards/:id - 获取成本标准详情
 * PUT /api/cost-standards/:id - 更新成本标准
 * DELETE /api/cost-standards/:id - 删除成本标准
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  getCostStandardById,
  updateCostStandard,
  deleteCostStandard,
} from '@/lib/db/cost-standards';
import { createClientWithAuth } from '@/lib/supabase/server-with-auth';
import { verifyAuth } from '@/lib/utils/auth';
import type { CostStandardUpdateInput } from '@/lib/db/cost-standards';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClientWithAuth(request);
    const { user, error } = await verifyAuth(supabase);

    if (error || !user) {
      return NextResponse.json(
        { success: false, error: '未登录' },
        { status: 401 }
      );
    }

    const costStandard = await getCostStandardById(params.id, supabase);

    if (!costStandard) {
      return NextResponse.json(
        { success: false, error: '成本标准不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: costStandard,
    });
  } catch (error) {
    console.error('获取成本标准详情失败:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : '获取成本标准详情失败',
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
    const supabase = await createClientWithAuth(request);
    const { user, error } = await verifyAuth(supabase);

    if (error || !user) {
      return NextResponse.json(
        { success: false, error: '未登录' },
        { status: 401 }
      );
    }

    const body: CostStandardUpdateInput = await request.json();

    // 验证 daily_cost > 0（如果提供了）
    if (body.daily_cost !== undefined && body.daily_cost <= 0) {
      return NextResponse.json(
        { success: false, error: '人日成本必须大于 0' },
        { status: 400 }
      );
    }

    const costStandard = await updateCostStandard(
      params.id,
      body,
      supabase
    );

    return NextResponse.json({
      success: true,
      data: costStandard,
    });
  } catch (error) {
    console.error('更新成本标准失败:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : '更新成本标准失败',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClientWithAuth(request);
    const { user, error } = await verifyAuth(supabase);

    if (error || !user) {
      return NextResponse.json(
        { success: false, error: '未登录' },
        { status: 401 }
      );
    }

    await deleteCostStandard(params.id, supabase);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('删除成本标准失败:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : '删除成本标准失败',
      },
      { status: 500 }
    );
  }
}

