# Plan: Department Manager Dashboard

> **Spec:** `specs/012-department-manager-dashboard/spec.md`
> **Date:** 2026-07-11
> **Status:** `completed`

---

## Open Questions Resolved

| Question | Decision | Rationale |
|----------|----------|-----------|
| Default department derivation | Use `user.current_position.position.department.public_id` from `GET /v1/iam/auth/me`. Write it to URL `departmentId` once via `router.replace`. | Matches resolved spec; predictable back button. |
| Route path | `/analytics/department?departmentId={publicId}`. | Sibling to `/analytics/aging` and `/analytics/executive/*`; cookie-based locale. |
| Team endpoint names | Consume `name_ar`/`name_en` directly from `TeamMetricsResource`. No extra user lookup. | Backend now returns localized names. |
| Workload highlighting | Deferred. Sort by `overdue_assignments` desc, then `active_assignments` desc, then name. | No capacity metric from backend. |
| Drill-down employee filter | Use `assignee_id={userPublicId}` on `GET /v1/analytics/departments/{department}/performance/drill-down`. | Backend contract supports it. |
| Department selector for scoped users | Hide selector for users with only `analytics.view.department` or `analytics.view.individuals_in_department`. | Server returns 403 for unauthorized department URLs. |
| Sidebar grouping | Add "Department Dashboard" under existing Analytics group; Executive Dashboard remains at `/` (Dashboard) per existing F5 implementation. | Current sidebar already places Executive Dashboard under Main → Dashboard. |
| Status filter UI | Status filtering is driven by clickable stat cards (`metric=active\|overdue\|at_risk`). The advanced filter sheet exposes date, priority, and blueprint category only, matching the executive dashboard pattern. | Keeps UI consistent with `002`; `status` is still forwarded to endpoints when present in URL. |

---

## Technical Approach

Build `/analytics/department` as a read-only, department-scoped dashboard. Three analytics endpoints feed one screen: a bounded performance summary (polled every 60s), a bounded team list, and a cursor-paginated drill-down list. Department selection and all filters live in URL search params so views are bookmarkable. Runtime narrowing adapters convert string-serialized numeric fields from the backend. The drill-down reuses the executive drill-down table/mobile components because both return `TaskListItemResource`.

Key decisions:

- **One page, three queries** — `useQuery` for performance/team, `useInfiniteQuery` for drill-down.
- **URL state for shareability** — `departmentId`, `dateFrom`, `dateTo`, `priorityId`, `blueprintCategoryId`, `metric`, `assigneeId`.
- **Default department via `/me`** — no extra endpoint call.
- **No Zustand for API data** — TanStack Query owns server state; local state only for filter sheet open/close.
- **Reuse executive drill-down UI** — table and mobile list already render `DrillDownTaskItem`.
- **Capability-gated selector** — org-wide users see a Select; scoped users see a read-only label.
- **Polling only on performance** — keeps SLA counts fresh, avoids load on team/drill-down.

---

## Component Tree

```text
app/(dashboard)/analytics/department/page.tsx                 Server   (PageHeader + DepartmentDashboard)
  components/domain/analytics/department-dashboard.tsx        Client   (orchestrates departmentId, queries, 4 states)
    DepartmentDashboardFilters                                Client   (AdvancedFiltersSheet + reset chip)
    DepartmentSelector                                        Client   (Select for org-wide users, read-only for scoped)
    DepartmentPerformanceCards                                Client   (4 KPI stat cards)
      StatCard                                                Client   (shared)
    DepartmentTeamPanel                                       Client   (sorted team workload list)
      DepartmentTeamRow                                       Client   (single employee row)
    DepartmentDrillDownList                                   Client   (infinite query + table/cards)
      ExecutiveDrillDownTable                                 Client   (reused from 002)
      ExecutiveDrillDownMobileList                            Client   (reused from 002)
    DepartmentDashboardSkeleton                               Client   (loading state)
    EmptyState / ErrorState                                   Client   (shared)

components/domain/shell/app-sidebar.tsx                       Client   (add Department Dashboard nav item)
components/domain/shell/use-page-breadcrumb.ts                Client   (add /analytics/department breadcrumb)
```

**Server components:** page shells only.  
**Client components:** anything using TanStack Query, URL params, router, or event handlers.

---

## Affected Files

### New Files

| File | Purpose |
|------|---------|
| `components/domain/analytics/department-dashboard.tsx` | Main client container: department resolution, queries, layout, states. |
| `components/domain/analytics/department-dashboard-types.ts` | Display types + URL filter types. |
| `components/domain/analytics/department-dashboard-utils.ts` | URL parsing, API param mapping, runtime narrowing adapters, team sorting. |
| `components/domain/analytics/department-performance-cards.tsx` | 4 KPI stat cards with metric drill-down links. |
| `components/domain/analytics/department-team-panel.tsx` | Sorted team workload list. |
| `components/domain/analytics/department-team-row.tsx` | Single employee row. |
| `components/domain/analytics/department-drill-down-list.tsx` | Cursor-paginated drill-down container. |
| `components/domain/analytics/department-dashboard-filters.tsx` | Filter button in PageHeader actions slot. |
| `components/domain/analytics/department-selector.tsx` | Department Select or read-only label. |
| `components/domain/analytics/department-dashboard-skeleton.tsx` | Skeleton matching stat cards + team rows + drill-down rows. |
| `app/(dashboard)/analytics/department/page.tsx` | Server page shell. |
| `__tests__/components/domain/analytics/department-dashboard.test.tsx` | Loading/success/empty/error/no-permission/sort tests. |

### Modified Files

