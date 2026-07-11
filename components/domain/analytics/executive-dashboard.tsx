'use client';

import { useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import {
  useExecutiveSummary,
  useExecutiveDepartmentHealth,
  useExecutiveBottlenecks,
} from '@/lib/api/hooks/use-analytics';
import { ApiRequestError } from '@/lib/api/client';
import {
  readExecutiveFilters,
  toExecutiveSummaryQuery,
  toExecutiveBottlenecksQuery,
  narrowExecutiveSummary,
  narrowDepartmentHealthItem,
  narrowBottleneckItem,
  sortDepartmentHealth,
} from './executive-dashboard-utils';
import { ExecutiveDashboardSkeleton } from './executive-dashboard-skeleton';
import { ExecutiveSummaryCards } from './executive-summary-cards';
import { DepartmentHealthPanel } from './department-health-panel';
import { BottlenecksPanel } from './bottlenecks-panel';
import type { DepartmentHealthItem, BottleneckItem } from './executive-dashboard-types';

export function ExecutiveDashboard() {
  const t = useTranslations('analytics.executive');
  const locale = useLocale();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const urlFilters = useMemo(() => readExecutiveFilters(searchParams), [searchParams]);
  const summaryFilters = useMemo(() => toExecutiveSummaryQuery(urlFilters), [urlFilters]);
  const bottleneckFilters = useMemo(() => toExecutiveBottlenecksQuery(urlFilters), [urlFilters]);

  const summaryQuery = useExecutiveSummary(summaryFilters);
  const healthQuery = useExecutiveDepartmentHealth(summaryFilters);
  const bottlenecksQuery = useExecutiveBottlenecks(bottleneckFilters);

  const isLoading = summaryQuery.isLoading || healthQuery.isLoading || bottlenecksQuery.isLoading;
  const isError = summaryQuery.isError || healthQuery.isError || bottlenecksQuery.isError;
  const error = summaryQuery.error ?? healthQuery.error ?? bottlenecksQuery.error;

  const summary = useMemo(() => {
    if (!summaryQuery.data) return null;
    return narrowExecutiveSummary(summaryQuery.data);
  }, [summaryQuery.data]);

  const departments = useMemo(() => {
    if (!healthQuery.data || !Array.isArray(healthQuery.data)) return [];
    return sortDepartmentHealth(
      healthQuery.data.map(narrowDepartmentHealthItem).filter((d): d is DepartmentHealthItem => d !== null),
      locale,
    );
  }, [healthQuery.data, locale]);

  const bottlenecks = useMemo(() => {
    if (!bottlenecksQuery.data || !Array.isArray(bottlenecksQuery.data)) return [];
    return bottlenecksQuery.data
      .map(narrowBottleneckItem)
      .filter((b): b is BottleneckItem => b !== null);
  }, [bottlenecksQuery.data]);

  if (isLoading) return <ExecutiveDashboardSkeleton />;
  if (isError) {
    if (error instanceof ApiRequestError && error.status === 403) {
      return <EmptyState icon={Lock} title={t('no_permission_title')} description={t('no_permission_description')} />;
    }
    return (
      <ErrorState
        message={t('error')}
        onRetry={() => { summaryQuery.refetch(); healthQuery.refetch(); bottlenecksQuery.refetch(); }}
      />
    );
  }
  const hasFilters = urlFilters.dateFrom || urlFilters.dateTo || urlFilters.departmentId || urlFilters.priorityId || urlFilters.blueprintCategoryId;
  const isEmpty = (!summary || summary.active === 0) && departments.length === 0 && bottlenecks.length === 0;

  if (isEmpty) {
    return (
      <EmptyState
        title={t(hasFilters ? 'empty_filtered_title' : 'empty_title')}
        description={t(hasFilters ? 'empty_filtered_description' : 'empty_description')}
        action={hasFilters ? <Button variant="outline" onClick={() => router.replace(pathname)}>{t('reset_filters')}</Button> : undefined}
      />
    );
  }

  return (
    <section className="flex flex-col gap-6">
      {summary && <ExecutiveSummaryCards summary={summary} />}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DepartmentHealthPanel departments={departments} />
        </div>
        <div>
          <BottlenecksPanel bottlenecks={bottlenecks} />
        </div>
      </div>
    </section>
  );
}
