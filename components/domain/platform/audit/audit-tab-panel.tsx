'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { usePlatformAuditEventsInfinite } from '@/lib/api/hooks/use-platform';
import { AuditFilters } from './audit-filters';
import { AuditSkeleton } from './audit-skeleton';
import { AuditTable } from './audit-table';
import { AuditCardList } from './audit-card-list';
import { AuditDetailDialog } from './audit-detail-dialog';
import type { PlatformAuditEvent } from '@/lib/utils/platform-utils';

export function AuditTabPanel() { const t = useTranslations('platform.audit'); const c = useTranslations('platform.common'); const params = useSearchParams(); const [selected, setSelected] = useState<PlatformAuditEvent | null>(null); const filters = useMemo(() => ({ action: params.get('action') || undefined, entity_type: params.get('entity_type') || undefined, from: params.get('from') || undefined, to: params.get('to') || undefined, per_page: 15 }), [params]); const query = usePlatformAuditEventsInfinite(filters); const events = query.data?.pages.flatMap((page) => page.data) ?? []; if (query.isLoading) return <AuditSkeleton />; if (query.isError) return <ErrorState message={t('error')} onRetry={() => query.refetch()} />; return <><AuditFilters />{events.length === 0 ? <EmptyState title={t('empty_title')} description={t('empty_description')} /> : <><div className="hidden md:block"><AuditTable events={events} onView={setSelected} /></div><AuditCardList events={events} onView={setSelected} />{query.hasNextPage && <Button variant="outline" className="mt-4 w-full" onClick={() => query.fetchNextPage()} disabled={query.isFetchingNextPage}>{query.isFetchingNextPage ? c('loading_more') : c('load_more')}</Button>}</>}<AuditDetailDialog event={selected} open={!!selected} onOpenChange={(open) => !open && setSelected(null)} /></>; }
