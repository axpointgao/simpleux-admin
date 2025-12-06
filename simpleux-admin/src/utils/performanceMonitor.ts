/**
 * 性能监控工具
 * 用于监控 API 请求性能
 */

interface PerformanceMetric {
  url: string;
  method: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  success?: boolean;
  error?: string;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 100; // 最多保存 100 条记录

  /**
   * 开始监控一个请求
   */
  start(url: string, method = 'GET'): string {
    const id = `${Date.now()}-${Math.random()}`;
    this.metrics.push({
      url,
      method,
      startTime: performance.now(),
    });

    // 限制记录数量
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    return id;
  }

  /**
   * 结束监控一个请求
   */
  end(url: string, success = true, error?: string) {
    const metric = this.metrics.find((m) => m.url === url && !m.endTime);
    if (metric) {
      metric.endTime = performance.now();
      metric.duration = metric.endTime - metric.startTime;
      metric.success = success;
      if (error) {
        metric.error = error;
      }
    }
  }

  /**
   * 获取性能统计
   */
  getStats() {
    const completed = this.metrics.filter((m) => m.duration !== undefined);
    if (completed.length === 0) {
      return {
        total: 0,
        average: 0,
        min: 0,
        max: 0,
        slowRequests: [],
      };
    }

    const durations = completed.map((m) => m.duration!);
    const average = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    const min = Math.min(...durations);
    const max = Math.max(...durations);

    // 找出慢请求（超过 1 秒）
    const slowRequests = completed
      .filter((m) => m.duration! > 1000)
      .sort((a, b) => (b.duration || 0) - (a.duration || 0))
      .slice(0, 10);

    return {
      total: completed.length,
      average: Math.round(average),
      min: Math.round(min),
      max: Math.round(max),
      slowRequests: slowRequests.map((m) => ({
        url: m.url,
        method: m.method,
        duration: Math.round(m.duration!),
        success: m.success,
        error: m.error,
      })),
    };
  }

  /**
   * 清空记录
   */
  clear() {
    this.metrics = [];
  }

  /**
   * 打印性能报告
   */
  printReport() {
    const stats = this.getStats();
    console.group('📊 API 性能报告');
    console.log(`总请求数: ${stats.total}`);
    console.log(`平均响应时间: ${stats.average}ms`);
    console.log(`最快: ${stats.min}ms`);
    console.log(`最慢: ${stats.max}ms`);

    if (stats.slowRequests.length > 0) {
      console.group('🐌 慢请求 (>1000ms)');
      stats.slowRequests.forEach((req) => {
        console.log(
          `${req.method} ${req.url}: ${req.duration}ms ${
            req.success ? '✅' : '❌'
          }`
        );
      });
      console.groupEnd();
    }
    console.groupEnd();
  }
}

// 创建全局实例
export const performanceMonitor = new PerformanceMonitor();

// 在开发环境下，定期打印性能报告
if (process.env.NODE_ENV === 'development') {
  // 每 30 秒打印一次报告
  setInterval(() => {
    if (performanceMonitor.getStats().total > 0) {
      performanceMonitor.printReport();
    }
  }, 30000);
}

// 导出工具函数
export function measurePerformance<T>(
  fn: () => Promise<T>,
  url: string,
  method = 'GET'
): Promise<T> {
  const startTime = performance.now();
  return fn()
    .then((result) => {
      const duration = performance.now() - startTime;
      performanceMonitor.end(url, true);
      if (duration > 1000) {
        console.warn(
          `⚠️ 慢请求: ${method} ${url} 耗时 ${Math.round(duration)}ms`
        );
      }
      return result;
    })
    .catch((error) => {
      performanceMonitor.end(url, false, error.message);
      throw error;
    });
}
