'use client';

import type { components } from '@/lib/generated/api-types';
import { DirectAccessPanel } from './direct-access-panel';
import { MonitoringScopesPanel } from './monitoring-scopes-panel';
import { AuditGrantsPanel } from './audit-grants-panel';

type UserDetailResource = components['schemas']['UserDetailResource'];

interface UserAccessTabProps {
  user: UserDetailResource;
}

export function UserAccessTab({ user }: UserAccessTabProps) {
  const isExternalAuditor = user.account_type === 'external_auditor';

  return (
    <div className="space-y-4 pb-4">
      <DirectAccessPanel userPublicId={user.public_id} />
      <MonitoringScopesPanel userPublicId={user.public_id} />
      {isExternalAuditor && <AuditGrantsPanel userPublicId={user.public_id} />}
    </div>
  );
}
