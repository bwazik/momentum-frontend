'use client';

import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/empty-state';
import { useTranslations } from 'next-intl';

export default function TaskDetailError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('tasks.detail');

  return (
    <div className="p-6">
      <EmptyState
        icon={AlertCircle}
        title={t('error')}
        action={
          <Button variant="outline" onClick={reset}>
            {t('retry')}
          </Button>
        }
      />
    </div>
  );
}
