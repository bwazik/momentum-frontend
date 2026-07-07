'use client';

import { useTranslations } from 'next-intl';
import { ErrorState } from '@/components/shared/error-state';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function BlueprintBuilderError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('blueprints.builder');
  return (
    <main className="flex flex-col items-center justify-center p-6">
      <ErrorState
        message={error.message}
        onRetry={reset}
      />
      <div className="mt-4">
        <Button asChild>
          <Link href="/blueprints">{t('back_to_list')}</Link>
        </Button>
      </div>
    </main>
  );
}
