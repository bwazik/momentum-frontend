'use client';

import { useEffect, useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { ApiRequestError } from '@/lib/api/client';
import { useCurrentUser } from '@/lib/api/hooks/use-auth';
import { useCapability } from '@/lib/api/hooks/use-capabilities';
import {
  useDepartmentPerformance,
  useDepartmentTeam,
  useDepartmentDrillDownInfinite,
} from '@/lib/api/hooks/use-analytics';
import {
  readDepartmentDashboardFilters,
  toDepartmentPerformanceQuery,
  toDepartmentTeamQuery,
  toDepartmentDrillDownQuery,
  narrowDepartmentPerformance,
  narrowTeamMember,
  sortTeamMembers,
} from './department-dashboard-utils';
import { DepartmentDashboardSkeleton } from './department-dashboard-skeleton';
import { DepartmentSelector } from './department-selector';
import { DepartmentDashboardFilters } from './department-dashboard-filters';
import { DepartmentPerformanceCards } from './department-performance-cards';
import { DepartmentTeamPanel } from './department-team-panel';
import { DepartmentDrillDownList } from './department-drill-down-list';
import type { TeamMember } from './department-dashboard-types';

export function DepartmentDashboard() {
  const t = useTranslations('analytics.department');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: user, isLoading: isUserLoading } = useCurrentUser();
  const canViewOrg = useCapability('analytics.view.organization');

  const urlFilters = useMemo(() => readDepartmentDashboardFilters(searchParams), [searchParams]);

  const userDeptId = (user as { current_position?: { position?: { department?: { public_id?: string } } } } | undefined)
    ?.current_position?.position?.department?.public_id;

  useEffect(() => {
    if (urlFilters.departmentId) return;
    if (!user || !userDeptId) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('departmentId', userDeptId);
    router.replace(`${pathname}?${params.toString()}`);
  }, [user, userDeptId, urlFilters.departmentId, pathname, router, searchParams]);

  const performanceFilters = useMemo(() => toDepartmentPerformanceQuery(urlFilters), [urlFilters]);
  const teamFilters = useMemo(() => toDepartmentTeamQuery(urlFilters), [urlFilters]);
  const drillDownFilters = useMemo(() => toDepartmentDrillDownQuery(urlFilters), [urlFilters]);

  const performanceQuery = useDepartmentPerformance(urlFilters.departmentId ?? '', performanceFilters);
  const teamQuery = useDepartmentTeam(urlFilters.departmentId ?? '', teamFilters);
  const drillDownQuery = useDepartmentDrillDownInfinite(urlFilters.departmentId ?? '', drillDownFilters);

  const performance = useMemo(() => {
    if (!performanceQuery.data) return null;
    return narrowDepartmentPerformance(performanceQuery.data);
  }, [performanceQuery.data]);

  const teamMembers = useMemo(() => {
    if (!teamQuery.data || !Array.isArray(teamQuery.data)) return [];
    return sortTeamMembers(
      teamQuery.data.map(narrowTeamMember).filter((m): m is TeamMember => m !== null),
      locale,
    );
  }, [teamQuery.data, locale]);

  const noDeptToResolve = !!user && !userDeptId;
  const isFetchingOrLoading =
    performanceQuery.isLoading || performanceQuery.isFetching ||
    teamQuery.isLoading || teamQuery.isFetching ||
    drillDownQuery.isLoading || drillDownQuery.isFetching;
  const isLoading =
    isUserLoading ||
    (!urlFilters.departmentId && !noDeptToResolve) ||
    isFetchingOrLoading;
  const hasPermanentError =
    (performanceQuery.isError && !performanceQuery.isFetching) ||
    (teamQuery.isError && !teamQuery.isFetching) ||
    (drillDownQuery.isError && !drillDownQuery.isFetching);
  const error = performanceQuery.error ?? teamQuery.error ?? drillDownQuery.error;

  const filterActions = (
    <div className="flex items-center gap-2">
      <DepartmentSelector
        departmentId={urlFilters.departmentId ?? ''}
        canSelect={canViewOrg}
      />
      <DepartmentDashboardFilters />
    </div>
  );

  if (isLoading) return <DepartmentDashboardSkeleton />;
  if (hasPermanentError) {
    if (error instanceof ApiRequestError && error.status === 403) {
      return <EmptyState icon={Lock} title={t('no_permission_title')} description={t('no_permission_description')} />;
    }
    return (
      <ErrorState
        message={t('error')}
        onRetry={() => {
          performanceQuery.refetch();
          teamQuery.refetch();
          drillDownQuery.refetch();
        }}
      />
    );
  }

  if (!urlFilters.departmentId) {
    return (
      <section className="flex flex-col gap-6">
        <PageHeader title={t('title')} description={t('description')} actions={filterActions} />
        <EmptyState
          title={t('select_department_title')}
          description={canViewOrg ? t('select_department_description') : t('no_permission_description')}
        />
      </section>
    );
  }

  const hasFilters =
    urlFilters.dateFrom ||
    urlFilters.dateTo ||
    urlFilters.priorityId ||
    urlFilters.blueprintCategoryId ||
    urlFilters.status ||
    urlFilters.slaHealth ||
    urlFilters.assigneeId;
  const isEmpty =
    (!performance || performance.activeTasks + performance.overdueTasks + performance.atRiskTasks === 0) &&
    teamMembers.length === 0;

  if (isEmpty) {
    return (
      <section className="flex flex-col gap-6">
        <PageHeader title={t('title')} description={t('description')} actions={filterActions} />
        <EmptyState
          title={t(hasFilters ? 'empty_filtered_title' : 'empty_title')}
          description={t(hasFilters ? 'empty_filtered_description' : 'empty_description')}
          action={
            hasFilters ? (
              <Button variant="outline" onClick={() => router.replace(`${pathname}?departmentId=${urlFilters.departmentId}`)}>
                {t('reset_filters')}
              </Button>
            ) : undefined
          }
        />
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-6">
      <PageHeader title={t('title')} description={t('description')} actions={filterActions} />
      {performance && <DepartmentPerformanceCards performance={performance} />}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div>
          <DepartmentTeamPanel members={teamMembers} />
        </div>
        <div className="lg:col-span-2">
          <DepartmentDrillDownList query={drillDownQuery} />
        </div>
      </div>
    </section>
  );
}
