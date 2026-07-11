# Plan: Executive Dashboard

> **Spec:** `specs/002-executive-dashboard/spec.md`
> **Date:** 2026-07-10
> **Status:** `completed`

---

## Open Questions Resolved

| Question | Decision | Rationale |
|----------|----------|-----------|
| Sidebar navigation grouping for Analytics? | **Convert Analytics into a collapsible group.** Items: "Executive Dashboard" → `/analytics`, "Aging Report" → `/analytics/aging`. Department Dashboard is added later under the same group. | Analytics now has two screens; a group prevents nav churn and scales to `012-department-manager-dashboard`. |
| Drill-down destination? | **Dedicated executive routes.** Summary metrics → `/analytics/executive/drill-down/[metric]`; bottlenecks → `/analytics/executive/bottlenecks/[stageType]/drill-down`. | The aging report cannot filter by SLA health (`overdue`/`at_risk`) or stage type, so it cannot serve all drill-down cases. Dedicated routes use the backend drill-down endpoints directly. |
| Completion rate card caption? | **Show `completed` count only** (e.g. "1,204 completed"). | The percentage is the hero metric; the caption provides direct context without derived rounding issues. Denominator can be added in V2 if requested. |
| Department health sorting? | **Severity descending (red → amber → green), then localized name ascending.** | Surfaces problem departments first while keeping the list predictable. |
| Bottleneck severity tinting? | **Red if `overdue_count > 0`, amber if only `at_risk_count > 0`, slate/zinc otherwise.** | Aligns with the backend scoring logic. |
| OpenAPI numeric-string fields? | **Frontend runtime narrowing adapter.** Convert string-serialized numeric fields to numbers at runtime, following the `narrowAgingItems()` pattern from `009-analytics-reporting`. | Backend contract is stable; do not block implementation on Scramble fixes. |

---

## Technical Approach

Build `/analytics` as a read-only executive dashboard inside the dashboard shell. Fetch three bounded summary endpoints in parallel with `useQuery`, drive optional filters through URL search params, and render KPI stat cards, a department health panel, and a bottleneck panel. Clicking any summary element navigates to dedicated drill-down routes that reuse cursor pagination and table styling from `009-analytics-reporting` but query the executive drill-down endpoints.

Key decisions:

- **Three bounded queries, no pagination on dashboard** — summary, department-health, and bottlenecks return small arrays; use `useQuery`.
- **60s polling on summary only** — keeps the active/overdue counts fresh without excessive load.
- **Dedicated drill-down routes** — because `/analytics/aging` cannot express `overdue`/`at_risk` status or stage-type filters.
- **Runtime narrowing adapters** — backend Scramble serializes numbers as strings; frontend adapters convert them safely.
- **Reuse visual patterns, not data types** — drill-down table styling matches the aging report, but it is typed for `TaskListItemResource`.
- **Capability-gated nav and page** — hide Analytics group when user lacks analytics capabilities; page shows no-permission state on 403.

---

## Component Tree

```text
app/(dashboard)/analytics/page.tsx                              Server   (ExecutiveDashboardPage shell)
  components/domain/analytics/executive-dashboard.tsx           Client   (orchestrates queries, 4 states, layout)
    ExecutiveSummaryCards                                       Client   (5 KPI stat cards)
      StatCard                                                  Client   (shared component, also used by Follow-Up)
    DepartmentHealthPanel                                       Client   (department list)
      DepartmentHealthRow                                       Client   (single row)
    BottlenecksPanel                                            Client   (bottleneck cards)
      BottleneckCard                                            Client   (single card)
    ExecutiveDashboardSkeleton                                  Client   (loading state)
    EmptyState / ErrorState                                     Client   (shared)

app/(dashboard)/analytics/executive/drill-down/[metric]/page.tsx        Server
  components/domain/analytics/executive-drill-down-list.tsx     Client   (infinite query + table for metric)

app/(dashboard)/analytics/executive/bottlenecks/[stageType]/drill-down/page.tsx   Server
  components/domain/analytics/executive-bottleneck-drill-down-list.tsx   Client   (infinite query + table for bottleneck)

components/domain/shell/app-sidebar.tsx                         Client   (Analytics collapsible group)
```

**Server components:** page shells only.

**Client components:** anything using TanStack Query, URL params, router, event handlers, or local state.

---

## Affected Files

### New Files

