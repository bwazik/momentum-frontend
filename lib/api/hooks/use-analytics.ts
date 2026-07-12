import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { queryKeys } from '@/lib/api/query-keys';
import type { CursorPage } from '@/lib/api/types';
import type { operations } from '@/lib/generated/api-types';

export type AgingReportQuery = NonNullable<
  operations['agingReport.index']['parameters']['query']
>;

export type ExecutiveSummaryQuery = NonNullable<
  operations['executiveDashboard.summary']['parameters']['query']
>;

export type ExecutiveBottlenecksQuery = NonNullable<
  operations['executiveDashboard.bottlenecks']['parameters']['query']
>;

export function useAgingReportInfinite(filters: AgingReportQuery) {
  return useInfiniteQuery({
    queryKey: queryKeys.analytics.agingList(filters as unknown as Record<string, unknown>),
    queryFn: ({ pageParam }) =>
      apiClient.get<CursorPage<unknown>>('/v1/analytics/tasks/aging', {
        params: { ...filters, cursor: pageParam },
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? lastPage.next_cursor : undefined,
  });
}

export function useExecutiveSummary(filters: ExecutiveSummaryQuery) {
  return useQuery({
    queryKey: queryKeys.analytics.executive.summary(filters as unknown as Record<string, unknown>),
    queryFn: () => apiClient.get<unknown>('/v1/analytics/executive/summary', { params: filters }),
    refetchInterval: 60_000,
  });
}

export function useExecutiveDepartmentHealth(filters: ExecutiveSummaryQuery) {
  return useQuery({
    queryKey: queryKeys.analytics.executive.departmentHealth(filters as unknown as Record<string, unknown>),
    queryFn: () => apiClient.get<unknown[]>('/v1/analytics/executive/department-health', { params: filters }),
  });
}

export function useExecutiveBottlenecks(filters: ExecutiveBottlenecksQuery) {
  return useQuery({
    queryKey: queryKeys.analytics.executive.bottlenecks(filters as unknown as Record<string, unknown>),
    queryFn: () => apiClient.get<unknown[]>('/v1/analytics/executive/bottlenecks', { params: filters }),
  });
}

export function useExecutiveSummaryDrillDown(metric: string, filters: ExecutiveSummaryQuery) {
  return useInfiniteQuery({
    queryKey: queryKeys.analytics.executive.drillDown(metric, filters as unknown as Record<string, unknown>),
    queryFn: ({ pageParam }) =>
      apiClient.get<CursorPage<unknown>>(`/v1/analytics/executive/summary/drill-down/${metric}`, {
        params: { ...filters, cursor: pageParam },
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.has_more ? lastPage.next_cursor : undefined),
  });
}

export function useExecutiveBottleneckDrillDown(stageType: string, filters: ExecutiveBottlenecksQuery) {
  return useInfiniteQuery({
    queryKey: queryKeys.analytics.executive.bottleneckDrillDown(stageType, filters as unknown as Record<string, unknown>),
    queryFn: ({ pageParam }) =>
      apiClient.get<CursorPage<unknown>>(`/v1/analytics/executive/bottlenecks/${stageType}/drill-down`, {
        params: { ...filters, cursor: pageParam },
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.has_more ? lastPage.next_cursor : undefined),
  });
}

// ---- Department Dashboard Hooks -------------------------------------------

export type DepartmentPerformanceQuery = NonNullable<
  operations['departmentDashboard.performance']['parameters']['query']
>;

export type DepartmentTeamQuery = NonNullable<
  operations['departmentDashboard.team']['parameters']['query']
> & { sla_health?: string; assignee_id?: string };

export type DepartmentDrillDownQuery = NonNullable<
  operations['departmentDashboard.drillDown']['parameters']['query']
> & { sla_health?: string; assignee_id?: string };

export function useDepartmentPerformance(departmentPublicId: string, filters: DepartmentPerformanceQuery) {
  return useQuery({
    queryKey: queryKeys.analytics.department.performance(departmentPublicId, filters as unknown as Record<string, unknown>),
    queryFn: () =>
      apiClient.get<unknown>(`/v1/analytics/departments/${departmentPublicId}/performance`, {
        params: filters,
      }),
    refetchInterval: 60_000,
    enabled: !!departmentPublicId,
  });
}

export function useDepartmentTeam(departmentPublicId: string, filters: DepartmentTeamQuery) {
  return useQuery({
    queryKey: queryKeys.analytics.department.team(departmentPublicId, filters as unknown as Record<string, unknown>),
    queryFn: () =>
      apiClient.get<unknown[]>(`/v1/analytics/departments/${departmentPublicId}/team`, {
        params: filters,
      }),
    enabled: !!departmentPublicId,
  });
}

export function useDepartmentDrillDownInfinite(departmentPublicId: string, filters: DepartmentDrillDownQuery) {
  return useInfiniteQuery({
    queryKey: queryKeys.analytics.department.drillDown(departmentPublicId, filters as unknown as Record<string, unknown>),
    queryFn: ({ pageParam }) =>
      apiClient.get<CursorPage<unknown>>(
        `/v1/analytics/departments/${departmentPublicId}/performance/drill-down`,
        { params: { ...filters, cursor: pageParam } },
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.has_more ? lastPage.next_cursor : undefined),
    enabled: !!departmentPublicId,
  });
}
