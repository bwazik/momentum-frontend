# Plan: Analytics & Reporting — Task Aging Report

> **Spec:** `specs/009-analytics-reporting/spec.md`
> **Date:** 2026-07-09
> **Status:** `completed`

---

## Open Questions Resolved

| Question | Decision | Rationale |
|----------|----------|-----------|
| Sidebar navigation entry for Analytics in MVP? | **Single Analytics nav item linking to `/analytics/aging`.** | Keeps navigation simple while analytics surface is small. Expands to a collapsible group once `002` and `012` add executive and department dashboards. |
| Capability gating for the page? | **Hide Analytics nav item when user lacks all of `analytics.view.organization`, `analytics.view.department`, and `task.view.follow_up_scope`.** Direct access to `/analytics/aging` without any of these renders the no-permission `EmptyState`. | Backend is the ABAC source of truth; frontend check is UX-only. |
| "All" quick filter behavior? | **"All" clears the `status` URL param.** Backend `AgingReportService` defaults to active + suspended tasks, so no status filter returns both. | Matches backend contract and avoids client-side status reconstruction. |
| Date range column? | **Use `date_from`/`date_to` on `created_at` in MVP.** | This is what backend `AgingReportRequest` supports today. Stage-entered date filtering is deferred to V2. |
| Overdue / At Risk as quick filters? | **No.** They are SLA health states shown per row; the aging endpoint's `status` filter only accepts `TaskStatus` enum (active/suspended/completed/cancelled). Quick chips are Active, Suspended, All. | Aligns with stable backend contract. |
| Backend OpenAPI returns `data: string[]` for aging? | **Use a local display type + `unknown` narrowing adapter** until backend Scramble/OpenAPI is regenerated. | Same adapter pattern already used for `BoardTaskResource.current_assignees` and `BottleneckResource.stage_type`. |

---

## Technical Approach

Build `/analytics/aging` as a read-only client-driven report inside the dashboard shell. Fetch from `GET /api/v1/analytics/tasks/aging` with `useInfiniteQuery`, drive filters through URL search params, and render a dedicated table/mobile-card view built for the aging response shape. Reuse SLA/priority badges, avatars, and filter styling from the task board, but do not force aging data into `BoardTaskResource` because the fields differ.

Key decisions:

- **Dedicated aging components** — `AgingReportTable` and `AgingReportCard` are built for the aging response shape, not wrappers around `BoardTable`/`BoardTaskCard`.
- **URL params for filters only** — `status`, `priorityId`, `departmentId`, `blueprintCategoryId`, `dateFrom`, `dateTo`. No search or sort (backend fixes sort to `entered_at` ASC).
- **Status mapping** — aging endpoint expects `TaskStatus` integer enum (`2=active, 3=suspended`). URL uses string keys; map before the API call.
- **No polling** — unlike follow-up center, this report does not refresh automatically.
- **No mutations** — read-only report; no cache invalidation beyond TanStack defaults.
- **Capability-gated nav** — hide Analytics nav item when the user has no analytics/follow-up capability.
- **Generated types + adapter** — use `operations['agingReport.index']` for params, but narrow the `data` array from `unknown` because current OpenAPI types it as `string[]`.

---

## Component Tree

```text
app/(dashboard)/analytics/page.tsx                        Server   (redirects to /analytics/aging)
app/(dashboard)/analytics/aging/page.tsx                  Server   (PageHeader + AgingReport)
  components/domain/analytics/aging-report.tsx            Client   (orchestrates filters, query, pagination, 4 states)
    AgingReportFilters                                    Client   (URL-driven quick chips + advanced Sheet)
    AgingReportTable                                      Client   (desktop/tablet table)
    AgingReportMobileList                                 Client   (mobile cards)
      AgingReportCard                                     Client   (single mobile card)
    AgingReportSkeleton                                   Client   (loading state)
    EmptyState / ErrorState                               Client   (shared)
```

**Server components:** page shells only.

**Client components:** anything using TanStack Query, URL params, router, event handlers, or local state.

---

## Affected Files

### New Files

| File | Purpose |
|------|---------|
| `components/domain/analytics/aging-report.tsx` | Main client container: filters, query, pagination, state handling. |
| `components/domain/analytics/aging-report-filters.tsx` | URL-driven quick filters and advanced filter Sheet. |
| `components/domain/analytics/aging-report-table.tsx` | Desktop/tablet table for aging response shape. |
| `components/domain/analytics/aging-report-mobile-list.tsx` | Mobile card list. |
| `components/domain/analytics/aging-report-card.tsx` | Single aging mobile card. |
| `components/domain/analytics/aging-report-skeleton.tsx` | Skeleton matching table/cards. |
| `components/domain/analytics/aging-report-types.ts` | Display type + filter types. |
| `components/domain/analytics/aging-report-utils.ts` | URL parsing, API param mapping, time-since formatter, adapter. |
| `lib/api/hooks/use-analytics.ts` | `useAgingReportInfinite` hook. |
| `__tests__/components/domain/analytics/aging-report.test.tsx` | Loading/empty/error/success/filter tests. |

