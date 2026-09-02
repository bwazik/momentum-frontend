'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../client';
import { queryKeys } from '../query-keys';

interface TenantInfo {
  public_id: string;
  name_ar: string;
  name_en: string;
}

interface TenantResponse {
  tenant: TenantInfo;
}

export function useTenant(enabled = true) {
  return useQuery({
    queryKey: queryKeys.tenant.info,
    queryFn: () => apiClient.get<TenantResponse>('/v1'),
    enabled,
    staleTime: 30 * 60 * 1000,
  });
}

export function useTenantName() {
  const { data } = useTenant();
  return data?.tenant;
}
