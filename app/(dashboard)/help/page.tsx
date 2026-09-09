import { Suspense } from 'react';
import { HelpCenterPageClient } from '@/components/domain/help/help-center-page-client';
import { HelpCenterSkeleton } from '@/components/domain/help/help-center-skeleton';

export default function HelpPage() {
  return (
    <main className="flex flex-col gap-6 p-6">
      <Suspense fallback={<HelpCenterSkeleton />}>
        <HelpCenterPageClient />
      </Suspense>
    </main>
  );
}