| File | Change |
|------|--------|
| `lib/api/query-keys.ts` | Add `analytics.department` namespace. |
| `lib/api/hooks/use-analytics.ts` | Add `useDepartmentPerformance`, `useDepartmentTeam`, `useDepartmentDrillDownInfinite`. |
| `components/shared/stat-card.tsx` | Add `onClick` prop and allow `value: number | string` for clickable metric cards and duration display. |
| `components/domain/shell/app-sidebar.tsx` | Add Department Dashboard item to Analytics group. |
| `components/domain/shell/use-page-breadcrumb.ts` | Add `/analytics/department` breadcrumb label. |
| `messages/ar.json` | Add `analytics.department.*` namespace. |
| `messages/en.json` | Add `analytics.department.*` namespace. |
| `__tests__/mocks/handlers.ts` | Add MSW handlers for department analytics endpoints. |

### Optional Backend Coordination

- Verify `DepartmentPerformanceResource` numeric fields are typed as numbers in a future OpenAPI regeneration, then remove runtime narrowing.

---

## Implementation Notes

### 1. Query Keys

**One-line summary:** extend `lib/api/query-keys.ts` with `analytics.department` namespace.

**Key decisions:**
- Centralize keys; no hardcoded strings.
- `departmentPublicId` and filters are part of the key.

**File:** `lib/api/query-keys.ts`

**Snippet:**

```ts
export const queryKeys = {
  // ... existing namespaces ...
  analytics: {
    all: ['analytics'] as const,
    agingLists: () => [...queryKeys.analytics.all, 'aging', 'list'] as const,
    agingList: (filters: Record<string, unknown>) =>
      [...queryKeys.analytics.agingLists(), filters] as const,
    executive: {
      // ... existing executive keys ...
    },
    department: {
      performances: () => [...queryKeys.analytics.all, 'department', 'performance'] as const,
      performance: (departmentPublicId: string, filters: Record<string, unknown>) =>
        [...queryKeys.analytics.department.performances(), departmentPublicId, filters] as const,
      teams: () => [...queryKeys.analytics.all, 'department', 'team'] as const,
      team: (departmentPublicId: string, filters: Record<string, unknown>) =>
        [...queryKeys.analytics.department.teams(), departmentPublicId, filters] as const,
      drillDowns: () => [...queryKeys.analytics.all, 'department', 'drill-down'] as const,
      drillDown: (departmentPublicId: string, filters: Record<string, unknown>) =>
        [...queryKeys.analytics.department.drillDowns(), departmentPublicId, filters] as const,
    },
  },
} as const;
```

**Test cases:**
1. `queryKeys.analytics.department.performance('dept-1', { priority_id: 'p1' })` returns `['analytics', 'department', 'performance', 'dept-1', { priority_id: 'p1' }]`.
2. No component imports a hardcoded `['analytics', 'department', ...]` array.

**Rules:** `coding-standards.md` — centralized query key factory.

---

### 2. Department Dashboard Query Hooks

**One-line summary:** add three hooks to `lib/api/hooks/use-analytics.ts` using generated operation types.

**Key decisions:**
- Performance query polls every 60s.
- Team query is bounded; no pagination.
- Drill-down uses `useInfiniteQuery` with cursor pagination.
- All hooks are disabled until `departmentPublicId` is available.
- Response data is narrowed from `unknown` because OpenAPI serializes numeric fields as strings.

**File:** `lib/api/hooks/use-analytics.ts`

**Snippet:**

```ts
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
// ... existing imports ...

export type DepartmentPerformanceQuery = NonNullable<
  operations['departmentDashboard.performance']['parameters']['query']
>;

export type DepartmentTeamQuery = NonNullable<
  operations['departmentDashboard.team']['parameters']['query']
>;

export type DepartmentDrillDownQuery = NonNullable<
  operations['departmentDashboard.drillDown']['parameters']['query']
>;

export function useDepartmentPerformance(departmentPublicId: string, filters: DepartmentPerformanceQuery) {
  return useQuery({
    queryKey: queryKeys.analytics.department.performance(
      departmentPublicId,
      filters as unknown as Record<string, unknown>,
    ),
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
    queryKey: queryKeys.analytics.department.team(
      departmentPublicId,
      filters as unknown as Record<string, unknown>,
    ),
    queryFn: () =>
      apiClient.get<unknown[]>(`/v1/analytics/departments/${departmentPublicId}/team`, {
        params: filters,
      }),
    enabled: !!departmentPublicId,
  });
}

export function useDepartmentDrillDownInfinite(
  departmentPublicId: string,
  filters: DepartmentDrillDownQuery,
) {
  return useInfiniteQuery({
    queryKey: queryKeys.analytics.department.drillDown(
      departmentPublicId,
      filters as unknown as Record<string, unknown>,
    ),
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
```

**Test cases:**
1. Render `useDepartmentPerformance('dept-1', { date_from: '2026-01-01' })` → request URL contains `date_from=2026-01-01`.
2. Render `useDepartmentDrillDownInfinite('dept-1', {})` → second page uses returned `next_cursor` when `has_more=true`.

**Rules:** `coding-standards.md` — `useInfiniteQuery` for cursor pagination, generated types, no `useEffect` fetch.

---

### 3. Types, Adapter, and Utils

**One-line summary:** define display types, URL filter types, runtime narrowing adapters, and URL-to-API mapping in `department-dashboard-types.ts` and `department-dashboard-utils.ts`.

**Key decisions:**
- `DepartmentPerformance` and `TeamMember` describe runtime shapes.
- `metric` is restricted to the drill-down metric values.
- `toDepartment*Query()` helpers strip drill-down-only fields from performance/team queries.
- Reuse `formatDuration` from `executive-dashboard-utils.ts` to format average stage delay.

