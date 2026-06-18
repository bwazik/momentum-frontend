'use client';

import { useTranslations } from 'next-intl';
import { useCapability } from '@/lib/api/hooks/use-capabilities';

export default function AdminPage() {
  const t = useTranslations('placeholder');
  const tnav = useTranslations('nav');
  const canAdmin = useCapability('iam.manage_users');
  if (!canAdmin) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground">{tnav('no_permission')}</p>
      </div>
    );
  }
  return (
    <div className="flex flex-1 items-center justify-center">
      <p className="text-muted-foreground">{t('admin')}</p>
    </div>
  );
}
