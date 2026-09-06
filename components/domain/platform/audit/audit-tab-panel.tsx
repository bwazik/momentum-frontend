'use client';

import { useMemo, useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { usePlatformAuditEventsInfinite } from '@/lib/api/hooks/use-platform';
import { AuditFilters } from './audit-filters';
import { AuditSkeleton, AuditTableSkeleton } from './audit-skeleton';
import { AuditTable } from './audit-table';
import { AuditCardList } from './audit-card-list';
import { AuditDetailDialog } from './audit-detail-dialog';
import type { PlatformAuditEvent } from '@/lib/utils/platform-utils';
import { History } from 'lucide-react';

export function AuditTabPanel() {
  const t = useTranslations('platform.audit');
  const c = useTranslations('platform.common');
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const [selected, setSelected] = useState<PlatformAuditEvent | null>(null);

  const filters = useMemo(() => ({
    action: sp.get('action') || undefined,
    entity_type: sp.get('entity_type') || undefined,
    user_id: sp.get('user_id') || undefined,
    from: sp.get('from') || undefined,
    to: sp.get('to') || undefined,
    calendar_system: (sp.get('calendar_system') as 'gregorian' | 'hijri') || undefined,
    per_page: 15,
  }), [sp]);

  const query = usePlatformAuditEventsInfinite(filters);
  const events = query.data?.pages.flatMap((page) => page.data) ?? [];

  const isFirstLoad = query.isLoading;
  const isRefetching = query.isFetching && !query.isLoading;

  function resetFilters() {
    const params = new URLSearchParams();
    const tab = sp.get('tab');
    if (tab) params.set('tab', tab);
    const q = params.toString();
    router.replace(q ? `${pathname}?${q}` : pathname);
  }

  if (isFirstLoad) return <AuditSkeleton />;

  return (
    <>
      <AuditFilters />
      {isRefetching ? (
        <AuditTableSkeleton />
      ) : query.isError ? (
        <ErrorState message={t('error')} onRetry={() => query.refetch()} />
      ) : events.length === 0 ? (
        <EmptyState
          icon={History}
          title={t('empty_title')}
          description={t('empty_description')}
          action={
            <Button variant="outline" onClick={resetFilters}>
              {c('reset_filters')}
            </Button>
          }
        />
      ) : (
        <>
          <div className="hidden md:block">
            <AuditTable events={events} onView={setSelected} />
          </div>
          <AuditCardList events={events} onView={setSelected} />
          {query.hasNextPage && (
            <Button
              variant="outline"
              className="mt-4 w-full"
              onClick={() => query.fetchNextPage()}
              disabled={query.isFetchingNextPage}
            >
              {query.isFetchingNextPage ? c('loading_more') : c('load_more')}
            </Button>
          )}
        </>
      )}
      <AuditDetailDialog
        event={selected}
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
      />
    </>
  );
}