### Modified Files

| File | Change |
|------|--------|
| `app/(dashboard)/analytics/page.tsx` | Replace placeholder with redirect to `/analytics/aging`. |
| `app/(dashboard)/analytics/aging/page.tsx` | Render `PageHeader` + `AgingReport`. |
| `components/domain/shell/app-sidebar.tsx` | Change Analytics link from `/analytics` to `/analytics/aging`; hide when user lacks required capabilities. |
| `lib/api/query-keys.ts` | Add `analytics` namespace. |
| `messages/ar.json` | Add `analytics.aging.*` namespace. |
| `messages/en.json` | Add `analytics.aging.*` namespace. |
| `__tests__/mocks/handlers.ts` | Add MSW handler for `/v1/analytics/tasks/aging`. |

### Optional Backend Coordination

- Fix Scramble/OpenAPI schema for `agingReport.index` response `data` array so it returns `AgingReportResource` objects, then run `npm run generate:api`.

---

## Implementation Notes

### 1. Query Keys

**One-line summary:** extend `lib/api/query-keys.ts` with an `analytics` namespace for aging lists.

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
  },
} as const;
```

**Test cases:**
1. `queryKeys.analytics.agingList({ status: 2 })` returns `['analytics', 'aging', 'list', { status: 2 }]`.
2. No component imports or uses a hardcoded `['analytics', 'aging', ...]` array.

**Rules:** `coding-standards.md` — centralized query key factory.

---

### 2. Aging Report Query Hook

**One-line summary:** add `useAgingReportInfinite` in `lib/api/hooks/use-analytics.ts` using generated operation types and cursor pagination.

**Key decisions:**
- Use `operations['agingReport.index']['parameters']['query']` for filter typing.
- Send `status` as integer (`2=active, 3=suspended`).
- Response `data` is narrowed from `unknown` because current OpenAPI types it as `string[]`.
- No polling, no stale-time override.

**File:** `lib/api/hooks/use-analytics.ts`

**Snippet:**

```ts
import { useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { queryKeys } from '@/lib/api/query-keys';
import type { CursorPage } from '@/lib/api/types';
import type { operations } from '@/lib/generated/api-types';
import type { AgingReportItem } from '@/components/domain/analytics/aging-report-types';

export type AgingReportQuery = NonNullable<
  operations['agingReport.index']['parameters']['query']
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
```

The hook returns `CursorPage<unknown>`; the consumer calls `narrowAgingItems()` to get `AgingReportItem[]`.

**Test cases:**
1. Render with `{ status: 2 }` -> request URL contains `status=2`.
2. Render -> `getNextPageParam` returns `next_cursor` when `has_more=true`, otherwise `undefined`.

**Rules:** `coding-standards.md` — `useInfiniteQuery` for cursor pagination, generated types, no `useEffect` fetch.

---

### 3. Types, Adapter, and Utils

**One-line summary:** define the display type, URL filter type, `unknown` narrowing adapter, and URL-to-API mapping in `aging-report-types.ts` and `aging-report-utils.ts`.

**Key decisions:**
- `AgingReportItem` is a frontend display type; it is not a hand-written API DTO — it describes the runtime shape returned by the backend.
- `narrowAgingItems()` validates each row at runtime and drops malformed rows.
- Status map converts URL strings to backend integer enum values.
- `formatTimeSince()` computes elapsed working hours/days from `entered_at`.

**Files:**
- `components/domain/analytics/aging-report-types.ts`
- `components/domain/analytics/aging-report-utils.ts`

**Snippet — types:**

```ts
import type { operations } from '@/lib/generated/api-types';

export type AgingReportQuery = NonNullable<
  operations['agingReport.index']['parameters']['query']
>;

export interface AgingReportUrlFilters {
  status?: 'active' | 'suspended' | 'all';
  priorityId?: string;
  departmentId?: string;
  blueprintCategoryId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface AgingAssignee {
  public_id: string;
  name_ar?: string | null;
  name_en?: string | null;
}

export interface AgingReportItem {
  task_public_id: string;
  title_ar: string;
  title_en: string;
  priority: string | null;
  current_stage_name_ar: string | null;
  current_stage_name_en: string | null;
  active_assignees: AgingAssignee[];
  sla_health: 'green' | 'amber' | 'red' | 'grey' | 'none';
  created_at: string | null;
  entered_at: string | null;
}
```

**Snippet — utils:**

```ts
import type { AgingReportItem, AgingReportUrlFilters, AgingReportQuery } from './aging-report-types';

const AGING_STATUS_MAP: Record<string, number> = {
  active: 2,
  suspended: 3,
};

export function readAgingFilters(params: URLSearchParams): AgingReportUrlFilters {
  return {
    status: (params.get('status') as AgingReportUrlFilters['status']) ?? undefined,
    priorityId: params.get('priorityId') ?? undefined,
    departmentId: params.get('departmentId') ?? undefined,
    blueprintCategoryId: params.get('blueprintCategoryId') ?? undefined,
    dateFrom: params.get('dateFrom') ?? undefined,
    dateTo: params.get('dateTo') ?? undefined,
  };
}

export function toAgingQuery(filters: AgingReportUrlFilters): AgingReportQuery {
  return {
    status: filters.status && filters.status !== 'all'
      ? (AGING_STATUS_MAP[filters.status] as 2 | 3)
      : undefined,
    priority_id: filters.priorityId ?? null,
    department_id: filters.departmentId ?? null,
    blueprint_category_id: filters.blueprintCategoryId ?? null,
    date_from: filters.dateFrom ?? null,
    date_to: filters.dateTo ?? null,
    per_page: 15,
  };
}

function isAgingAssignee(raw: unknown): raw is AgingAssignee {
  if (!raw || typeof raw !== 'object') return false;
  const v = raw as Record<string, unknown>;
  return typeof v.public_id === 'string';
}

export function narrowAgingItem(raw: unknown): AgingReportItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const v = raw as Record<string, unknown>;
  if (typeof v.task_public_id !== 'string') return null;

  const assigneesRaw = Array.isArray(v.active_assignees) ? v.active_assignees : [];

  return {
    task_public_id: v.task_public_id,
    title_ar: typeof v.title_ar === 'string' ? v.title_ar : '',
    title_en: typeof v.title_en === 'string' ? v.title_en : '',
    priority: typeof v.priority === 'string' ? v.priority : null,
    current_stage_name_ar: typeof v.current_stage_name_ar === 'string' ? v.current_stage_name_ar : null,
    current_stage_name_en: typeof v.current_stage_name_en === 'string' ? v.current_stage_name_en : null,
    active_assignees: assigneesRaw.map(isAgingAssignee).filter(Boolean) as AgingAssignee[],
    sla_health: ['green', 'amber', 'red', 'grey', 'none'].includes(String(v.sla_health))
      ? (String(v.sla_health) as AgingReportItem['sla_health'])
      : 'none',
    created_at: typeof v.created_at === 'string' ? v.created_at : null,
    entered_at: typeof v.entered_at === 'string' ? v.entered_at : null,
  };
}

export function narrowAgingItems(data: unknown[]): AgingReportItem[] {
  return data.map(narrowAgingItem).filter((item): item is AgingReportItem => item !== null);
}

export function formatTimeSince(dateStr: string | null | undefined, locale?: string): string {
  if (!dateStr) return '-';
  const entered = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - entered.getTime()) / 1000);
  if (seconds <= 0) return locale === 'ar' ? 'أقل من ساعة' : '< 1 hour';

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);

  const unitEn = (n: number, one: string, many: string) => (n === 1 ? one : many);
  const unitAr = (n: number, one: string, two: string, many: string) => {
    if (n === 1) return one;
    if (n === 2) return two;
    return many;
  };

  const d = locale === 'ar'
    ? (n: number) => unitAr(n, 'يوم', 'يومان', 'أيام')
    : (n: number) => unitEn(n, 'day', 'days');
  const h = locale === 'ar'
    ? (n: number) => unitAr(n, 'ساعة', 'ساعتان', 'ساعات')
    : (n: number) => unitEn(n, 'hour', 'hours');

  if (days > 0 && hours > 0) return `${days} ${d(days)}, ${hours} ${h(hours)}`;
  if (days > 0) return `${days} ${d(days)}`;
  if (hours > 0) return `${hours} ${h(hours)}`;
  return locale === 'ar' ? 'أقل من ساعة' : '< 1 hour';
}
```

**Test cases:**
1. `toAgingQuery({ status: 'active' })` returns `{ status: 2, ... }`.
2. `toAgingQuery({ status: 'all' })` returns `{ status: undefined, ... }`.
3. `narrowAgingItems([{ task_public_id: 'x', title_ar: 't', priority: 'p', sla_health: 'red', active_assignees: [{ public_id: 'u' }] }])` returns one valid item.
4. `formatTimeSince('2026-07-07T00:00:00Z', 'en')` contains "day" or "days".

**Rules:** `coding-standards.md` — no `any`, use `unknown` narrowing; URL params for filters; logical properties in UI.

---

### 4. Page + Container

**One-line summary:** `/analytics/aging` is a server page rendering `PageHeader` + `AgingReport` client container.

**Key decisions:**
- Server page uses `getTranslations('analytics.aging')`.
- `AgingReport` reads URL params, builds API filters, runs the infinite query, and handles all 4 states.
- Flatten pages with `Set` deduplication.

**Files:**
- `app/(dashboard)/analytics/aging/page.tsx`
- `components/domain/analytics/aging-report.tsx`

**Page snippet:**

```tsx
import { getTranslations } from 'next-intl/server';
import { PageHeader } from '@/components/shared/page-header';
import { AgingReport } from '@/components/domain/analytics/aging-report';