**Files:**
- `components/domain/analytics/department-dashboard-types.ts`
- `components/domain/analytics/department-dashboard-utils.ts`

**Snippet — types:**

```ts
import type { operations } from '@/lib/generated/api-types';

export type DepartmentPerformanceQuery = NonNullable<
  operations['departmentDashboard.performance']['parameters']['query']
>;

export type DepartmentTeamQuery = NonNullable<
  operations['departmentDashboard.team']['parameters']['query']
>;

export type DepartmentDrillDownQuery = NonNullable<
  operations['departmentDashboard.drillDown']['parameters']['query']
>;

export interface DepartmentDashboardUrlFilters {
  departmentId?: string;
  dateFrom?: string;
  dateTo?: string;
  priorityId?: string;
  status?: string;
  blueprintCategoryId?: string;
  metric?: 'active' | 'overdue' | 'at_risk' | 'suspended' | 'completed' | 'cancelled';
  assigneeId?: string;
}

export interface DepartmentPerformance {
  departmentPublicId: string;
  activeTasks: number;
  overdueTasks: number;
  atRiskTasks: number;
  averageStageDelaySeconds: number;
}

export interface TeamMember {
  userPublicId: string;
  nameAr: string;
  nameEn: string;
  activeAssignments: number;
  overdueAssignments: number;
  completedStages: number;
}
```

**Snippet — utils:**

```ts
import { formatDuration } from './executive-dashboard-utils';
import type {
  DepartmentDashboardUrlFilters,
  DepartmentPerformanceQuery,
  DepartmentTeamQuery,
  DepartmentDrillDownQuery,
  DepartmentPerformance,
  TeamMember,
} from './department-dashboard-types';

export { formatDuration };

export function readDepartmentDashboardFilters(params: URLSearchParams): DepartmentDashboardUrlFilters {
  return {
    departmentId: params.get('departmentId') ?? undefined,
    dateFrom: params.get('dateFrom') ?? undefined,
    dateTo: params.get('dateTo') ?? undefined,
    priorityId: params.get('priorityId') ?? undefined,
    status: params.get('status') ?? undefined,
    blueprintCategoryId: params.get('blueprintCategoryId') ?? undefined,
    metric: (params.get('metric') as DepartmentDashboardUrlFilters['metric']) ?? undefined,
    assigneeId: params.get('assigneeId') ?? undefined,
  };
}

function toNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

function narrowObject(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object') return null;
  return raw as Record<string, unknown>;
}

function buildBaseQuery(filters: DepartmentDashboardUrlFilters): Record<string, unknown> {
  return {
    date_from: filters.dateFrom ?? null,
    date_to: filters.dateTo ?? null,
    priority_id: filters.priorityId ?? null,
    status: filters.status ?? null,
    blueprint_category_id: filters.blueprintCategoryId ?? null,
  };
}

export function toDepartmentPerformanceQuery(filters: DepartmentDashboardUrlFilters): DepartmentPerformanceQuery {
  return buildBaseQuery(filters) as DepartmentPerformanceQuery;
}

export function toDepartmentTeamQuery(filters: DepartmentDashboardUrlFilters): DepartmentTeamQuery {
  return buildBaseQuery(filters) as DepartmentTeamQuery;
}

export function toDepartmentDrillDownQuery(filters: DepartmentDashboardUrlFilters): DepartmentDrillDownQuery {
  return {
    ...buildBaseQuery(filters),
    assignee_id: filters.assigneeId ?? null,
    metric: filters.metric ?? null,
    per_page: 15,
  } as DepartmentDrillDownQuery;
}

export function narrowDepartmentPerformance(raw: unknown): DepartmentPerformance | null {
  const v = narrowObject(raw);
  if (!v || typeof v.department_public_id !== 'string') return null;
  return {
    departmentPublicId: v.department_public_id,
    activeTasks: toNumber(v.active_tasks),
    overdueTasks: toNumber(v.overdue_tasks),
    atRiskTasks: toNumber(v.at_risk_tasks),
    averageStageDelaySeconds: toNumber(v.average_stage_delay_seconds),
  };
}

export function narrowTeamMember(raw: unknown): TeamMember | null {
  const v = narrowObject(raw);
  if (!v || typeof v.user_public_id !== 'string') return null;
  return {
    userPublicId: v.user_public_id,
    nameAr: typeof v.name_ar === 'string' ? v.name_ar : '',
    nameEn: typeof v.name_en === 'string' ? v.name_en : '',
    activeAssignments: toNumber(v.active_assignments),
    overdueAssignments: toNumber(v.overdue_assignments),
    completedStages: toNumber(v.completed_stages),
  };
}

export function sortTeamMembers(members: TeamMember[], locale: string): TeamMember[] {
  return [...members].sort((a, b) => {
    if (b.overdueAssignments !== a.overdueAssignments) {
      return b.overdueAssignments - a.overdueAssignments;
    }
    if (b.activeAssignments !== a.activeAssignments) {
      return b.activeAssignments - a.activeAssignments;
    }
    const nameA = locale === 'ar' ? a.nameAr : a.nameEn;
    const nameB = locale === 'ar' ? b.nameAr : b.nameEn;
    return nameA.localeCompare(nameB, locale);
  });
}
```

