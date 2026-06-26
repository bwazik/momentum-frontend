'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FollowUpAlertBannerProps {
  overdueCount: number;
  onApplyOverdue: () => void;
}

export function FollowUpAlertBanner({ overdueCount, onApplyOverdue }: FollowUpAlertBannerProps) {
  const t = useTranslations('followUp.banner');
  const [dismissed, setDismissed] = useState(false);
  if (dismissed || overdueCount <= 0) return null;

  return (
    <div
      role="alert"
      className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950"
    >
      <div className="flex items-center gap-3">
        <AlertCircle className="size-5 text-red-600 dark:text-red-400" aria-hidden="true" />
        <p className="text-sm text-red-700 dark:text-red-300">
          <span className="font-semibold">{overdueCount}</span> {t('overdue_message')}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="link" size="sm" className="text-red-600 dark:text-red-400" onClick={onApplyOverdue}>
          {t('view_all')}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          aria-label={t('dismiss')}
          onClick={() => setDismissed(true)}
        >
          <X className="size-4" />
        </Button>
      </div>
    </div>
  );
}