| File | Purpose |
|------|---------|
| `components/domain/analytics/executive-dashboard.tsx` | Main client container: queries, layout, state handling. |
| `components/domain/analytics/executive-summary-cards.tsx` | Grid of 5 KPI stat cards. |
| `components/shared/stat-card.tsx` | Shared stat card component (replaces domain-specific `ExecutiveStatCard`). |
| `components/domain/analytics/executive-dashboard-filters.tsx` | Filter button in PageHeader actions slot. |
| `components/domain/analytics/executive-drill-down-skeleton.tsx` | Skeleton matching drill-down table layout. |
| `components/domain/analytics/department-health-panel.tsx` | Department health list panel. |
| `components/domain/analytics/department-health-row.tsx` | Single department row. |
| `components/domain/analytics/bottlenecks-panel.tsx` | Bottleneck cards panel. |
| `components/domain/analytics/bottleneck-card.tsx` | Single bottleneck card. |
| `components/domain/analytics/executive-dashboard-skeleton.tsx` | Skeleton matching dashboard layout. |
| `components/domain/analytics/executive-dashboard-types.ts` | Display types + filter types + adapters. |
| `components/domain/analytics/executive-dashboard-utils.ts` | URL parsing, API param mapping, health sorting, time formatting. |
| `components/domain/analytics/executive-drill-down-list.tsx` | Metric drill-down infinite list container. |
| `components/domain/analytics/executive-bottleneck-drill-down-list.tsx` | Bottleneck drill-down infinite list container. |
| `components/domain/analytics/executive-drill-down-table.tsx` | Desktop/tablet table for drill-down task rows. |
| `components/domain/analytics/executive-drill-down-mobile-list.tsx` | Mobile card list for drill-down rows. |
| `lib/api/hooks/use-analytics.ts` | Add executive query hooks to existing file. |
| `__tests__/components/domain/analytics/executive-dashboard.test.tsx` | Dashboard loading/empty/error/success tests. |
| `__tests__/components/domain/analytics/executive-drill-down.test.tsx` | Drill-down list tests. |

### Modified Files

| File | Change |
|------|--------|
| `app/(dashboard)/page.tsx` | Replaced placeholder with executive dashboard content (PageHeader + ExecutiveDashboard). |
| `app/(dashboard)/analytics/page.tsx` | Replaced executive dashboard page with redirect to `/`. |
| `components/domain/shell/app-sidebar.tsx` | Removed collapsible Analytics group. Added standalone Analytics group with Aging Report. |
| `components/domain/shell/use-page-breadcrumb.ts` | Added breadcrumb for `/` (dashboard home). Updated drill-down breadcrumbs. |
| `lib/api/query-keys.ts` | Extend `analytics` namespace with executive keys. |
| `messages/ar.json` | Add `analytics.executive.*` namespace. |
| `messages/en.json` | Add `analytics.executive.*` namespace. |
| `__tests__/mocks/handlers.ts` | Add MSW handlers for executive endpoints. |
| `components/domain/follow-up/follow-up-stats.tsx` | Migrated to shared `StatCard`. |
| `components/domain/tasks/workflow-timeline-bar.tsx` | Added dark mode colors. |

---

## Implementation Notes

### 1. Query Keys

**One-line summary:** extend `lib/api/query-keys.ts` with an `analytics.executive` namespace.

**Key decisions:**
- Centralize keys; no hardcoded strings.
- Filter object is included in the key and memoized at the call site.

**File:** `lib/api/query-keys.ts`

**Snippet:**

```ts
export const queryKeys = {
  // existing namespaces...
  analytics: {
    all: ['analytics'] as const,
    agingLists: () => [...queryKeys.analytics.all, 'aging', 'list'] as const,
    agingList: (filters: Record<string, unknown>) =>
      [...queryKeys.analytics.agingLists(), filters] as const,
    executive: {
      summaries: () => [...queryKeys.analytics.all, 'executive', 'summary'] as const,
      summary: (filters: Record<string, unknown>) =>
        [...queryKeys.analytics.executive.summaries(), filters] as const,
      departmentHealths: () => [...queryKeys.analytics.all, 'executive', 'department-health'] as const,
      departmentHealth: (filters: Record<string, unknown>) =>
        [...queryKeys.analytics.executive.departmentHealths(), filters] as const,
      bottlenecks: (filters: Record<string, unknown>) =>
        [...queryKeys.analytics.all, 'executive', 'bottlenecks', filters] as const,
      drillDowns: () => [...queryKeys.analytics.all, 'executive', 'drill-down'] as const,
      drillDown: (metric: string, filters: Record<string, unknown>) =>
        [...queryKeys.analytics.executive.drillDowns(), metric, filters] as const,
      bottleneckDrillDowns: () => [...queryKeys.analytics.all, 'executive', 'bottleneck-drill-down'] as const,
      bottleneckDrillDown: (stageType: string, filters: Record<string, unknown>) =>
        [...queryKeys.analytics.executive.bottleneckDrillDowns(), stageType, filters] as const,
    },
  },
} as const;
```

**Test cases:**
1. `queryKeys.analytics.executive.summary({ date_from: '2026-01-01' })` returns `['analytics', 'executive', 'summary', { date_from: '2026-01-01' }]`.
2. No component imports or uses a hardcoded `['analytics', 'executive', ...]` array.

**Rules:** `coding-standards.md` — centralized query key factory.

---

