/**
 * API 配置文件
 */
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { Message } from '@arco-design/web-react';

// API 基础 URL
const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || 'http://localhost:3002/api';

// 创建 axios 实例
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
apiClient.interceptors.request.use(
  async (config) => {
    // 性能监控：记录请求开始时间
    if (process.env.NODE_ENV === 'development') {
      const url = config.url || '';
      const fullUrl = config.baseURL ? `${config.baseURL}${url}` : url;
      (config as any).__startTime = performance.now();
      (config as any).__url = fullUrl;
    }

    // 优先从 Supabase session 获取 token
    try {
      const { supabase } = await import('@/lib/supabase/client');
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
        // 同时保存到 localStorage（用于兼容）
        localStorage.setItem('token', session.access_token);
      } else {
        // 降级：从 localStorage 获取 token
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (error) {
      // 如果 Supabase 未配置，降级使用 localStorage
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    // 对于项目相关的 API，使用 fetch adapter 绕过 mockjs
    const url = config.url || '';
    const fullUrl = config.baseURL ? `${config.baseURL}${url}` : url;

    if (
      fullUrl.includes('/api/projects') ||
      fullUrl.includes('/api/frameworks') ||
      fullUrl.includes('/api/users') ||
      fullUrl.includes('/api/departments') ||
      fullUrl.includes('/api/roles') ||
      fullUrl.includes('/api/integrations') ||
      fullUrl.includes('/api/cost-standards')
    ) {
      // 使用 fetch adapter 绕过 mockjs 的 XMLHttpRequest 拦截
      (config as any).adapter = async (adapterConfig: any) => {
        const adapterUrl = adapterConfig.url || '';
        const adapterFullUrl = adapterConfig.baseURL
          ? `${adapterConfig.baseURL}${adapterUrl}`
          : adapterUrl;

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (adapterConfig.headers) {
          Object.keys(adapterConfig.headers).forEach((key) => {
            const value = adapterConfig.headers[key];
            if (
              value !== undefined &&
              value !== null &&
              key.toLowerCase() !== 'content-type'
            ) {
              headers[key] = String(value);
            }
          });
        }

        // 确保 Authorization header 被正确传递
        if (config.headers?.Authorization) {
          headers['Authorization'] = config.headers.Authorization;
        }

        // 获取请求数据
        // axios 的 adapter 中，POST/PUT 等请求的数据在 config.data 中
        // 但 adapterConfig 是 config 的副本，所以数据应该在 adapterConfig.data 中
        // 如果 adapterConfig.data 不存在，尝试从原始 config.data 获取
        let requestData =
          adapterConfig.data !== undefined
            ? adapterConfig.data
            : config.data !== undefined
            ? config.data
            : null;

        // 如果 requestData 已经是字符串（可能被双重序列化了），尝试解析
        if (typeof requestData === 'string') {
          try {
            requestData = JSON.parse(requestData);
          } catch (e) {
            // 如果解析失败，保持原样
            console.warn(
              'Fetch adapter: requestData 是字符串但无法解析为 JSON:',
              requestData
            );
          }
        }

        // 调试：打印发送的数据
        if (process.env.NODE_ENV === 'development') {
          console.log(
            'Fetch adapter - adapterConfig.data:',
            adapterConfig.data
          );
          console.log('Fetch adapter - config.data:', config.data);
          console.log('Fetch adapter - 最终使用的数据:', requestData);
          if (requestData) {
            console.log(
              'Fetch adapter 发送的数据 (JSON):',
              JSON.stringify(requestData, null, 2)
            );
          }
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(
          () => controller.abort(),
          adapterConfig.timeout || 30000
        );

        try {
          // 确保 body 是正确的 JSON 字符串
          const bodyString = requestData
            ? JSON.stringify(requestData)
            : undefined;

          if (process.env.NODE_ENV === 'development' && bodyString) {
            console.log('Fetch adapter - 实际发送的 body 字符串:', bodyString);
          }

          const response = await fetch(adapterFullUrl, {
            method: (
              adapterConfig.method ||
              config.method ||
              'GET'
            ).toUpperCase(),
            headers,
            body: bodyString,
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          const data = await response.json();

          return {
            data,
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
            config: adapterConfig,
          };
        } catch (error: any) {
          clearTimeout(timeoutId);
          if (error.name === 'AbortError') {
            throw new Error('请求超时');
          }
          throw error;
        }
      };
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // 性能监控：记录请求耗时
    if (process.env.NODE_ENV === 'development') {
      const config = response.config as any;
      if (config.__startTime) {
        const duration = performance.now() - config.__startTime;
        const url = config.__url || config.url || '';
        const method = config.method?.toUpperCase() || 'GET';

        // 打印慢请求警告（超过 1 秒）
        if (duration > 1000) {
          console.warn(
            `⚠️ 慢请求: ${method} ${url} 耗时 ${Math.round(duration)}ms`
          );
        } else if (duration > 500) {
          console.info(
            `ℹ️ 请求: ${method} ${url} 耗时 ${Math.round(duration)}ms`
          );
        }
      }
    }

    const { data } = response;

    // 调试：打印响应数据
    if (
      process.env.NODE_ENV === 'development' &&
      response.config.url?.includes('/cost-standards')
    ) {
      console.log('响应拦截器 - 原始 response.data:', data);
      console.log('响应拦截器 - response.status:', response.status);
    }

    // 如果后端返回的是 { success: true, data: ... } 格式
    if (
      data &&
      typeof data === 'object' &&
      'success' in data &&
      data.success === false
    ) {
      Message.error((data as any).error || '请求失败');
      return Promise.reject(new Error((data as any).error || '请求失败'));
    }
    // 返回 data，这样在 API 函数中可以直接使用 response.data, response.total 等
    return data;
  },
  (error) => {
    // 性能监控：记录错误请求耗时
    if (process.env.NODE_ENV === 'development') {
      const config = error.config as any;
      if (config?.__startTime) {
        const duration = performance.now() - config.__startTime;
        const url = config.__url || config.url || '';
        const method = config.method?.toUpperCase() || 'GET';
        console.error(
          `❌ 请求失败: ${method} ${url} 耗时 ${Math.round(duration)}ms`,
          error.message
        );
      }
    }

    // 处理错误响应
    if (error.response) {
      const { status, data } = error.response;
      switch (status) {
        case 401:
          Message.error('未登录或登录已过期');
          // 可以在这里跳转到登录页
          break;
        case 403:
          Message.error('没有权限');
          break;
        case 404:
          Message.error('请求的资源不存在');
          break;
        case 500:
          Message.error(data?.error || '服务器错误');
          break;
        default:
          Message.error(data?.error || '请求失败');
      }
    } else if (error.request) {
      Message.error('网络错误，请检查网络连接');
    } else {
      Message.error('请求配置错误');
    }
    return Promise.reject(error);
  }
);

export default apiClient;
