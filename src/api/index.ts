/**
 * API 服务入口
 * 根据环境变量决定使用 mock 还是真实 API
 */

const USE_MOCK = process.env.REACT_APP_USE_MOCK === 'true';

// 项目相关 API
export * from './projects';

// 计件项目相关 API
export * from './frameworks';

// 如果使用 mock，导出 mock 函数
if (USE_MOCK) {
  // 在开发环境中，可以同时保留 mock 数据用于测试
  console.log('使用 Mock 数据模式');
}
