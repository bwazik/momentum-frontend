'use client';

import { useMemo } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { DepartmentDrillDownSkeleton } from './department-drill-down-skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { SlaBadge, PriorityBadge } from '@/components/domain/tasks/task-badges';
import { cn } from '@/lib/utils';
import { localizeName } from '@/lib/utils/localize';
import { formatDate } from './aging-report-utils';
import type { UseInfiniteQueryResult, InfiniteData } from '@tanstack/react-query';
import type { CursorPage } from '@/lib/api/types';
import { narrowDrillDownTaskItem } from './executive-dashboard-utils';
import type { DrillDownTaskItem } from './executive-dashboard-types';

const SLA_BORDER: Record<string, string> = {
  green: 'border-s-4 border-s-emerald-500 dark:border-s-emerald-400',
  amber: 'border-s-4 border-s-amber-500 dark:border-s-amber-400',
  red: 'border-s-4 border-s-red-500 dark:border-s-red-400',
  grey: 'border-s-4 border-s-slate-400 dark:border-s-slate-500',
  none: 'border-s-4 border-s-zinc-300 dark:border-s-zinc-600',
};

interface DepartmentDrillDownListProps {
  query: UseInfiniteQueryResult<InfiniteData<CursorPage<unknown>>, Error>;
}

export function DepartmentDrillDownList({ query }: DepartmentDrillDownListProps) {
  const t = useTranslations('analytics.department');
  const router = useRouter();
  const locale = useLocale();

  const tasks = useMemo(() => {
    const seen = new Set<string>();
    return (query.data?.pages.flatMap((page) => (page.data as unknown[]).map(narrowDrillDownTaskItem)) ?? [])
      .filter((task): task is NonNullable<DrillDownTaskItem> => task !== null)
      .filter((task) => {
        if (seen.has(task.taskPublicId)) return false;
        seen.add(task.taskPublicId);
        return true;
      });
  }, [query.data]);

  if (query.isError) {
    return <ErrorState message={t('drill_down_error')} onRetry={() => query.refetch()} />;
  }

  if (query.isLoading) {
    return (
      <section className="flex flex-col gap-4" data-testid="department-drill-down-skeleton">
        <DepartmentDrillDownSkeleton />
      </section>
    );
  }

  if (tasks.length === 0) {
    return <EmptyState title={t('drill_down_empty_title')} description={t('drill_down_empty_description')} />;
  }

  return (
    <section className="flex flex-col gap-4" data-testid="department-drill-down-list">
      <div className="hidden md:block">
        <Table aria-label={t('columns.table_label')}>
          <TableHeader>
            <TableRow>
              <TableHead scope="col" className="w-28 text-start text-xs uppercase tracking-wider">{t('columns.sla')}</TableHead>
              <TableHead scope="col" className="text-start text-xs uppercase tracking-wider">{t('columns.task')}</TableHead>
              <TableHead scope="col" className="text-start text-xs uppercase tracking-wider">{t('columns.priority')}</TableHead>
              <TableHead scope="col" className="text-start text-xs uppercase tracking-wider">{t('columns.stage')}</TableHead>
              <TableHead scope="col" className="w-32 text-start text-xs uppercase tracking-wider">{t('columns.created_at')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => {
              const slaKey = task.slaHealth.toLowerCase();
              return (
                <TableRow
                  key={task.taskPublicId}
                  tabIndex={0}
                  className="cursor-pointer"
                  onClick={() => router.push(`/tasks/${task.taskPublicId}`)}
                  onKeyDown={(e) => { if (e.key === 'Enter') router.push(`/tasks/${task.taskPublicId}`); }}
                >
                  <TableCell className={cn('text-start', SLA_BORDER[slaKey] || '')}>
                    <SlaBadge health={task.slaHealth} status={task.status} />
                  </TableCell>
                  <TableCell className="text-start">
                    <span className="text-sm font-medium leading-tight">
                      {localizeName(locale, task.titleAr, task.titleEn)}
                    </span>
                  </TableCell>
                  <TableCell className="text-start">
                    {task.priority ? (
                      <PriorityBadge priority={task.priority} />
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-start">
                    <span className="text-sm">
                      {localizeName(locale, task.currentStageNameAr, task.currentStageNameEn) || '-'}
                    </span>
                  </TableCell>
                  <TableCell className="text-start">
                    <span className="text-sm text-muted-foreground">
                      {formatDate(task.createdAt, locale)}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <div className="md:hidden flex flex-col gap-3">
        {tasks.map((task) => {
          const name = localizeName(locale, task.titleAr, task.titleEn);
          const stage = localizeName(locale, task.currentStageNameAr, task.currentStageNameEn) || '-';
          return (
            <Card
              key={task.taskPublicId}
              className="p-4 cursor-pointer transition-colors hover:bg-muted/50"
              tabIndex={0}
              onClick={() => router.push(`/tasks/${task.taskPublicId}`)}
              onKeyDown={(e) => { if (e.key === 'Enter') router.push(`/tasks/${task.taskPublicId}`); }}
            >
              <div className="flex items-center gap-3 mb-2">
                <SlaBadge health={task.slaHealth} status={task.status} />
                <span className="text-sm font-medium truncate">{name}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {task.priority ? <PriorityBadge priority={task.priority} /> : <span>-</span>}
                <span>{stage}</span>
                <span>{formatDate(task.createdAt, locale)}</span>
              </div>
            </Card>
          );
        })}
      </div>
      {query.hasNextPage && (
        <Button variant="outline" onClick={() => query.fetchNextPage()} disabled={query.isFetchingNextPage}>
          {query.isFetchingNextPage ? t('loading_more') : t('load_more')}
        </Button>
      )}
    </section>
  );
}
