import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { queryKeys } from '@/lib/api/query-keys';
import type { BoardTaskResource, TaskPriorityResource, BlueprintCategoryResource, StageTypeResource, DepartmentResource } from '@/components/domain/tasks/task-board-types';
import type { BoardQuery } from '@/components/domain/tasks/task-board-types';

interface CursorPage<T> {
  data: T[];
  next_cursor: string | null;
  has_more: boolean;
}

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

export function useBlueprintCategories() {
  return useQuery({
    queryKey: queryKeys.blueprints.categories(),
    queryFn: () => apiClient.get<BlueprintCategoryResource[]>('/v1/blueprints/categories'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useStageTypes() {
  return useQuery({
    queryKey: queryKeys.blueprints.stageTypes(),
    queryFn: () => apiClient.get<StageTypeResource[]>('/v1/blueprints/stage-types'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useDepartmentsInfinite() {
  return useInfiniteQuery({
    queryKey: queryKeys.organization.departments({ is_active: true }),
    queryFn: ({ pageParam }) =>
      apiClient.get<CursorPage<DepartmentResource>>('/v1/organization/departments', {
        params: { is_active: true, per_page: 100, cursor: pageParam },
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? lastPage.next_cursor : undefined,
    staleTime: 5 * 60 * 1000,
  });
}
