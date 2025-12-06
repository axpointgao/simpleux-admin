/**
 * 健康检查和性能诊断 API
 * GET /api/health - 健康检查
 * GET /api/health/db - 数据库连接测试
 * GET /api/health/performance - 性能诊断
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClientWithAuth } from '@/lib/supabase/server-with-auth';

/**
 * 健康检查
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'basic';

  if (type === 'db') {
    // 数据库连接测试
    const startTime = Date.now();
    try {
      const supabase = await createClientWithAuth(request);
      const { data, error } = await supabase
        .from('projects')
        .select('id')
        .limit(1);
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      if (error) {
        return NextResponse.json({
          success: false,
          error: error.message,
          duration,
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: '数据库连接正常',
        duration: `${duration}ms`,
        latency: duration,
      });
    } catch (error: any) {
      const endTime = Date.now();
      return NextResponse.json({
        success: false,
        error: error.message || '数据库连接失败',
        duration: `${endTime - startTime}ms`,
      }, { status: 500 });
    }
  }

  if (type === 'performance') {
    // 性能诊断
    const results: Record<string, any> = {};
    
    try {
      const supabase = await createClientWithAuth(request);
      
      // 1. 测试简单查询
      const simpleStart = Date.now();
      const { data: simpleData, error: simpleError } = await supabase
        .from('projects')
        .select('id')
        .limit(1);
      results.simpleQuery = {
        duration: Date.now() - simpleStart,
        success: !simpleError,
        error: simpleError?.message,
      };

      // 2. 测试分页查询
      const pageStart = Date.now();
      const { data: pageData, error: pageError } = await supabase
        .from('projects')
        .select('*', { count: 'exact' })
        .range(0, 9)
        .order('created_at', { ascending: false });
      results.paginatedQuery = {
        duration: Date.now() - pageStart,
        success: !pageError,
        error: pageError?.message,
        count: pageData?.length || 0,
      };

      // 3. 测试计数查询
      const countStart = Date.now();
      const { data: countData, error: countError, count } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true });
      results.countQuery = {
        duration: Date.now() - countStart,
        success: !countError,
        error: countError?.message,
        count: count || 0,
      };

      return NextResponse.json({
        success: true,
        results,
        summary: {
          totalDuration: Object.values(results).reduce((sum: number, r: any) => sum + (r.duration || 0), 0),
          averageDuration: Object.values(results).reduce((sum: number, r: any) => sum + (r.duration || 0), 0) / Object.keys(results).length,
        },
      });
    } catch (error: any) {
      return NextResponse.json({
        success: false,
        error: error.message || '性能诊断失败',
        results,
      }, { status: 500 });
    }
  }

  // 基本健康检查
  return NextResponse.json({
    success: true,
    message: 'API服务正常',
    timestamp: new Date().toISOString(),
  });
}

