import { useQuery, useMutation, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../query-keys';
import { apiClient } from '../client';
import type { components } from '@/lib/generated/api-types';

type TaskResource = components['schemas']['TaskResource'];

export function useTasks(filters: Record<string, unknown>) {
  return useQuery({
    queryKey: queryKeys.tasks.list(filters),
    queryFn: () =>
      apiClient.get<{ data: TaskResource[]; next_cursor: string | null; has_more: boolean }>(
        '/v1/tasks',
        { params: filters },
      ),
  });
}

export function useTask(publicId: string) {
  return useQuery({
    queryKey: queryKeys.tasks.detail(publicId),
    queryFn: () => apiClient.get<TaskResource>(`/v1/tasks/${publicId}`),
    enabled: !!publicId,
  });
}

export function useTasksInfinite(filters: Record<string, unknown>) {
  return useInfiniteQuery({
    queryKey: queryKeys.tasks.list(filters),
    queryFn: ({ pageParam }) =>
      apiClient.get<{ data: TaskResource[]; next_cursor: string | null; has_more: boolean }>(
        '/v1/tasks',
        { params: { ...filters, cursor: pageParam } },
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? lastPage.next_cursor : undefined,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiClient.post<TaskResource>('/v1/tasks', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() });
    },
  });
}
