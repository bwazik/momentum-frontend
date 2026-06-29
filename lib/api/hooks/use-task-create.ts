'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { apiClient } from '@/lib/api/client';
import { queryKeys } from '@/lib/api/query-keys';
import { toast } from 'sonner';
import type { components } from '@/lib/generated/api-types';

type TaskResource = components['schemas']['TaskResource'];
type TaskDetailResource = components['schemas']['TaskDetailResource'];
type StoreTaskRequest = components['schemas']['StoreTaskRequest'];
type UpdateTaskRequest = components['schemas']['UpdateTaskRequest'];
type LaunchTaskRequest = components['schemas']['LaunchTaskRequest'];
type ApiManualAssignment = NonNullable<StoreTaskRequest['manual_assignments']>[number];

export function toApiManual(map: Record<string, string[]>): ApiManualAssignment[] {
  return Object.entries(map)
    .filter(([, ids]) => ids.length > 0)
    .map(([key, user_ids]) =>
      key.startsWith('sub:')
        ? { blueprint_sub_stage_id: key.slice(4), user_ids }
        : { blueprint_stage_id: key, user_ids },
    );
}

function invalidateTaskCaches(qc: ReturnType<typeof useQueryClient>, publicId?: string) {
  qc.invalidateQueries({ queryKey: queryKeys.taskBoard.lists() });
  qc.invalidateQueries({ queryKey: queryKeys.tasks.lists() });
  if (publicId) {
    qc.invalidateQueries({ queryKey: queryKeys.tasks.detail(publicId) });
    qc.invalidateQueries({ queryKey: queryKeys.tasks.slaHealth(publicId) });
  }
}

export function useCreateTask() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (body: StoreTaskRequest) =>
      apiClient.post<TaskResource>('/v1/tasks', body),
    onSuccess: (data) => {
      invalidateTaskCaches(qc, data.public_id);
    },
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  const t = useTranslations('tasks.create.toast');

  return useMutation({
    mutationFn: ({ publicId, body }: { publicId: string; body: UpdateTaskRequest }) =>
      apiClient.put<TaskResource>(`/v1/tasks/${publicId}`, body),
    onSuccess: (data) => {
      invalidateTaskCaches(qc, data.public_id);
      toast.success(t('saved'));
    },
  });
}

export function useLaunchTask() {
  const qc = useQueryClient();
  const t = useTranslations('tasks.create.toast');

  return useMutation({
    mutationFn: ({ publicId, manualAssignments }: { publicId: string; manualAssignments?: Record<string, string[]> }) =>
      apiClient.post<TaskDetailResource>(
        `/v1/tasks/${publicId}/launch`,
        manualAssignments && Object.keys(manualAssignments).length > 0
          ? { manual_assignments: toApiManual(manualAssignments) } as LaunchTaskRequest
          : {} as LaunchTaskRequest,
      ),
    onSuccess: (data) => {
      invalidateTaskCaches(qc, data.public_id);
      toast.success(t('launched'));
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : String(error));
    },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  const t = useTranslations('tasks.create.toast');

  return useMutation({
    mutationFn: (publicId: string) => apiClient.delete(`/v1/tasks/${publicId}`),
    onSuccess: (_data, publicId) => {
      qc.removeQueries({ queryKey: queryKeys.tasks.detail(publicId) });
      invalidateTaskCaches(qc);
      toast.success(t('deleted'));
    },
  });
}
