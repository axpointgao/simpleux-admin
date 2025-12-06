/**
 * 认证工具函数
 */
import { SupabaseClient } from '@supabase/supabase-js';
import { getCachedAuth, setCachedAuth } from './auth-cache';

export interface AuthResult {
  user: any | null;
  error: string | null;
}

/**
 * 从 Supabase 客户端获取 token
 */
function getTokenFromClient(supabase: SupabaseClient): string | null {
  // 尝试从客户端的 headers 中获取 token
  // 注意：这是一个简化的实现，实际可能需要从请求中获取
  return null;
}

/**
 * 验证用户登录（带缓存优化）
 */
export async function verifyAuth(
  supabase: SupabaseClient,
  token?: string | null
): Promise<AuthResult> {
  try {
    // 性能优化：先检查缓存
    if (token) {
      const cachedUser = getCachedAuth(token);
      if (cachedUser) {
        return { user: cachedUser, error: null };
      }
    }

    // 开发模式下可以跳过验证
    if (process.env.NODE_ENV === 'development') {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        // 开发模式下返回一个模拟用户
        return {
          user: {
            id: 'dev-user-id',
            email: 'dev@example.com',
          },
          error: null,
        };
      }
      
      // 缓存认证结果
      if (token) {
        setCachedAuth(token, user);
      }
      
      return { user, error: null };
    }

    // 生产模式下必须验证
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      return { user: null, error: error.message };
    }

    if (!user) {
      return { user: null, error: '未登录' };
    }

    // 缓存认证结果
    if (token) {
      setCachedAuth(token, user);
    }

    return { user, error: null };
  } catch (error) {
    return {
      user: null,
      error: error instanceof Error ? error.message : '认证失败',
    };
  }
}


