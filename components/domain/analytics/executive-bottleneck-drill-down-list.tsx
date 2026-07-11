'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { useExecutiveBottleneckDrillDown } from '@/lib/api/hooks/use-analytics';
import { readExecutiveFilters, toExecutiveBottlenecksQuery, narrowDrillDownTaskItem } from './executive-dashboard-utils';
import { ExecutiveDrillDownSkeleton } from './executive-drill-down-skeleton';
import { ExecutiveDrillDownTable } from './executive-drill-down-table';
import { ExecutiveDrillDownMobileList } from './executive-drill-down-mobile-list';

interface ExecutiveBottleneckDrillDownListProps {
  stageType: string;
}

export function ExecutiveBottleneckDrillDownList({ stageType }: ExecutiveBottleneckDrillDownListProps) {
  const t = useTranslations('analytics.executive');
  const searchParams = useSearchParams();
  const urlFilters = useMemo(() => readExecutiveFilters(searchParams), [searchParams]);
  const apiFilters = useMemo(() => toExecutiveBottlenecksQuery(urlFilters), [urlFilters]);
  const query = useExecutiveBottleneckDrillDown(stageType, apiFilters);

  const tasks = useMemo(() => {
    const seen = new Set<string>();
    return (query.data?.pages.flatMap((page) => (page.data as unknown[]).map(narrowDrillDownTaskItem)) ?? [])
      .filter((task): task is NonNullable<typeof task> => task !== null)
      .filter((task) => {
        if (seen.has(task.taskPublicId)) return false;
        seen.add(task.taskPublicId);
        return true;
      });
  }, [query.data]);

  if (query.isLoading) return <ExecutiveDrillDownSkeleton />;
  if (query.isError) return <ErrorState message={t('error')} onRetry={() => query.refetch()} />;
  if (tasks.length === 0) return <EmptyState title={t('empty_title')} description={t('empty_description')} />;

  return (
    <section className="flex flex-col gap-4">
      <div className="hidden md:block"><ExecutiveDrillDownTable tasks={tasks} /></div>
      <div className="md:hidden"><ExecutiveDrillDownMobileList tasks={tasks} /></div>
      {query.hasNextPage && (
        <Button variant="outline" onClick={() => query.fetchNextPage()} disabled={query.isFetchingNextPage}>
          {query.isFetchingNextPage ? t('loading_more') : t('load_more')}
        </Button>
      )}
    </section>
  );
}
