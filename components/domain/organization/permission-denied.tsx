'use client';

import { Lock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { EmptyState } from '@/components/shared/empty-state';

export function PermissionDenied() {
  const t = useTranslations('organization');
  return (
    <EmptyState
      icon={Lock}
      title={t('no_permission_title')}
      description={t('no_permission_description')}
    />
  );
}