### 2. Executive Dashboard Query Hooks

**One-line summary:** add five hooks to `lib/api/hooks/use-analytics.ts` using generated operation types.

**Key decisions:**
- Use `operations['executiveDashboard.summary']`, etc. for filter typing.
- Summary/health/bottleneck hooks use `useQuery`.
- Drill-down hooks use `useInfiniteQuery` with cursor pagination.
- Summary query polls every 60s.
- Response data is narrowed from generated types because Scramble serializes numbers as strings.

**File:** `lib/api/hooks/use-analytics.ts`

**Snippet:**

```ts
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { queryKeys } from '@/lib/api/query-keys';
import type { CursorPage } from '@/lib/api/types';
import type { operations } from '@/lib/generated/api-types';

export type ExecutiveSummaryQuery = NonNullable<
  operations['executiveDashboard.summary']['parameters']['query']
>;

export type ExecutiveBottlenecksQuery = NonNullable<
  operations['executiveDashboard.bottlenecks']['parameters']['query']
>;

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
```

**Test cases:**
1. Render `useExecutiveSummary({ date_from: '2026-01-01' })` → request URL contains `date_from=2026-01-01`.
2. Render `useExecutiveSummaryDrillDown('overdue', {})` → second page uses returned `next_cursor`.

**Rules:** `coding-standards.md` — `useInfiniteQuery` for cursor pagination, generated types, no `useEffect` fetch.

---

### 3. Types, Adapter, and Utils

**One-line summary:** define display types, URL filter types, runtime narrowing adapters, and URL-to-API mapping in `executive-dashboard-types.ts` and `executive-dashboard-utils.ts`.

**Key decisions:**
- Display types describe the runtime shape returned by the backend.
- `narrowExecutiveSummary()`, `narrowDepartmentHealthItem()`, `narrowBottleneckItem()` validate and convert string numbers to actual numbers.
- `HEALTH_ORDER` map drives severity sorting.
- URL params use camelCase; API params use snake_case.

**Files:**
- `components/domain/analytics/executive-dashboard-types.ts`
- `components/domain/analytics/executive-dashboard-utils.ts`

**Snippet — types:**

```ts
import type { operations } from '@/lib/generated/api-types';

export type ExecutiveSummaryQuery = NonNullable<
  operations['executiveDashboard.summary']['parameters']['query']
>;

export type ExecutiveBottlenecksQuery = NonNullable<
  operations['executiveDashboard.bottlenecks']['parameters']['query']
>;

export interface ExecutiveDashboardUrlFilters {
  dateFrom?: string;
  dateTo?: string;
  priorityId?: string;
  departmentId?: string;
  blueprintCategoryId?: string;
}

export interface ExecutiveSummary {
  active: number;
  overdue: number;
  atRisk: number;
  suspended: number;
  completed: number;
  cancelled: number;
  completionRate: number;
}

export interface DepartmentHealthItem {
  departmentPublicId: string;
  departmentNameAr: string;
  departmentNameEn: string;
  health: 'green' | 'amber' | 'red';
  healthLabel: string;
  activeTasks: number;
  overdueTasks: number;
  atRiskTasks: number;
}

export interface BottleneckItem {
  stageTypeNameAr: string;
  stageTypeNameEn: string;
  departmentNameAr: string;
  departmentNameEn: string;
  overdueCount: number;
  atRiskCount: number;
  score: number;
  averageTimeAtStageSeconds: number;
}

export interface DrillDownTaskItem {
  taskPublicId: string;
  displayId: string;
  titleAr: string;
  titleEn: string;
  status: string;
  priority: { public_id: string; name_ar: string; name_en: string; severity_rank: string; color_code: string } | null;
  currentStageNameAr: string;
  currentStageNameEn: string;
  owningDepartmentPublicId: string;
  slaHealth: 'green' | 'amber' | 'red' | 'grey' | 'none';
  createdAt: string;
}
```

**Snippet — utils:**

