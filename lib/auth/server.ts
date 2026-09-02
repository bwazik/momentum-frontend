import 'server-only';

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/api/query-keys';
import { ApiRequestError } from '@/lib/api/client';
import type { components } from '@/lib/generated/api-types';

type UserResource = components['schemas']['UserResource'];
type PlatformAdminResource = components['schemas']['PlatformAdminResource'];

const BASE_URL = process.env.BACKEND_API_URL
  || (process.env.NODE_ENV === 'development' ? 'http://api.momentum.test' : 'https://api.momentum.test');
const COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'momentum-session';

export async function prefetchAuthenticatedUser(queryClient: QueryClient): Promise<void> {
  const cookieStore = await cookies();
  const headerStore = await headers();

  const sessionCookie = cookieStore.get(COOKIE_NAME);
  const host = headerStore.get('host') ?? '';
  const tenantSlug = host.split('.')[0] || process.env.NEXT_PUBLIC_DEFAULT_TENANT || 'moh';
  const locale = cookieStore.get('NEXT_LOCALE')?.value ?? 'ar';

  if (!sessionCookie) {
    redirect('/login');
  }

  const proto = headerStore.get('x-forwarded-proto') || 'http';
  const origin = `${proto}://${host}`;

  // Fetch at top level so redirect() propagates correctly to Next.js.
  // redirect() inside a TanStack Query callback would be swallowed.
  const res = await fetch(`${BASE_URL}/v1/iam/auth/me`, {
    method: 'GET',
    headers: {
      Cookie: `${COOKIE_NAME}=${sessionCookie.value}`,
      'X-Tenant': tenantSlug,
      'X-Locale': locale,
      Origin: origin,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(5000),
  });

  if (res.status === 401) {
    redirect('/login');
  }

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({ message: res.statusText }));
    throw new ApiRequestError(res.status, errorBody);
  }

  const userData = (await res.json()) as UserResource;

  // Populate the query cache with the fetched data so client-side
  // useCurrentUser() returns immediately without a second network request.
  queryClient.setQueryData(queryKeys.auth.me, userData);
}

export async function prefetchPlatformAdmin(queryClient: QueryClient): Promise<void> {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const sessionCookie = cookieStore.get(COOKIE_NAME);
  const locale = cookieStore.get('NEXT_LOCALE')?.value ?? 'ar';

  if (!sessionCookie) redirect('/login');

  const host = headerStore.get('host') ?? '';
  const proto = headerStore.get('x-forwarded-proto') || 'http';
  const res = await fetch(`${BASE_URL}/v1/platform/auth/me`, {
    headers: {
      Cookie: `${COOKIE_NAME}=${sessionCookie.value}`,
      'X-Locale': locale,
      Origin: `${proto}://${host}`,
      Accept: 'application/json',
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(5000),
  });

  if (res.status === 401) redirect('/login');
  if (!res.ok) throw new ApiRequestError(res.status, await res.json().catch(() => ({ message: res.statusText })));
  queryClient.setQueryData(queryKeys.platform.auth.me(), (await res.json()) as PlatformAdminResource);
}
