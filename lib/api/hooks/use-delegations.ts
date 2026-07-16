'use client';

import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/client';
import { queryKeys } from '@/lib/api/query-keys';
import type { CursorPage } from '@/lib/api/types';
import type { components } from '@/lib/generated/api-types';

type DelegationResource = components['schemas']['DelegationResource'];
type StoreDelegationRequest = components['schemas']['StoreDelegationRequest'];
type UpdateDelegationRequest = components['schemas']['UpdateDelegationRequest'];

export interface ActiveDelegationFilters {
  delegator_user_id?: string;
  delegate_user_id?: string;
  blueprint_category_id?: string;
  stage_type_id?: string;
}

export function useActiveDelegationsInfinite(filters: ActiveDelegationFilters) {
  return useInfiniteQuery({
    queryKey: queryKeys.delegations.activeList(filters as unknown as Record<string, unknown>),
    queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
      apiClient.get<CursorPage<DelegationResource>>('/v1/iam/delegations/active', {
        params: { ...filters, cursor: pageParam },
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.has_more ? lastPage.next_cursor : undefined),
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });
}

export function useCreateDelegation() {
  const queryClient = useQueryClient();
  const t = useTranslations('settings.delegations.toast');
  return useMutation({
    mutationFn: (body: StoreDelegationRequest) =>
      apiClient.post<DelegationResource>('/v1/iam/delegations', body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.delegations.all, refetchType: 'all' });
      toast.success(t('delegation_created'));
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdateDelegation() {
  const queryClient = useQueryClient();
  const t = useTranslations('settings.delegations.toast');
  return useMutation({
    mutationFn: (vars: { publicId: string; body: UpdateDelegationRequest }) =>
      apiClient.put<DelegationResource>(`/v1/iam/delegations/${vars.publicId}`, vars.body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.delegations.all, refetchType: 'all' });
      toast.success(t('delegation_updated'));
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useRevokeDelegation() {
  const queryClient = useQueryClient();
  const t = useTranslations('settings.delegations.toast');
  return useMutation({
    mutationFn: (publicId: string) =>
      apiClient.post<DelegationResource>(`/v1/iam/delegations/${publicId}/revoke`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.delegations.all, refetchType: 'all' });
      toast.success(t('delegation_revoked'));
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
