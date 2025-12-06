/**
 * 数据库性能监控工具
 */

interface QueryMetrics {
  query: string;
  duration: number;
  timestamp: number;
}

class DBPerformanceMonitor {
  private metrics: QueryMetrics[] = [];
  private maxMetrics = 50;

  record(query: string, duration: number) {
    this.metrics.push({
      query,
      duration,
      timestamp: Date.now(),
    });

    // 限制记录数量
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    // 记录慢查询
    if (duration > 500) {
      console.warn(`🐌 慢查询: ${query.substring(0, 100)}... 耗时: ${duration}ms`);
    }
  }

  getStats() {
    if (this.metrics.length === 0) {
      return {
        total: 0,
        average: 0,
        min: 0,
        max: 0,
        slowQueries: [],
      };
    }

    const durations = this.metrics.map(m => m.duration);
    const average = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    const min = Math.min(...durations);
    const max = Math.max(...durations);

    const slowQueries = this.metrics
      .filter(m => m.duration > 500)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    return {
      total: this.metrics.length,
      average: Math.round(average),
      min: Math.round(min),
      max: Math.round(max),
      slowQueries: slowQueries.map(m => ({
        query: m.query.substring(0, 100),
        duration: Math.round(m.duration),
      })),
    };
  }

  clear() {
    this.metrics = [];
  }
}

export const dbPerformanceMonitor = new DBPerformanceMonitor();

/**
 * 包装数据库查询，自动记录性能
 */
export async function measureQuery<T>(
  queryFn: () => Promise<T>,
  queryDescription: string
): Promise<T> {
  const startTime = Date.now();
  try {
    const result = await queryFn();
    const duration = Date.now() - startTime;
    dbPerformanceMonitor.record(queryDescription, duration);
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    dbPerformanceMonitor.record(`${queryDescription} (ERROR)`, duration);
    throw error;
  }
}

