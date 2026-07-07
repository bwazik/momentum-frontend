import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { apiClient, ApiRequestError } from '@/lib/api/client';
import { queryKeys } from '@/lib/api/query-keys';
import type { components } from '@/lib/generated/api-types';
import type { CursorPage } from '@/lib/api/types';

type BoardTaskResource = components['schemas']['BoardTaskResource'];
type BottleneckResource = components['schemas']['BottleneckResource'];
type FollowUpActionResource = components['schemas']['FollowUpActionResource'];
type StoreFollowUpActionRequest = components['schemas']['StoreFollowUpActionRequest'];

export interface FollowUpBoardFilters {
  status?: string | null;
  stage_type_id?: string | null;
  assignee_id?: string | null;
  department_id?: string | null;
  'priority_id[]'?: string[] | null;
  blueprint_category_id?: string | null;
  date_from?: string | null;
  date_to?: string | null;
  date_field?: string | null;
  search?: string | null;
  sort_by?: string | null;
  sort_direction?: string | null;
  per_page?: number | null;
  cursor?: string | null;
}

export function useFollowUpBoardInfinite(filters: FollowUpBoardFilters) {
  return useInfiniteQuery({
    queryKey: queryKeys.taskBoard.list(filters as unknown as Record<string, unknown>),
    queryFn: ({ pageParam }) =>
      apiClient.get<CursorPage<BoardTaskResource>>('/v1/follow-up/board', {
        params: { ...filters, cursor: pageParam },
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? lastPage.next_cursor : undefined,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
  });
}

export function useFollowUpOverdueInfinite(filters: Partial<FollowUpBoardFilters> = {}) {
  return useInfiniteQuery({
    queryKey: queryKeys.followUp.overdueList(filters as Record<string, unknown>),
    queryFn: ({ pageParam }) =>
      apiClient.get<CursorPage<BoardTaskResource>>('/v1/follow-up/overdue', {
        params: { ...filters, cursor: pageParam },
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? lastPage.next_cursor : undefined,
  });
}

export function useFollowUpAtRiskInfinite(filters: Partial<FollowUpBoardFilters> = {}) {
  return useInfiniteQuery({
    queryKey: queryKeys.followUp.atRiskList(filters as Record<string, unknown>),
    queryFn: ({ pageParam }) =>
      apiClient.get<CursorPage<BoardTaskResource>>('/v1/follow-up/at-risk', {
        params: { ...filters, cursor: pageParam },
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? lastPage.next_cursor : undefined,
  });
}

export function useFollowUpBottlenecks(filters: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: queryKeys.followUp.bottlenecks(filters),
    queryFn: () =>
      apiClient.get<{ data: BottleneckResource[] }>(
        '/v1/follow-up/bottlenecks',
        { params: filters },
      ),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAllFollowUpActions(filters: Record<string, unknown> = {}) {
  return useInfiniteQuery({
    queryKey: queryKeys.followUp.actionsAll(filters),
    queryFn: ({ pageParam }) =>
      apiClient.get<CursorPage<FollowUpActionResource>>('/v1/follow-up/actions', {
        params: { ...filters, cursor: pageParam },
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? lastPage.next_cursor : undefined,
    refetchOnWindowFocus: false,
  });
}

export function useFollowUpActions(taskPublicId: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.followUp.actionsTask(taskPublicId ?? ''),
    queryFn: () =>
      apiClient.get<CursorPage<FollowUpActionResource>>(
        `/v1/follow-up/tasks/${taskPublicId}/actions`,
        { params: { per_page: 5 } },
      ),
    enabled: !!taskPublicId,
    staleTime: 30 * 1000,
  });
}

export function useCreateFollowUpAction(taskPublicId: string) {
  const qc = useQueryClient();
  const t = useTranslations('followUp.actions');
  return useMutation({
    mutationFn: (body: StoreFollowUpActionRequest) =>
      apiClient.post<FollowUpActionResource>(
        `/v1/follow-up/tasks/${taskPublicId}/actions`,
        body,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.followUp.actionsTask(taskPublicId) });
      qc.invalidateQueries({ queryKey: queryKeys.followUp.actionsAll({}) });
      qc.invalidateQueries({ queryKey: queryKeys.taskBoard.lists() });
      toast.success(t('logged'));
    },
    onError: (error) => {
      if (error instanceof ApiRequestError) {
        toast.error(error.error.message);
      } else {
        toast.error(t('log_error'));
      }
    },
  });
}
