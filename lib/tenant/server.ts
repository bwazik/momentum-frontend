import 'server-only';

import { headers } from 'next/headers';
import { QueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/api/query-keys';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.momentum.test';

interface TenantInfo {
  public_id: string;
  name_ar: string;
  name_en: string;
}

interface TenantResponse {
  tenant: TenantInfo;
}

export async function prefetchTenant(queryClient: QueryClient): Promise<void> {
  const headerStore = await headers();
  const host = headerStore.get('host') ?? '';
  const tenantSlug = host.split('.')[0] || process.env.NEXT_PUBLIC_DEFAULT_TENANT || 'moh';

  try {
    const res = await fetch(`${BASE_URL}/v1`, {
      method: 'GET',
      headers: {
        'X-Tenant': tenantSlug,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) return;

    const data = (await res.json()) as TenantResponse;

    queryClient.setQueryData(queryKeys.tenant.info, data);
  } catch {
    // Tenant info is non-critical — fail silently.
  }
}
