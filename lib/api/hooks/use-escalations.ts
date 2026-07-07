import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { apiClient, ApiRequestError } from '@/lib/api/client';
import { queryKeys } from '@/lib/api/query-keys';
import type { components } from '@/lib/generated/api-types';
import type { CursorPage } from '@/lib/api/types';

type EscalationResource = components['schemas']['EscalationResource'];
type EscalationDetailResource = components['schemas']['EscalationDetailResource'];
type CreateManualEscalationRequest = components['schemas']['CreateManualEscalationRequest'];
type ResolveEscalationRequest = components['schemas']['ResolveEscalationRequest'];

export interface EscalationFilters {
  status?: number;
  type?: number;
  assigned_to_me?: boolean;
  task_id?: string;
  department_id?: string;
  per_page?: number;
  cursor?: string | null;
}

export function useEscalationsInfinite(filters: EscalationFilters = { status: 1 }) {
  return useInfiniteQuery({
    queryKey: queryKeys.escalations.list(filters as Record<string, unknown>),
    queryFn: ({ pageParam }) =>
      apiClient.get<CursorPage<EscalationResource>>('/v1/tracking/escalations', {
        params: { ...filters, cursor: pageParam },
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? lastPage.next_cursor : undefined,
  });
}

export function useCreateEscalation() {
  const qc = useQueryClient();
  const t = useTranslations('followUp.escalate');
  return useMutation({
    mutationFn: (body: CreateManualEscalationRequest) =>
      apiClient.post<EscalationDetailResource>('/v1/tracking/escalations', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.escalations.lists() });
      qc.invalidateQueries({ queryKey: queryKeys.taskBoard.lists() });
      toast.success(t('created'));
    },
    onError: (error) => {
      if (error instanceof ApiRequestError) {
        toast.error(error.error.message);
      } else {
        toast.error(t('create_error'));
      }
    },
  });
}

export function useResolveEscalation() {
  const qc = useQueryClient();
  const t = useTranslations('followUp.escalations');
  return useMutation({
    mutationFn: ({ escalationPublicId, body }: { escalationPublicId: string; body: ResolveEscalationRequest }) =>
      apiClient.post<EscalationDetailResource>(
        `/v1/tracking/escalations/${escalationPublicId}/resolve`,
        body,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.escalations.lists() });
      qc.invalidateQueries({ queryKey: queryKeys.taskBoard.lists() });
      toast.success(t('resolved'));
    },
    onError: (error) => {
      if (error instanceof ApiRequestError) {
        toast.error(error.error.message);
      } else {
        toast.error(t('resolve_error'));
      }
    },
  });
}
