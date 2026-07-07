'use client';

import { useTranslations } from 'next-intl';
import { ErrorState } from '@/components/shared/error-state';

export default function TaskCreateError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('tasks.create.toast');
  return (
    <div className="p-6">
      <ErrorState message={t('error')} onRetry={reset} />
    </div>
  );
}