```ts
import type {
  ExecutiveDashboardUrlFilters,
  ExecutiveSummaryQuery,
  ExecutiveBottlenecksQuery,
  ExecutiveSummary,
  DepartmentHealthItem,
  BottleneckItem,
  DrillDownTaskItem,
} from './executive-dashboard-types';

export function readExecutiveFilters(params: URLSearchParams): ExecutiveDashboardUrlFilters {
  return {
    dateFrom: params.get('dateFrom') ?? undefined,
    dateTo: params.get('dateTo') ?? undefined,
    priorityId: params.get('priorityId') ?? undefined,
    departmentId: params.get('departmentId') ?? undefined,
    blueprintCategoryId: params.get('blueprintCategoryId') ?? undefined,
  };
}

export function toExecutiveSummaryQuery(filters: ExecutiveDashboardUrlFilters): ExecutiveSummaryQuery {
  return {
    date_from: filters.dateFrom ?? null,
    date_to: filters.dateTo ?? null,
    priority_id: filters.priorityId ?? null,
    department_id: filters.departmentId ?? null,
    blueprint_category_id: filters.blueprintCategoryId ?? null,
  };
}

export function toExecutiveBottlenecksQuery(filters: ExecutiveDashboardUrlFilters): ExecutiveBottlenecksQuery {
  return {
    department_id: filters.departmentId ?? null,
    limit: 10,
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

export function narrowExecutiveSummary(raw: unknown): ExecutiveSummary | null {
  if (!raw || typeof raw !== 'object') return null;
  const v = raw as Record<string, unknown>;
  return {
    active: toNumber(v.active),
    overdue: toNumber(v.overdue),
    atRisk: toNumber(v.at_risk),
    suspended: toNumber(v.suspended),
    completed: toNumber(v.completed),
    cancelled: toNumber(v.cancelled),
    completionRate: toNumber(v.completion_rate),
  };
}

export function narrowDepartmentHealthItem(raw: unknown): DepartmentHealthItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const v = raw as Record<string, unknown>;
  if (typeof v.department_public_id !== 'string') return null;
  const health = String(v.health ?? '');
  return {
    departmentPublicId: v.department_public_id,
    departmentNameAr: typeof v.department_name_ar === 'string' ? v.department_name_ar : '',
    departmentNameEn: typeof v.department_name_en === 'string' ? v.department_name_en : '',
    health: ['green', 'amber', 'red'].includes(health) ? (health as DepartmentHealthItem['health']) : 'green',
    healthLabel: typeof v.health_label === 'string' ? v.health_label : '',
    activeTasks: toNumber(v.active_tasks),
    overdueTasks: toNumber(v.overdue_tasks),
    atRiskTasks: toNumber(v.at_risk_tasks),
  };
}

export function narrowBottleneckItem(raw: unknown): BottleneckItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const v = raw as Record<string, unknown>;
  const stageType = (v.stage_type && typeof v.stage_type === 'object') ? v.stage_type as Record<string, unknown> : {};
  const department = (v.department && typeof v.department === 'object') ? v.department as Record<string, unknown> : {};
  return {
    stageTypeNameAr: typeof stageType.name_ar === 'string' ? stageType.name_ar : '',
    stageTypeNameEn: typeof stageType.name_en === 'string' ? stageType.name_en : '',
    departmentNameAr: typeof department.name_ar === 'string' ? department.name_ar : '',
    departmentNameEn: typeof department.name_en === 'string' ? department.name_en : '',
    overdueCount: toNumber(v.overdue_count),
    atRiskCount: toNumber(v.at_risk_count),
    score: toNumber(v.score),
    averageTimeAtStageSeconds: toNumber(v.average_time_at_stage_seconds),
  };
}

export function narrowDrillDownTaskItem(raw: unknown): DrillDownTaskItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const v = raw as Record<string, unknown>;
  if (typeof v.task_public_id !== 'string') return null;
  const priority = (v.priority && typeof v.priority === 'object') ? v.priority as Record<string, unknown> : null;
  return {
    taskPublicId: v.task_public_id,
    displayId: typeof v.display_id === 'string' ? v.display_id : '',
    titleAr: typeof v.title_ar === 'string' ? v.title_ar : '',
    titleEn: typeof v.title_en === 'string' ? v.title_en : '',
    status: typeof v.status === 'string' ? v.status : '',
    priority: priority ? {
      public_id: typeof priority.public_id === 'string' ? priority.public_id : '',
      name_ar: typeof priority.name_ar === 'string' ? priority.name_ar : '',
      name_en: typeof priority.name_en === 'string' ? priority.name_en : '',
      severity_rank: typeof priority.severity_rank === 'string' ? priority.severity_rank : '',
      color_code: typeof priority.color_code === 'string' ? priority.color_code : '',
    } : null,
    currentStageNameAr: typeof v.current_stage_name_ar === 'string' ? v.current_stage_name_ar : '',
    currentStageNameEn: typeof v.current_stage_name_en === 'string' ? v.current_stage_name_en : '',
    owningDepartmentPublicId: typeof v.owning_department_public_id === 'string' ? v.owning_department_public_id : '',
    slaHealth: ['green', 'amber', 'red', 'grey', 'none'].includes(String(v.sla_health))
      ? (String(v.sla_health) as DrillDownTaskItem['slaHealth'])
      : 'none',
    createdAt: typeof v.created_at === 'string' ? v.created_at : '',
  };
}

const HEALTH_ORDER: Record<DepartmentHealthItem['health'], number> = { red: 0, amber: 1, green: 2 };

export function sortDepartmentHealth(items: DepartmentHealthItem[], locale: string): DepartmentHealthItem[] {
  return [...items].sort((a, b) => {
    const orderDiff = HEALTH_ORDER[a.health] - HEALTH_ORDER[b.health];
    if (orderDiff !== 0) return orderDiff;
    const nameA = locale === 'ar' ? a.departmentNameAr : a.departmentNameEn;
    const nameB = locale === 'ar' ? b.departmentNameAr : b.departmentNameEn;
    return nameA.localeCompare(nameB, locale);
  });
}
```

