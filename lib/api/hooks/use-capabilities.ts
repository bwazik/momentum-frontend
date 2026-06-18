import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../client';
import { queryKeys } from '../query-keys';
import { useCapabilityStore } from '@/lib/stores/use-capability-store';
import { useEffect } from 'react';
import type { components } from '@/lib/generated/api-types';

type EffectiveCapabilityResource = components['schemas']['EffectiveCapabilityResource'];

export function useCapabilities(userPublicId: string | undefined) {
  const setCapabilities = useCapabilityStore((s) => s.setCapabilities);

  const query = useQuery({
    queryKey: userPublicId ? queryKeys.auth.capabilities(userPublicId) : ['auth', 'capabilities'] as const,
    queryFn: () =>
      apiClient.get<EffectiveCapabilityResource[]>(`/v1/iam/users/${userPublicId}/capabilities`),
    enabled: !!userPublicId,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (query.data) {
      setCapabilities(query.data.map((c) => c.capability_key));
    }
  }, [query.data, setCapabilities]);

  return query;
}

export function useCapability(capability: string): boolean {
  return useCapabilityStore((s) => s.hasCapability(capability));
}
