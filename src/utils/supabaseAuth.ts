/**
 * Supabase 认证工具函数
 */
import { supabase } from '@/lib/supabase/client';
import { Message } from '@arco-design/web-react';

export interface SignInParams {
  email: string;
  password: string;
}

export interface SignUpParams {
  email: string;
  password: string;
  name?: string;
}

/**
 * 登录
 */
export async function signIn(params: SignInParams) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: params.email,
      password: params.password,
    });

    if (error) {
      throw error;
    }

    if (data.user) {
      // 保存用户信息到 localStorage
      localStorage.setItem('userStatus', 'login');
      localStorage.setItem('userId', data.user.id);
      localStorage.setItem('userEmail', data.user.email || '');

      // 保存 session token（用于 API 请求）
      if (data.session?.access_token) {
        localStorage.setItem('token', data.session.access_token);
      }

      return {
        success: true,
        user: data.user,
        session: data.session,
      };
    }

    throw new Error('登录失败：未返回用户信息');
  } catch (error: any) {
    console.error('登录错误:', error);
    const errorMessage = error.message || '登录失败，请检查邮箱和密码是否正确';
    Message.error(errorMessage);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * 登出
 */
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }

    // 清除本地存储
    localStorage.removeItem('userStatus');
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('token');

    return {
      success: true,
    };
  } catch (error: any) {
    console.error('登出错误:', error);
    Message.error(error.message || '登出失败');
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * 获取当前用户
 */
export async function getCurrentUser() {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error) {
      throw error;
    }

    return user;
  } catch (error: any) {
    console.error('获取用户错误:', error);
    return null;
  }
}

/**
 * 获取当前 session
 */
export async function getCurrentSession() {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      throw error;
    }

    return session;
  } catch (error: any) {
    console.error('获取 session 错误:', error);
    return null;
  }
}

/**
 * 获取访问令牌
 */
export async function getAccessToken(): Promise<string | null> {
  try {
    // 优先从 Supabase session 获取
    const session = await getCurrentSession();
    if (session?.access_token) {
      return session.access_token;
    }

    // 降级：从 localStorage 获取
    return localStorage.getItem('token');
  } catch (error) {
    console.error('获取访问令牌失败:', error);
    // 降级：从 localStorage 获取
    return localStorage.getItem('token');
  }
}

/**
 * 监听认证状态变化
 */
export function onAuthStateChange(callback: (user: any) => void) {
  return supabase.auth.onAuthStateChange((event, session) => {
    if (session?.user) {
      localStorage.setItem('userStatus', 'login');
      localStorage.setItem('userId', session.user.id);
      localStorage.setItem('userEmail', session.user.email || '');
      if (session.access_token) {
        localStorage.setItem('token', session.access_token);
      }
      callback(session.user);
    } else {
      localStorage.removeItem('userStatus');
      localStorage.removeItem('userId');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('token');
      callback(null);
    }
  });
}