**Test cases:**
1. `narrowExecutiveSummary({ active: '5', overdue: '1', completion_rate: '0.8333' })` returns `{ active: 5, overdue: 1, completionRate: 0.8333, ... }`.
2. `sortDepartmentHealth([redItem, greenItem, amberItem], 'en')` returns `[redItem, amberItem, greenItem]`.

**Rules:** `coding-standards.md` — generated types + runtime narrowing, no hand-written API DTOs.

---

### 4. Executive Dashboard Page and Container

**One-line summary:** server page renders `PageHeader` + `ExecutiveDashboard` client container.

**Key decisions:**
- Page is a Server Component; interactivity lives in `ExecutiveDashboard`.
- Container reads URL filters, runs three queries, handles loading/error/empty/success, and delegates layout to sub-components.
- 403 renders a no-permission `EmptyState`.

**Files:**
- `app/(dashboard)/analytics/page.tsx`
- `components/domain/analytics/executive-dashboard.tsx`

**Snippet — page:**

```tsx
import { getTranslations } from 'next-intl/server';
import { PageHeader } from '@/components/shared/page-header';
import { ExecutiveDashboard } from '@/components/domain/analytics/executive-dashboard';

export default async function ExecutiveDashboardPage() {
  const t = await getTranslations('analytics.executive');
  return (
    <main className="flex flex-col gap-6 p-6">
      <PageHeader title={t('title')} description={t('description')} />
      <ExecutiveDashboard />
    </main>
  );
}
```

**Snippet — container:**

_(Full actual source at `components/domain/analytics/executive-dashboard.tsx` — snippet below reflects the final implementation after all changes.)_

```tsx
'use client';

import { useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { ApiRequestError } from '@/lib/api/client';
import {
  useExecutiveSummary,
  useExecutiveDepartmentHealth,
  useExecutiveBottlenecks,
} from '@/lib/api/hooks/use-analytics';
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

  // ... loading, error, 403 checks ...

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
        <div className="lg:col-span-2"><DepartmentHealthPanel departments={departments} /></div>
        <div><BottlenecksPanel bottlenecks={bottlenecks} /></div>
      </div>
    </section>
  );
}
```

**Test cases:**
1. Render with all queries loading → `<ExecutiveDashboardSkeleton />` is shown.
2. Render with summary data → 5 stat cards rendered with correct numbers.

**Rules:** `coding-standards.md` — all 4 states handled, no API data in Zustand, URL filters shareable.

---

### 5. Stat Cards

**One-line summary:** `ExecutiveSummaryCards` renders five shared `StatCard` instances with icons, counts, subtitles, and drill-down links.

**Key decisions:**
- Uses shared `StatCard` from `components/shared/stat-card.tsx` (also consumed by Follow-Up center).
- Cards are clickable via `<Link>` wrapper for accessibility and keyboard nav.
- At-risk and overdue cards get `border-s-4` accent: `border-s-red-500` / `border-s-amber-500`.
- Variants align with app-wide color scheme: `active` (blue), `amber`, `red`, `suspended` (slate), `emerald`.
- Completion rate shows `Math.round(rate * 100)` with `valueSuffix="%"`.
- Completion card subtitle shows both completed and cancelled counts as separate clickable `<button>` elements that each drill down to their metric. Uses `router.push` + `e.stopPropagation()` to avoid nested `<a>` hydration errors.
- Shared `StatCard` supports `iconVariant: 'boxed' | 'muted'`, `valueSize: '2xl' | '3xl'`, `valueSuffix`, and `subtitle` as `string | ReactNode`.

**Files:**
- `components/shared/stat-card.tsx`
- `components/domain/analytics/executive-summary-cards.tsx`

**Rules:** `coding-standards.md` — logical properties, `cn()` utility, `prefers-reduced-motion`, focus-visible.

---

### 6. Department Health Panel

**One-line summary:** `DepartmentHealthPanel` renders sorted rows; each row links to the aging report filtered by department.

**Key decisions:**
- Rows sorted by severity then localized name (from utils).
- Health badge uses `Badge` with semantic colors + text label.
- Row click navigates to `/analytics/aging?departmentId={publicId}`.

**Files:**
- `components/domain/analytics/department-health-panel.tsx`
- `components/domain/analytics/department-health-row.tsx`

_(Actual source at `components/domain/analytics/department-health-row.tsx` differs significantly from the original plan. The final implementation uses a 3-line layout with stacked micro bar.)_

