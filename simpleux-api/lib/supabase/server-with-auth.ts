/**
 * Supabase 服务端客户端（支持从请求头获取 token）
 * 用于 API 路由中从 Authorization header 获取 token
 */
import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

/**
 * 从请求头获取 token
 */
export function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  return authHeader?.replace('Bearer ', '') || null;
}

/**
 * 从请求头创建带认证的 Supabase 客户端
 */
export async function createClientWithAuth(request: NextRequest) {
  // 从 Authorization header 获取 token
  const token = getTokenFromRequest(request);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  // 创建 Supabase 客户端
  // 使用 global.headers 传递 token，这样 Supabase 会在每次请求时使用这个 token
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {},
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      // 重要：设置 detectSessionInUrl 为 false，因为我们通过 header 传递 token
      detectSessionInUrl: false,
    },
    db: {
      schema: 'public',
    },
  });

  // 如果有 token，验证并设置用户上下文
  // 这样 RLS 策略中的 auth.uid() 才能正确工作
  if (token) {
    try {
      // 使用 getUser 验证 token 并设置用户上下文
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.warn('createClientWithAuth - 无法获取用户信息:', error.message);
      } else if (user) {
        if (process.env.NODE_ENV === 'development') {
          console.log('createClientWithAuth - 用户上下文已设置:', user.id, user.email);
        }
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.warn('createClientWithAuth - 用户信息为空，token 可能无效');
        }
      }
    } catch (error) {
      console.warn('createClientWithAuth - 设置用户上下文失败:', error);
    }
  }

  return supabase;
}

