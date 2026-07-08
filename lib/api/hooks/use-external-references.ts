'use client';

import { useMemo } from 'react';
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { apiClient, ApiRequestError } from '@/lib/api/client';
import { queryKeys } from '@/lib/api/query-keys';
import { toast } from 'sonner';
import type { CursorPage } from '@/lib/api/types';
import { asBool } from '@/components/domain/organization/organization-utils';
import type {
  TaskExternalReferenceResource,
  ExternalEntityResource,
  StoreTaskExternalReferenceRequest,
  UpdateTaskExternalReferenceRequest,
  StoreExternalEntityRequest,
  UpdateExternalEntityRequest,
} from '@/components/domain/tasks/task-external-reference-types';

export function useTaskExternalReferences(taskPublicId: string) {
  return useInfiniteQuery({
    queryKey: queryKeys.tasks.externalReferences(taskPublicId, { per_page: 15 }),
    queryFn: ({ pageParam }) =>
      apiClient.get<CursorPage<TaskExternalReferenceResource>>(
        `/v1/tasks/${taskPublicId}/external-references`,
        { params: { cursor: pageParam, per_page: 15 } },
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? lastPage.next_cursor : undefined,
    enabled: !!taskPublicId,
  });
}

export function useExternalEntities() {
  return useQuery({
    queryKey: queryKeys.tasks.externalEntities(),
    queryFn: () =>
      apiClient.get<ExternalEntityResource[]>('/v1/tasks/external-entities', {
        params: { all: true },
      }),
    staleTime: 5 * 60 * 1000,
  });
}

export function useActiveExternalEntities() {
  const { data, ...rest } = useExternalEntities();
  const active = useMemo(() => (data ?? []).filter((e) => asBool(e.is_active)), [data]);
  return { data: active, ...rest };
}

export function useCreateTaskExternalReference(taskPublicId: string) {
  const t = useTranslations('tasks.references');
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: StoreTaskExternalReferenceRequest) =>
      apiClient.post<TaskExternalReferenceResource>(
        `/v1/tasks/${taskPublicId}/external-references`,
        body,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.tasks.detail(taskPublicId), 'external-references'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.timeline(taskPublicId) });
      toast.success(t('toast_created'));
    },
    onError: (error) => {
      if (!(error instanceof ApiRequestError && error.status === 422)) {
        toast.error(error.message);
      }
    },
  });
}

export function useUpdateTaskExternalReference(taskPublicId: string) {
  const t = useTranslations('tasks.references');
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { referencePublicId: string; body: UpdateTaskExternalReferenceRequest }) =>
      apiClient.put<TaskExternalReferenceResource>(
        `/v1/tasks/${taskPublicId}/external-references/${vars.referencePublicId}`,
        vars.body,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.tasks.detail(taskPublicId), 'external-references'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.timeline(taskPublicId) });
      toast.success(t('toast_updated'));
    },
    onError: (error) => {
      if (!(error instanceof ApiRequestError && error.status === 422)) {
        toast.error(error.message);
      }
    },
  });
}

export function useDeleteTaskExternalReference(taskPublicId: string) {
  const t = useTranslations('tasks.references');
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (referencePublicId: string) =>
      apiClient.delete<void>(`/v1/tasks/${taskPublicId}/external-references/${referencePublicId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.tasks.detail(taskPublicId), 'external-references'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.timeline(taskPublicId) });
      toast.success(t('toast_deleted'));
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useCreateExternalEntity() {
  const t = useTranslations('tasks.entities');
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: StoreExternalEntityRequest) =>
      apiClient.post<ExternalEntityResource>('/v1/tasks/external-entities', body),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.externalEntities() });
      toast.success(t('toast_created'));
      return data;
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useUpdateExternalEntity() {
  const t = useTranslations('tasks.entities');
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vars: { entityPublicId: string; body: UpdateExternalEntityRequest }) =>
      apiClient.put<ExternalEntityResource>(`/v1/tasks/external-entities/${vars.entityPublicId}`, vars.body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.externalEntities() });
      toast.success(t('toast_updated'));
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useDeactivateExternalEntity() {
  const t = useTranslations('tasks.entities');
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entityPublicId: string) =>
      apiClient.post<ExternalEntityResource>(`/v1/tasks/external-entities/${entityPublicId}/deactivate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.externalEntities() });
      toast.success(t('toast_deactivated'));
    },
    onError: (error) => toast.error(error.message),
  });
}

export function useReactivateExternalEntity() {
  const t = useTranslations('tasks.entities');
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (entityPublicId: string) =>
      apiClient.post<ExternalEntityResource>(`/v1/tasks/external-entities/${entityPublicId}/reactivate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.externalEntities() });
      toast.success(t('toast_reactivated'));
    },
    onError: (error) => toast.error(error.message),
  });
}
