'use client';

import { useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { AdvancedFiltersSheet } from '@/components/domain/tasks/advanced-filters-sheet';
import type { AgingReportUrlFilters } from './aging-report-types';
import type { TaskBoardUrlFilters } from '@/components/domain/tasks/task-board-types';

const QUICK_FILTERS = ['active', 'suspended', 'all'] as const;

interface AgingReportFiltersProps {
  filters: AgingReportUrlFilters;
}

export function AgingReportFilters({ filters }: AgingReportFiltersProps) {
  const t = useTranslations('analytics.aging');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = useLocale();

  const setParam = useCallback((key: string, value?: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.replace(`${pathname}?${params.toString()}`);
  }, [searchParams, router, pathname]);

  const setBatchParams = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    router.replace(`${pathname}?${params.toString()}`);
  }, [searchParams, router, pathname]);

  function resetFilters() {
    router.replace(pathname);
  }

  function handleQuickFilter(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('status');
    if (value !== 'all') params.set('status', value);
    router.replace(`${pathname}?${params.toString()}`);
  }

  const mappedFilters: TaskBoardUrlFilters = useMemo(() => ({
    departmentId: filters.departmentId,
    priorityId: filters.priorityId ? [filters.priorityId] : undefined,
    blueprintCategoryId: filters.blueprintCategoryId,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
    calendarSystem: filters.calendarSystem,
  }), [filters.departmentId, filters.priorityId, filters.blueprintCategoryId, filters.dateFrom, filters.dateTo, filters.calendarSystem]);

  return (
    <div className="flex flex-col gap-3 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <ToggleGroup
          type="single"
          value={filters.status ?? 'active'}
          onValueChange={(value) => { if (value) handleQuickFilter(value); }}
          dir={locale === 'ar' ? 'rtl' : 'ltr'}
        >
          {QUICK_FILTERS.map((k) => (
            <ToggleGroupItem key={k} value={k} className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
              {t(`filter_${k}`)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <Button variant="ghost" onClick={resetFilters}>{t('reset')}</Button>
        <AdvancedFiltersSheet
          t={t as unknown as ReturnType<typeof useTranslations>}
          filters={mappedFilters}
          onParam={(key, value) => setParam(key, value === 'all' ? null : value)}
          onBatchParams={(updates) => setBatchParams(updates)}
          hideFields={['stageType']}
        />
      </div>
    </div>
  );
}
