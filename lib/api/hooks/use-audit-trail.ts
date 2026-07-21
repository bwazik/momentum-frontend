'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { queryKeys, AuditFilters } from '@/lib/api/query-keys';
import { narrowAuditPage, type AuditEvent } from '@/lib/utils/audit-utils';

export function useSystemAuditInfinite(filters: AuditFilters) {
  return useInfiniteQuery({
    queryKey: queryKeys.audit.systemList(filters),
    queryFn: async ({ pageParam }) => {
      const raw = await apiClient.get<unknown>('/v1/audit-trail/system', {
        params: { ...filters, cursor: pageParam, per_page: filters.per_page ?? 20 },
      });
      return narrowAuditPage(raw);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => (last.has_more ? last.next_cursor : undefined),
    staleTime: 30 * 1000,
  });
}

export type { AuditEvent };