export default async function AgingReportPage() {
  const t = await getTranslations('analytics.aging');
  return (
    <main className="flex flex-col gap-6 p-6">
      <PageHeader title={t('title')} description={t('description')} />
      <AgingReport />
    </main>
  );
}
```

**Container snippet:**

```tsx
'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { ApiRequestError } from '@/lib/api/client';
import { useAgingReportInfinite } from '@/lib/api/hooks/use-analytics';
import { readAgingFilters, toAgingQuery, narrowAgingItems } from './aging-report-utils';
import { AgingReportFilters } from './aging-report-filters';
import { AgingReportSkeleton } from './aging-report-skeleton';
import { AgingReportTable } from './aging-report-table';
import { AgingReportMobileList } from './aging-report-mobile-list';

export function AgingReport() {
  const t = useTranslations('analytics.aging');
  const searchParams = useSearchParams();

  const urlFilters = useMemo(() => readAgingFilters(searchParams), [searchParams]);
  const apiFilters = useMemo(() => toAgingQuery(urlFilters), [urlFilters]);

  const query = useAgingReportInfinite(apiFilters);

  const allTasks = useMemo(() => {
    const seen = new Set<string>();
    return (query.data?.pages.flatMap((page) => narrowAgingItems(page.data as unknown[])) ?? [])
      .filter((task) => {
        if (seen.has(task.task_public_id)) return false;
        seen.add(task.task_public_id);
        return true;
      });
  }, [query.data]);

  if (query.isLoading) return <AgingReportSkeleton />;
  if (query.isError) {
    if (query.error instanceof ApiRequestError && query.error.status === 403) {
      return <EmptyState icon={Lock} title={t('no_permission_title')} description={t('no_permission_description')} />;
    }
    return <ErrorState message={t('error')} onRetry={() => query.refetch()} />;
  }

  return (
    <section className="flex flex-col gap-4">
      <AgingReportFilters filters={urlFilters} />
      {allTasks.length === 0 ? (
        <EmptyState
          title={t('empty_title')}
          description={t('empty_description')}
          action={
            <Button variant="outline" onClick={() => window.location.replace('/analytics/aging')}>
              {t('reset_filters')}
            </Button>
          }
        />
      ) : (
        <>
          <div className="hidden md:block">
            <AgingReportTable tasks={allTasks} />
          </div>
          <div className="md:hidden">
            <AgingReportMobileList tasks={allTasks} />
          </div>
          {query.hasNextPage && (
            <Button
              variant="outline"
              onClick={() => query.fetchNextPage()}
              disabled={query.isFetchingNextPage}
            >
              {query.isFetchingNextPage ? t('loading_more') : t('load_more')}
            </Button>
          )}
        </>
      )}
    </section>
  );
}
```

**State management:**
- **URL:** all filters (`status`, `priorityId`, `departmentId`, `blueprintCategoryId`, `dateFrom`, `dateTo`).
- **Local `useState`:** none in the container; filter sheet open/close is internal to `AgingReportFilters`.
- **Zustand:** none. No API data in Zustand.

**Test cases:**
1. Render loading -> skeleton visible.
2. Render success with 3 rows -> table/cards show titles and "Load more" appears when `has_more=true`.
3. Render error 500 -> `ErrorState` with retry button.

**Rules:** `coding-standards.md` — all 4 states, `useInfiniteQuery`, URL params, no Zustand for API data.

---

### 5. Filters

**One-line summary:** `AgingReportFilters` renders quick chips (Active/Suspended/All) and an advanced filter Sheet (department, priority, blueprint category, date range).

**Key decisions:**
- Reuse the URL-param pattern from `BoardFilters` but remove search, sort, external reference, and stage type (backend aging endpoint does not support them).
- Use `ToggleGroup` for quick chips.
- Use `AdvancedFiltersSheet` if reusable; otherwise build a Sheet inline (aging endpoint supports department/priority/category/date only).
- Department lookup uses `useDepartmentsInfinite` from `use-organization.ts`; priority and category use `useTaskPriorities` and `useBlueprintCategories` from `use-task-board.ts`/`use-blueprints.ts`.

**File:** `components/domain/analytics/aging-report-filters.tsx`

**Snippet:**

```tsx
'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { AdvancedFiltersSheet } from '@/components/domain/tasks/advanced-filters-sheet';
import type { AgingReportUrlFilters } from './aging-report-types';

