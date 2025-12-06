/**
 * 钉钉 OAuth 登录工具函数
 */

/**
 * 钉钉 OAuth 配置
 */
const DINGTALK_CONFIG = {
  // 钉钉 OAuth 授权地址
  authUrl:
    process.env.REACT_APP_DINGTALK_AUTH_URL ||
    'https://oapi.dingtalk.com/connect/oauth2/sns_authorize',
  // 应用 AppKey
  appKey: process.env.REACT_APP_DINGTALK_APP_KEY || '',
  // 回调地址（由后端处理）
  redirectUri:
    process.env.REACT_APP_DINGTALK_REDIRECT_URI ||
    `${window.location.origin}/api/auth/dingtalk/callback`,
  // 响应类型
  responseType: 'code',
  // 授权范围
  scope: 'openid',
};

/**
 * 生成钉钉 OAuth 授权 URL
 */
export function getDingtalkAuthUrl(): string {
  const params = new URLSearchParams({
    appid: DINGTALK_CONFIG.appKey,
    response_type: DINGTALK_CONFIG.responseType,
    scope: DINGTALK_CONFIG.scope,
    redirect_uri: DINGTALK_CONFIG.redirectUri,
    state: generateState(), // 防止 CSRF 攻击
  });

  return `${DINGTALK_CONFIG.authUrl}?${params.toString()}`;
}

/**
 * 生成随机 state 参数（用于防止 CSRF 攻击）
 */
function generateState(): string {
  const state =
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
  // 保存到 sessionStorage，用于回调时验证
  sessionStorage.setItem('dingtalk_oauth_state', state);
  return state;
}

/**
 * 验证 state 参数
 */
export function verifyState(state: string): boolean {
  const savedState = sessionStorage.getItem('dingtalk_oauth_state');
  if (savedState && savedState === state) {
    sessionStorage.removeItem('dingtalk_oauth_state');
    return true;
  }
  return false;
}

/**
 * 跳转到钉钉授权页面
 */
export function redirectToDingtalk() {
  const authUrl = getDingtalkAuthUrl();
  window.location.href = authUrl;
}

/**
 * 处理钉钉登录回调（由后端 API 处理，前端只需要跳转）
 * 后端会处理钉钉回调，创建 Supabase session，然后重定向回前端
 */
export async function handleDingtalkCallback(
  code: string,
  state: string
): Promise<void> {
  // 验证 state
  if (!verifyState(state)) {
    throw new Error('Invalid state parameter');
  }

  // 调用后端 API 处理钉钉回调
  const response = await fetch('/api/auth/dingtalk/callback', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code, state }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || '钉钉登录失败');
  }

  const data = await response.json();

  // 如果后端返回了 Supabase session，可以在这里处理
  if (data.session) {
    // 保存 session（如果需要）
    localStorage.setItem('userStatus', 'login');
  }

  // 重定向到首页
  window.location.href = '/';
}
