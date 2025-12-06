/**
 * 认证结果缓存
 * 用于减少重复的认证请求，提升性能
 */

interface CachedAuth {
  user: any;
  timestamp: number;
}

// 简单的内存缓存
const authCache = new Map<string, CachedAuth>();
const CACHE_TTL = 30 * 1000; // 30 秒缓存

/**
 * 从 token 中提取用户 ID（简单实现，仅用于缓存键）
 */
function getUserIdFromToken(token: string): string | null {
  try {
    // JWT token 格式：header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    // 解码 payload（base64）
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    return payload.sub || payload.user_id || null;
  } catch {
    return null;
  }
}

/**
 * 获取缓存的认证结果
 */
export function getCachedAuth(token: string | null): any | null {
  if (!token) return null;
  
  const userId = getUserIdFromToken(token);
  if (!userId) return null;
  
  const cached = authCache.get(userId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.user;
  }
  
  return null;
}

/**
 * 缓存认证结果
 */
export function setCachedAuth(token: string | null, user: any): void {
  if (!token || !user) return;
  
  const userId = getUserIdFromToken(token);
  if (!userId) return;
  
  authCache.set(userId, {
    user,
    timestamp: Date.now(),
  });
}

/**
 * 清除认证缓存
 */
export function clearAuthCache(userId?: string): void {
  if (userId) {
    authCache.delete(userId);
  } else {
    authCache.clear();
  }
}

/**
 * 清理过期的缓存
 */
export function cleanExpiredCache(): void {
  const now = Date.now();
  for (const [userId, cached] of authCache.entries()) {
    if (now - cached.timestamp >= CACHE_TTL) {
      authCache.delete(userId);
    }
  }
}

// 定期清理过期缓存（每 5 分钟）
if (typeof setInterval !== 'undefined') {
  setInterval(cleanExpiredCache, 5 * 60 * 1000);
}

