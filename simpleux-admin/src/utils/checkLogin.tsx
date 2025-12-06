import { getCurrentSession } from '@/utils/supabaseAuth';

/**
 * 检查登录状态
 * 优先检查 Supabase session，如果没有则检查 localStorage
 */
export default async function checkLogin(): Promise<boolean> {
  try {
    // 检查 Supabase session
    const session = await getCurrentSession();
    if (session?.user) {
      return true;
    }

    // 降级检查 localStorage（兼容旧逻辑）
    return localStorage.getItem('userStatus') === 'login';
  } catch (error) {
    console.error('检查登录状态错误:', error);
    // 降级检查 localStorage
    return localStorage.getItem('userStatus') === 'login';
  }
}
