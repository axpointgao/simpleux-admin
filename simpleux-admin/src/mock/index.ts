import Mock from 'mockjs';
import { isSSR } from '@/utils/is';

import './user';
import './message-box';

if (!isSSR) {
  Mock.setup({
    timeout: '500-1500',
  });

  // 注意：项目相关的 API (/api/projects, /api/frameworks) 不使用 mock
  // 这些请求会直接发送到后端服务器 (http://localhost:3002/api)
  // 只有 /api/user 和 /api/message 等使用 mock 数据
}