const QUICK_FILTERS = ['active', 'suspended', 'all'] as const;

interface AgingReportFiltersProps {
  filters: AgingReportUrlFilters;
}

export function AgingReportFilters({ filters }: AgingReportFiltersProps) {
  const t = useTranslations('analytics.aging');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setParam(key: string, value?: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.replace(`${pathname}?${params.toString()}`);
  }

  function resetFilters() {
    router.replace(pathname);
  }

  function handleQuickFilter(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('status');
    if (value !== 'all') params.set('status', value);
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-3 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <ToggleGroup
          type="single"
          value={filters.status ?? 'active'}
          onValueChange={(value) => { if (value) handleQuickFilter(value); }}
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
          filters={{
            status: filters.status,
            departmentId: filters.departmentId,
            priorityId: filters.priorityId ? [filters.priorityId] : undefined,
            blueprintCategoryId: filters.blueprintCategoryId,
            dateFrom: filters.dateFrom,
            dateTo: filters.dateTo,
          }}
          onParam={(key, value) => {
            const map: Record<string, string> = {
              departmentId: 'departmentId',
              stageTypeId: '',
              priorityId: 'priorityId',
              blueprintCategoryId: 'blueprintCategoryId',
              dateFrom: 'dateFrom',
              dateTo: 'dateTo',
            };
            if (key === 'priorityId' && value) {
              setParam('priorityId', value);
            } else if (map[key]) {
              setParam(map[key], value);
            }
          }}
        />
      </div>
    </div>
  );
}
```

> Note: `AdvancedFiltersSheet` from the task board exposes `stageTypeId` and `assigneeId` fields that the aging endpoint does not support. If reuse becomes awkward, create a dedicated `AgingAdvancedFiltersSheet` that only shows department, priority, blueprint category, and date range. Mark this as `<!-- TODO: verify -->` in the plan.

**Test cases:**
1. Click "Suspended" -> URL contains `status=suspended`.
2. Click "All" -> URL has no `status` param.
3. Select department in Sheet -> URL contains `departmentId=<publicId>`.

**Rules:** `coding-standards.md` — URL-driven filters, logical properties; shadcn skill — `ToggleGroup`, `Sheet`, `RtlSelect`.

---

### 6. Table + Mobile Cards

**One-line summary:** `AgingReportTable` and `AgingReportCard` render desktop rows and mobile cards for the aging response shape, reusing SLA badge, priority badge, avatars, and SLA border accent from the task board.

**Key decisions:**
- Columns: SLA, Task (title), Priority, Current Stage, Active Assignees, Time at Stage, Created At.
- Row click navigates to `/tasks/[publicId]`.
- SLA border accent (`border-s-4`) uses the same `SLA_BORDER` map as the task board.
- `PriorityBadge` is fed `{ name_ar: item.priority, name_en: item.priority }` because aging only returns the priority name string.
- Time at stage uses `formatTimeSince(item.entered_at, locale)`.
- Created at uses `formatDualDate` or `Intl.DateTimeFormat`.

**Files:**
- `components/domain/analytics/aging-report-table.tsx`
- `components/domain/analytics/aging-report-mobile-list.tsx`
- `components/domain/analytics/aging-report-card.tsx`

**Snippet — table:**

```tsx
'use client';

