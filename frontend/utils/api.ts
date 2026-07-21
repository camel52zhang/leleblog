// utils/api.ts - 带 JWT 认证的 API 请求工具

export function authedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem('admin_token');
  if (!token) {
    // 未登录，跳转到登录页
    if (typeof window !== 'undefined') {
      window.location.href = '/admin/login';
    }
    return Promise.reject(new Error('未登录'));
  }

  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${token}`);

  return fetch(url, {
    ...options,
    headers,
  }).then(res => {
    if (res.status === 401) {
      localStorage.removeItem('admin_token');
      if (typeof window !== 'undefined') {
        window.location.href = '/admin/login';
      }
      throw new Error('令牌已过期，请重新登录');
    }
    return res;
  });
}
