'use client';

import { useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { ApiRequestError } from '@/lib/api/client';
import { useAgingReportInfinite } from '@/lib/api/hooks/use-analytics';
import { readAgingFilters, toAgingQuery, narrowAgingItems } from './aging-report-utils';
import { AgingReportFilters } from './aging-report-filters';
import { AgingReportSkeleton } from './aging-report-skeleton';
import { AgingReportTable } from './aging-report-table';
import { AgingReportMobileList } from './aging-report-mobile-list';

export function AgingReport() {
  const t = useTranslations('analytics.aging');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const urlFilters = useMemo(() => readAgingFilters(searchParams), [searchParams]);
  const apiFilters = useMemo(() => toAgingQuery(urlFilters), [urlFilters]);

  const query = useAgingReportInfinite(apiFilters);

  const allTasks = useMemo(() => {
    const seen = new Set<string>();
    return (query.data?.pages.flatMap((page) => narrowAgingItems(page.data as unknown[])) ?? [])
      .filter((task) => {
        if (seen.has(task.task_public_id)) return false;
        seen.add(task.task_public_id);
        return true;
      });
  }, [query.data]);

  if (query.isLoading) return <AgingReportSkeleton />;
  if (query.isError) {
    if (query.error instanceof ApiRequestError && query.error.status === 403) {
      return <EmptyState icon={Lock} title={t('no_permission_title')} description={t('no_permission_description')} />;
    }
    return <ErrorState message={t('error')} onRetry={() => query.refetch()} />;
  }

  return (
    <section className="flex flex-col gap-4">
      <AgingReportFilters filters={urlFilters} />
      {allTasks.length === 0 ? (
        <EmptyState
          title={t('empty_title')}
          description={t('empty_description')}
          action={
            <Button variant="outline" onClick={() => router.replace(pathname)}>
              {t('reset_filters')}
            </Button>
          }
        />
      ) : (
        <>
          <div className="hidden md:block">
            <AgingReportTable tasks={allTasks} />
          </div>
          <div className="md:hidden">
            <AgingReportMobileList tasks={allTasks} />
          </div>
          {query.hasNextPage && (
            <Button
              variant="outline"
              onClick={() => query.fetchNextPage()}
              disabled={query.isFetchingNextPage}
            >
              {query.isFetchingNextPage ? t('loading_more') : t('load_more')}
            </Button>
          )}
        </>
      )}
    </section>
  );
}
