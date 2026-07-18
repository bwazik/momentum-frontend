import { useEffect } from 'react';
import { useCapabilityStore } from '@/lib/stores/use-capability-store';
import { useCurrentUser } from './use-auth';

function parseCapabilities(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw as string[];
  if (typeof raw === 'string') return raw.length > 0 ? raw.split(',').map((s) => s.trim()).filter(Boolean) : [];
  return [];
}

export function useCapabilities(userPublicId: string | undefined) {
  const setCapabilities = useCapabilityStore((s) => s.setCapabilities);
  const { data: user, isLoading } = useCurrentUser();

  useEffect(() => {
    if (user?.effective_capabilities && userPublicId) {
      setCapabilities(parseCapabilities(user.effective_capabilities));
    }
  }, [user?.effective_capabilities, userPublicId, setCapabilities]);

  return { data: user?.effective_capabilities, isLoading };
}

export function useCapability(capability: string): boolean {
  return useCapabilityStore((s) => s.hasCapability(capability));
}
