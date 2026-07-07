import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { queryKeys } from '@/lib/api/query-keys';
import type { CursorPage } from '@/lib/api/types';
import type { components, operations } from '@/lib/generated/api-types';

type BoardTaskResource = components['schemas']['BoardTaskResource'];
type TaskPriorityResource = components['schemas']['TaskPriorityResource'];
export type BoardQuery = NonNullable<operations['followUpBoard.board']['parameters']['query']> & { cursor?: string | null };

export function useTaskBoardInfinite(filters: BoardQuery) {
  return useInfiniteQuery({
    queryKey: queryKeys.taskBoard.list(filters as unknown as Record<string, unknown>),
    queryFn: ({ pageParam }) =>
      apiClient.get<CursorPage<BoardTaskResource>>('/v1/follow-up/board', {
        params: { ...filters, cursor: pageParam },
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? lastPage.next_cursor : undefined,
  });
}

export function useTaskPriorities() {
  return useQuery({
    queryKey: queryKeys.tasks.priorities(),
    queryFn: () => apiClient.get<TaskPriorityResource[]>('/v1/tasks/priorities'),
    staleTime: 5 * 60 * 1000,
  });
}

export { useBlueprintCategories, useBlueprintStageTypes as useStageTypes } from './use-blueprints';
