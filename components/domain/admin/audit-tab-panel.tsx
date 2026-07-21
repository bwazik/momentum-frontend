'use client';

import { useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { RtlTable } from '@/components/shared/rtl-table';
import { TableHeader, TableRow, TableHead, TableBody } from '@/components/ui/table';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { useSystemAuditInfinite } from '@/lib/api/hooks/use-audit-trail';
import { AuditFilters } from './audit-filters';
import { AuditTableRow } from './audit-table-row';
import { AuditEventCardList } from './audit-event-card-list';
import { AuditLogSkeleton } from './audit-log-skeleton';
import type { AuditFilters as AuditFilterType } from '@/lib/api/query-keys';
import { ScrollText } from 'lucide-react';

export function AuditTabPanel() {
  const t = useTranslations('admin.audit');
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const filters = useMemo<AuditFilterType>(() => ({
    user_id: sp.get('userPublicId') || undefined,
    event_type: sp.get('eventType') || undefined,
    entity_type: sp.get('entityType') || undefined,
    date_from: sp.get('dateFrom') || undefined,
    date_to: sp.get('dateTo') || undefined,
    calendar_system: (sp.get('calendarSystem') as 'gregorian' | 'hijri') || undefined,
    per_page: 20,
  }), [sp]);

  const query = useSystemAuditInfinite(filters);
  const events = query.data?.pages.flatMap((p) => p.data) ?? [];

  function resetFilters() { router.replace(pathname); }

  if (query.isLoading) return <AuditLogSkeleton />;
  if (query.isError) return <ErrorState onRetry={() => query.refetch()} message={t('error')} />;
  if (events.length === 0) return (
    <EmptyState
      icon={ScrollText}
      title={t('empty_title')}
      description={t('empty_description')}
      action={<Button variant="outline" onClick={resetFilters}>{t('reset_filters')}</Button>}
    />
  );

  return (
    <>
      <AuditFilters />
      <div className="hidden md:block">
        <RtlTable aria-label={t('table_aria_label')}>
          <TableHeader>
            <TableRow>
              <TableHead className="text-start">{t('col_timestamp')}</TableHead>
              <TableHead className="text-start">{t('col_actor')}</TableHead>
              <TableHead className="text-start">{t('col_event')}</TableHead>
              <TableHead className="text-start">{t('col_entity')}</TableHead>
              <TableHead className="text-start">{t('col_target')}</TableHead>
              <TableHead className="text-end">{t('col_details')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => (
              <AuditTableRow key={event.public_id} event={event} />
            ))}
          </TableBody>
        </RtlTable>
      </div>
      <AuditEventCardList events={events} />
      {query.hasNextPage && (
        <Button
          variant="outline"
          className="w-full mt-4"
          onClick={() => query.fetchNextPage()}
          disabled={query.isFetchingNextPage}
        >
          {query.isFetchingNextPage ? t('loading_more') : t('load_more')}
        </Button>
      )}
    </>
  );
}
