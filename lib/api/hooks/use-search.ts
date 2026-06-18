import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../client';
import { extraQueryKeys } from '../query-keys-extra';

interface SearchResult {
  public_id: string;
  title_ar?: string;
  title_en?: string;
  status?: string;
  snippet_ar?: string;
  snippet_en?: string;
}

interface RecentActivityItem {
  public_id: string;
  title_ar?: string;
  title_en?: string;
  status?: string;
  activity_type: string;
  occurred_at: string;
}

export function useSearch(query: string) {
  return useQuery({
    queryKey: extraQueryKeys.search.list({ q: query }),
    queryFn: () =>
      apiClient.get<{ data: SearchResult[] }>('/v1/search', {
        params: { q: query, per_page: 10 },
      }),
    enabled: query.length >= 2,
  });
}

export function useRecentActivity() {
  return useQuery({
    queryKey: extraQueryKeys.search.recent(),
    queryFn: () => apiClient.get<{ data: RecentActivityItem[] }>('/v1/search/recent'),
  });
}
