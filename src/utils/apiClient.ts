/**
 * API 客户端（带 Supabase 认证）
 */
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { getAccessToken } from './supabaseAuth';

const API_BASE_URL =
  process.env.REACT_APP_API_URL || 'http://localhost:3002/api';

// 创建 axios 实例
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器：添加认证 token
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('获取 token 失败:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器：处理错误
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (error.response) {
      // 401 未授权，清除登录状态并跳转到登录页
      if (error.response.status === 401) {
        localStorage.removeItem('userStatus');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