**Test cases:**
1. `narrowDepartmentPerformance({ department_public_id: 'd1', active_tasks: '5', overdue_tasks: '1', at_risk_tasks: '0', average_stage_delay_seconds: '86400' })` returns `{ activeTasks: 5, overdueTasks: 1, atRiskTasks: 0, averageStageDelaySeconds: 86400 }`.
2. `sortTeamMembers([{ overdueAssignments: 0, activeAssignments: 5 }, { overdueAssignments: 2, activeAssignments: 1 }], 'en')` returns the member with 2 overdue first.
3. `toDepartmentDrillDownQuery({ assigneeId: 'u1', metric: 'overdue' })` contains `assignee_id: 'u1'` and `metric: 'overdue'`.

**Rules:** `coding-standards.md` — no `any`, use `unknown` narrowing; URL params for filters.

---

### 4. Page + Container

**One-line summary:** `/analytics/department` is a server page rendering `PageHeader` + `DepartmentDashboard` client container.

**Key decisions:**
- Server page uses `getTranslations('analytics.department')`.
- `DepartmentDashboard` resolves `departmentId`, runs three queries, handles all 4 states.
- Default department is written to URL once; scoped users with no `departmentId` see it auto-filled.
- Org-wide users without a primary department see the selector and an empty prompt until they pick a department.

**Files:**
- `app/(dashboard)/analytics/department/page.tsx`
- `components/domain/analytics/department-dashboard.tsx`

**Page snippet:**

```tsx
import { getTranslations } from 'next-intl/server';
import { PageHeader } from '@/components/shared/page-header';
import { DepartmentDashboard } from '@/components/domain/analytics/department-dashboard';

export default async function DepartmentDashboardPage() {
  const t = await getTranslations('analytics.department');
  return (
    <main className="flex flex-col gap-6 p-6">
      <PageHeader title={t('title')} description={t('description')} />
      <DepartmentDashboard />
    </main>
  );
}
```

**Container snippet:**

```tsx
'use client';

import { useEffect, useMemo, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    if (urlFilters.departmentId) {
      initialized.current = true;
      return;
    }
    const defaultDepartmentId = user?.current_position?.position?.department?.public_id;
    if (defaultDepartmentId) {
      initialized.current = true;
      const params = new URLSearchParams(searchParams.toString());
      params.set('departmentId', defaultDepartmentId);
      router.replace(`${pathname}?${params.toString()}`);
    }
  }, [user, urlFilters.departmentId, pathname, router, searchParams]);

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

  const isLoading =
    isUserLoading ||
    performanceQuery.isLoading ||
    teamQuery.isLoading ||
    (!urlFilters.departmentId && !initialized.current);
  const isError = performanceQuery.isError || teamQuery.isError || drillDownQuery.isError;
  const error = performanceQuery.error ?? teamQuery.error ?? drillDownQuery.error;

  if (isLoading) return <DepartmentDashboardSkeleton />;
  if (isError) {
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
      <EmptyState
        title={t('select_department_title')}
        description={t('select_department_description')}
      />
    );
  }

  const hasFilters =
    urlFilters.dateFrom ||
    urlFilters.dateTo ||
    urlFilters.priorityId ||
    urlFilters.blueprintCategoryId ||
    urlFilters.metric ||
    urlFilters.assigneeId;
  const isEmpty =
    (!performance || performance.activeTasks + performance.overdueTasks + performance.atRiskTasks === 0) &&
    teamMembers.length === 0;

  if (isEmpty) {
    return (
      <section className="flex flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <DepartmentSelector departmentId={urlFilters.departmentId} canSelect={canViewOrg} />
          <DepartmentDashboardFilters />
        </div>
        <EmptyState
          title={t(hasFilters ? 'empty_filtered_title' : 'empty_title')}
          description={t(hasFilters ? 'empty_filtered_description' : 'empty_description')}
          action={
            hasFilters ? (
              <Button variant="outline" onClick={() => router.replace(pathname)}>
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <DepartmentSelector departmentId={urlFilters.departmentId} canSelect={canViewOrg} />
        <DepartmentDashboardFilters />
      </div>
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
```

**State management:**
- **URL:** department selection and all filters.
- **Local `useState`:** filter sheet open/close (inside `DepartmentDashboardFilters`).
- **Zustand:** none. No API data in Zustand.

**Test cases:**
1. Render with no `departmentId` and mocked user with primary department → URL updated to `?departmentId={primaryDept}` and skeleton appears briefly, then dashboard renders.
2. Render success with performance + team data → stat cards and team rows are visible.
3. Render API 500 → `ErrorState` with retry button.
4. Render API 403 → no-permission `EmptyState`.

**Rules:** `coding-standards.md` — all 4 states, no Zustand for API data, URL params shareable.

---

### 5. Department Selector

**One-line summary:** render a `RtlSelect` for org-wide users; render a read-only department name for scoped users.

**Key decisions:**
- Use `useDepartmentsInfinite` for the selector options.
- Selecting a department updates `departmentId` and clears `assigneeId`/`metric` so the new department starts fresh.
- For scoped users, use `useDepartment(departmentId)` to show the localized name.

**File:** `components/domain/analytics/department-selector.tsx`

**Snippet:**