**Key changes from original plan:**
- 3-line layout: name + badge (line 1), stacked micro bar (line 2), count breakdown (line 3)
- Mutli-color stacked bar: `bg-emerald-500` / `bg-amber-500` / `bg-red-500` segments proportional to `activeTasks`
- Bar is fixed full-width — communicates health distribution only, not workload
- Count line: "N active · N overdue · N at risk" with overdue/at-risk in `text-red-600`/`text-amber-600`
- Health badge uses translated labels from `tasks.board.sla` namespace, not backend `healthLabel`

**Rules:** `coding-standards.md` — logical properties (`text-end`), `localizeName`, color + text.

---

### 7. Bottlenecks Panel

**One-line summary:** `BottlenecksPanel` renders top bottleneck cards sorted by backend score.

**Key decisions:**
- Severity shown via `border-s-4` accent (like stat cards), not full card background tint.
- Both overdue AND at-risk counts shown when present (separate pills stacked vertically).
- Average time at stage displayed via `formatDuration(seconds, locale)`.
- Card hover lifts: `hover:shadow-xl hover:-translate-y-0.5`.
- Card click navigates to `/analytics/executive/bottlenecks/{stageTypePublicId}/drill-down`.
- `formatDuration` supports Arabic dual-plural: "2d 4h" in EN, "يومان 4 ساعات" in AR.

**Files:**
- `components/domain/analytics/bottlenecks-panel.tsx`
- `components/domain/analytics/bottleneck-card.tsx`
- `components/domain/analytics/executive-dashboard-utils.ts` (contains `formatDuration`)

**Key changes from original plan:**
- Full card tint (`bg-red-50 border-red-200`) → `border-s-4 border-s-red-500` (desaturated per UX feedback)
- Single count pill → two pills stacked when both overdue and at-risk exist
- Missing `averageTimeAtStageSeconds` → now displayed via `t('bottleneck_avg_delay')`
- `text-[10px]` / `text-[11px]` → `text-xs` (standardized tokens)

**Rules:** `coding-standards.md` — logical properties, no hardcoded strings, semantic colors.

---

### 8. Drill-Down Pages and Lists

**One-line summary:** two server pages render client list containers that use `useInfiniteQuery` and a shared table/card view.

**Key decisions:**
- Reuse table styling from `aging-report-table.tsx` but adapt for `DrillDownTaskItem`.
- Show SLA badge, task title, priority, current stage, created at.
- Manual "Load more" button (cursor pagination).

**Files:**
- `app/(dashboard)/analytics/executive/drill-down/[metric]/page.tsx`
- `app/(dashboard)/analytics/executive/bottlenecks/[stageType]/drill-down/page.tsx`
- `components/domain/analytics/executive-drill-down-list.tsx`
- `components/domain/analytics/executive-bottleneck-drill-down-list.tsx`
- `components/domain/analytics/executive-drill-down-table.tsx`
- `components/domain/analytics/executive-drill-down-mobile-list.tsx`

**Snippet — metric drill-down page:**

```tsx
import { getTranslations } from 'next-intl/server';
import { PageHeader } from '@/components/shared/page-header';
import { ExecutiveDrillDownList } from '@/components/domain/analytics/executive-drill-down-list';

interface Props {
  params: Promise<{ metric: string }>;
}

export default async function ExecutiveDrillDownPage({ params }: Props) {
  const { metric } = await params;
  const t = await getTranslations('analytics.executive');
  return (
    <main className="flex flex-col gap-6 p-6">
      <PageHeader title={t(`drill_down_title_${metric}`)} description={t('drill_down_description')} />
      <ExecutiveDrillDownList metric={metric} />
    </main>
  );
}
```

**Snippet — drill-down list container:**

```tsx
'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { useExecutiveSummaryDrillDown } from '@/lib/api/hooks/use-analytics';
import { readExecutiveFilters, toExecutiveSummaryQuery, narrowDrillDownTaskItem } from '../executive-dashboard-utils';
import { ExecutiveDrillDownTable } from './executive-drill-down-table';
import { ExecutiveDrillDownMobileList } from './executive-drill-down-mobile-list';

interface ExecutiveDrillDownListProps {
  metric: string;
}

export function ExecutiveDrillDownList({ metric }: ExecutiveDrillDownListProps) {
  const t = useTranslations('analytics.executive');
  const searchParams = useSearchParams();
  const urlFilters = useMemo(() => readExecutiveFilters(searchParams), [searchParams]);
  const apiFilters = useMemo(() => toExecutiveSummaryQuery(urlFilters), [urlFilters]);
  const query = useExecutiveSummaryDrillDown(metric, apiFilters);

  const tasks = useMemo(() => {
    const seen = new Set<string>();
    return (query.data?.pages.flatMap((page) => narrowDrillDownTaskItem(page.data as unknown[])) ?? [])
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
```

**Rules:** `coding-standards.md` — cursor pagination, deduplicate rows, all 4 states.

---

### 9. Skeleton

