'use client';

import { useMemo, useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AdvancedFiltersSheet } from '@/components/domain/tasks/advanced-filters-sheet';
import type { TaskBoardUrlFilters } from '@/components/domain/tasks/task-board-types';

export function DepartmentDashboardFilters() {
  const ta = useTranslations('analytics.aging');
  const td = useTranslations('analytics.department');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = useMemo(
    () => ({
      dateFrom: searchParams.get('dateFrom') ?? undefined,
      dateTo: searchParams.get('dateTo') ?? undefined,
      priorityId: searchParams.get('priorityId') ?? undefined,
      blueprintCategoryId: searchParams.get('blueprintCategoryId') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      slaHealth: searchParams.get('slaHealth') ?? undefined,
      assigneeId: searchParams.get('assigneeId') ?? undefined,
    }),
    [searchParams],
  );

  const activeCount = [filters.dateFrom, filters.dateTo, filters.priorityId, filters.blueprintCategoryId, filters.status, filters.slaHealth, filters.assigneeId].filter(
    Boolean,
  ).length;

  const mappedFilters: TaskBoardUrlFilters = useMemo(
    () => ({
      priorityId: filters.priorityId ? [filters.priorityId] : undefined,
      blueprintCategoryId: filters.blueprintCategoryId,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
    }),
    [filters],
  );

  const setParam = useCallback(
    (key: string, value?: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== 'all') params.set(key, value);
      else params.delete(key);
      router.replace(`${pathname}?${params.toString()}`);
    },
    [searchParams, router, pathname],
  );

  function resetFilters() {
    const departmentId = searchParams.get('departmentId');
    const params = new URLSearchParams();
    if (departmentId) params.set('departmentId', departmentId);
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-2">
      <AdvancedFiltersSheet
        t={ta as unknown as ReturnType<typeof useTranslations>}
        filters={mappedFilters}
        onParam={(key, value) => setParam(key, value === 'all' ? null : value)}
        hideFields={['stageType', 'assignee']}
      />
      {activeCount > 0 && (
        <Button variant="ghost" size="sm" onClick={resetFilters} className="gap-1">
          <X className="size-4" />
          {td('reset_filters')}
          <span className="text-xs text-muted-foreground">({activeCount})</span>
        </Button>
      )}
    </div>
  );
}
