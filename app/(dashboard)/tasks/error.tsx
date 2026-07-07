'use client';

import { useTranslations } from 'next-intl';
import { ErrorState } from '@/components/shared/error-state';

export default function TaskBoardError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('tasks.board');
  return (
    <div className="p-6">
      <ErrorState message={t('error')} onRetry={reset} />
    </div>
  );
}