**One-line summary:** `ExecutiveDashboardSkeleton` matches the real layout with five stat-card placeholders, department rows, and bottleneck cards.

**File:** `components/domain/analytics/executive-dashboard-skeleton.tsx`

**Snippet:**

```tsx
import { Skeleton } from '@/components/ui/skeleton';

export function ExecutiveDashboardSkeleton() {
  return (
    <section className="flex flex-col gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
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
        <div className="lg:col-span-2 flex flex-col gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border">
              <Skeleton className="h-4 w-48" />
              <div className="flex items-center gap-4">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-4 rounded-xl border border-border">
              <div className="flex justify-between mb-1">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-4 w-16 rounded" />
              </div>
              <Skeleton className="h-3 w-24" />
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

### 10. Sidebar Navigation

**One-line summary:** the executive dashboard is at `/` (Dashboard nav item). Aging Report is a standalone link under an "Analytics" sidebar group.

**Key decisions:**
- Executive dashboard replaces the placeholder dashboard at `/`.
- Analytics sidebar group contains only "Aging Report" → `/analytics/aging`.
- No collapsible needed — the group has a single item.
- Hide the Analytics group when user lacks `analytics.view.organization`, `analytics.view.department`, and `task.view.follow_up_scope`.

**File:** `components/domain/shell/app-sidebar.tsx`

**Rules:** `coding-standards.md` — capability-gated UI, server is source of truth.

---

### 12. Breadcrumb

**One-line summary:** extend `use-page-breadcrumb.ts` to label executive drill-down routes.

**Key decisions:**
- `/` shows "Dashboard" (no breadcrumb parent).
- `/analytics/executive/drill-down/[metric]` shows "Dashboard → Analytics → [metric label]".
- `/analytics/executive/bottlenecks/[stageType]/drill-down` shows "Dashboard → Analytics → [bottleneck label]".
- `/analytics/aging` continues to use `analytics('aging.title')`.

**File:** `components/domain/shell/use-page-breadcrumb.ts`

**Snippet:**

```ts
const metricDrillDown = pathname.match(/^\/analytics\/executive\/drill-down\/([^/]+)$/);
if (metricDrillDown) {
  return [
    { label: nav('dashboard'), href: '/' },
    { label: nav('analytics'), href: '/analytics' },
    { label: analytics(`executive.drill_down_title_${metricDrillDown[1]}`) },
  ];
}

const bottleneckDrillDown = pathname.match(/^\/analytics\/executive\/bottlenecks\/([^/]+)\/drill-down$/);
if (bottleneckDrillDown) {
  return [
    { label: nav('dashboard'), href: '/' },
    { label: nav('analytics'), href: '/analytics' },
    { label: analytics('executive.bottleneck_drill_down_title') },
  ];
}
```

**Rules:** `coding-standards.md` — breadcrumb derived from pathname, no per-page duplication.

---

### 13. Messages / i18n

**One-line summary:** add `analytics.executive` namespace to both locale files.

**Files:**
- `messages/ar.json`
- `messages/en.json`

**Snippet — English additions:**

```json
{
  "analytics": {
    "executive": {
      "title": "Executive Dashboard",
      "description": "Organization-wide task health summary with department performance and bottleneck analysis.",
      "error": "Unable to load the executive dashboard.",
      "empty_title": "No dashboard data",
      "empty_description": "No analytics data is available for the selected filters.",
      "loading": "Loading...",
      "loading_more": "Loading...",
      "load_more": "Load more",
      "no_permission_title": "No permission",
      "no_permission_description": "You do not have permission to view the executive dashboard.",
      "drill_down_description": "Tasks matching the selected metric.",
      "drill_down_title_active": "Active Tasks",
      "drill_down_title_overdue": "Overdue Tasks",
      "drill_down_title_at_risk": "At Risk Tasks",
      "drill_down_title_suspended": "Suspended Tasks",
      "drill_down_title_completed": "Completed Tasks",
      "drill_down_title_cancelled": "Cancelled Tasks",
      "bottleneck_drill_down_title": "Bottleneck Tasks",
      "stat_active": "Total Active",
      "stat_at_risk": "At Risk",
      "stat_overdue": "Overdue",
      "stat_suspended": "Suspended",
      "stat_completion_rate": "Completion Rate",
      "completed_caption": "{count} completed",
      "panel_department_health": "Department SLA Health",
      "panel_bottlenecks": "Top Bottlenecks",
      "bottleneck_avg_delay": "Avg delay: {time}",
      "columns": {
        "table_label": "Executive drill-down",
        "sla": "SLA",
        "task": "Task",
        "priority": "Priority",
        "stage": "Current Stage",
        "created_at": "Created At"
      }
    },
    "aging": { ... }
  }
}
```

**Rules:** `coding-standards.md` — dot-namespaced snake_case keys, no hardcoded strings.

---

## Data Flow

```text
User opens /analytics
  → ExecutiveDashboardPage (Server) renders PageHeader + ExecutiveDashboard (Client)
  → ExecutiveDashboard reads URL search params
  → Three useQuery hooks fetch in parallel:
      /v1/analytics/executive/summary
      /v1/analytics/executive/department-health
      /v1/analytics/executive/bottlenecks
  → Narrow adapters convert string-serialized numbers to typed objects
  → ExecutiveSummaryCards, DepartmentHealthPanel, BottlenecksPanel render

