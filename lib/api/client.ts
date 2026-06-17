import type { ApiError } from '@/lib/generated/api-types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.momentum.test';

interface RequestOptions {
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
}

function getXsrfToken(): string | null {
  const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  options?: RequestOptions,
): Promise<T> {
  const url = new URL(path, BASE_URL);

  if (options?.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...options?.headers,
  };

  const xsrf = getXsrfToken();
  if (xsrf && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    headers['X-XSRF-TOKEN'] = xsrf;
  }

  const response = await fetch(url.toString(), {
    method,
    credentials: 'include',
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
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
    public error: ApiError,
  ) {
    super(error.message);
    this.name = 'ApiRequestError';
  }
}