```tsx
'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Skeleton } from '@/components/ui/skeleton';
import { RtlSelect } from '@/components/shared/rtl-select';
import {
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDepartmentsInfinite } from '@/lib/api/hooks/use-organization';
import { useDepartment } from '@/lib/api/hooks/use-organization';
import { localizeName } from '@/lib/utils/localize';

interface DepartmentSelectorProps {
  departmentId: string;
  canSelect: boolean;
}

export function DepartmentSelector({ departmentId, canSelect }: DepartmentSelectorProps) {
  const t = useTranslations('analytics.department');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: departmentsData, isLoading: isDepartmentsLoading } = useDepartmentsInfinite();
  const { data: department, isLoading: isDepartmentLoading } = useDepartment(departmentId);

  const departments = departmentsData?.pages.flatMap((p) => p.data) ?? [];

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('departmentId', value);
    params.delete('assigneeId');
    params.delete('metric');
    router.replace(`${pathname}?${params.toString()}`);
  }

  if (!canSelect) {
    if (isDepartmentLoading) return <Skeleton className="h-9 w-48" />;
    const name = department ? localizeName(locale, department.name_ar, department.name_en) : departmentId;
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">{t('department_label')}</span>
        <span className="text-base font-semibold">{name}</span>
      </div>
    );
  }

  return (
    <RtlSelect value={departmentId} onValueChange={handleChange} disabled={isDepartmentsLoading}>
      <SelectTrigger className="w-64">
        <SelectValue placeholder={t('select_department')} />
      </SelectTrigger>
      <SelectContent position="popper">
        <SelectGroup>
          {departments.map((d) => (
            <SelectItem key={d.public_id} value={d.public_id}>
              {localizeName(locale, d.name_ar, d.name_en)}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </RtlSelect>
  );
}
```

**Test cases:**
1. Org-wide user → `RtlSelect` rendered with department options.
2. Scoped user → read-only department label rendered, no Select.

**Rules:** `coding-standards.md` — capability checks via `useCapability`; logical properties in layout.

---

### 6. Filters

**One-line summary:** `DepartmentDashboardFilters` renders an `AdvancedFiltersSheet` with department hidden (because department selection is separate) and a reset chip when filters are active.

**Key decisions:**
- Reuse `AdvancedFiltersSheet` from `components/domain/tasks/advanced-filters-sheet.tsx`.
- Hide `stageType` and `assignee` fields; department is controlled by the dedicated selector above.
- Reset clears everything except `departmentId`.

**File:** `components/domain/analytics/department-dashboard-filters.tsx`

**Snippet:**

```tsx
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
    }),
    [searchParams],
  );

  const activeCount = [filters.dateFrom, filters.dateTo, filters.priorityId, filters.blueprintCategoryId].filter(
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
```

**Test cases:**
1. Select priority in sheet → URL contains `priorityId=<publicId>` and performance/team/drill-down refetch.
2. Click reset → URL keeps `departmentId` but removes `priorityId`, `dateFrom`, etc.

**Rules:** `coding-standards.md` — URL-driven filters; `security-policy.md` — no PII in URL beyond `public_id`.

---

### 7. KPI Stat Cards

**One-line summary:** `DepartmentPerformanceCards` renders four shared `StatCard` instances: Active, Overdue, At Risk, Average Stage Delay.

**Key decisions:**
- Reuse shared `StatCard`.
- Active, Overdue, and At Risk cards are clickable and set `metric` URL param.
- Average Stage Delay card is not clickable (duration, not count).
- Use `formatDuration` for average delay.

**File:** `components/domain/analytics/department-performance-cards.tsx`

**Snippet:**

```tsx
'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Activity, AlertCircle, AlertTriangle, Clock } from 'lucide-react';
import { StatCard } from '@/components/shared/stat-card';
import { formatDuration } from './department-dashboard-utils';
import type { DepartmentPerformance } from './department-dashboard-types';

interface DepartmentPerformanceCardsProps {
  performance: DepartmentPerformance;
}

function setMetric(metric: string, searchParams: URLSearchParams, pathname: string, router: ReturnType<typeof useRouter>) {
  const params = new URLSearchParams(searchParams.toString());
  params.set('metric', metric);
  params.delete('assigneeId');
  router.replace(`${pathname}?${params.toString()}`);
}

export function DepartmentPerformanceCards({ performance }: DepartmentPerformanceCardsProps) {
  const t = useTranslations('analytics.department');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="department-performance-cards">
      <StatCard
        label={t('stat_active')}
        value={performance.activeTasks}
        icon={Activity}
        variant="active"
        iconVariant="boxed"
        valueSize="3xl"
        onClick={() => setMetric('active', searchParams, pathname, router)}
      />
      <StatCard
        label={t('stat_overdue')}
        value={performance.overdueTasks}
        icon={AlertCircle}
        variant="red"
        iconVariant="boxed"
        valueSize="3xl"
        onClick={() => setMetric('overdue', searchParams, pathname, router)}
      />
      <StatCard
        label={t('stat_at_risk')}
        value={performance.atRiskTasks}
        icon={AlertTriangle}
        variant="amber"
        iconVariant="boxed"
        valueSize="3xl"
        onClick={() => setMetric('at_risk', searchParams, pathname, router)}
      />
      <StatCard
        label={t('stat_avg_delay')}
        value={formatDuration(performance.averageStageDelaySeconds, locale)}
        icon={Clock}
        variant="emerald"
        iconVariant="boxed"
        valueSize="3xl"
      />
    </div>
  );
}
```

> **Note:** `StatCard` currently accepts `href?: string`, not `onClick`, and `value: number`. Two minimal changes are required:
> 1. Add `onClick?: () => void` to `StatCard` props and prefer `onClick` over `href` when `onClick` is provided.
> 2. Change `value` type to `number | string` and skip `Intl.NumberFormat` when `value` is a string so the average-delay duration can be passed directly.
> The existing `href`/numeric behavior remains untouched.

**Test cases:**
1. Render with `{ activeTasks: 10, overdueTasks: 2, atRiskTasks: 1, averageStageDelaySeconds: 3600 }` → cards show 10, 2, 1, and a duration label.
2. Click Overdue card → URL updates to `metric=overdue`.

