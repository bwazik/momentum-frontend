'use client';

import { useInfiniteQuery, useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { apiClient, localizedApiError } from '@/lib/api/client';
import { queryKeys, AdminUserFilters } from '@/lib/api/query-keys';
import type { CursorPage } from '@/lib/api/types';
import type { components } from '@/lib/generated/api-types';

type UserResource = components['schemas']['UserResource'];
type UserDetailResource = components['schemas']['UserDetailResource'];
type PositionAssignmentResource = components['schemas']['PositionAssignmentResource'];
type StoreUserRequest = components['schemas']['StoreUserRequest'];
type UpdateUserRequest = components['schemas']['UpdateUserRequest'];
type AssignPositionRequest = components['schemas']['AssignPositionRequest'];
type EndPositionRequest = components['schemas']['EndPositionRequest'];

export function useAdminUsersInfinite(filters: AdminUserFilters) {
  return useInfiniteQuery({
    queryKey: queryKeys.users.list(filters),
    queryFn: ({ pageParam }) =>
      apiClient.get<CursorPage<UserResource>>('/v1/iam/users', {
        params: { ...filters, cursor: pageParam, per_page: filters.per_page ?? 20 },
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => (last.has_more ? last.next_cursor : undefined),
    staleTime: 30 * 1000,
    placeholderData: keepPreviousData,
  });
}

export function useAdminUserDetail(publicId: string | null) {
  return useQuery({
    queryKey: queryKeys.users.detail(publicId ?? ''),
    queryFn: () => apiClient.get<UserDetailResource>(`/v1/iam/users/${publicId}`),
    enabled: !!publicId,
  });
}

export function usePrefetchUserDetail() {
  const qc = useQueryClient();
  return (publicId: string) =>
    qc.prefetchQuery({
      queryKey: queryKeys.users.detail(publicId),
      queryFn: () => apiClient.get<UserDetailResource>(`/v1/iam/users/${publicId}`),
      staleTime: 60 * 1000,
    });
}

export function useUserPositionsInfinite(publicId: string) {
  return useInfiniteQuery({
    queryKey: queryKeys.users.positions(publicId),
    queryFn: ({ pageParam }) =>
      apiClient.get<CursorPage<PositionAssignmentResource>>(
        `/v1/iam/users/${publicId}/positions`,
        { params: { cursor: pageParam, per_page: 25 } },
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => (last.has_more ? last.next_cursor : undefined),
    enabled: !!publicId,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  const t = useTranslations('admin.toast');
  return useMutation({
    mutationFn: (body: StoreUserRequest) =>
      apiClient.post<UserDetailResource>('/v1/iam/users', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.users.lists() });
      qc.invalidateQueries({ queryKey: queryKeys.audit.systemLists() });
      toast.success(t('user_created'));
    },
    onError: (e) => toast.error(localizedApiError(e, t)),
  });
}

export function useUpdateUser(publicId: string) {
  const qc = useQueryClient();
  const t = useTranslations('admin.toast');
  return useMutation({
    mutationFn: (body: UpdateUserRequest) =>
      apiClient.put<UserResource>(`/v1/iam/users/${publicId}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.users.lists() });
      qc.invalidateQueries({ queryKey: queryKeys.users.detail(publicId) });
      qc.invalidateQueries({ queryKey: queryKeys.audit.systemLists() });
      toast.success(t('user_updated'));
    },
    onError: (e) => toast.error(localizedApiError(e, t)),
  });
}

export function useDeactivateUser(publicId: string) {
  const qc = useQueryClient();
  const t = useTranslations('admin.toast');
  return useMutation({
    mutationFn: () => apiClient.post<UserResource>(`/v1/iam/users/${publicId}/deactivate`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.users.lists() });
      qc.invalidateQueries({ queryKey: queryKeys.users.detail(publicId) });
      qc.invalidateQueries({ queryKey: queryKeys.users.positions(publicId) });
      qc.invalidateQueries({ queryKey: queryKeys.organization.positions() });
      qc.invalidateQueries({ queryKey: queryKeys.organization.departmentTree() });
      qc.invalidateQueries({ queryKey: queryKeys.audit.systemLists() });
      toast.success(t('user_deactivated'));
    },
    onError: (e) => toast.error(localizedApiError(e, t)),
  });
}

export function useReactivateUser(publicId: string) {
  const qc = useQueryClient();
  const t = useTranslations('admin.toast');
  return useMutation({
    mutationFn: () => apiClient.post<UserResource>(`/v1/iam/users/${publicId}/reactivate`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.users.lists() });
      qc.invalidateQueries({ queryKey: queryKeys.users.detail(publicId) });
      qc.invalidateQueries({ queryKey: queryKeys.users.positions(publicId) });
      qc.invalidateQueries({ queryKey: queryKeys.organization.positions() });
      qc.invalidateQueries({ queryKey: queryKeys.organization.departmentTree() });
      qc.invalidateQueries({ queryKey: queryKeys.audit.systemLists() });
      toast.success(t('user_reactivated'));
    },
    onError: (e) => toast.error(localizedApiError(e, t)),
  });
}

export function useAssignPosition(publicId: string) {
  const qc = useQueryClient();
  const t = useTranslations('admin.toast');
  return useMutation({
    mutationFn: (body: AssignPositionRequest) =>
      apiClient.post<PositionAssignmentResource>(`/v1/iam/users/${publicId}/positions`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.users.positions(publicId) });
      qc.invalidateQueries({ queryKey: queryKeys.users.detail(publicId) });
      qc.invalidateQueries({ queryKey: queryKeys.organization.positions() });
      qc.invalidateQueries({ queryKey: queryKeys.audit.systemLists() });
      toast.success(t('position_assigned'));
    },
    onError: (e) => toast.error(localizedApiError(e, t)),
  });
}

export function useEndPositionAssignment(publicId: string, assignmentPublicId: string) {
  const qc = useQueryClient();
  const t = useTranslations('admin.toast');
  return useMutation({
    mutationFn: (body: EndPositionRequest) =>
      apiClient.post(`/v1/iam/users/${publicId}/positions/${assignmentPublicId}/end`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.users.positions(publicId) });
      qc.invalidateQueries({ queryKey: queryKeys.users.detail(publicId) });
      qc.invalidateQueries({ queryKey: queryKeys.organization.positions() });
      qc.invalidateQueries({ queryKey: queryKeys.audit.systemLists() });
      toast.success(t('position_ended'));
    },
    onError: (e) => toast.error(localizedApiError(e, t)),
  });
}

export function useSetPrimaryAssignment(publicId: string, assignmentPublicId: string) {
  const qc = useQueryClient();
  const t = useTranslations('admin.toast');
  return useMutation({
    mutationFn: () =>
      apiClient.post(`/v1/iam/users/${publicId}/positions/${assignmentPublicId}/set-primary`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.users.positions(publicId) });
      qc.invalidateQueries({ queryKey: queryKeys.users.detail(publicId) });
      qc.invalidateQueries({ queryKey: queryKeys.audit.systemLists() });
      toast.success(t('position_set_primary'));
    },
    onError: (e) => toast.error(localizedApiError(e, t)),
  });
}