import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount, Tooltip, TooltipContent, TooltipTrigger,
} from '@/components/ui/avatar';
import { SlaBadge, PriorityBadge } from '@/components/domain/tasks/task-badges';
import { localizeName } from '@/lib/utils/localize';
import type { AgingReportItem } from './aging-report-types';
import { formatTimeSince } from './aging-report-utils';

const SLA_BORDER: Record<string, string> = {
  green: 'border-s-4 border-s-emerald-500 dark:border-s-emerald-400',
  amber: 'border-s-4 border-s-amber-500 dark:border-s-amber-400',
  red: 'border-s-4 border-s-red-500 dark:border-s-red-400',
  grey: 'border-s-4 border-s-slate-400 dark:border-s-slate-500',
  none: 'border-s-4 border-s-zinc-300 dark:border-s-zinc-600',
};

interface AgingReportTableProps {
  tasks: AgingReportItem[];
}

export function AgingReportTable({ tasks }: AgingReportTableProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('analytics.aging.columns');

  return (
    <Table aria-label={t('table_label')}>
      <TableHeader>
        <TableRow>
          <TableHead className="w-28 text-start text-xs uppercase tracking-wider">{t('sla')}</TableHead>
          <TableHead className="text-start text-xs uppercase tracking-wider">{t('task')}</TableHead>
          <TableHead className="text-start text-xs uppercase tracking-wider">{t('priority')}</TableHead>
          <TableHead className="text-start text-xs uppercase tracking-wider">{t('stage')}</TableHead>
          <TableHead className="text-start text-xs uppercase tracking-wider">{t('assignees')}</TableHead>
          <TableHead className="w-32 text-start text-xs uppercase tracking-wider">{t('time_at_stage')}</TableHead>
          <TableHead className="w-32 text-start text-xs uppercase tracking-wider">{t('created_at')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasks.map((task) => {
          const slaKey = (task.sla_health ?? 'none').toLowerCase();
          return (
            <TableRow
              key={task.task_public_id}
              tabIndex={0}
              className="cursor-pointer"
              onClick={() => router.push(`/tasks/${task.task_public_id}`)}
              onKeyDown={(e) => { if (e.key === 'Enter') router.push(`/tasks/${task.task_public_id}`); }}
            >
              <TableCell className={cn('text-start', SLA_BORDER[slaKey])}>
                <SlaBadge health={task.sla_health} status="active" />
              </TableCell>
              <TableCell className="text-start">
                <span className="text-sm font-medium leading-tight">
                  {localizeName(locale, task.title_ar, task.title_en)}
                </span>
              </TableCell>
              <TableCell className="text-start">
                {task.priority ? (
                  <PriorityBadge priority={{ name_ar: task.priority, name_en: task.priority }} />
                ) : (
                  <span className="text-sm text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell className="text-start align-top">
                {task.current_stage_name_ar || task.current_stage_name_en ? (
                  <span className="text-sm">
                    {localizeName(locale, task.current_stage_name_ar, task.current_stage_name_en)}
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell className="text-start align-top">
                {task.active_assignees.length > 0 ? (
                  <AvatarGroup>
                    {task.active_assignees.slice(0, 3).map((user) => {
                      const name = localizeName(locale, user.name_ar, user.name_en);
                      return (
                        <Tooltip key={user.public_id}>
                          <TooltipTrigger asChild>
                            <Avatar size="sm"><AvatarFallback>{name.charAt(0)}</AvatarFallback></Avatar>
                          </TooltipTrigger>
                          <TooltipContent side="top">{name}</TooltipContent>
                        </Tooltip>
                      );
                    })}
                    {task.active_assignees.length > 3 && (
                      <AvatarGroupCount>+{task.active_assignees.length - 3}</AvatarGroupCount>
                    )}
                  </AvatarGroup>
                ) : (
                  <span className="text-sm text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell className="text-start align-top">
                <span className="text-sm">{formatTimeSince(task.entered_at, locale)}</span>
              </TableCell>
              <TableCell className="text-start align-top">
                <span className="text-sm text-muted-foreground">
                  {task.created_at ? format(new Date(task.created_at), 'yyyy-MM-dd') : '-'}
                </span>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
```

> Note: `date-fns` is used in the snippet for formatting. If the project does not have `date-fns`, use `Intl.DateTimeFormat` instead. Check `package.json` before implementation.

**Snippet — mobile card:**

```tsx
'use client';

import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { format } from 'date-fns';
import { Card } from '@/components/ui/card';
import { SlaBadge, PriorityBadge } from '@/components/domain/tasks/task-badges';
import { localizeName } from '@/lib/utils/localize';
import type { AgingReportItem } from './aging-report-types';
import { formatTimeSince } from './aging-report-utils';

const SLA_BORDER: Record<string, string> = {
  green: 'border-s-emerald-500',
  amber: 'border-s-amber-500',
  red: 'border-s-red-500',
  grey: 'border-s-slate-400',
  none: 'border-s-zinc-300',
};

interface AgingReportCardProps {
  task: AgingReportItem;
}

export function AgingReportCard({ task }: AgingReportCardProps) {
  const router = useRouter();
  const locale = useLocale();
  const slaKey = (task.sla_health ?? 'none').toLowerCase();

  return (
    <Card
      className={`cursor-pointer border-s-4 p-4 ${SLA_BORDER[slaKey]}`}
      onClick={() => router.push(`/tasks/${task.task_public_id}`)}
      onKeyDown={(e) => { if (e.key === 'Enter') router.push(`/tasks/${task.task_public_id}`); }}
      tabIndex={0}
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <SlaBadge health={task.sla_health} status="active" />
          {task.priority && <PriorityBadge priority={{ name_ar: task.priority, name_en: task.priority }} />}
        </div>
        <p className="font-medium text-foreground">
          {localizeName(locale, task.title_ar, task.title_en)}
        </p>
        <div className="flex flex-col gap-1 text-xs text-muted-foreground">
          <span>
            {task.current_stage_name_ar || task.current_stage_name_en
              ? localizeName(locale, task.current_stage_name_ar, task.current_stage_name_en)
              : '-'}
          </span>
          <span>
            {formatTimeSince(task.entered_at, locale)}
            {task.created_at && ` · ${format(new Date(task.created_at), 'yyyy-MM-dd')}`}
          </span>
        </div>
        {task.active_assignees.length > 0 && (
          <div className="flex -space-x-2">
            {task.active_assignees.slice(0, 3).map((a) => (
              <div
                key={a.public_id}
                className="flex size-6 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] font-medium"
                title={localizeName(locale, a.name_ar, a.name_en)}
              >
                {(locale === 'ar' ? a.name_ar : a.name_en)?.charAt(0) ?? '?'}
              </div>
            ))}
            {task.active_assignees.length > 3 && (
              <div className="flex size-6 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] font-medium">
                +{task.active_assignees.length - 3}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
```

**Test cases:**
1. Render row -> title, stage, SLA text, priority, assignee initials, time at stage, created date appear.
2. Press Enter on focused row -> navigates to `/tasks/{publicId}`.

**Rules:** `coding-standards.md` — logical properties, no `any`; `design-system/05-accessibility.md` — semantic table, color + text for SLA, keyboard navigation.

---

### 7. Skeleton, Empty, Error, No Permission

**One-line summary:** reuse `EmptyState`/`ErrorState` and add an aging-specific skeleton matching the table/card shape.

**File:** `components/domain/analytics/aging-report-skeleton.tsx`

**Snippet:**

```tsx
'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function AgingReportSkeleton() {
  return (
    <div className="flex flex-col gap-4" data-testid="aging-report-skeleton">
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-16" />
      </div>
      <div className="hidden md:block overflow-x-auto">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex gap-2 border-b p-2 last:border-b-0">
            <div className="flex w-28 items-start ps-1">
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <div className="flex flex-1 flex-col gap-0.5">
              <Skeleton className="h-4 w-full max-w-56" />
            </div>
            <div className="flex w-24 items-start"><Skeleton className="h-5 w-16 rounded-full" /></div>
            <div className="flex w-36 flex-col gap-1"><Skeleton className="h-4 w-24" /></div>
            <div className="flex w-28 items-start"><Skeleton className="h-4 w-14" /></div>
            <div className="flex w-32 flex-col gap-1"><Skeleton className="h-4 w-14" /></div>
            <div className="flex w-32 flex-col gap-1"><Skeleton className="h-4 w-20" /></div>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-3 md:hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-xl border-s-4 border-s-zinc-300 p-4">
            <div className="flex items-start justify-between gap-2 pb-2">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-4 w-3/4" />
            <div className="mt-2 flex flex-col gap-1">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Test cases:**
1. API 500 -> `ErrorState` and retry button appear.
2. API 403 -> no-permission empty state appears.

**Rules:** `coding-standards.md` — all 4 states mandatory; shadcn skill — use `Skeleton`.

---

### 8. Sidebar Navigation

**One-line summary:** update `app-sidebar.tsx` to link Analytics to `/analytics/aging` and hide it when the user lacks analytics/follow-up capabilities.

**File:** `components/domain/shell/app-sidebar.tsx`

**Snippet:**

```tsx
const canViewAnalytics =
  useCapability('analytics.view.organization') ||
  useCapability('analytics.view.department') ||
  useCapability('task.view.follow_up_scope');

const mainItems = [
  { title: tnav('dashboard'), url: '/', icon: LayoutDashboard },
  { title: tnav('tasks'), url: '/tasks', icon: ListTodo },
  ...(canViewAnalytics ? [{ title: tnav('analytics'), url: '/analytics/aging', icon: BarChart3 }] : []),
];
```

Also update active matching so `/analytics/aging` highlights Analytics. The existing `NavMain` uses `pathname.startsWith(item.url + '/')` plus exact match; `/analytics/aging` starts with `/analytics/aging/`, and the item URL is `/analytics/aging`, so exact match works. If future analytics pages exist under `/analytics/executive`, add an `isActive` function.

**Test cases:**
1. User without analytics capabilities -> Analytics nav item is not rendered.
2. User with `analytics.view.organization` -> Analytics nav item links to `/analytics/aging`.

**Rules:** `security-policy.md` — capability checks are UX-only; server returns 403 regardless.

---

### 9. Translations

**One-line summary:** add `analytics.aging` namespace to both locale files.

**Files:** `messages/ar.json`, `messages/en.json`

**Required keys (Arabic + English):**

```json
{
  "analytics": {
    "aging": {
      "title": "Aging Report",
      "description": "Tasks sorted by how long they have been at their current stage.",
      "error": "Unable to load the aging report.",
      "empty_title": "No tasks found",
      "empty_description": "Adjust filters or reset the report.",
      "reset_filters": "Reset filters",
      "load_more": "Load more",
      "loading_more": "Loading...",
      "no_permission_title": "No permission",
      "no_permission_description": "You do not have permission to view analytics.",
      "filter_active": "Active",
      "filter_suspended": "Suspended",
      "filter_all": "All",
      "reset": "Reset",
      "advanced": "Advanced filters",
      "columns": {
        "table_label": "Aging report",
        "sla": "SLA",
        "task": "Task",
        "priority": "Priority",
        "stage": "Current Stage",
        "assignees": "Assignees",
        "time_at_stage": "Time at Stage",
        "created_at": "Created At"
      }
    }
  }
}
```

**Test cases:**
1. Arabic locale -> Arabic title/description render and document direction is RTL.
2. English locale -> English title/description render and document direction is LTR.

**Rules:** `coding-standards.md` — no hardcoded user-facing strings.

---

### 10. Tests

**One-line summary:** add MSW handler and component tests for the aging report.

**File:** `__tests__/components/domain/analytics/aging-report.test.tsx`

**Snippet:**

```tsx
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/__tests__/utils/test-utils';
import { AgingReport } from '@/components/domain/analytics/aging-report';

test('renders loading skeleton', () => {
  renderWithProviders(<AgingReport />);
  expect(screen.getByTestId('aging-report-skeleton')).toBeInTheDocument();
});

test('renders aging rows', async () => {
  renderWithProviders(<AgingReport />);
  expect(await screen.findByText('مهمة متأخرة')).toBeInTheDocument();
});
```

**MSW handler:**

```ts
http.get('https://api.momentum.test/v1/analytics/tasks/aging', () => {
  return HttpResponse.json({
    data: [
      {
        task_public_id: '01912345-6789-7abc-def0-123456789abc',
        title_ar: 'مهمة متأخرة',
        title_en: 'Overdue Task',
        priority: 'عاجل',
        current_stage_name_ar: 'مراجعة',
        current_stage_name_en: 'Review',
        active_assignees: [{ public_id: 'u1', name_ar: 'أحمد', name_en: 'Ahmad' }],
        sla_health: 'red',
        created_at: '2026-07-01T00:00:00Z',
        entered_at: '2026-07-05T00:00:00Z',
      },
    ],
    next_cursor: null,
    has_more: false,
  });
});
```

**Rules:** `testing-policy.md` — MSW for API mocking, test loading/success/empty/error states, test both locales where relevant.

---

## Data Flow

1. User opens `/analytics/aging`.
2. `app/(dashboard)/layout.tsx` authenticates and hydrates current user (existing behavior).
3. `AgingReportPage` renders `PageHeader` + `AgingReport`.
4. `AgingReport` reads URL search params via `useSearchParams`.
5. `readAgingFilters()` returns URL filter state.
6. `toAgingQuery()` maps URL filters to backend integer enum values and query params.
7. `useAgingReportInfinite()` calls `GET /v1/analytics/tasks/aging` through `apiClient`.
8. `apiClient` sends credentials, `X-Tenant`, `X-Locale`, and serialized query params.
9. Backend applies ABAC visibility and returns `{ data: AgingReportItem[], next_cursor, has_more }`.
10. `narrowAgingItems()` validates and types the response because current OpenAPI types `data` as `string[]`.
11. Component flattens pages and renders `AgingReportTable` (desktop) or `AgingReportMobileList` (mobile).
12. User changes filters -> URL changes -> query key changes -> report refetches.
13. User clicks "Load more" -> `fetchNextPage()` appends the next cursor page.
14. User clicks row/card -> Next router navigates to `/tasks/[publicId]`.

---

## Route Structure

```text
app/
  (dashboard)/
    analytics/
      page.tsx              # /analytics  -> redirect to /analytics/aging
      aging/
        page.tsx            # /analytics/aging
      error.tsx             # existing route error boundary
```

Locale remains cookie-based through `NEXT_LOCALE`; no `[locale]` route segment is added.

---

## Execution Order

1. Update `lib/api/query-keys.ts` with `analytics` namespace.
2. Add `lib/api/hooks/use-analytics.ts` with `useAgingReportInfinite`.
3. Add `components/domain/analytics/aging-report-types.ts` and `aging-report-utils.ts`.
4. Add `components/domain/analytics/aging-report-skeleton.tsx`.
5. Add `components/domain/analytics/aging-report-table.tsx` and `aging-report-mobile-list.tsx` + `aging-report-card.tsx`.
6. Add `components/domain/analytics/aging-report-filters.tsx`.
7. Add `components/domain/analytics/aging-report.tsx` container.
8. Create `app/(dashboard)/analytics/aging/page.tsx`.
9. Update `app/(dashboard)/analytics/page.tsx` to redirect to `/analytics/aging`.
10. Update `components/domain/shell/app-sidebar.tsx` to link `/analytics/aging` and capability-gate Analytics.
11. Add translations to `messages/ar.json` and `messages/en.json`.
12. Add MSW handler for `/v1/analytics/tasks/aging`.
13. Add `__tests__/components/domain/analytics/aging-report.test.tsx`.
14. Run `npm run lint`, `npm run typecheck`, and `npm run test`.
15. Coordinate with backend to regenerate OpenAPI so `data` is typed as `AgingReportResource[]`; then remove the `narrowAgingItems` adapter and use generated types directly.

---

## What to Test Manually

1. **Arabic happy path:** open `/analytics/aging` with no params, verify active + suspended tasks load, RTL layout is correct, and SLA badges show Arabic text.
2. **English happy path:** switch locale to English, verify LTR layout and English labels.
3. **Default filter:** open `/analytics/aging` with no params and verify backend request uses the default (no status, which returns active + suspended).
4. **Active filter:** click "Active" and verify request includes `status=2`.
5. **Suspended filter:** click "Suspended" and verify request includes `status=3`.
6. **All filter:** click "All" and verify request has no `status` param.
7. **Department filter:** select a department in advanced filters and verify `department_id=<publicId>`.
8. **Priority filter:** select a priority and verify `priority_id=<publicId>`.
9. **Date range:** pick date from/to and verify query params.
10. **Pagination:** click "Load more" and verify existing rows remain while new rows append.
11. **Empty state:** choose filters with no matches and verify empty state plus reset action.
12. **Error state:** simulate API failure and verify retry works.
13. **Permission state:** access page with a user lacking analytics capabilities and verify no-permission state.
14. **Navigation:** click a row/card and verify navigation to `/tasks/[publicId]`.
15. **Sidebar:** verify Analytics item is hidden for users without capabilities and links to `/analytics/aging` for users with capabilities.
16. **Responsive:** verify desktop table, tablet reduced layout, and mobile cards.
17. **Keyboard:** Tab to filters, rows/cards, and Load More; press Enter on a focused row/card.
18. **Accessibility:** verify visible focus rings, semantic table headers, icon-only labels, and color + text SLA status.