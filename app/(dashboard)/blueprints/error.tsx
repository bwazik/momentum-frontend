'use client';

import { useTranslations } from 'next-intl';
import { ErrorState } from '@/components/shared/error-state';

export default function BlueprintLibraryError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('blueprints.library');
  return (
    <div className="p-6">
      <ErrorState message={t('error')} onRetry={reset} />
    </div>
  );
}
