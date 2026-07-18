'use client';

import { useTranslations } from 'next-intl';
import { ShieldAlert } from 'lucide-react';
import { InfoAlert } from '@/components/shared/info-alert';
import type { ReactNode } from 'react';

interface Props {
  reason: string;
  children: ReactNode;
}

export function TaskOverrideSession({ reason, children }: Props) {
  const t = useTranslations('confidential.override');

  return (
    <div className="space-y-4">
      <InfoAlert
        icon={<ShieldAlert className="size-4" aria-hidden="true" />}
        title={t('session_title')}
        description={t('session_description', { reason })}
        className="animate-in slide-in-from-top duration-300 motion-reduce:animate-none"
      />
      {children}
    </div>
  );
}
