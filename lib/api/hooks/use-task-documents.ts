import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { apiClient, ApiRequestError } from '@/lib/api/client';
import { queryKeys } from '@/lib/api/query-keys';
import { toast } from 'sonner';
import type { components } from '@/lib/generated/api-types';

export type DocumentResource = components['schemas']['DocumentResource'];
export type DocumentVersionResource = components['schemas']['DocumentVersionResource'];

interface CursorPage<T> {
  data: T[];
  next_cursor: string | null;
  has_more: boolean;
}

export function useTaskDocuments(taskPublicId: string, sort: 'asc' | 'desc' = 'desc') {
  return useInfiniteQuery({
    queryKey: queryKeys.tasks.documents(taskPublicId, { sort }),
    queryFn: ({ pageParam }) =>
      apiClient.get<CursorPage<DocumentResource>>(`/v1/tasks/${taskPublicId}/documents`, {
        params: { cursor: pageParam, sort },
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? lastPage.next_cursor : undefined,
    enabled: !!taskPublicId,
  });
}

export function useDocument(documentPublicId: string) {
  return useQuery({
    queryKey: queryKeys.documents.detail(documentPublicId),
    queryFn: () => apiClient.get<DocumentResource>(`/v1/documents/${documentPublicId}`),
    enabled: !!documentPublicId,
  });
}

export function useDocumentVersions(documentPublicId: string) {
  return useInfiniteQuery({
    queryKey: queryKeys.documents.versions(documentPublicId),
    queryFn: ({ pageParam }) =>
      apiClient.get<CursorPage<DocumentVersionResource>>(
        `/v1/documents/${documentPublicId}/versions`,
        { params: { cursor: pageParam } },
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? lastPage.next_cursor : undefined,
    enabled: !!documentPublicId,
  });
}

export function useUploadTaskDocument(taskPublicId: string) {
  const t = useTranslations('tasks.documents');
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) =>
      apiClient.post<DocumentResource>(`/v1/tasks/${taskPublicId}/documents`, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.tasks.detail(taskPublicId), 'documents'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.timeline(taskPublicId) });
      toast.success(t('toast_uploaded'));
    },
    onError: (error) => {
      if (!(error instanceof ApiRequestError && error.status === 422)) {
        toast.error(error.message);
      }
    },
  });
}

export function useUploadDocumentVersion(documentPublicId: string, taskPublicId: string) {
  const t = useTranslations('tasks.documents');
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) =>
      apiClient.post<DocumentResource>(`/v1/documents/${documentPublicId}/versions`, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.documents.versions(documentPublicId) });
      queryClient.invalidateQueries({ queryKey: [...queryKeys.tasks.detail(taskPublicId), 'documents'] });
      toast.success(t('toast_version_created'));
    },
    onError: (error) => {
      if (!(error instanceof ApiRequestError && error.status === 422)) {
        toast.error(error.message);
      }
    },
  });
}

export function useDeleteDocument(taskPublicId: string) {
  const t = useTranslations('tasks.documents');
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (documentPublicId: string) =>
      apiClient.delete<void>(`/v1/documents/${documentPublicId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...queryKeys.tasks.detail(taskPublicId), 'documents'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.timeline(taskPublicId) });
      toast.success(t('toast_deleted'));
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
}
