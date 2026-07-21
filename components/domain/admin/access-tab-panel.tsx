'use client';

import { useCapabilities } from '@/lib/api/hooks/use-admin-access';
import { CapabilityCatalog } from './capability-catalog';
import { PositionCapabilityPanel } from './position-capability-panel';
import { AccessSkeleton } from './access-skeleton';

export function AccessTabPanel() {
  const { isLoading } = useCapabilities();

  if (isLoading) return <AccessSkeleton />;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[4fr_1fr] gap-6">
      <CapabilityCatalog />
      <PositionCapabilityPanel />
    </div>
  );
}
