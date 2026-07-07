'use client';

import { useTranslations } from 'next-intl';
import { ErrorState } from '@/components/shared/error-state';

export default function FollowUpError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('followUp');
  return (
    <div className="p-6">
      <ErrorState message={t('error')} onRetry={reset} />
    </div>
  );
}
