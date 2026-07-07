'use client';

import { useTranslations } from 'next-intl';
import { ErrorState } from '@/components/shared/error-state';

export default function LoginError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('auth.login');
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center p-6">
      <ErrorState message={t('error')} onRetry={reset} />
    </div>
  );
}
