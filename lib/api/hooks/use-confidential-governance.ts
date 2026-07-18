import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/client';
import { extraQueryKeys } from '@/lib/api/query-keys-extra';
import type { CursorPage } from '@/lib/api/types';
import type { components } from '@/lib/generated/api-types';

type GovernanceResource = components['schemas']['ConfidentialGovernanceParticipantResource'];
type StoreRequest = components['schemas']['StoreConfidentialGovernanceParticipantRequest'];
type UpdateRequest = components['schemas']['UpdateConfidentialGovernanceParticipantRequest'];

export interface GovernanceFilters extends Record<string, unknown> {
  scope_type?: string;
  status?: 'active' | 'revoked';
}

export function useGovernanceParticipantsInfinite(filters: GovernanceFilters = {}) {
  return useInfiniteQuery({
    queryKey: extraQueryKeys.iam.governanceParticipants(filters),
    queryFn: ({ pageParam }) =>
      apiClient.get<CursorPage<GovernanceResource>>('/v1/iam/confidential-governance-participants', {
        params: { ...filters, cursor: pageParam, per_page: 15 },
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.has_more ? lastPage.next_cursor : undefined),
    staleTime: 30 * 1000,
  });
}

export function useCreateGovernanceParticipant() {
  const qc = useQueryClient();
  const t = useTranslations('confidential.governance.toast');
  return useMutation({
    mutationFn: (body: StoreRequest) =>
      apiClient.post<GovernanceResource>('/v1/iam/confidential-governance-participants', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['iam', 'governance-participants'] });
      toast.success(t('created'));
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdateGovernanceParticipant(publicId: string) {
  const qc = useQueryClient();
  const t = useTranslations('confidential.governance.toast');
  return useMutation({
    mutationFn: (body: UpdateRequest) =>
      apiClient.put<GovernanceResource>(`/v1/iam/confidential-governance-participants/${publicId}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['iam', 'governance-participants'] });
      toast.success(t('updated'));
    },
    onError: (error: Error) => toast.error(error.message),
  });
}