User clicks a stat card / department row / bottleneck card
  → Next.js Link navigates to drill-down route
  → Drill-down page renders ExecutiveDrillDownList
  → useInfiniteQuery fetches /v1/analytics/executive/summary/drill-down/{metric}
                       or /v1/analytics/executive/bottlenecks/{stageType}/drill-down
  → Adapter narrows TaskListItemResource rows
  → ExecutiveDrillDownTable / MobileList renders
  → "Load more" fetches next cursor page
```

---

## Route Structure

```text
app/(dashboard)/
  page.tsx                                          # Executive dashboard (home page)
  analytics/
    aging/
      page.tsx                                      # Existing aging report
    executive/
      drill-down/
        [metric]/
          page.tsx                                  # Summary metric drill-down
      bottlenecks/
        [stageType]/
          drill-down/
            page.tsx                                # Bottleneck drill-down
```

Locale is cookie-based (`NEXT_LOCALE`); no `[locale]` segment in routes.

---

## Execution Order

1. **Extend query keys** (`lib/api/query-keys.ts`) with `analytics.executive` namespace.
2. **Add executive hooks** (`lib/api/hooks/use-analytics.ts`) for summary, health, bottlenecks, and drill-downs.
3. **Create types and adapters** (`executive-dashboard-types.ts`, `executive-dashboard-utils.ts`).
4. **Create skeleton** (`executive-dashboard-skeleton.tsx`).
5. **Create presentational components** (`executive-stat-card`, `executive-summary-cards`, `department-health-row`, `department-health-panel`, `bottleneck-card`, `bottlenecks-panel`).
6. **Create container** (`executive-dashboard.tsx`) and update `app/(dashboard)/page.tsx` (replaces placeholder dashboard). `app/(dashboard)/analytics/page.tsx` becomes a redirect to `/`.
7. **Create drill-down table/mobile components** and list containers.
8. **Create drill-down routes** under `app/(dashboard)/analytics/executive/...`.
9. **Update sidebar** (`app-sidebar.tsx`) to collapsible Analytics group.
10. **Update breadcrumb** (`use-page-breadcrumb.ts`) for drill-down routes.
11. **Add i18n** (`messages/ar.json`, `messages/en.json`).
12. **Add MSW handlers** (`__tests__/mocks/handlers.ts`) and write tests.
13. **Run** `npm run lint && npm run typecheck && npm run test`.

---

## What to Test Manually

1. **Happy path — Arabic RTL:** Open `/analytics` with `NEXT_LOCALE=ar`. Verify stat cards, department list, and bottleneck cards render right-to-left with logical properties.
2. **Happy path — English LTR:** Switch locale to `en`. Verify layout flips correctly, directional icons rotate where applicable.
3. **KPI card drill-down:** Click "Overdue" stat card → navigates to `/analytics/executive/drill-down/overdue` and loads overdue tasks.
4. **Department health drill-down:** Click a department row → navigates to `/analytics/aging?departmentId=...` with that department filtered.
5. **Bottleneck drill-down:** Click a bottleneck card → navigates to `/analytics/executive/bottlenecks/[stageType]/drill-down`.
6. **Loading state:** Throttle network and verify skeleton matches final layout.
7. **Empty state:** With no analytics data, verify `EmptyState` with correct messaging.
8. **Error state:** Block the API and verify `ErrorState` with retry button.
9. **No permission:** Log in as a user without `analytics.view.organization` and verify no-permission `EmptyState`.
10. **Sidebar gating:** Verify Analytics group is hidden when user lacks analytics/follow-up capabilities.
11. **Responsive:** Check desktop (5-column stats + 2/3 + 1/3 panels), tablet (stats wrap), mobile (single column, cards instead of table).
12. **Keyboard navigation:** Tab through stat cards, department rows, bottleneck cards, and drill-down table rows; verify focus rings and Enter activation.
13. **Polling:** Verify summary numbers refresh after 60s when data changes on the backend.
14. **Filters:** Apply date/department/priority filters via the PageHeader filter button → dashboard data updates. Reset clears filters. Empty state shows "No results match your filters" when filters produce 0 results.
15. **Cancelled drill-down:** Click the "cancelled" link in the completion card subtitle → navigates to `/analytics/executive/drill-down/cancelled` with cancelled tasks.
16. **Dark mode:** Toggle to dark mode → all colors (stat card icons, department health bars, bottleneck accents, timeline segments) render correctly.