**Rules:** `coding-standards.md` — shared `StatCard`, logical properties, semantic colors.

---

### 8. Team Panel

**One-line summary:** `DepartmentTeamPanel` renders sorted team rows; each row sets `assigneeId` URL param to filter the drill-down.

**Key decisions:**
- Sort by `overdueAssignments` desc, then `activeAssignments` desc, then localized name.
- Each row is clickable; clicking sets `assigneeId` and clears `metric`.
- No workload tinting in MVP.

**Files:**
- `components/domain/analytics/department-team-panel.tsx`
- `components/domain/analytics/department-team-row.tsx`

**Snippet — row:**

```tsx
'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { localizeName } from '@/lib/utils/localize';
import type { TeamMember } from './department-dashboard-types';

interface DepartmentTeamRowProps {
  member: TeamMember;
}

export function DepartmentTeamRow({ member }: DepartmentTeamRowProps) {
  const locale = useLocale();
  const t = useTranslations('analytics.department');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const name = localizeName(locale, member.nameAr, member.nameEn);

  function handleClick() {
    const params = new URLSearchParams(searchParams.toString());
    params.set('assigneeId', member.userPublicId);
    params.delete('metric');
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="w-full text-start p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <div className="flex items-center justify-between gap-4 mb-2">
        <span className="text-sm font-medium text-foreground truncate">{name}</span>
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span>{t('team_active', { count: member.activeAssignments })}</span>
        {member.overdueAssignments > 0 && (
          <span className="text-red-600">{t('team_overdue', { count: member.overdueAssignments })}</span>
        )}
        <span>{t('team_completed', { count: member.completedStages })}</span>
      </div>
    </button>
  );
}
```

**Snippet — panel:**

```tsx
'use client';

import { useTranslations } from 'next-intl';
import { DepartmentTeamRow } from './department-team-row';
import type { TeamMember } from './department-dashboard-types';

interface DepartmentTeamPanelProps {
  members: TeamMember[];
}

export function DepartmentTeamPanel({ members }: DepartmentTeamPanelProps) {
  const t = useTranslations('analytics.department');
  return (
    <section data-testid="department-team-panel">
      <h2 className="text-base font-semibold text-foreground mb-3">{t('panel_team')}</h2>
      <div className="flex flex-col gap-2">
        {members.map((member) => (
          <DepartmentTeamRow key={member.userPublicId} member={member} />
        ))}
      </div>
    </section>
  );
}
```

**Test cases:**
1. Render rows → first row has the highest overdue count.
2. Click a row → URL updates to `assigneeId={userPublicId}` and `metric` is removed.

**Rules:** `coding-standards.md` — logical properties (`text-start`/`text-end`), `localizeName`; `design-system/05-accessibility.md` — visible focus rings, semantic buttons.

---

### 9. Drill-Down List

**One-line summary:** `DepartmentDrillDownList` fetches cursor-paginated tasks and reuses the executive drill-down table/mobile list.

**Key decisions:**
- Flatten pages with `Set` deduplication.
- Use `narrowDrillDownTaskItem` from `executive-dashboard-utils.ts`.
- Reuse `ExecutiveDrillDownTable` and `ExecutiveDrillDownMobileList`.

**File:** `components/domain/analytics/department-drill-down-list.tsx`

**Snippet:**

```tsx
'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import type { UseInfiniteQueryResult } from '@tanstack/react-query';
import type { CursorPage } from '@/lib/api/types';
import { narrowDrillDownTaskItem } from './executive-dashboard-utils';
import { ExecutiveDrillDownTable } from './executive-drill-down-table';
import { ExecutiveDrillDownMobileList } from './executive-drill-down-mobile-list';
import type { DrillDownTaskItem } from './executive-dashboard-types';

interface DepartmentDrillDownListProps {
  query: UseInfiniteQueryResult<CursorPage<unknown>, Error>;
}

export function DepartmentDrillDownList({ query }: DepartmentDrillDownListProps) {
  const t = useTranslations('analytics.department');

  const tasks = useMemo(() => {
    const seen = new Set<string>();
    return (query.data?.pages.flatMap((page) => narrowDrillDownTaskItem(page.data as unknown[])) ?? [])
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

  if (!query.isLoading && tasks.length === 0) {
    return <EmptyState title={t('drill_down_empty_title')} description={t('drill_down_empty_description')} />;
  }

  return (
    <section className="flex flex-col gap-4" data-testid="department-drill-down-list">
      <div className="hidden md:block">
        <ExecutiveDrillDownTable tasks={tasks} />
      </div>
      <div className="md:hidden">
        <ExecutiveDrillDownMobileList tasks={tasks} />
      </div>
      {query.hasNextPage && (
        <Button variant="outline" onClick={() => query.fetchNextPage()} disabled={query.isFetchingNextPage}>
          {query.isFetchingNextPage ? t('loading_more') : t('load_more')}
        </Button>
      )}
    </section>
  );
}
```

**Test cases:**
1. Render with mock drill-down rows → table/cards show titles and "Load more" appears when `has_more=true`.
2. Click Load more → existing rows remain while new rows append.

**Rules:** `coding-standards.md` — cursor pagination, deduplicate rows.

---

### 10. Skeleton

**One-line summary:** `DepartmentDashboardSkeleton` matches the real layout: 4 stat cards, team rows, and drill-down rows.

**File:** `components/domain/analytics/department-dashboard-skeleton.tsx`

**Snippet:**

