'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { apiClient, localizedApiError } from '@/lib/api/client';
import { queryKeys } from '@/lib/api/query-keys';
import type { components } from '@/lib/generated/api-types';

type TaskPriorityResource = components['schemas']['TaskPriorityResource'];
type StoreTaskPriorityRequest = components['schemas']['StoreTaskPriorityRequest'];
type UpdateTaskPriorityRequest = components['schemas']['UpdateTaskPriorityRequest'];

export function useTaskPriorities(all = false) {
  return useQuery({
    queryKey: [...queryKeys.tasks.priorities(), all],
    queryFn: () => apiClient.get<TaskPriorityResource[]>('/v1/tasks/priorities', { params: all ? { all: 'true' } : undefined }),
    staleTime: 60 * 1000,
  });
}

export function useCreateTaskPriority() {
  const qc = useQueryClient();
  const t = useTranslations('admin.toast');
  return useMutation({
    mutationFn: (body: StoreTaskPriorityRequest) =>
      apiClient.post<TaskPriorityResource>('/v1/tasks/priorities', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.tasks.priorities() });
      qc.invalidateQueries({ queryKey: queryKeys.taskBoard.lists() });
      qc.invalidateQueries({ queryKey: queryKeys.audit.systemLists() });
      toast.success(t('priority_created'));
    },
    onError: (e) => toast.error(localizedApiError(e, t)),
  });
}

export function useUpdateTaskPriority(publicId: string) {
  const qc = useQueryClient();
  const t = useTranslations('admin.toast');
  return useMutation({
    mutationFn: (body: UpdateTaskPriorityRequest) =>
      apiClient.put<TaskPriorityResource>(`/v1/tasks/priorities/${publicId}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.tasks.priorities() });
      qc.invalidateQueries({ queryKey: queryKeys.taskBoard.lists() });
      qc.invalidateQueries({ queryKey: queryKeys.audit.systemLists() });
      toast.success(t('priority_updated'));
    },
    onError: (e) => toast.error(localizedApiError(e, t)),
  });
}

export function useDeactivateTaskPriority(publicId: string) {
  const qc = useQueryClient();
  const t = useTranslations('admin.toast');
  return useMutation({
    mutationFn: () =>
      apiClient.post(`/v1/tasks/priorities/${publicId}/deactivate`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.tasks.priorities() });
      qc.invalidateQueries({ queryKey: queryKeys.taskBoard.lists() });
      qc.invalidateQueries({ queryKey: queryKeys.audit.systemLists() });
      toast.success(t('priority_deactivated'));
    },
    onError: (e) => toast.error(localizedApiError(e, t)),
  });
}

export function useReactivateTaskPriority(publicId: string) {
  const qc = useQueryClient();
  const t = useTranslations('admin.toast');
  return useMutation({
    mutationFn: () =>
      apiClient.post(`/v1/tasks/priorities/${publicId}/reactivate`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.tasks.priorities() });
      qc.invalidateQueries({ queryKey: queryKeys.taskBoard.lists() });
      qc.invalidateQueries({ queryKey: queryKeys.audit.systemLists() });
      toast.success(t('priority_reactivated'));
    },
    onError: (e) => toast.error(localizedApiError(e, t)),
  });
}
