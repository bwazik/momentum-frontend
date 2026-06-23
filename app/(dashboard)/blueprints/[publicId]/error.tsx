'use client';

import { AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { EmptyState } from '@/components/shared/empty-state';
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
      <EmptyState
        icon={AlertCircle}
        title={t('not_found_title')}
        description={error.message}
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={reset}>{t('retry')}</Button>
            <Button asChild>
              <Link href="/blueprints">{t('back_to_list')}</Link>
            </Button>
          </div>
        }
      />
    </main>
  );
}