```tsx
'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function DepartmentDashboardSkeleton() {
  return (
    <section className="flex flex-col gap-6" data-testid="department-dashboard-skeleton">
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-9 w-24" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5">
            <div className="flex justify-between mb-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
            <Skeleton className="h-9 w-20" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="p-3 rounded-lg border border-border">
              <Skeleton className="h-4 w-40 mb-2" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>
        <div className="lg:col-span-2 flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-2 border-b p-2 last:border-b-0">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-4 w-full max-w-56" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

**Rules:** `coding-standards.md` — skeleton matches content shape.

---

### 11. Sidebar Navigation

**One-line summary:** add "Department Dashboard" to the existing Analytics group, alongside "Aging Report".

**File:** `components/domain/shell/app-sidebar.tsx`

**Snippet:**

```tsx
{canViewAnalytics && (
  <SidebarGroup>
    <SidebarGroupLabel>{tnav('analytics')}</SidebarGroupLabel>
    <SidebarGroupContent>
      <NavMain
        items={[
          { title: tnav('aging_report'), url: '/analytics/aging', icon: BarChart3 },
          { title: tnav('department_dashboard'), url: '/analytics/department', icon: BarChart3 },
        ]}
        pathname={pathname}
      />
    </SidebarGroupContent>
  </SidebarGroup>
)}
```

**Rules:** `security-policy.md` — capability checks are UX-only; server returns 403 regardless.

---

### 12. Breadcrumb

**One-line summary:** add `/analytics/department` handling before the generic `/analytics/` fallback.

**File:** `components/domain/shell/use-page-breadcrumb.ts`

**Snippet:**

```ts
if (pathname === '/analytics/department') {
  return [
    { label: nav('dashboard'), href: '/' },
    { label: nav('analytics'), href: '/analytics' },
    { label: analytics('department.title') },
  ];
}
```

**Rules:** `coding-standards.md` — breadcrumb derived from pathname, no per-page duplication.

---

### 13. Messages / i18n

**One-line summary:** add `analytics.department` namespace to both locale files.

**Files:** `messages/ar.json`, `messages/en.json`

**Required keys (English):**

```json
{
  "analytics": {
    "department": {
      "title": "Department Dashboard",
      "description": "Department-level task performance and team workload.",
      "error": "Unable to load the department dashboard.",
      "empty_title": "No dashboard data",
      "empty_description": "No analytics data is available for this department.",
      "empty_filtered_title": "No results match your filters",
      "empty_filtered_description": "Try adjusting or removing the active filters.",
      "reset_filters": "Reset filters",
      "loading_more": "Loading...",
      "load_more": "Load more",
      "no_permission_title": "No permission",
      "no_permission_description": "You do not have permission to view this department dashboard.",
      "select_department_title": "Select a department",
      "select_department_description": "Choose a department to view its dashboard.",
      "department_label": "Department",
      "select_department": "Select department",
      "stat_active": "Active Tasks",
      "stat_overdue": "Overdue Tasks",
      "stat_at_risk": "At Risk Tasks",
      "stat_avg_delay": "Average Stage Delay",
      "panel_team": "Team Workload",
      "panel_drill_down": "Tasks",
      "team_active": "{count} active",
      "team_overdue": "{count} overdue",
      "team_completed": "{count} completed",
      "drill_down_error": "Unable to load tasks.",
      "drill_down_empty_title": "No tasks found",
      "drill_down_empty_description": "Adjust filters or reset the view.",
      "columns": {
        "table_label": "Department tasks"
      }
    }
  }
}
```

**Rules:** `coding-standards.md` — dot-namespaced snake_case keys, no hardcoded strings.

---

### 14. Tests

**One-line summary:** add MSW handlers and component tests for the department dashboard.

**File:** `__tests__/components/domain/analytics/department-dashboard.test.tsx`

**Snippet:**

```tsx
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/__tests__/utils/test-utils';
import { DepartmentDashboard } from '@/components/domain/analytics/department-dashboard';

test('renders skeleton while resolving department', () => {
  renderWithProviders(<DepartmentDashboard />);
  expect(screen.getByTestId('department-dashboard-skeleton')).toBeInTheDocument();
});

test('renders stat cards and team rows', async () => {
  renderWithProviders(<DepartmentDashboard />);
  expect(await screen.findByTestId('department-performance-cards')).toBeInTheDocument();
  expect(await screen.findByText('Active Tasks')).toBeInTheDocument();
});
```

**MSW handlers to add to `__tests__/mocks/handlers.ts`:**

```ts
http.get('https://api.momentum.test/v1/analytics/departments/:department/performance', () => {
  return HttpResponse.json({
    department_public_id: 'dept-1',
    active_tasks: '5',
    overdue_tasks: '1',
    at_risk_tasks: '0',
    average_stage_delay_seconds: '3600',
  });
}),

http.get('https://api.momentum.test/v1/analytics/departments/:department/team', () => {
  return HttpResponse.json([
    {
      user_public_id: 'user-1',
      name_ar: 'أحمد',
      name_en: 'Ahmad',
      active_assignments: '3',
      overdue_assignments: '1',
      completed_stages: '5',
    },
    {
      user_public_id: 'user-2',
      name_ar: 'سارة',
      name_en: 'Sara',
      active_assignments: '2',
      overdue_assignments: '0',
      completed_stages: '8',
    },
  ]);
}),

