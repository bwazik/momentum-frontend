'use client';

import { useMemo, useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { AdvancedFiltersSheet } from '@/components/domain/tasks/advanced-filters-sheet';
import type { TaskBoardUrlFilters } from '@/components/domain/tasks/task-board-types';

export function ExecutiveDashboardFilters() {
  const ta = useTranslations('analytics.aging');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setParam = useCallback((key: string, value?: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'all') params.set(key, value);
    else params.delete(key);
    router.replace(`${pathname}?${params.toString()}`);
  }, [searchParams, router, pathname]);

  const setBatchParams = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value && value !== 'all') params.set(key, value);
      else params.delete(key);
    }
    router.replace(`${pathname}?${params.toString()}`);
  }, [searchParams, router, pathname]);

  const filters = useMemo(() => ({
    dateFrom: searchParams.get('dateFrom') ?? undefined,
    dateTo: searchParams.get('dateTo') ?? undefined,
    departmentId: searchParams.get('departmentId') ?? undefined,
    priorityId: searchParams.get('priorityId') ?? undefined,
    blueprintCategoryId: searchParams.get('blueprintCategoryId') ?? undefined,
    calendarSystem: (searchParams.get('calendarSystem') as TaskBoardUrlFilters['calendarSystem']) ?? undefined,
  }), [searchParams]);

  const activeCount = [filters.dateFrom, filters.dateTo, filters.departmentId, filters.priorityId, filters.blueprintCategoryId, filters.calendarSystem]
    .filter(Boolean).length;

  const mappedFilters: TaskBoardUrlFilters = useMemo(() => ({
    departmentId: filters.departmentId,
    priorityId: filters.priorityId ? [filters.priorityId] : undefined,
    blueprintCategoryId: filters.blueprintCategoryId,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    calendarSystem: filters.calendarSystem,
  }), [filters.departmentId, filters.priorityId, filters.blueprintCategoryId, filters.dateFrom, filters.dateTo, filters.calendarSystem]);

  return (
    <div className="flex items-center gap-2">
      <AdvancedFiltersSheet
        t={ta as unknown as ReturnType<typeof useTranslations>}
        filters={mappedFilters}
        onParam={(key, value) => setParam(key, value === 'all' ? null : value)}
        onBatchParams={(updates) => setBatchParams(updates)}
        hideFields={['stageType', 'assignee']}
      />
      {activeCount > 0 && (
        <>
          <Button variant="ghost" size="sm" onClick={() => router.replace(pathname)}>
            {ta('reset')}
          </Button>
          <span className="text-xs text-muted-foreground">({activeCount})</span>
        </>
      )}
    </div>
  );
}
