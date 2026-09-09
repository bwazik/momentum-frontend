'use client';

import { Lock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { EmptyState } from '@/components/shared/empty-state';

export function PermissionDenied() {
  const t = useTranslations('help_center');
  return (
    <div className="py-12" data-testid="help-permission-denied">
      <EmptyState
        icon={Lock}
        title={t('permission_denied')}
        description={t('permission_denied_desc')}
      />
    </div>
  );
}