http.get('https://api.momentum.test/v1/analytics/departments/:department/performance/drill-down', () => {
  return HttpResponse.json({
    data: [
      {
        task_public_id: 'task-1',
        display_id: 'T-2026-0001',
        title_ar: 'مهمة اختبارية',
        title_en: 'Test Task',
        status: 'active',
        priority: { public_id: 'p1', name_ar: 'عاجل', name_en: 'Urgent', severity_rank: '1', color_code: '#dc2626' },
        current_stage_name_ar: 'مراجعة',
        current_stage_name_en: 'Review',
        owning_department_public_id: 'dept-1',
        sla_health: 'red',
        created_at: '2026-07-01T00:00:00Z',
        created_at_hijri: null,
        completed_at: '',
        completed_at_hijri: null,
      },
    ],
    next_cursor: null,
    has_more: false,
  });
}),
```

**Rules:** `testing-policy.md` — MSW for API mocking, test loading/success/empty/error states.

---

## Data Flow

```text
User opens /analytics/department
  → app/(dashboard)/layout.tsx authenticates and hydrates current user
  → DepartmentDashboardPage renders PageHeader + DepartmentDashboard
  → DepartmentDashboard reads URL search params
  → If no departmentId, derives default from user.current_position.position.department.public_id
     and writes it to URL via router.replace
  → Three queries run in parallel:
      GET /v1/analytics/departments/{department}/performance
      GET /v1/analytics/departments/{department}/team
      GET /v1/analytics/departments/{department}/performance/drill-down
  → apiClient sends credentials, X-Tenant, X-Locale, and serialized query params
  → Backend applies ABAC visibility and returns:
      performance object
      team array
      cursor-paginated { data, next_cursor, has_more }
  → Narrow adapters convert string-serialized numbers to typed objects
  → DepartmentPerformanceCards, DepartmentTeamPanel, DepartmentDrillDownList render

User changes department
  → URL departmentId changes → all three queries refetch

User clicks stat card
  → URL metric changes → drill-down query refetches with metric filter

User clicks team row
  → URL assigneeId changes → drill-down query refetches with assignee_id filter

User changes advanced filters
  → URL changes → all three queries refetch

User clicks Load more
  → fetchNextPage appends next cursor page to drill-down
```

---

## Route Structure

```text
app/
  (dashboard)/
    analytics/
      page.tsx                              # existing redirect to /analytics/aging
      aging/
        page.tsx                            # existing aging report
      department/
        page.tsx                            # /analytics/department
      executive/                            # existing executive drill-downs
        ...
      error.tsx                             # existing route error boundary
```

Locale remains cookie-based (`NEXT_LOCALE`); no `[locale]` segment in routes.

---

## Execution Order

1. Extend `lib/api/query-keys.ts` with `analytics.department` namespace.
2. Add department hooks to `lib/api/hooks/use-analytics.ts`.
3. Add `components/domain/analytics/department-dashboard-types.ts` and `department-dashboard-utils.ts`.
4. Add `components/domain/analytics/department-dashboard-skeleton.tsx`.
5. Add `components/domain/analytics/department-selector.tsx`.
6. Add `components/domain/analytics/department-dashboard-filters.tsx`.
7. Add `components/domain/analytics/department-performance-cards.tsx`.
8. Add `components/domain/analytics/department-team-row.tsx` and `department-team-panel.tsx`.
9. Add `components/domain/analytics/department-drill-down-list.tsx`.
10. Add `components/domain/analytics/department-dashboard.tsx` container.
11. Create `app/(dashboard)/analytics/department/page.tsx`.
12. Update `components/domain/shell/app-sidebar.tsx` to add Department Dashboard nav item.
13. Update `components/domain/shell/use-page-breadcrumb.ts` for `/analytics/department`.
14. Extend `components/shared/stat-card.tsx` with `onClick` prop and `value: number | string`.
15. Add translations to `messages/ar.json` and `messages/en.json`.
16. Add MSW handlers for department analytics endpoints.
17. Add `__tests__/components/domain/analytics/department-dashboard.test.tsx`.
18. Run `npm run lint && npm run typecheck && npm run test`.

---

## What to Test Manually

1. **Arabic happy path:** open `/analytics/department` with `NEXT_LOCALE=ar`, verify RTL layout, stat cards, team panel, drill-down table render correctly.
2. **English happy path:** switch locale to `en`, verify LTR layout and English labels.
3. **Default department:** open `/analytics/department` with no params as a scoped user → URL auto-fills `departmentId` from `/me`.
4. **Department selector:** as an org-wide user, verify the selector lists departments and switching updates all panels.
5. **Stat card drill-down:** click Active/Overdue/At Risk cards → drill-down refetches with `metric` param.
6. **Average delay card:** verify it shows a formatted duration and is not clickable.
7. **Team row drill-down:** click a team row → drill-down refetches with `assignee_id` param and rows are sorted by overdue then active.
8. **Advanced filters:** apply date range, priority, and blueprint category → all panels refetch; reset clears filters while preserving department.
9. **Loading state:** throttle network and verify skeleton matches final layout.
10. **Empty state:** select a department with no data or apply filters with no matches → correct empty messaging and reset CTA.
11. **Error state:** block the API and verify `ErrorState` with retry button.
12. **No permission:** access page as a user without analytics capabilities → no-permission `EmptyState`.
13. **Sidebar:** verify Analytics group shows Aging Report and Department Dashboard for users with capabilities.
14. **Breadcrumb:** verify `/analytics/department` shows Dashboard → Analytics → Department Dashboard.
15. **Responsive:** verify desktop (4 stat cards + 1/3 team + 2/3 drill-down), tablet (2 stat cards + stacked), mobile (1 stat card + stacked cards).
16. **Keyboard navigation:** Tab through selector, stat cards, team rows, drill-down rows, and Load More; verify focus rings and Enter activation.
17. **Polling:** verify performance numbers refresh after 60s when backend data changes.
18. **Load more:** click Load more on drill-down and verify rows append without losing existing data.