import { getTenantSlug } from '@/lib/utils/tenant';

function getLocaleSlug(): string {
  if (typeof document === 'undefined') return 'ar';
  const match = document.cookie.match(/NEXT_LOCALE=([^;]+)/);
  return match ? match[1] : 'ar';
}

function isFormData(body: unknown): body is FormData {
  return typeof FormData !== 'undefined' && body instanceof FormData;
}

function isPlatformPath(path: string): boolean {
  return path.startsWith('/v1/platform/');
}

interface ApiErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
}

function getBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return (
    process.env.BACKEND_API_URL ||
    (process.env.NODE_ENV === 'development'
      ? 'http://api.momentum.test'
      : 'https://api.momentum.test')
  );
}

interface RequestOptions {
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
}

function getXsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function getImpersonationToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/impersonation_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  options?: RequestOptions,
): Promise<T> {
  const url = new URL(path, getBaseUrl());

  if (options?.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') return;

      if (Array.isArray(value)) {
        value.forEach((item) => {
          if (item !== undefined && item !== null && item !== '') {
            url.searchParams.append(key, String(item));
          }
        });
        return;
      }

      url.searchParams.set(key, typeof value === 'boolean' ? (value ? '1' : '0') : String(value));
    });
  }

  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'X-Locale': getLocaleSlug(),
    ...options?.headers,
  };

  const impersonationToken = !isPlatformPath(path) ? getImpersonationToken() : null;
  if (!isPlatformPath(path)) {
    headers['X-Tenant'] = getTenantSlug();
    if (impersonationToken) {
      headers['Authorization'] = `Bearer ${impersonationToken}`;
    }
  }

  const bodyIsFormData = isFormData(body);
  if (!bodyIsFormData) {
    headers['Content-Type'] = 'application/json';
  }

  const xsrf = getXsrfToken();
  if (xsrf && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    headers['X-XSRF-TOKEN'] = xsrf;
  }

  const response = await fetch(url.toString(), {
    method,
    credentials: impersonationToken ? 'omit' : 'include',
    headers,
    body: bodyIsFormData ? body : (body ? JSON.stringify(body) : undefined),
  });

  if (!response.ok) {
    const error: ApiErrorResponse = await response.json().catch(() => ({
      message: response.statusText,
    }));
    throw new ApiRequestError(response.status, error);
  }

  if (response.status === 204) return undefined as T;

  return response.json();
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>('GET', path, undefined, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('POST', path, body, options),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PUT', path, body, options),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PATCH', path, body, options),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>('DELETE', path, undefined, options),
};

export class ApiRequestError extends Error {
  constructor(
    public status: number,
    public error: ApiErrorResponse,
  ) {
    super(error.message);
    this.name = 'ApiRequestError';
  }
}

export function localizedApiError(e: unknown, t: (key: string) => string): string {
  if (e instanceof ApiRequestError && e.error?.message) return e.error.message;
  return t('generic_error');
}
