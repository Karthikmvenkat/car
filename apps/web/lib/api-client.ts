const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

/**
 * Uploaded assets (3D models, renders, AI previews) are served by the API
 * under /uploads. Resolve them against the API origin unless an explicit
 * asset/CDN base is configured.
 */
const ASSET_BASE_URL = (() => {
  if (process.env.NEXT_PUBLIC_ASSET_BASE_URL) return process.env.NEXT_PUBLIC_ASSET_BASE_URL.replace(/\/$/, '');
  if (/^https?:\/\//i.test(API_URL)) return new URL(API_URL).origin;
  return '';
})();

export function assetUrl(path?: string | null): string | null {
  if (!path) return null;
  if (/^(https?:|blob:|data:)/i.test(path)) return path;
  return `${ASSET_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}

interface ApiOptions extends RequestInit {
  token?: string;
}

class ApiError extends Error {
  constructor(
    public status: number,
    public data: any
  ) {
    const msg = data?.message;
    super(Array.isArray(msg) ? msg.join('; ') : msg || 'API request failed');
    this.name = 'ApiError';
  }
}

async function apiCall<T = any>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  const { token, ...fetchOptions } = options;

  const headers = new Headers(options.headers as Record<string, string>);
  // Let the browser set the multipart boundary for FormData bodies.
  if (!(fetchOptions.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  const text = await response.text();
  let data: any = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text.slice(0, 300) };
    }
  }

  if (!response.ok) {
    throw new ApiError(response.status, data || { message: response.statusText });
  }

  return data as T;
}

export const api = {
  get: <T = any>(endpoint: string, token?: string) =>
    apiCall<T>(endpoint, { method: 'GET', token }),

  post: <T = any>(endpoint: string, body?: any, token?: string) =>
    apiCall<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
      token,
    }),

  put: <T = any>(endpoint: string, body?: any, token?: string) =>
    apiCall<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
      token,
    }),

  delete: <T = any>(endpoint: string, token?: string) =>
    apiCall<T>(endpoint, { method: 'DELETE', token }),

  /** Multipart upload (files + string fields). */
  upload: <T = any>(endpoint: string, form: FormData, token?: string) =>
    apiCall<T>(endpoint, { method: 'POST', body: form, token }),
};

export { ApiError, API_URL };
