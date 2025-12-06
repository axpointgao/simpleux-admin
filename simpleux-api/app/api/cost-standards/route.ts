/**
 * 成本标准列表和创建 API
 * GET /api/cost-standards - 获取成本标准列表
 * POST /api/cost-standards - 创建成本标准
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  getCostStandards,
  createCostStandard,
} from '@/lib/db/cost-standards';
import { createClientWithAuth } from '@/lib/supabase/server-with-auth';
import { verifyAuth } from '@/lib/utils/auth';
import type {
  CostStandardQueryParams,
  CostStandardCreateInput,
} from '@/lib/db/cost-standards';

export async function GET(request: NextRequest) {
  try {
    // 从请求头获取 token 创建 Supabase 客户端
    const supabase = await createClientWithAuth(request);
    const { user, error } = await verifyAuth(supabase);

    if (error || !user) {
      return NextResponse.json(
        { success: false, error: '未登录' },
        { status: 401 }
      );
    }

    // 解析查询参数
    const searchParams = request.nextUrl.searchParams;
    const params: CostStandardQueryParams = {
      employee_level: searchParams.get('employee_level')
        ? searchParams.get('employee_level')!.split(',')
        : undefined,
      city_type: searchParams.get('city_type')
        ? searchParams.get('city_type')!.split(',')
        : undefined,
      current: searchParams.get('current')
        ? parseInt(searchParams.get('current')!)
        : 1,
      pageSize: searchParams.get('pageSize')
        ? parseInt(searchParams.get('pageSize')!)
        : 10,
    };

    // 查询成本标准列表
    const result = await getCostStandards(params, supabase);

    // 调试：打印返回结果
    if (process.env.NODE_ENV === 'development') {
      console.log('GET /api/cost-standards - 返回结果:', {
        dataCount: result.data.length,
        total: result.total,
        firstItem: result.data[0] || null,
      });
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      total: result.total,
    });
  } catch (error) {
    console.error('获取成本标准列表失败:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : '获取成本标准列表失败',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // 从请求头获取 token 创建 Supabase 客户端
    const supabase = await createClientWithAuth(request);
    const { user, error } = await verifyAuth(supabase);

    if (error || !user) {
      return NextResponse.json(
        { success: false, error: '未登录' },
        { status: 401 }
      );
    }

    // 解析请求体
    let body: CostStandardCreateInput;
    try {
      const rawBody = await request.text();
      console.log('接收到的原始请求体 (text):', rawBody);
      
      if (!rawBody || rawBody.trim() === '') {
        return NextResponse.json(
          { success: false, error: '请求体为空' },
          { status: 400 }
        );
      }
      
      body = JSON.parse(rawBody);
      console.log('解析后的请求体 (JSON):', JSON.stringify(body, null, 2));
      console.log('解析后的请求体 (对象):', body);
      console.log('字段检查:', {
        employee_level: body.employee_level,
        city_type: body.city_type,
        daily_cost: body.daily_cost,
        effective_from: body.effective_from,
      });
    } catch (error: any) {
      console.error('解析请求体失败:', error);
      return NextResponse.json(
        { success: false, error: `解析请求体失败: ${error.message}` },
        { status: 400 }
      );
    }

    // 验证必填字段，提供更详细的错误信息
    const missingFields: string[] = [];
    
    // 检查员工级别
    if (!body.employee_level || (typeof body.employee_level === 'string' && body.employee_level.trim() === '')) {
      missingFields.push('员工级别');
    }
    
    // 检查城市类型
    if (!body.city_type || (typeof body.city_type === 'string' && body.city_type.trim() === '')) {
      missingFields.push('城市类型');
    }
    
    // 检查人日成本（必须是数字且大于 0）
    if (body.daily_cost === undefined || body.daily_cost === null || isNaN(Number(body.daily_cost)) || Number(body.daily_cost) <= 0) {
      missingFields.push('人日成本');
    }
    
    // 检查生效开始日期
    if (!body.effective_from || (typeof body.effective_from === 'string' && body.effective_from.trim() === '')) {
      missingFields.push('生效开始日期');
    }

    if (missingFields.length > 0) {
      console.error('验证失败，缺失字段:', missingFields);
      console.error('接收到的 body:', body);
      return NextResponse.json(
        { 
          success: false, 
          error: `缺少必填字段: ${missingFields.join(', ')}`,
          missingFields,
          receivedData: body // 返回接收到的数据用于调试
        },
        { status: 400 }
      );
    }

    // 验证 daily_cost > 0
    if (body.daily_cost <= 0) {
      return NextResponse.json(
        { success: false, error: '人日成本必须大于 0' },
        { status: 400 }
      );
    }

    // 创建成本标准
    const costStandard = await createCostStandard(body, user.id, supabase);

    return NextResponse.json({
      success: true,
      data: costStandard,
    });
  } catch (error) {
    console.error('创建成本标准失败:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : '创建成本标准失败',
      },
      { status: 500 }
    );
  }
}

