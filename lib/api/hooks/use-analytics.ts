import { useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { queryKeys } from '@/lib/api/query-keys';
import type { CursorPage } from '@/lib/api/types';
import type { operations } from '@/lib/generated/api-types';

export type AgingReportQuery = NonNullable<
  operations['agingReport.index']['parameters']['query']
>;

export function useAgingReportInfinite(filters: AgingReportQuery) {
  return useInfiniteQuery({
    queryKey: queryKeys.analytics.agingList(filters as unknown as Record<string, unknown>),
    queryFn: ({ pageParam }) =>
      apiClient.get<CursorPage<unknown>>('/v1/analytics/tasks/aging', {
        params: { ...filters, cursor: pageParam },
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? lastPage.next_cursor : undefined,
  });
}
