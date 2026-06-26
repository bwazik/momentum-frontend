# Plan: Follow-Up Center

> **Spec:** `specs/007-follow-up-center/spec.md`
> **Date:** 2026-06-24
> **Status:** `completed`

---

## Open Questions Resolved

| # | Question (from spec) | Decision | Rationale |
|---|----------------------|----------|-----------|
| 1 | Recent actions panel: aggregate client-side or new endpoint? | **Dedicated cross-task endpoint `GET /v1/follow-up/actions`** (added during implementation). Uses `useAllFollowUpActions` (cursor-paginated `useInfiniteQuery`). | Backend added the endpoint before frontend MVP shipped. Replaced client-side aggregation from first 3 board tasks. Single query, cursor-paginated, no N+1 concern. |
| 2 | Escalations panel: all open in scope or only assigned to current user? | **All open escalations visible to the user** (`GET /v1/tracking/escalations?status=1`). Resolve action gated by `task.resolve_escalations` capability OR the escalation being assigned to the current user. | Matches the operational "see everything stuck" intent of the follow-up center. ABAC remains source of truth. |
| 3 | Bottleneck items clickable to filter the board? | **Yes.** Clicking a bottleneck writes `stageTypeId` + `departmentId` to the URL search params, which drives the board query. | High-value UX, low implementation cost, spec recommends yes. |
| 4 | Default monitoring-scope label when org-wide? | **"Organization-wide" / "على مستوى الجهة"** when user has `task.view.organization`; otherwise **"Monitoring Scope" / "نطاق المتابعة"** (generic). | Matches spec recommendation. |
| 5 | Board default status? | **`status=active`** when no `status`/`scope` URL param present. "All" quick filter clears `status`. | Matches task board (003) precedent and spec recommendation. |
| 6 | Stats card data source (no stats endpoint exists)? | **Page-local counts from the currently-loaded board rows (MVP).** "Monitoring Scope" = `allTasks.length`; "At Risk" = count of `sla_health === 'amber'`; "Overdue" = count of `sla_health === 'red'`; "Follow-ups Today" = recent-actions created today. Cards re-derive when filters/board change. | Backend cursor pagination returns no total count. Three extra `per_page=100` queries would be heavy and still capped. Page-local counts are honest, update with filters, and need no extra endpoint. |
| 7 | Alert banner "overdue by more than 3 days" threshold? | **MVP triggers the banner when the overdue count (stat card) > 0**, text: "N tasks in your scope are overdue". "View All" applies `status=overdue`. | `BoardTaskResource` exposes `time_at_current_stage_seconds` (working seconds at current stage) but not breach duration. Computing "days overdue" client-side is not possible without the SLA timer deadline. |
| 8 | Board polling interval? | **`refetchInterval: 60_000`** on the board `useInfiniteQuery` (only when the tab is visible via `refetchIntervalInBackground: false`). | Spec NFR: "Board data refreshes every 60 seconds." |
| 9 | OpenAPI schema mismatch for `BottleneckResource.stage_type`/`.department` (typed `string`, backend returns nested `{public_id, name_ar, name_en}`)? | **`unknown` narrowing adapter** `getBottleneckEntities()` in `follow-up-utils.ts` — same pattern as `getCurrentAssignees()` in 003. | Avoids `any`; resilient to backend Scramble schema fix. |
| 10 | `EscalationResource.status`/`.escalation_type` value format? | Backend returns enum **names** as strings (`"Open"`, `"Resolved"`, `"AutoSlaBreach"`, `"Manual"`). Compare case-insensitively via `ESCALATION_STATUS_MAP`/`ESCALATION_TYPE_MAP`. | OpenAPI declares these as `type: string` without enum values. |

Residual backend coordination (not blocking):
- Fix Scramble/OpenAPI schemas for `BoardTaskResource.current_assignees` (array), `BottleneckResource.stage_type`/`.department` (nested objects), then `npm run generate:api`. Until then, adapters use `unknown` narrowing.

---

## Technical Approach

**One-line summary:** Build `/follow-up` as a client-driven operational hub inside the dashboard shell, reusing the stable `010` board/overdue/at-risk/bottlenecks/actions endpoints and `007` escalation endpoints through TanStack Query, with URL-driven filters, page-local stat cards, a dismissible overdue banner, side panels for bottlenecks / recent actions / open escalations, and inline dialogs to log follow-up actions and create/resolve escalations.

**Key decisions (with rationale):**

- **Dedicated cross-task endpoint `GET /v1/follow-up/actions`** for the recent actions panel, replacing planned client-side aggregation from first 3 board tasks. The new `useAllFollowUpActions` hook uses cursor-paginated `useInfiniteQuery` against this single endpoint — no N+1, simpler code, accurate `actionsTodayCount`.
- **Reuse the existing `/v1/follow-up/board` endpoint and `taskBoard` query key namespace** for the board query (shared cache with the task board at `/tasks`), but add a **new `followUp` query key namespace** for overdue, at-risk, bottlenecks, actions, and escalations. The board query adds `refetchInterval: 60_000` via a follow-up-specific hook `useFollowUpBoardInfinite` that wraps the existing key. — Avoids double-caching the same board endpoint while giving the follow-up center its own polling behavior.
- **URL search params for all board filters/sort/search** (same camelCase param names as 003: `status`, `scope`, `stageTypeId`, `assigneeId`, `departmentId`, `priorityId`, `blueprintCategoryId`, `dateFrom`, `dateTo`, `dateField`, `search`, `sortBy`, `sortDirection`). — Bookmarkable, back-button friendly, matches 003.
- **Reuse existing lookup hooks** (`useTaskPriorities`, `useBlueprintCategories`, `useStageTypes`, `useDepartmentsInfinite`) and existing badges (`SlaBadge`, `TaskStatusBadge`, `PriorityBadge`, `ClassificationBadge`) and utils (`getCurrentAssignees`, `localizeName`, `formatTimeInStage`, `formatDueDate`) from `components/domain/tasks/`. — Smallest change, consistent visuals.
- **Generated types only** — import `BoardTaskResource`, `BottleneckResource`, `FollowUpActionResource`, `EscalationResource`, `EscalationDetailResource`, `CreateManualEscalationRequest`, `ResolveEscalationRequest`, `StoreFollowUpActionRequest` from `lib/generated/api-types.ts`. Use `unknown` narrowing adapters where OpenAPI schemas are wrong.
- **Two-column desktop layout** (`grid-cols-1 lg:grid-cols-3`): main column (stats + banner + filters + board + load-more) spans 2; sticky side column (bottlenecks + recent actions + escalations) spans 1. Tablet stacks side panels below; mobile renders cards + collapses filters into a `Sheet`.
- **Capability gating**: `task.view.follow_up_scope` / `task.view.organization` / `task.view.department_touched` gate the whole page; `task.escalate` gates the "Escalate" row action + `EscalateDialog`; `task.resolve_escalations` (or being the escalation target) gates the "Resolve" action. Server returns 403 regardless.
- **No Zustand for follow-up data** — only `useState` for dialog open/close, banner dismissed, and debounced search input. API data stays in TanStack Query.
- **No new npm packages.** shadcn primitives + Lucide icons only.

---

## Component Tree

```text
app/(dashboard)/follow-up/page.tsx                          Server   (getTranslations + PageHeader + FollowUpCenter)
  components/domain/follow-up/follow-up-center.tsx           Client   (orchestrates stats, banner, filters, board, panels, dialogs)
    FollowUpStats                                            Client   (4 stat cards, page-local counts)
    FollowUpAlertBanner                                      Client   (dismissible overdue banner -> applies status=overdue)
    FollowUpFilters                                          Client   (URL-driven quick chips, search, sort, advanced Sheet)
      QuickFilterToggleGroup                                 Client   (reuses 003 ToggleGroup pattern)
      SearchInput                                            Client   (InputGroup + 300ms debounce)
      AdvancedFiltersSheet                                   Client   (mobile Sheet: dept, stage type, priority, category, dates)
    FollowUpBoard                                            Client   (useFollowUpBoardInfinite + 4 states + load more)
      FollowUpBoardSkeleton                                  Client   (skeleton stats + table/cards + panels)
      FollowUpBoardTable                                     Client   (desktop/tablet table — reuses task-badges)
        FollowUpBoardRow                                     Client   (row with SLA accent + actions dropdown)
      FollowUpBoardMobileList                                Client   (mobile card list)
        FollowUpTaskCard                                     Client   (single mobile card)
    BottleneckPanel                                          Client   (useFollowUpBottlenecks + top-5 preview + "View all" Dialog + side-by-side counts + red/amber left border + clickable items -> URL filters)
    RecentActionsPanel                                       Client   (useAllFollowUpActions cross-task endpoint + 3-line ActionEntry + "View all" Dialog with ScrollArea+Load More + reports actionsTodayCount)
    EscalationsPanel                                         Client   (useEscalationsInfinite + timeline feed layout with circular icons+connecting line + Open/Resolved tab toggle + "View all" Dialog with ScrollArea+Load More)
    LogFollowUpDialog                                        Client   (form -> POST /follow-up/tasks/{task}/actions)
    EscalateDialog                                           Client   (form -> POST /tracking/escalations)
    ResolveEscalationDialog                                  Client   (form -> POST /tracking/escalations/{id}/resolve)
```

**Server components:** `FollowUpPage` only reads translations and renders the shell.

**Client components:** everything using TanStack Query, URL params, router, event handlers, or local state.

---

## Affected Files

### New Files

| File | Purpose |
|------|---------|
| `components/domain/follow-up/follow-up-center.tsx` | Main client container; orchestrates all sections and dialogs. |
| `components/domain/follow-up/follow-up-stats.tsx` | 4 stat cards with page-local counts + tinted borders. |
| `components/domain/follow-up/follow-up-alert-banner.tsx` | Dismissible overdue banner with "View All" action. |
| `components/domain/follow-up/follow-up-filters.tsx` | URL-driven quick filters, search, sort, advanced Sheet. |
| `components/domain/follow-up/follow-up-board.tsx` | Board container: infinite query + 4 states + load more. |
| `components/domain/follow-up/follow-up-board-table.tsx` | Desktop/tablet table view with SLA accent + actions dropdown. |
| `components/domain/follow-up/follow-up-board-mobile-list.tsx` | Mobile card list. |
| `components/domain/follow-up/follow-up-task-card.tsx` | Single mobile card. |
| `components/domain/follow-up/follow-up-board-skeleton.tsx` | Skeleton stats + table/cards + panels. |
| `components/domain/follow-up/bottleneck-panel.tsx` | Top 10 bottlenecks list, clickable to filter board. |
| `components/domain/follow-up/recent-actions-panel.tsx` | Bounded recent actions aggregation + empty state. |
| `components/domain/follow-up/escalations-panel.tsx` | Open escalations list with resolve action. |
| `components/domain/follow-up/log-follow-up-dialog.tsx` | Form dialog: action type, bilingual note, contact name. |
| `components/domain/follow-up/escalate-dialog.tsx` | Form dialog: reason + optional target position. |
| `components/domain/follow-up/resolve-escalation-dialog.tsx` | Form dialog: resolution note. |
| `components/domain/follow-up/follow-up-types.ts` | Generated type aliases, filter types, display helper interfaces. |
| `components/domain/follow-up/follow-up-utils.ts` | URL filter parsing, API param mapping, bottleneck/escalation adapters, label maps. |
| `lib/api/hooks/use-follow-up.ts` | Board (polling), overdue, at-risk, bottlenecks, actions hooks. |
| `lib/api/hooks/use-escalations.ts` | Escalations list, create, resolve hooks. |
| `__tests__/components/domain/follow-up/follow-up-board.test.tsx` | Board loading/empty/error/success/filter tests. |
| `__tests__/components/domain/follow-up/follow-up-panels.test.tsx` | Bottleneck + recent actions + escalations panel tests. |
| `__tests__/components/domain/follow-up/log-follow-up-dialog.test.tsx` | Dialog form + submit + validation tests. |
| `__tests__/components/domain/follow-up/resolve-escalation-dialog.test.tsx` | Resolve form + submit tests. |
| `__tests__/components/domain/follow-up/escalate-dialog.test.tsx` | Escalate dialog validation + submit tests. |

### Modified Files

| File | Change |
|------|--------|
| `app/(dashboard)/follow-up/page.tsx` | Replace placeholder with `PageHeader` + `FollowUpCenter`. |
| `lib/api/query-keys.ts` | Add `followUp` (overdue, atRisk, bottlenecks, actions) + `escalations` (list, detail) namespaces. |
| `messages/ar.json` | Add `followUp.*` namespace (~80 keys). |
| `messages/en.json` | Add `followUp.*` namespace (~80 keys). |
| `__tests__/mocks/handlers.ts` | Add MSW handlers for `/v1/follow-up/overdue`, `/at-risk`, `/bottlenecks`, `/actions` (cross-task GET), `/tasks/{task}/actions` (GET+POST), `/v1/tracking/escalations` (GET+POST), `/tracking/escalations/{id}/resolve` (POST). |
| `specs/007-follow-up-center/spec.md` | Mark open questions resolved (see "Open Questions Resolved" above). |

Optional backend coordination (not blocking):
- Fix Scramble schemas for `BottleneckResource.stage_type`/`.department` and `BoardTaskResource.current_assignees`, then `npm run generate:api`.

---

## Implementation Notes

### 1. Query Keys

**One-line summary:** Extend `lib/api/query-keys.ts` with `followUp` and `escalations` namespaces; reuse existing `taskBoard` key for the board query.

**Key decisions:**
- Reuse `queryKeys.taskBoard.list(filters)` for the board query (shared cache with `/tasks`).
- New `followUp` namespace for overdue/at-risk/bottlenecks/actions.
- New `escalations` namespace for the escalations list + detail.
- Filter objects in query keys are memoized via `useMemo` at the call site.

**File:** `lib/api/query-keys.ts`

**Snippet:**
```ts
// append to queryKeys
followUp: {
  all: ['follow-up'] as const,
  boardLists: () => [...queryKeys.followUp.all, 'board'] as const,
  // board reuses taskBoard.list key (same endpoint) — no separate key
  overdueLists: () => [...queryKeys.followUp.all, 'overdue'] as const,
  overdueList: (filters: Record<string, unknown>) =>
    [...queryKeys.followUp.overdueLists(), filters] as const,
  atRiskLists: () => [...queryKeys.followUp.all, 'at-risk'] as const,
  atRiskList: (filters: Record<string, unknown>) =>
    [...queryKeys.followUp.atRiskLists(), filters] as const,
  bottlenecks: (filters: Record<string, unknown>) =>
    [...queryKeys.followUp.all, 'bottlenecks', filters] as const,
    actionsAll: (filters: Record<string, unknown>) =>
      [...queryKeys.followUp.all, 'actions', 'all', filters] as const,
    actionsTask: (taskPublicId: string) =>
      [...queryKeys.followUp.all, 'actions', 'task', taskPublicId] as const,
},
escalations: {
  all: ['escalations'] as const,
  lists: () => [...queryKeys.escalations.all, 'list'] as const,
  list: (filters: Record<string, unknown>) =>
    [...queryKeys.escalations.lists(), filters] as const,
  detail: (publicId: string) => [...queryKeys.escalations.all, 'detail', publicId] as const,
},
```

**Test cases:**
1. Render -> `queryKeys.followUp.bottlenecks({})` returns `['follow-up', 'bottlenecks', {}]`.
2. Render -> no component uses hardcoded query key strings.

**Rules:** `coding-standards.md` — centralized query key factory; no hardcoded query keys.

---

### 2. Follow-Up Query Hooks

**One-line summary:** Add `use-follow-up.ts` with board (60s polling), overdue, at-risk, bottlenecks, all-actions (cross-task), per-task actions, and create-action hooks using generated types.

**Key decisions:**
- `useFollowUpBoardInfinite` reuses `queryKeys.taskBoard.list` (shared cache with `/tasks`) but adds `refetchInterval: 60_000`, `refetchIntervalInBackground: false`.
- `useFollowUpBottlenecks` is a bounded `useQuery` (no pagination).
- `useAllFollowUpActions` is a cursor-paginated `useInfiniteQuery` against the new `GET /v1/follow-up/actions` cross-task endpoint — replaces planned client-side aggregation from first 3 board tasks.
- `useFollowUpActions` is a bounded `useQuery` (`per_page=5`) used for per-task action history (legacy, kept for detail pages).
- All hooks import generated types from `lib/generated/api-types.ts`.

**File:** `lib/api/hooks/use-follow-up.ts`

**Snippet:**
```ts
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { queryKeys } from '@/lib/api/query-keys';
import type { components, operations } from '@/lib/generated/api-types';

type BoardTaskResource = components['schemas']['BoardTaskResource'];
type BottleneckResource = components['schemas']['BottleneckResource'];
type FollowUpActionResource = components['schemas']['FollowUpActionResource'];
type BoardQuery = NonNullable<
  operations['followUpBoard.board']['parameters']['query']
> & { cursor?: string | null };

interface CursorPage<T> {
  data: T[];
  next_cursor: string | null;
  has_more: boolean;
}

export function useFollowUpBoardInfinite(filters: BoardQuery) {
  return useInfiniteQuery({
    queryKey: queryKeys.taskBoard.list(filters as unknown as Record<string, unknown>),
    queryFn: ({ pageParam }) =>
      apiClient.get<CursorPage<BoardTaskResource>>('/v1/follow-up/board', {
        params: { ...filters, cursor: pageParam },
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? lastPage.next_cursor : undefined,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
  });
}

export function useFollowUpOverdueInfinite(filters: Partial<BoardQuery>) {
  return useInfiniteQuery({
    queryKey: queryKeys.followUp.overdueList(filters as Record<string, unknown>),
    queryFn: ({ pageParam }) =>
      apiClient.get<CursorPage<BoardTaskResource>>('/v1/follow-up/overdue', {
        params: { ...filters, cursor: pageParam },
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? lastPage.next_cursor : undefined,
  });
}

export function useFollowUpAtRiskInfinite(filters: Partial<BoardQuery>) {
  return useInfiniteQuery({
    queryKey: queryKeys.followUp.atRiskList(filters as Record<string, unknown>),
    queryFn: ({ pageParam }) =>
      apiClient.get<CursorPage<BoardTaskResource>>('/v1/follow-up/at-risk', {
        params: { ...filters, cursor: pageParam },
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? lastPage.next_cursor : undefined,
  });
}

export function useFollowUpBottlenecks(filters: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: queryKeys.followUp.bottlenecks(filters),
    queryFn: () =>
      apiClient.get<{ data: BottleneckResource[] }>(
        '/v1/follow-up/bottlenecks',
        { params: filters },
      ),
    staleTime: 5 * 60 * 1000,
  });
}

export function useFollowUpActions(taskPublicId: string | null | undefined) {
  return useQuery({
    queryKey: queryKeys.followUp.actionsTask(taskPublicId ?? ''),
    queryFn: () =>
      apiClient.get<CursorPage<FollowUpActionResource>>(
        `/v1/follow-up/tasks/${taskPublicId}/actions`,
        { params: { per_page: 5 } },
      ),
    enabled: !!taskPublicId,
    staleTime: 30 * 1000,
  });
}

export function useAllFollowUpActions(filters: Record<string, unknown> = {}) {
  return useInfiniteQuery({
    queryKey: queryKeys.followUp.actionsAll(filters),
    queryFn: ({ pageParam }) =>
      apiClient.get<CursorPage<FollowUpActionResource>>('/v1/follow-up/actions', {
        params: { ...filters, cursor: pageParam },
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? lastPage.next_cursor : undefined,
    refetchOnWindowFocus: false,
  });
}
```

**Test cases:**
1. Render -> `useFollowUpBoardInfinite({ status: 'active' })` polls every 60s (assert `refetchInterval === 60_000`).
2. Render -> `useFollowUpBottlenecks({})` calls `/v1/follow-up/bottlenecks` and returns `{ data: [...] }`.
3. Render -> `useAllFollowUpActions({ per_page: 15 })` calls `GET /v1/follow-up/actions` and returns `{ data: [...], next_cursor, has_more }`.

**Rules:** `coding-standards.md` — generated types, cursor pagination with `useInfiniteQuery`, no `useEffect` fetch, no API data in Zustand.

---

### 3. Escalation Hooks (Query + Mutations)

**One-line summary:** Add `use-escalations.ts` with list, create, and resolve hooks; mutations invalidate `escalations.list` + `followUp.board`.

**Key decisions:**
- `useEscalationsInfinite` filters `status=1` (Open) by default.
- `useCreateEscalation` invalidates `escalations.lists()` + `followUp.board` + `taskBoard.lists()`.
- `useResolveEscalation` invalidates `escalations.lists()` + `followUp.board` + `taskBoard.lists()`.
- All mutation success/error toasts use `useTranslations('followUp')` — no hardcoded strings.

**File:** `lib/api/hooks/use-escalations.ts`

**Snippet:**
```ts
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/client';
import { queryKeys } from '@/lib/api/query-keys';
import type { components } from '@/lib/generated/api-types';

type EscalationResource = components['schemas']['EscalationResource'];
type EscalationDetailResource = components['schemas']['EscalationDetailResource'];
type CreateManualEscalationRequest = components['schemas']['CreateManualEscalationRequest'];
type ResolveEscalationRequest = components['schemas']['ResolveEscalationRequest'];

interface CursorPage<T> { data: T[]; next_cursor: string | null; has_more: boolean; }

export interface EscalationFilters {
  status?: number;        // 1=Open, 2=Resolved
  type?: number;          // 1=AutoSlaBreach, 2=Manual
  assigned_to_me?: boolean;
  task_id?: string;
  department_id?: string;
  per_page?: number;
  cursor?: string | null;
}

export function useEscalationsInfinite(filters: EscalationFilters = { status: 1 }) {
  return useInfiniteQuery({
    queryKey: queryKeys.escalations.list(filters as Record<string, unknown>),
    queryFn: ({ pageParam }) =>
      apiClient.get<CursorPage<EscalationResource>>('/v1/tracking/escalations', {
        params: { ...filters, cursor: pageParam },
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? lastPage.next_cursor : undefined,
  });
}

export function useCreateEscalation() {
  const qc = useQueryClient();
  const t = useTranslations('followUp.escalate');
  return useMutation({
    mutationFn: (body: CreateManualEscalationRequest) =>
      apiClient.post<EscalationDetailResource>('/v1/tracking/escalations', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.escalations.lists() });
      qc.invalidateQueries({ queryKey: queryKeys.taskBoard.lists() });
      toast.success(t('created'));
    },
    onError: () => toast.error(t('create_error')),
  });
}

export function useResolveEscalation() {
  const qc = useQueryClient();
  const t = useTranslations('followUp.escalations');
  return useMutation({
    mutationFn: ({ escalationPublicId, body }: { escalationPublicId: string; body: ResolveEscalationRequest }) =>
      apiClient.post<EscalationDetailResource>(
        `/v1/tracking/escalations/${escalationPublicId}/resolve`,
        body,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.escalations.lists() });
      qc.invalidateQueries({ queryKey: queryKeys.taskBoard.lists() });
      toast.success(t('resolved'));
    },
    onError: () => toast.error(t('resolve_error')),
  });
}
```

**Test cases:**
1. Render -> `useCreateEscalation().mutate(...)` invalidates `escalations.lists()` and `taskBoard.lists()`.
2. Render -> `useResolveEscalation` success toast uses `followUp.escalations.resolved` translation key.

**Rules:** `coding-standards.md` — mutations invalidate related lists; localized toasts; generated request body types.

---

### 4. Follow-Up Action Mutation Hook

**One-line summary:** Add `useCreateFollowUpAction` to `use-follow-up.ts` — `POST /v1/follow-up/tasks/{task}/actions`.

**Key decisions:**
- Invalidates `followUp.actionsTask(taskPublicId)` + `followUp.actionsAll({})` + `taskBoard.lists()`.
- Localized toast via `useTranslations('followUp.actions')`.

**Snippet (append to `use-follow-up.ts`):**
```ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import type { StoreFollowUpActionRequest } from '@/lib/generated/api-types';

export function useCreateFollowUpAction(taskPublicId: string) {
  const qc = useQueryClient();
  const t = useTranslations('followUp.actions');
  return useMutation({
    mutationFn: (body: StoreFollowUpActionRequest) =>
      apiClient.post<FollowUpActionResource>(
        `/v1/follow-up/tasks/${taskPublicId}/actions`,
        body,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.followUp.actionsTask(taskPublicId) });
      qc.invalidateQueries({ queryKey: queryKeys.followUp.actionsAll({}) });
      qc.invalidateQueries({ queryKey: queryKeys.taskBoard.lists() });
      toast.success(t('logged'));
    },
    onError: () => toast.error(t('log_error')),
  });
}
```

**Rules:** `coding-standards.md` — mutation invalidation; localized toasts; generated `StoreFollowUpActionRequest` type.

---

### 5. Types & Utils

**One-line summary:** Add `follow-up-types.ts` (generated aliases + filter/adapter interfaces) and `follow-up-utils.ts` (URL filter parsing, API param mapping, bottleneck/escalation adapters, label maps).

**Key decisions:**
- Reuse `BoardTaskResource` + `TaskBoardUrlFilters` + `BoardQuery` from `components/domain/tasks/task-board-types.ts` (re-export).
- `getBottleneckEntities()` narrows `BottleneckResource.stage_type`/`.department` from `unknown` to `{ public_id, name_ar, name_en }` (OpenAPI schema mismatch).
- `ESCALATION_STATUS_MAP` / `ESCALATION_TYPE_MAP` normalize backend string enum names to display keys.
- `FOLLOW_UP_ACTION_TYPE_MAP` maps integer action types (1–5) to translation keys + Lucide icons.

**Files:**
- `components/domain/follow-up/follow-up-types.ts`
- `components/domain/follow-up/follow-up-utils.ts`

**Snippet — types:**
```ts
import type { components } from '@/lib/generated/api-types';
export type BottleneckResource = components['schemas']['BottleneckResource'];
export type FollowUpActionResource = components['schemas']['FollowUpActionResource'];
export type EscalationResource = components['schemas']['EscalationResource'];
export type EscalationDetailResource = components['schemas']['EscalationDetailResource'];
export type CreateManualEscalationRequest = components['schemas']['CreateManualEscalationRequest'];
export type ResolveEscalationRequest = components['schemas']['ResolveEscalationRequest'];
export type StoreFollowUpActionRequest = components['schemas']['StoreFollowUpActionRequest'];

export interface BottleneckEntity {
  public_id: string;
  name_ar?: string | null;
  name_en?: string | null;
}
// Re-export board filter types from tasks for reuse
export type {
  BoardTaskResource,
  TaskBoardUrlFilters,
  BoardQuery,
  AssigneeDisplay,
} from '@/components/domain/tasks/task-board-types';
```

**Snippet — utils (adapters + maps):**
```ts
import type { BottleneckResource, BottleneckEntity, FollowUpActionResource } from './follow-up-types';

export function getBottleneckEntities(item: BottleneckResource): {
  stageType: BottleneckEntity | null;
  department: BottleneckEntity | null;
} {
  const narrow = (raw: unknown): BottleneckEntity | null => {
    if (!raw || typeof raw !== 'object') return null;
    const v = raw as Record<string, unknown>;
    if (typeof v.public_id !== 'string') return null;
    return {
      public_id: v.public_id,
      name_ar: typeof v.name_ar === 'string' ? v.name_ar : null,
      name_en: typeof v.name_en === 'string' ? v.name_en : null,
    };
  };
  return { stageType: narrow(item.stage_type), department: narrow(item.department) };
}

export const ESCALATION_TYPE_MAP: Record<string, string> = {
  auto_sla_breach: 'auto',
  manual: 'manual',
};

const FOLLOW_UP_ACTION_TYPE_MAP: Record<string, string> = {
  phonecall: 'phone',
  message: 'message',
  meeting: 'meeting',
  email: 'email',
  other: 'other',
};

// FollowUpActionType: supports both string names (phonecall, message, etc.) and integer (1-5)
export function actionTypeKey(actionType: string | number | null | undefined): string {
  if (typeof actionType === 'string' && FOLLOW_UP_ACTION_TYPE_MAP[actionType]) {
    return FOLLOW_UP_ACTION_TYPE_MAP[actionType];
  }
  const n = typeof actionType === 'number' ? actionType : parseInt(String(actionType ?? ''), 10);
  if (n >= 1 && n <= 5) return ['phone', 'message', 'meeting', 'email', 'other'][n - 1];
  return 'other';
}

// Re-export the shared board filter helpers for the follow-up board
export {
  readBoardFilters,
  toBoardQuery,
  getCurrentAssignees,
  localizeName,
  formatTimeInStage,
  formatDueDate,
} from '@/components/domain/tasks/task-board-utils';
```

**Test cases:**
1. Render -> `getBottleneckEntities({ stage_type: 'x', department: { public_id: 'd1', name_ar: 'A' } })` returns `department` non-null and `stageType` null (string narrowed away).
2. Render -> `actionTypeKey(1)` returns `'phone'`; `actionTypeKey('3')` returns `'meeting'`.

**Rules:** `coding-standards.md` — generated types, no `any` (use `unknown` narrowing), reuse shared utils.

---

### 6. Page + Center Container

**One-line summary:** Replace the placeholder `/follow-up` page with a server page rendering `PageHeader` + `FollowUpCenter` (client orchestrator).

**Key decisions:**
- Server page uses `getTranslations('followUp')` for title + description.
- `FollowUpCenter` reads URL params, runs the board query, derives page-local stats, renders all sections + dialogs, and gates the whole view on `task.view.follow_up_scope` / `task.view.organization` / `task.view.department_touched`.
- All 4 states handled before success rendering.
- Layout: `grid-cols-1 lg:grid-cols-3` — main col (2) + side col (1, sticky).

**Files:**
- `app/(dashboard)/follow-up/page.tsx`
- `components/domain/follow-up/follow-up-center.tsx`

**Page snippet:**
```tsx
import { getTranslations } from 'next-intl/server';
import { PageHeader } from '@/components/shared/page-header';
import { FollowUpCenter } from '@/components/domain/follow-up/follow-up-center';

export default async function FollowUpPage() {
  const t = await getTranslations('followUp');
  return (
    <main className="flex flex-col gap-6 p-6">
      <PageHeader title={t('title')} description={t('description')} />
      <FollowUpCenter />
    </main>
  );
}
```

**Center snippet (skeleton — full file ~180 lines):**
```tsx
'use client';

import { useMemo, useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useCapability } from '@/lib/api/hooks/use-capabilities';
import { useCurrentUser } from '@/lib/api/hooks/use-auth';
import { useFollowUpBoardInfinite } from '@/lib/api/hooks/use-follow-up';
import { readBoardFilters, toBoardQuery, localizeName } from './follow-up-utils';
import { FollowUpStats } from './follow-up-stats';
import { FollowUpAlertBanner } from './follow-up-alert-banner';
import { FollowUpFilters } from './follow-up-filters';
import { FollowUpBoard } from './follow-up-board';
import { BottleneckPanel } from './bottleneck-panel';
import { RecentActionsPanel } from './recent-actions-panel';
import { EscalationsPanel } from './escalations-panel';
import { LogFollowUpDialog, EscalateDialog, ResolveEscalationDialog } from './log-follow-up-dialog';
import type { BoardTaskResource } from './follow-up-types';

export function FollowUpCenter() {
  const t = useTranslations('followUp');
  const searchParams = useSearchParams();
  const { data: user } = useCurrentUser();
  const canViewOrg = useCapability('task.view.organization');
  const canViewFollowUp = useCapability('task.view.follow_up_scope');
  const canViewDept = useCapability('task.view.department_touched');
  const canView = canViewOrg || canViewFollowUp || canViewDept;

  const urlFilters = useMemo(() => readBoardFilters(searchParams), [searchParams]);
  const apiFilters = useMemo(
    () => toBoardQuery(urlFilters, user?.public_id),
    [urlFilters, user?.public_id],
  );

  const [logTask, setLogTask] = useState<BoardTaskResource | null>(null);
  const [escalateTask, setEscalateTask] = useState<BoardTaskResource | null>(null);
  const [resolveEscalationId, setResolveEscalationId] = useState<string | null>(null);

  if (!canView) {
    return (
      <EmptyState
        icon={Lock}
        title={t('no_permission_title')}
        description={t('no_permission_description')}
      />
    );
  }

  const scopeLabel = canViewOrg ? t('scope_organization') : t('scope_monitoring');

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="flex flex-col gap-6 lg:col-span-2">
        <FollowUpStats filters={urlFilters} scopeLabel={scopeLabel} />
        <FollowUpAlertBanner onApplyOverdue={() => applyFilter('status', 'overdue')} />
        <FollowUpFilters filters={urlFilters} />
        <FollowUpBoard
          filters={apiFilters}
          onLogFollowUp={setLogTask}
          onEscalate={setEscalateTask}
        />
      </div>
      <aside className="flex flex-col gap-6 lg:sticky lg:top-20 lg:self-start">
        <BottleneckPanel />
        <RecentActionsPanel />
        <EscalationsPanel onResolve={setResolveEscalationId} />
      </aside>

      {logTask && (
        <LogFollowUpDialog
          task={logTask}
          open={!!logTask}
          onOpenChange={(o) => !o && setLogTask(null)}
        />
      )}
      {escalateTask && (
        <EscalateDialog
          task={escalateTask}
          open={!!escalateTask}
          onOpenChange={(o) => !o && setEscalateTask(null)}
        />
      )}
      {resolveEscalationId && (
        <ResolveEscalationDialog
          escalationPublicId={resolveEscalationId}
          open={!!resolveEscalationId}
          onOpenChange={(o) => !o && setResolveEscalationId(null)}
        />
      )}
    </div>
  );
}
```

**State management:**
- **URL:** all board filters + sort + search (`status`, `scope`, `stageTypeId`, `assigneeId`, `departmentId`, `priorityId`, `blueprintCategoryId`, `dateFrom`, `dateTo`, `dateField`, `search`, `sortBy`, `sortDirection`).
- **Local `useState`:** `logTask`, `escalateTask`, `resolveEscalationId` (dialog targets), banner dismissed flag (inside banner).
- **Zustand:** none. No follow-up data in Zustand.

**Test cases:**
1. Render with no capabilities -> no-permission empty state appears.
2. Render with `task.view.follow_up_scope` + board data -> stats, filters, board, and side panels all render.

**Rules:** `coding-standards.md` — all 4 states, `useInfiniteQuery`, URL params for filters, `useCapability()`, no Zustand for API data, logical properties. `design-system/04-layout-patterns.md` — two-column grid + sticky side column.

---

### 7. Stats + Alert Banner

**One-line summary:** `FollowUpStats` renders 4 page-local count cards; `FollowUpAlertBanner` shows a dismissible red banner when overdue count > 0.

**Key decisions:**
- Stats derive from the currently-loaded board rows (passed in or re-derived from the board query in `FollowUpCenter`).
- At-risk card uses `border-amber-200`, overdue card uses `border-red-200` (tinted borders per spec).
- "Follow-ups Today" counts recent-actions with `created_at` >= start of today.
- Banner dismissed state is local `useState` (not persisted — reappears on next page load, acceptable MVP).
- Banner "View All" calls the parent `onApplyOverdue` which writes `status=overdue` to the URL.

**Files:**
- `components/domain/follow-up/follow-up-stats.tsx`
- `components/domain/follow-up/follow-up-alert-banner.tsx`

**Stats snippet:**
```tsx
'use client';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { ShieldAlert, AlertTriangle, Clock, PhoneCall } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BoardTaskResource } from './follow-up-types';

interface FollowUpStatsProps {
  tasks: BoardTaskResource[];
  actionsTodayCount: number;
  scopeLabel: string;
}

export function FollowUpStats({ tasks, actionsTodayCount, scopeLabel }: FollowUpStatsProps) {
  const t = useTranslations('followUp.stats');
  const active = tasks.length;
  const atRisk = tasks.filter((x) => (x.sla_health ?? '').toLowerCase() === 'amber').length;
  const overdue = tasks.filter((x) => (x.sla_health ?? '').toLowerCase() === 'red').length;

  const cards = [
    { label: t('scope'), value: active, sub: scopeLabel, icon: Clock, border: '' },
    { label: t('at_risk'), value: atRisk, sub: t('at_risk_sub'), icon: AlertTriangle, border: 'border-amber-200 dark:border-amber-800' },
    { label: t('overdue'), value: overdue, sub: t('overdue_sub'), icon: ShieldAlert, border: 'border-red-200 dark:border-red-800' },
    { label: t('today'), value: actionsTodayCount, sub: t('today_sub'), icon: PhoneCall, border: '' },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((c) => (
        <Card
          key={c.label}
          className={cn('p-5 transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 motion-reduce:hover:translate-y-0', c.border)}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{c.label}</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{c.value}</p>
              <p className="text-xs text-muted-foreground">{c.sub}</p>
            </div>
            <c.icon className="size-5 text-muted-foreground/50" aria-hidden="true" />
          </div>
        </Card>
      ))}
    </div>
  );
}
```

**Banner snippet:**
```tsx
'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FollowUpAlertBannerProps {
  overdueCount: number;
  onApplyOverdue: () => void;
}

export function FollowUpAlertBanner({ overdueCount, onApplyOverdue }: FollowUpAlertBannerProps) {
  const t = useTranslations('followUp.banner');
  const [dismissed, setDismissed] = useState(false);
  if (dismissed || overdueCount <= 0) return null;

  return (
    <div
      role="alert"
      className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-950"
    >
      <div className="flex items-center gap-3">
        <AlertCircle className="size-5 text-red-600 dark:text-red-400" aria-hidden="true" />
        <p className="text-sm text-red-700 dark:text-red-300">
          <span className="font-semibold">{overdueCount}</span> {t('overdue_message')}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="link" size="sm" className="text-red-600 dark:text-red-400" onClick={onApplyOverdue}>
          {t('view_all')}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          aria-label={t('dismiss')}
          onClick={() => setDismissed(true)}
        >
          <X className="size-4" />
        </Button>
      </div>
    </div>
  );
}
```

**Test cases:**
1. Render -> 4 stat cards with correct counts from `tasks` array.
2. Render with `overdueCount=0` -> banner not rendered; with `overdueCount=3` -> banner shows "3" + View All button.

**Rules:** `design-system/01-tokens.md` — tinted borders, stat card hover motion; `05-accessibility.md` — `role="alert"`, icon-only `aria-label`, `motion-reduce:`; `coding-standards.md` — logical properties, no physical direction.

---

### 8. Filters

**One-line summary:** URL-driven `FollowUpFilters` with quick chips (`ToggleGroup`), debounced search (`InputGroup`), sort select + direction toggle, and an advanced-filters `Sheet` on mobile (department, stage type, priority, blueprint category, date range).

**Key decisions:**
- Reuse 003 `setParam`/`resetFilters` URL-param pattern.
- Quick chips: Active (default), My Tasks, Overdue, At Risk, Suspended, All — same as 003.
- Advanced filters: Department (`RtlSelect`), Stage Type (`RtlSelect`), Priority (multi via repeated `priorityId` params), Blueprint Category (`RtlSelect`), Date Range (two `Input type=date` + `dateField` select).
- Search debounced 300ms via manual `setTimeout`/`clearTimeout` in `useEffect`.
- Sort: `Select` (field) + `Button` (asc/desc toggle with `ArrowUpDown` `rtl:rotate-180`).
- Reset button clears all filter params.

**File:** `components/domain/follow-up/follow-up-filters.tsx`

**Snippet (core — full file reuses 003 patterns):**
```tsx
'use client';
import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { SearchIcon, ArrowUpDown, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { RtlSelect } from '@/components/shared/rtl-select';
import { useTaskPriorities, useBlueprintCategories, useStageTypes, useDepartmentsInfinite } from '@/lib/api/hooks/use-task-board';
import { localizeName } from './follow-up-utils';
import type { TaskBoardUrlFilters } from './follow-up-types';

interface FollowUpFiltersProps { filters: TaskBoardUrlFilters; }

export function FollowUpFilters({ filters }: FollowUpFiltersProps) {
  const t = useTranslations('followUp.filters');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = useLocale();

  function setParam(key: string, value?: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value); else params.delete(key);
    router.replace(`${pathname}?${params.toString()}`);
  }
  function resetFilters() { router.replace(pathname); }

  // debounced search (300ms) — same pattern as 003
  const [search, setSearch] = useState(filters.search ?? '');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (search) params.set('search', search); else params.delete('search');
      router.replace(`${pathname}?${params.toString()}`);
    }, 300);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col gap-3 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <ToggleGroup
          type="single"
          value={filters.scope === 'mine' ? 'mine' : filters.status ?? 'active'}
          onValueChange={(value) => {
            if (!value) return;
            const params = new URLSearchParams(searchParams.toString());
            params.delete('scope'); params.delete('status');
            if (value === 'mine') params.set('scope', 'mine');
            else if (value !== 'all') params.set('status', value);
            else params.set('status', 'all');
            router.replace(`${pathname}?${params.toString()}`);
          }}
        >
          {(['active','mine','overdue','at_risk','suspended','all'] as const).map((k) => (
            <ToggleGroupItem key={k} value={k} className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
              {t(k)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <Button variant="ghost" onClick={resetFilters}>{t('reset')}</Button>
        <AdvancedFiltersSheet filters={filters} onParam={setParam} />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Field>
          <FieldLabel className="sr-only">{t('search')}</FieldLabel>
          <InputGroup>
            <InputGroupInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('search_placeholder')}
              aria-label={t('search')}
            />
            <InputGroupAddon><SearchIcon aria-hidden="true" /></InputGroupAddon>
          </InputGroup>
        </Field>
        <div className="flex items-center gap-2">
          <Select value={filters.sortBy ?? 'time_at_stage'} onValueChange={(v) => setParam('sortBy', v)}>
            <SelectTrigger className="flex-1" aria-label={t('sort_by')}><SelectValue /></SelectTrigger>
            <SelectContent position="popper" align={locale === 'ar' ? 'start' : 'end'}>
              <SelectGroup>
                {(['time_at_stage','priority','due_date','created_at','department','stage_type'] as const).map((k) => (
                  <SelectItem key={k} value={k}>{t(`sort_${k}`)}</SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Button
            variant="outline" size="icon" className="size-8 shrink-0"
            aria-label={filters.sortDirection === 'asc' ? t('sort_asc') : t('sort_desc')}
            onClick={() => setParam('sortDirection', filters.sortDirection === 'asc' ? 'desc' : 'asc')}
          >
            <ArrowUpDown className="size-4 rtl:rotate-180" />
          </Button>
        </div>
      </div>
    </div>
  );
}
```

**Test cases:**
1. Click "Overdue" chip -> URL contains `status=overdue`.
2. Type search -> after 300ms URL contains `search=<term>`.

**Rules:** `architecture.md` — filters in URL; `coding-standards.md` — logical properties, `rtl:rotate-180` on directional icons; shadcn skill — `ToggleGroup`, `Field`/`InputGroup`, `SelectItem` inside `SelectGroup`, `Sheet` for mobile advanced filters.

---

### 9. Board + Table + Mobile Cards

**One-line summary:** `FollowUpBoard` runs `useFollowUpBoardInfinite`, handles 4 states + load-more; `FollowUpBoardTable` reuses the 6-column hybrid enterprise layout from 003 with SLA accent + actions dropdown (Open Details, Open Workflow, Log Follow-Up, Escalate); `FollowUpBoardMobileList`/`FollowUpTaskCard` render cards on mobile.

**Key decisions:**
- Reuse `SlaBadge`, `TaskStatusBadge`, `PriorityBadge`, `ClassificationBadge` from `components/domain/tasks/task-badges.tsx`.
- Reuse `getCurrentAssignees`, `localizeName`, `formatTimeInStage`, `formatDueDate` from `task-board-utils.ts`.
- Row accent `border-s-4` derived from SLA health (same `SLA_BORDER` map as 003).
- Row click navigates to `/tasks/[publicId]`; row Enter key also navigates.
- Actions dropdown items: Open Details, Open Workflow, Log Follow-Up (always), Escalate (gated by `useCapability('task.escalate')`). Each calls `e.stopPropagation()` then the relevant handler.
- `cursor-pointer` on `TableRow` and mobile `Card` (non-primitive elements).
- Load-more button: manual, disabled while fetching next page.

**Files:**
- `components/domain/follow-up/follow-up-board.tsx`
- `components/domain/follow-up/follow-up-board-table.tsx`
- `components/domain/follow-up/follow-up-board-mobile-list.tsx`
- `components/domain/follow-up/follow-up-task-card.tsx`

**Board snippet:**
```tsx
'use client';
import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { ApiRequestError } from '@/lib/api/client';
import { useFollowUpBoardInfinite } from '@/lib/api/hooks/use-follow-up';
import { FollowUpBoardSkeleton } from './follow-up-board-skeleton';
import { FollowUpBoardTable } from './follow-up-board-table';
import { FollowUpBoardMobileList } from './follow-up-board-mobile-list';
import type { BoardQuery, BoardTaskResource } from './follow-up-types';

interface FollowUpBoardProps {
  filters: BoardQuery;
  onLogFollowUp: (task: BoardTaskResource) => void;
  onEscalate: (task: BoardTaskResource) => void;
}

export function FollowUpBoard({ filters, onLogFollowUp, onEscalate }: FollowUpBoardProps) {
  const t = useTranslations('followUp.board');
  const query = useFollowUpBoardInfinite(filters);

  const allTasks = useMemo(() => {
    const seen = new Set<string>();
    return (query.data?.pages.flatMap((p) => p.data) ?? []).filter((task) => {
      if (seen.has(task.public_id)) return false;
      seen.add(task.public_id);
      return true;
    });
  }, [query.data]);

  if (query.isLoading) return <FollowUpBoardSkeleton />;
  if (query.isError) {
    const error = query.error;
    if (error instanceof ApiRequestError && error.status === 403) {
      return <EmptyState title={t('no_permission_title')} description={t('no_permission_description')} />;
    }
    return <ErrorState message={t('error')} onRetry={() => query.refetch()} />;
  }

  if (allTasks.length === 0) {
    return (
      <EmptyState
        title={t('empty_title')}
        description={t('empty_description')}
        action={<Button variant="outline" onClick={() => (window.location.href = '/follow-up')}>{t('reset_filters')}</Button>}
      />
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="hidden md:block">
        <FollowUpBoardTable tasks={allTasks} onLogFollowUp={onLogFollowUp} onEscalate={onEscalate} />
      </div>
      <div className="md:hidden">
        <FollowUpBoardMobileList tasks={allTasks} onLogFollowUp={onLogFollowUp} onEscalate={onEscalate} />
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

**Row actions dropdown snippet (inside `FollowUpBoardTable`):**
```tsx
<DropdownMenu dir={locale === 'ar' ? 'rtl' : 'ltr'}>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon" className="size-8" aria-label={t('row_actions')}>
      <Ellipsis className="size-4" />
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align={locale === 'ar' ? 'start' : 'end'} side="bottom" className="min-w-40">
    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/tasks/${task.public_id}`); }}>
      <ExternalLink className="me-2 size-4" /> {t('open_details')}
    </DropdownMenuItem>
    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/tasks/${task.public_id}/workflow`); }}>
      <GitBranch className="me-2 size-4" /> {t('open_workflow')}
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onLogFollowUp(task); }}>
      <PhoneCall className="me-2 size-4" /> {t('log_follow_up')}
    </DropdownMenuItem>
    {canEscalate && (
      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEscalate(task); }}>
        <ShieldAlert className="me-2 size-4" /> {t('escalate')}
      </DropdownMenuItem>
    )}
  </DropdownMenuContent>
</DropdownMenu>
```

**Test cases:**
1. Render loading -> skeleton visible; render success -> task title + load-more (when `has_more`) appear.
2. Render row -> press Enter on focused row -> router navigates to `/tasks/{publicId}`.

**Rules:** `coding-standards.md` — all 4 states, `useInfiniteQuery`, manual load-more, `useCapability('task.escalate')`, logical properties, `text-start`/`text-end`; `design-system/03-components.md` — 6-column hybrid enterprise table, SLA accent border, SLA owns color; `05-accessibility.md` — semantic `<table>`/`<th scope="col">`, icon-only `aria-label`, color + text on SLA.

---

### 10. Bottleneck Panel

**One-line summary:** `BottleneckPanel` fetches `GET /v1/follow-up/bottlenecks` and renders a bounded preview (first 3) with a "View all" Dialog; items use a side-by-side count layout with a red/amber left border accent; clicking writes `stageTypeId` + `departmentId` to the URL.

**Key decisions:**
- `MAX_VISIBLE = 3` (configurable constant); "View all" link opens a Dialog showing the full list.
- Option A layout: stage type + department name on first line, side-by-side overdue count (red) and at-risk count (amber) on the right, average time at stage below.
- Left border accent: `bg-red-500` when `overdue_count > 0`, `bg-amber-500` otherwise — semantic, color-coded urgency.
- `useFollowUpBottlenecks({})` (bounded, 5-min stale).
- Each item: stage type + department name via `getBottleneckEntities` adapter, counts displayed via `Number(item.overdue_count)` / `Number(item.at_risk_count)`.
- Click -> `setParam('stageTypeId', stageType.public_id)` + `setParam('departmentId', department.public_id)`.
- All states (loading/error/empty/success) render inside a Card shell so the panel layout is preserved.
- Requires `task.view.organization` OR `task.view.follow_up_scope` (gate the panel).

**File:** `components/domain/follow-up/bottleneck-panel.tsx`

**Snippet:**
```tsx
'use client';

import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { useFollowUpBottlenecks } from '@/lib/api/hooks/use-follow-up';
import { useCapability } from '@/lib/api/hooks/use-capabilities';
import { getBottleneckEntities, localizeName, formatTimeInStage } from './follow-up-utils';

const MAX_VISIBLE = 3;

export function BottleneckPanel() {
  const t = useTranslations('followUp.bottlenecks');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const canView = useCapability('task.view.organization') || useCapability('task.view.follow_up_scope');
  const query = useFollowUpBottlenecks({});
  const [showAll, setShowAll] = useState(false);

  if (!canView) return null;
  // All states wrapped in Card for consistent layout
  if (query.isLoading) return <Card><CardHeader><CardTitle .../><CardContent><Skeleton className="h-48"/></CardContent></Card>;
  if (query.isError) return <Card><CardHeader><CardTitle .../><CardContent><EmptyState title={t('error_title')}/></CardContent></Card>;
  const items = query.data?.data ?? [];
  if (items.length === 0) return <Card><CardHeader><CardTitle .../><CardContent><EmptyState .../></CardContent></Card>;

  function applyBottleneck(...) { ... }

  const renderItem = (item) => {
    const { stageType, department } = getBottleneckEntities(item);
    const overdue = Number(item.overdue_count);
    const atRisk = Number(item.at_risk_count);
    return (
      <button ...>
        {/* Left border: red if overdue>0, amber otherwise */}
        <span className={`w-1.5 shrink-0 self-stretch rounded-full ${overdue > 0 ? 'bg-red-500' : 'bg-amber-500'}`} ... />
        <div className="flex-1">
          <div className="flex flex-wrap items-center justify-between gap-x-2 text-xs">
            <span className="font-medium text-foreground">
              {stageType ? localizeName(locale, stageType.name_ar, stageType.name_en) : '-'}
              {department && ` · ${localizeName(locale, department.name_ar, department.name_en)}`}
            </span>
            {/* Side-by-side counts */}
            <div className="flex items-center gap-2">
              {overdue > 0 && <span className="font-medium text-red-600">{overdue} {t('overdue')}</span>}
              {atRisk > 0 && <span className="font-medium text-amber-600">{atRisk} {t('at_risk')}</span>}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{formatTimeInStage(item.average_time_at_stage_seconds, locale)}</p>
        </div>
      </button>
    );
  };

  return (
    <>
      <Card>
        <CardHeader><CardTitle className="text-sm">{t('title')}</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-3">
          {items.slice(0, MAX_VISIBLE).map(renderItem)}
          {items.length > MAX_VISIBLE && (
            <button type="button" onClick={() => setShowAll(true)} className="mt-1 block cursor-pointer text-xs font-medium text-primary hover:underline text-start">
              {t('view_all_stages', { count: items.length })} <ArrowRight className="inline size-3 rtl:rotate-180" />
            </button>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAll} onOpenChange={(o) => { if (!o) setShowAll(false); }}>
        <DialogContent className="max-h-[80vh] max-w-lg">
          <DialogHeader><DialogTitle>{t('title')}</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-2 overflow-y-auto pe-2">{items.map(renderItem)}</div>
        </DialogContent>
      </Dialog>
    </>
  );
}
```

**Test cases:**
1. Render with data -> top bottleneck stage type name + overdue count appear on first item; only first 3 visible.
2. Click "View all" -> dialog opens showing all items.
3. Click a bottleneck -> URL contains `stageTypeId` + `departmentId`.
4. Item with `overdue_count>0` -> left border is `bg-red-500`; item with `overdue_count=0` but `at_risk_count>0` -> left border is `bg-amber-500`.

**Rules:** `coding-standards.md` — generated types + `unknown` narrowing, `useCapability()`, logical properties; `05-accessibility.md` — focus ring on clickable items, color + text.

---

### 11. Recent Actions Panel

**One-line summary:** `RecentActionsPanel` fetches the new cross-task endpoint `GET /v1/follow-up/actions` via `useAllFollowUpActions`, renders a preview (first 3) with "View all" Dialog containing a `ScrollArea` + "Load More" button for cursor-paginated browsing. Each action uses the `ActionEntry` sub-component with a three-line metadata layout. Reports `actionsTodayCount` to `FollowUpCenter` via callback.

**Key decisions:**
- Uses `useAllFollowUpActions({ per_page: 15 })` — a single cursor-paginated `useInfiniteQuery` against the cross-task endpoint. Replaced planned N=3 per-task queries.
- Preview shows first `MAX_VISIBLE=3` actions; "View all" link opens a `Dialog` with `ScrollArea` + `fetchNextPage` Load More button.
- `ActionEntry` sub-component renders three lines:
  1. Note text (localized) + task `display_id` on the right.
  2. Author name + contact name (if any), separated by ` · `.
  3. Dual date + time using `formatDualDate` + HH:MM.
- `actionsTodayCount` computed from `flatActions` by filtering `created_at >= today`. Lifted via `onTodayCount` callback using `useEffect`.
- Empty state shows inside a Card wrapper (preserves panel layout) with a descriptive message even when the board is empty.
- Action type icon mapped via `ACTION_ICONS` record: `phone` → `PhoneCall`, `message` → `MessageSquare`, `meeting` → `Users`, `email` → `Mail`, `other` → `HelpCircle`.

**File:** `components/domain/follow-up/recent-actions-panel.tsx`

**Snippet (core):**
```tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { PhoneCall, MessageSquare, Users, Mail, HelpCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { useAllFollowUpActions } from '@/lib/api/hooks/use-follow-up';
import { actionTypeKey, localizeName } from './follow-up-utils';
import { formatDualDate } from '@/components/domain/tasks/task-detail-utils';
import type { BoardTaskResource, FollowUpActionResource } from './follow-up-types';

const MAX_VISIBLE = 3;
const ACTION_ICONS: Record<string, typeof PhoneCall> = {
  phone: PhoneCall, message: MessageSquare, meeting: Users, email: Mail, other: HelpCircle,
};

function ActionEntry({ a, locale }: { a: FollowUpActionResource; locale: string }) {
  const Icon = ACTION_ICONS[actionTypeKey(a.action_type)] ?? HelpCircle;
  return (
    <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-2.5">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <div className="flex-1 min-w-0">
        {/* Line 1: note + task display_id */}
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs text-foreground truncate">
            {localizeName(locale, a.note_ar, a.note_en)}
          </p>
          {a.task_display_id && (
            <span className="shrink-0 text-[10px] text-muted-foreground">{a.task_display_id}</span>
          )}
        </div>
        {/* Line 2: author + contact */}
        <p className="mt-0.5 text-[10px] text-muted-foreground">
          {a.created_by ? localizeName(locale, a.created_by.name_ar, a.created_by.name_en) : ''}
          {a.contact_name ? ` · ${a.contact_name}` : ''}
        </p>
        {/* Line 3: date + time */}
        <p className="text-[10px] text-muted-foreground">
          {a.created_at && formatDualDate(a.created_at, locale)}
          {a.created_at && (() => {
            const d = new Date(a.created_at);
            return ` ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
          })()}
        </p>
      </div>
    </div>
  );
}

interface RecentActionsPanelProps {
  tasks: BoardTaskResource[];
  onTodayCount?: (count: number) => void;
}

export function RecentActionsPanel({ tasks, onTodayCount }: RecentActionsPanelProps) {
  const t = useTranslations('followUp.recent_actions');
  const locale = useLocale();
  const [showAll, setShowAll] = useState(false);
  const query = useAllFollowUpActions({ per_page: 15 });

  const flatActions = useMemo(
    (): FollowUpActionResource[] => query.data?.pages.flatMap((p) => p.data) ?? [],
    [query.data],
  );
  const preview = useMemo(() => flatActions.slice(0, MAX_VISIBLE), [flatActions]);

  const todayCount = useMemo(
    () => flatActions.filter((a) => {
      if (!a.created_at) return false;
      const today = new Date();
      const created = new Date(a.created_at);
      return created.getFullYear() === today.getFullYear()
        && created.getMonth() === today.getMonth()
        && created.getDate() === today.getDate();
    }).length,
    [flatActions],
  );

  useEffect(() => { onTodayCount?.(todayCount); }, [todayCount, onTodayCount]);

  if (tasks.length === 0) {
    return (
      <Card><CardHeader><CardTitle className="text-sm">{t('title')}</CardTitle></CardHeader>
        <CardContent><EmptyState title={t('empty_title')} description={t('empty_description')} /></CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader><CardTitle className="text-sm">{t('title')}</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-2">
          {query.isLoading ? (
            <Skeleton className="h-48 rounded-xl" />
          ) : preview.length === 0 ? (
            <EmptyState title={t('empty_title')} description={t('empty_description')} />
          ) : (
            <>
              {preview.map((a) => <ActionEntry key={a.public_id} a={a} locale={locale} />)}
              {flatActions.length > MAX_VISIBLE && (
                <button type="button" onClick={() => setShowAll(true)}
                  className="mt-1 block cursor-pointer text-xs font-medium text-primary hover:underline text-start">
                  {t('view_all_actions', { count: flatActions.length })} →
                </button>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAll} onOpenChange={(o) => { if (!o) setShowAll(false); }}>
        <DialogContent className="max-h-[80vh] max-w-lg">
          <DialogHeader><DialogTitle>{t('title')}</DialogTitle></DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="flex flex-col gap-2 pe-2" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
              {flatActions.map((a) => <ActionEntry key={a.public_id} a={a} locale={locale} />)}
            </div>
          </ScrollArea>
          {query.hasNextPage && (
            <Button variant="outline" className="mt-2 w-full" onClick={() => query.fetchNextPage()}
              disabled={query.isFetchingNextPage}>
              {t('load_more')}
            </Button>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
```

**Test cases:**
1. Render with no tasks -> empty state inside Card.
2. Render with data -> preview shows first 3 actions with ActionEntry three-line layout.
3. Click "View all" -> dialog opens with ScrollArea + Load More button when `hasNextPage`.
4. `actionsTodayCount` callback fires with correct count of today's actions.

**Rules:** `coding-standards.md` — single cross-task endpoint, no client-side aggregation, `useInfiniteQuery`, `useCallback` for callback, generated types, logical properties.

---

### 12. Escalations Panel

**One-line summary:** `EscalationsPanel` fetches `GET /v1/tracking/escalations?status=N` (Open/Resolved tab-controlled), renders a timeline feed layout with circular icons connected by a vertical line, event sentences, reason in quotes, and an Open/Resolved tab toggle. "View all" Dialog with `ScrollArea` + "Load More" for paginated browsing. "Resolve" button opens `ResolveEscalationDialog` (gated by `task.resolve_escalations` or being the target).

**Key decisions:**
- `STATUS_OPTIONS = [{ value: 1, label: 'open' }, { value: 2, label: 'resolved' }]` drives a local `statusFilter` state (default `1` = Open).
- `useEscalationsInfinite({ status: statusFilter })` — cursor-paginated, refetches on tab switch.
- Timeline feed layout:
  - Circular icon container: `AlertTriangle` in red background for auto escalations, `User` in amber background for manual.
  - Vertical connecting line via `w-px flex-1 bg-border/50`.
  - Event sentence: `t('event_auto', { task })` / `t('event_manual', { task })` with `escalated_to` subtext.
  - Reason in quotation marks (`"..."`) with italic styling.
  - Date on the right via `formatDualDate`.
- Preview shows first `MAX_VISIBLE=3` items; "View all" link opens a `Dialog` with `ScrollArea` + `fetchNextPage` Load More.
- Resolve button gated by `useCapability('task.resolve_escalations')` OR `escalation.escalated_to_user.public_id === currentUser.public_id` (only shown on Open tab).
- Empty state differentiates Open vs Resolved via `empty_title_open`/`empty_title_resolved` translation keys.
- "Escalate" creation is triggered from the board row actions (not here).

**File:** `components/domain/follow-up/escalations-panel.tsx`

**Snippet:**
```tsx
'use client';

import { useMemo, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { CheckCircle2, AlertTriangle, User } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { useEscalationsInfinite } from '@/lib/api/hooks/use-escalations';
import { useCapability } from '@/lib/api/hooks/use-capabilities';
import { useCurrentUser } from '@/lib/api/hooks/use-auth';
import { localizeName, ESCALATION_TYPE_MAP } from './follow-up-utils';
import { formatDualDate } from '@/components/domain/tasks/task-detail-utils';

const MAX_VISIBLE = 3;
const STATUS_OPTIONS = [
  { value: 1, label: 'open' },
  { value: 2, label: 'resolved' },
] as const;

function EscalationItem({ e, typeKey, locale, statusFilter, canResolve, user, onResolve, t }) {
  const escalatedToName = e.escalated_to_user
    ? localizeName(locale, e.escalated_to_user.name_ar, e.escalated_to_user.name_en) : '-';
  const canResolveThis = statusFilter === 1 && (canResolve || e.escalated_to_user?.public_id === user?.public_id);
  return (
    <div className="flex gap-3">
      {/* Timeline icon + connecting line */}
      <div className="flex flex-col items-center">
        <div className={`flex size-8 items-center justify-center rounded-full ${
          typeKey === 'auto'
            ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400'
            : 'bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-400'
        }`}>
          {typeKey === 'auto' ? <AlertTriangle className="size-4" /> : <User className="size-4" />}
        </div>
        <div className="mt-1 w-px flex-1 bg-border/50" />
      </div>
      {/* Content */}
      <div className="flex-1 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-medium text-foreground">
              {t(`event_${typeKey}`, { task: e.task_display_id })}
            </p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              {t(`event_${typeKey}_to`, { to: escalatedToName })}
            </p>
          </div>
          <span className="shrink-0 text-[10px] text-muted-foreground">
            {e.created_at && formatDualDate(e.created_at, locale)}
          </span>
        </div>
        {e.reason && (
          <p className="mt-1 text-[10px] italic text-muted-foreground/80">"{e.reason}"</p>
        )}
        {canResolveThis && (
          <Button size="sm" variant="outline" className="mt-2 h-7 text-[10px]" onClick={() => onResolve(e.public_id)}>
            {t('resolve')}
          </Button>
        )}
      </div>
    </div>
  );
}

function getTypeKey(e): string {
  const rawType = String(e.escalation_type ?? '').toLowerCase();
  return ESCALATION_TYPE_MAP[rawType] ?? 'manual';
}

export function EscalationsPanel({ onResolve }: EscalationsPanelProps) {
  const t = useTranslations('followUp.escalations');
  const locale = useLocale();
  const canResolve = useCapability('task.resolve_escalations');
  const { data: user } = useCurrentUser();
  const [statusFilter, setStatusFilter] = useState<number>(1);
  const [showAll, setShowAll] = useState(false);
  const query = useEscalationsInfinite({ status: statusFilter });

  const items = useMemo(() => query.data?.pages.flatMap((p) => p.data) ?? [], [query.data]);
  const preview = useMemo(() => items.slice(0, MAX_VISIBLE), [items]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm">{t('title')}</CardTitle>
          {/* Tab toggle */}
          <div className="flex gap-0.5 rounded-lg bg-muted p-0.5">
            {STATUS_OPTIONS.map((opt) => (
              <button key={opt.value} type="button" onClick={() => setStatusFilter(opt.value)}
                className={`cursor-pointer rounded-md px-2 py-0.5 text-[10px] font-medium transition-colors ${
                  statusFilter === opt.value ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'
                }`}>
                {t(`tab_${opt.label}`)}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {query.isLoading ? (<Skeleton className="h-48 rounded-xl" />
        ) : query.isError ? (<EmptyState title={t('error_title')} />
        ) : items.length === 0 ? (<EmptyState icon={CheckCircle2}
            title={t(`empty_title_${statusFilter === 1 ? 'open' : 'resolved'}`)}
            description={t(`empty_description_${statusFilter === 1 ? 'open' : 'resolved'}`)} />
        ) : (
          <>
            {preview.map(renderItem)}
            {items.length > MAX_VISIBLE && (
              <button type="button" onClick={() => setShowAll(true)}
                className="mt-1 block cursor-pointer text-xs font-medium text-primary hover:underline text-start">
                {t('view_all', { count: items.length })} →
              </button>
            )}
          </>
        )}
      </CardContent>

      <Dialog open={showAll} onOpenChange={(o) => { if (!o) setShowAll(false); }}>
        <DialogContent className="max-h-[80vh] max-w-lg">
          <DialogHeader><DialogTitle>{t('title')}</DialogTitle></DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="flex flex-col gap-2 pe-2" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
              {items.map(renderItem)}
            </div>
          </ScrollArea>
          {query.hasNextPage && (
            <Button variant="outline" onClick={() => query.fetchNextPage()} disabled={query.isFetchingNextPage}>
              {t('load_more')}
            </Button>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
```

**Test cases:**
1. Render with no open escalations -> empty state with `CheckCircle2` icon and "No open escalations" text.
2. Render with one escalation assigned to current user -> "Resolve" button enabled without `task.resolve_escalations`.
3. Click "Resolved" tab -> query refetches with `status=2`.
4. Click "View all" -> dialog opens with ScrollArea + Load More when `hasNextPage`.
5. Auto escalation renders `AlertTriangle` icon in red circle; manual escalation renders `User` icon in amber circle; connecting line visible between items.

**Rules:** `coding-standards.md` — `useInfiniteQuery`, `useMemo` for flattening, `useCapability()`, generated types, logical properties; `security-policy.md` — capability is UX-only, server returns 403.

---

### 13. Log Follow-Up Dialog

**One-line summary:** `LogFollowUpDialog` is a form with action-type `Select`, bilingual note (`Textarea` AR required + EN optional), optional contact name `Input`; submits `POST /v1/follow-up/tasks/{task}/actions`.

**Key decisions:**
- Uses shadcn `Dialog` + `Field` + `FieldLabel` + `FieldError` + `Select` + `Textarea` + `Input`.
- Validation: `action_type` required (1–5), `note_ar` required (min 1 char), `note_en`/`contact_name` optional.
- `useCreateFollowUpAction(task.public_id)` — on success closes dialog + toast.
- `action_type` sent as integer (1–5).
- Bilingual note fields: AR `dir="rtl"`, EN `dir="ltr"`.

**File:** `components/domain/follow-up/log-follow-up-dialog.tsx`

**Snippet:**
```tsx
'use client';
import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel, FieldError } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateFollowUpAction } from '@/lib/api/hooks/use-follow-up';
import type { BoardTaskResource } from './follow-up-types';

interface LogFollowUpDialogProps {
  task: BoardTaskResource;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LogFollowUpDialog({ task, open, onOpenChange }: LogFollowUpDialogProps) {
  const t = useTranslations('followUp.actions');
  const locale = useLocale();
  const mut = useCreateFollowUpAction(task.public_id);
  const [actionType, setActionType] = useState<string>('');
  const [noteAr, setNoteAr] = useState('');
  const [noteEn, setNoteEn] = useState('');
  const [contact, setContact] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleSubmit() {
    const errs: Record<string, string> = {};
    if (!actionType) errs.action_type = t('action_type_required');
    if (!noteAr.trim()) errs.note_ar = t('note_ar_required');
    setErrors(errs);
    if (Object.keys(errs).length) return;
    mut.mutate(
      { action_type: Number(actionType), note_ar: noteAr, note_en: noteEn || undefined, contact_name: contact || undefined },
      { onSuccess: () => { onOpenChange(false); reset(); } },
    );
  }
  function reset() { setActionType(''); setNoteAr(''); setNoteEn(''); setContact(''); setErrors({}); }

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
      <DialogContent>
        <DialogHeader><DialogTitle>{t('log_title')}</DialogTitle></DialogHeader>
        <div className="flex flex-col gap-4">
          <Field>
            <FieldLabel>{t('action_type')} *</FieldLabel>
            <Select value={actionType} onValueChange={setActionType}>
              <SelectTrigger aria-label={t('action_type')}><SelectValue placeholder={t('action_type_placeholder')} /></SelectTrigger>
              <SelectContent position="popper">
                <SelectGroup>
                  {(['1','2','3','4','5'] as const).map((v) => (
                    <SelectItem key={v} value={v}>{t(`type_${v}`)}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            {errors.action_type && <FieldError>{errors.action_type}</FieldError>}
          </Field>
          <Field>
            <FieldLabel>{t('note_ar')} *</FieldLabel>
            <Textarea dir="rtl" value={noteAr} onChange={(e) => setNoteAr(e.target.value)} />
            {errors.note_ar && <FieldError>{errors.note_ar}</FieldError>}
          </Field>
          <Field>
            <FieldLabel>{t('note_en')}</FieldLabel>
            <Textarea dir="ltr" value={noteEn} onChange={(e) => setNoteEn(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel>{t('contact_name')}</FieldLabel>
            <Input value={contact} onChange={(e) => setContact(e.target.value)} placeholder={t('contact_name_placeholder')} />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('cancel')}</Button>
          <Button onClick={handleSubmit} disabled={mut.isPending}>{mut.isPending ? t('submitting') : t('submit')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

**Test cases:**
1. Render -> click Submit with empty fields -> `action_type` + `note_ar` errors appear; no API call.
2. Render -> fill action_type=1 + note_ar -> submit -> `POST /v1/follow-up/tasks/{id}/actions` called with `action_type: 1`.

**Rules:** `coding-standards.md` — shadcn `Field`/`InputGroup` (nova), bilingual fields (AR required `dir="rtl"`, EN optional `dir="ltr"`), `aria-describedby` via `FieldError`, generated `StoreFollowUpActionRequest`; `05-accessibility.md` — Dialog traps focus, Escape closes.

---

### 14. Escalate + Resolve Dialogs

**One-line summary:** `EscalateDialog` creates a manual escalation (`POST /v1/tracking/escalations` — `task_id`, `reason`, optional `escalated_to_position_id`); `ResolveEscalationDialog` resolves (`POST /v1/tracking/escalations/{id}/resolve` — `resolution_note`).

**Key decisions:**
- `EscalateDialog`: `reason` `Textarea` required (min 1), optional target position `Select` (deferred — MVP sends `task_id` + `reason` only, lets backend auto-resolve target). `<!-- TODO: verify position lookup endpoint for manual target; MVP omits explicit target -->`
- `ResolveEscalationDialog`: `resolution_note` `Textarea` required (min 1).
- Both use `useCreateEscalation` / `useResolveEscalation` from `use-escalations.ts`.
- Both close + reset on success; localized toasts handled in the hooks.

**Files:**
- `components/domain/follow-up/escalate-dialog.tsx`
- `components/domain/follow-up/resolve-escalation-dialog.tsx`

**Resolve snippet:**
```tsx
'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel, FieldError } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import { useResolveEscalation } from '@/lib/api/hooks/use-escalations';

interface ResolveEscalationDialogProps {
  escalationPublicId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ResolveEscalationDialog({ escalationPublicId, open, onOpenChange }: ResolveEscalationDialogProps) {
  const t = useTranslations('followUp.escalations');
  const mut = useResolveEscalation();
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  function handleSubmit() {
    if (!note.trim()) { setError(t('resolution_required')); return; }
    setError('');
    mut.mutate(
      { escalationPublicId, body: { resolution_note: note } },
      { onSuccess: () => { onOpenChange(false); setNote(''); } },
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) { setNote(''); setError(''); } }}>
      <DialogContent>
        <DialogHeader><DialogTitle>{t('resolve_title')}</DialogTitle></DialogHeader>
        <Field>
          <FieldLabel>{t('resolution_note')} *</FieldLabel>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} />
          {error && <FieldError>{error}</FieldError>}
        </Field>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('cancel')}</Button>
          <Button onClick={handleSubmit} disabled={mut.isPending}>{mut.isPending ? t('submitting') : t('resolve')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

**Test cases:**
1. Resolve dialog -> submit with empty note -> error appears; no API call.
2. Resolve dialog -> submit with note -> `POST /v1/tracking/escalations/{id}/resolve` called with `resolution_note`.

**Rules:** `coding-standards.md` — shadcn `Field`/`FieldError`, generated request types, localized toasts (in hooks); `security-policy.md` — capability gating is UX-only.

---

### 15. Skeleton

**One-line summary:** `FollowUpBoardSkeleton` renders skeleton stats (4 cards) + skeleton filters + 8 skeleton table rows / 5 skeleton mobile cards + skeleton side panels (bottleneck + recent actions + escalations).

**File:** `components/domain/follow-up/follow-up-board-skeleton.tsx`

**Test cases:**
1. Render -> `data-testid="follow-up-skeleton"` present with 4 stat skeletons + table row skeletons + panel skeletons.

**Rules:** `coding-standards.md` — all 4 states; `design-system/03-components.md` — `Skeleton` matches content shape; `05-accessibility.md` — `animate-pulse motion-reduce:animate-none`.

---

### 16. Translations

**One-line summary:** Add `followUp.*` namespace (~100 keys) to `messages/ar.json` + `messages/en.json`.

**Required keys (EN shown — AR mirrors):**
```json
{
  "followUp": {
    "title": "Follow-Up Center",
    "description": "Monitor at-risk, overdue, and recently-followed work across your scope.",
    "scope_monitoring": "Monitoring Scope",
    "scope_organization": "Organization-wide",
    "no_permission_title": "No permission",
    "no_permission_description": "You do not have permission to view the follow-up center.",
    "stats": {
      "scope": "Monitoring Scope",
      "at_risk": "At Risk",
      "at_risk_sub": "Approaching SLA",
      "overdue": "Overdue",
      "overdue_sub": "Requires attention",
      "today": "Follow-ups Today",
      "today_sub": "Manual actions logged"
    },
    "banner": {
      "overdue_message": "tasks in your scope are overdue",
      "view_all": "View All",
      "dismiss": "Dismiss"
    },
    "board": {
      "error": "Unable to load the follow-up board.",
      "empty_title": "No tasks found",
      "empty_description": "Adjust filters or reset the board.",
      "load_more": "Load more",
      "loading_more": "Loading...",
      "reset_filters": "Reset filters",
      "no_permission_title": "No permission",
      "no_permission_description": "You do not have permission to view the follow-up board.",
      "table_label": "Follow-up board",
      "row_actions": "Row actions",
      "open_details": "Open Details",
      "open_workflow": "Open Workflow",
      "log_follow_up": "Log Follow-Up",
      "escalate": "Escalate",
      "columns": {
        "sla": "SLA", "task": "Task", "stage": "Stage",
        "assignees": "Assignees", "time_in_stage": "Time In Stage", "actions": "Actions"
      }
    },
    "filters": {
      "active": "Active", "mine": "My Tasks", "overdue": "Overdue",
      "at_risk": "At Risk", "suspended": "Suspended", "all": "All",
      "reset": "Reset", "search": "Search", "search_placeholder": "Search tasks...",
      "sort_by": "Sort by",
      "sort_time_at_stage": "Time at stage", "sort_priority": "Priority",
      "sort_due_date": "Due date", "sort_created_at": "Created date",
      "sort_department": "Department", "sort_stage_type": "Stage type",
      "sort_asc": "Ascending", "sort_desc": "Descending",
      "advanced": "Advanced Filters", "department": "Department", "stage_type": "Stage type",
      "priority": "Priority", "blueprint_category": "Blueprint category",
      "date_from": "Date from", "date_to": "Date to", "date_field": "Date field"
    },
    "bottlenecks": {
      "title": "Stage Bottlenecks by Department",
      "overdue": "overdue", "at_risk": "at risk",
      "empty_title": "No bottlenecks", "empty_description": "No stage-level bottlenecks detected.",
      "error_title": "Unable to load bottlenecks",
      "view_all_stages": "View all stage bottlenecks ({count})"
    },
    "recent_actions": {
      "title": "Recent Follow-Up Actions",
      "empty_title": "No recent actions",
      "empty_description": "Log a follow-up action from a task row.",
      "view_all_actions": "View all actions ({count})",
      "load_more": "Load more"
    },
    "escalations": {
      "title": "Escalations",
      "tab_open": "Open",
      "tab_resolved": "Resolved",
      "empty_title_open": "No open escalations",
      "empty_description_open": "All escalations are resolved.",
      "empty_title_resolved": "No resolved escalations",
      "empty_description_resolved": "No escalations have been resolved yet.",
      "error_title": "Unable to load escalations",
      "resolve": "Resolve", "resolve_title": "Resolve Escalation",
      "resolution_note": "Resolution note", "resolution_required": "Resolution note is required",
      "resolved": "Escalation resolved", "resolve_error": "Failed to resolve escalation",
      "escalated_to": "Escalated to", "cancel": "Cancel", "submitting": "Submitting...",
      "load_more": "Load more",
      "view_all": "View all escalations ({count})",
      "event_auto": "Auto escalation — {task}",
      "event_auto_to": "Notified: {to}",
      "event_manual": "Manual escalation — {task}",
      "event_manual_to": "Escalated to: {to}"
    },
    "actions": {
      "log_title": "Log Follow-Up Action",
      "action_type": "Action type", "action_type_placeholder": "Select type",
      "action_type_required": "Action type is required",
      "type_1": "Phone Call", "type_2": "Message", "type_3": "Meeting",
      "type_4": "Email", "type_5": "Other",
      "note_ar": "Note (Arabic)", "note_en": "Note (English, optional)",
      "note_ar_required": "Arabic note is required",
      "contact_name": "Contact name", "contact_name_placeholder": "Optional",
      "submit": "Submit", "submitting": "Submitting...", "cancel": "Cancel",
      "logged": "Follow-up action logged", "log_error": "Failed to log action"
    },
    "escalate": {
      "title": "Escalate Task", "reason": "Reason", "reason_required": "Reason is required",
      "submit": "Escalate", "submitting": "Submitting...", "cancel": "Cancel",
      "created": "Escalation created", "create_error": "Failed to create escalation"
    }
  }
}
```

**Test cases:**
1. Arabic locale -> Arabic labels render; `document.dir === 'rtl'`.
2. English locale -> English labels render; `document.dir === 'ltr'`.

**Rules:** `coding-standards.md` — no hardcoded user-facing English strings; `06-anti-patterns.md` — no English-only/Arabic-only strings.

---

### 17. MSW Handlers

**One-line summary:** Add MSW handlers for overdue, at-risk, bottlenecks, actions (GET+POST), escalations (GET+POST), and resolve.

**File:** `__tests__/mocks/handlers.ts`

**Snippet:**
```ts
http.get('https://api.momentum.test/v1/follow-up/overdue', () =>
  HttpResponse.json({ data: [], next_cursor: null, has_more: false })),

http.get('https://api.momentum.test/v1/follow-up/at-risk', () =>
  HttpResponse.json({ data: [], next_cursor: null, has_more: false })),

http.get('https://api.momentum.test/v1/follow-up/bottlenecks', () =>
  HttpResponse.json({ data: [{ stage_type: { public_id: 'st-1', name_ar: 'مراجعة', name_en: 'Review' }, department: { public_id: 'dept-1', name_ar: 'تقنية', name_en: 'IT' }, overdue_count: '3', at_risk_count: '2', score: '8', average_time_at_stage_seconds: '86400' }] })),

http.get('https://api.momentum.test/v1/follow-up/actions', () =>
  HttpResponse.json({ data: [{ public_id: 'act-1', action_type: 'phonecall', note_ar: 'اتصال', note_en: 'Called', contact_name: null, task_display_id: 'T-2026-0001', created_by: { public_id: 'u-1', name_ar: 'أحمد', name_en: 'Ahmed' }, created_at: '2026-06-24T09:00:00Z' }], next_cursor: null, has_more: false })),

http.get('https://api.momentum.test/v1/follow-up/tasks/:task/actions', () =>
  HttpResponse.json({ data: [{ public_id: 'act-1', action_type: '1', note_ar: 'اتصال', note_en: 'Called', contact_name: null, created_by: { public_id: 'u-1', name_ar: 'أحمد', name_en: 'Ahmed' }, created_at: '2026-06-24T09:00:00Z' }], next_cursor: null, has_more: false })),

http.post('https://api.momentum.test/v1/follow-up/tasks/:task/actions', async ({ request }) => {
  const body = await request.json();
  return HttpResponse.json({ public_id: 'act-new', ...body, created_by: { public_id: 'u-1', name_ar: 'أحمد', name_en: 'Ahmed' }, created_at: new Date().toISOString() }, { status: 201 });
}),

http.get('https://api.momentum.test/v1/tracking/escalations', () =>
  HttpResponse.json({ data: [{ public_id: 'esc-1', task_id: 't-1', task_display_id: 'T-2026-0001', stage_instance_id: 'si-1', sub_stage_instance_id: null, escalation_type: 'Manual', escalated_to_user: { public_id: 'u-2', name_ar: 'نورة', name_en: 'Noura' }, escalated_by_user: null, reason: 'SLA at risk', status: 'Open', resolution_note: null, resolved_at: null, created_at: '2026-06-24T08:00:00Z' }], next_cursor: null, has_more: false })),

http.post('https://api.momentum.test/v1/tracking/escalations', async ({ request }) => {
  const body = await request.json();
  return HttpResponse.json({ public_id: 'esc-new', ...body, status: 'Open', resolution_note: null, resolved_at: null, created_at: new Date().toISOString() }, { status: 201 });
}),

http.post('https://api.momentum.test/v1/tracking/escalations/:escalation/resolve', async ({ request }) => {
  const body = await request.json();
  return HttpResponse.json({ public_id: 'esc-1', status: 'Resolved', resolution_note: body.resolution_note, resolved_at: new Date().toISOString() });
}),
```

**Rules:** `testing-policy.md` — MSW for all API calls; no real backend in tests.

---

## Data Flow

1. User opens `/follow-up` → `(dashboard)/layout.tsx` has authenticated + hydrated current user (per `001`).
2. `FollowUpPage` (Server) renders `PageHeader` + `FollowUpCenter` (Client).
3. `FollowUpCenter` reads URL search params → `readBoardFilters()` → `toBoardQuery()` (maps URL camelCase → API snake_case, defaults `status=active`).
4. `useFollowUpBoardInfinite(apiFilters)` calls `GET /v1/follow-up/board` via `apiClient` (credentials + `X-Tenant` + `X-Locale`).
5. Backend applies ABAC (`TaskVisibilityScope`) + filters in `FollowUpBoardService` → returns `{ data: BoardTaskResource[], next_cursor, has_more }`.
6. Board flattens pages (deduped by `public_id`) → renders `FollowUpBoardTable` (desktop) / `FollowUpBoardMobileList` (mobile).
7. `FollowUpStats` derives page-local counts from the flattened board rows.
8. `FollowUpAlertBanner` shows when overdue count > 0 (dismissible).
9. `BottleneckPanel` calls `GET /v1/follow-up/bottlenecks` → bounded top 5 preview with "View all" Dialog → click writes `stageTypeId`+`departmentId` to URL → board refetches.
10. `RecentActionsPanel` calls `useAllFollowUpActions({ per_page: 15 })` against `GET /v1/follow-up/actions` (cross-task) → flattens cursor pages → shows top 5 → computes `actionsTodayCount` → lifts to `FollowUpCenter` via `onTodayCount` callback.
11. `EscalationsPanel` calls `GET /v1/tracking/escalations?status=1` → lists open escalations → "Resolve" opens `ResolveEscalationDialog`.
12. Row "Log Follow-Up" → `LogFollowUpDialog` → `POST /v1/follow-up/tasks/{task}/actions` → invalidates `actionsTask` + `taskBoard.lists()` → board + recent actions refresh.
13. Row "Escalate" (gated by `task.escalate`) → `EscalateDialog` → `POST /v1/tracking/escalations` → invalidates `escalations.lists()` + `taskBoard.lists()` → panel + board refresh.
14. Board auto-refetches every 60s (`refetchInterval`) to keep SLA health current.
15. User changes filters → URL changes → query key changes → board refetches → stats/banner re-derive.

---

## Route Structure

```text
app/
  (dashboard)/
    follow-up/
      page.tsx              # /follow-up, Server Component
```

Locale is cookie-based (`NEXT_LOCALE`) — no `[locale]` route segment. The sidebar "Follow-Up" nav item and `SiteHeader` breadcrumb for `/follow-up` already exist (per `001`). No new layouts.

---

## Execution Order

1. Extend `lib/api/query-keys.ts` with `followUp` + `escalations` namespaces (incl. `actionsAll`).
2. Add `lib/api/hooks/use-follow-up.ts` (board, overdue, at-risk, bottlenecks, all-actions, per-task actions, create-action mutation).
3. Add `lib/api/hooks/use-escalations.ts` (list, create, resolve).
4. Add `components/domain/follow-up/follow-up-types.ts` + `follow-up-utils.ts` (adapters, label maps, re-exports from task-board).
5. Extract shared components: `BoardTable`, `BoardTaskCard`, `BoardFilters`, `AdvancedFiltersSheet` into `components/shared/`.
6. Add `follow-up-board-skeleton.tsx`.
7. Add `follow-up-stats.tsx` + `follow-up-alert-banner.tsx`.
8. Add `follow-up-filters.tsx` (URL-driven + shared BoardFilters wrapper).
9. Add `follow-up-board.tsx` + `follow-up-board-table.tsx` + `follow-up-board-mobile-list.tsx` + `follow-up-task-card.tsx`.
10. Add `bottleneck-panel.tsx` + `recent-actions-panel.tsx` + `escalations-panel.tsx`.
11. Add `log-follow-up-dialog.tsx` + `escalate-dialog.tsx` + `resolve-escalation-dialog.tsx`.
12. Add `follow-up-center.tsx` (orchestrator).
13. Replace `app/(dashboard)/follow-up/page.tsx`.
14. Add `followUp.*` translations to `messages/ar.json` + `messages/en.json`.
15. Add MSW handlers for all new endpoints (incl. `/v1/follow-up/actions`).
16. Add component tests (board states, panels, dialogs, escalate-dialog).
17. Run `npm run lint`, `npm run typecheck`, `npm run test`.
18. (Backend coordination) Fix Scramble schemas → `npm run generate:api` → remove `unknown` narrowing adapters if schemas now match.

---

## What to Test Manually

1. **AR happy path:** open `/follow-up` (AR RTL, `task.view.follow_up_scope`) → stats, banner, filters, board table, and 3 side panels render with Arabic labels; SLA badges show Arabic text (في الموعد/قريب من الموعد/متأخر/معلق).
2. **EN happy path:** switch to English → LTR layout, English labels, SLA badges English text.
3. **Default filter:** open `/follow-up` with no params → board request includes `status=active`.
4. **Quick filters:** click My Tasks → `scope=mine` + `assignee_id=<current user>`; click Overdue → `status=overdue`; click All → `status` cleared.
5. **Advanced filters:** open Sheet → set Department + Stage Type + Priority (multi) + Blueprint Category + Date Range → verify URL + request.
6. **Search:** type a title → after 300ms URL + results update.
7. **Sort:** change sort field + toggle direction → verify order.
8. **Reset:** click Reset → all filter params cleared.
9. **Pagination:** use Load More → existing rows remain; new rows append; 60s polling refetches without losing rows.
10. **Empty state:** choose filters with no matches → empty state + reset CTA.
11. **Error state:** simulate API 500 → `ErrorState` + retry; simulate 403 → no-permission empty state.
12. **No-permission (page):** log in without any `task.view.*` capability → no-permission empty state, no board.
13. **Log Follow-Up:** click row "Log Follow-Up" → fill action type + AR note → submit → success toast + recent actions panel updates.
14. **Escalate:** (with `task.escalate`) click row "Escalate" → fill reason → submit → escalations panel updates.
15. **Resolve escalation:** (with `task.resolve_escalations` or as target) click Resolve → fill note → submit → escalation leaves open list + success toast.
16. **Bottleneck click:** click a bottleneck → URL gets `stageTypeId`+`departmentId` → board filters to that combo.
17. **Alert banner:** with overdue > 0 → banner shows count + View All → click View All → `status=overdue` applied → dismiss button hides banner.
18. **Row navigation:** click a row / press Enter on focused row → navigates to `/tasks/[publicId]`.
19. **Responsive desktop:** ≥1024px → two-column (board + sticky side panels).
20. **Responsive tablet:** 640–1023px → side panels stack below board; filters wrap.
21. **Responsive mobile:** <640px → board renders cards; stats grid 2×2; filters collapse into Sheet; side panels stack.
22. **Keyboard:** Tab through filters, rows/cards, action menu, Load More, dialog fields; Enter on row navigates; Escape closes dialog; focus returns to trigger.
23. **Accessibility:** visible focus rings; icon-only buttons have `aria-label`; SLA badges show text + color; table has `aria-label` + `th scope="col"`; touch targets ≥44px on mobile.

---

## Post-Implementation Changes (Shared Component Extraction)

The following shared components were extracted during implementation to eliminate duplication with `003-task-board`:

| Shared Component | Location | Consumers |
|-----------------|----------|-----------|
| `BoardTable` | `components/shared/board-table.tsx` | Task board (`TaskBoardTable`), Follow-up (`FollowUpBoardTable`) |
| `BoardTaskCard` | `components/shared/board-task-card.tsx` | Task board (`TaskCard`), Follow-up (`FollowUpTaskCard`) |
| `BoardFilters` | `components/shared/board-filters.tsx` | Task board (`TaskBoardFilters`), Follow-up (`FollowUpFilters`) |
| `AdvancedFiltersSheet` | `components/shared/advanced-filters-sheet.tsx` | Both via `BoardFilters` |

**Key deduplication:**
- `follow-up-utils.ts` — re-exports `readBoardFilters`, `toBoardQuery`, `getCurrentAssignees`, `localizeName`, `formatTimeInStage`, `formatDueDate`, `getSlaSortValue` from `task-board-utils.ts`
- `follow-up-types.ts` — re-exports `BoardTaskResource`, `TaskBoardUrlFilters`, `BoardQuery`, `AssigneeDisplay` from `task-board-types.ts`
- `use-follow-up.ts` — `FollowUpBoardFilters.per_page` widened to accept `null` to match `BoardQuery`

**Task board improvements (from this session):**
- Added `display_id` to table and card
- Added advanced filters Sheet (departments, stage types, priorities, categories, date range)
- Mobile card layout aligned with follow-up's style (badges row, action buttons, `display_id`)
- RTL sort icon flip (`rtl:rotate-180`)
- Stage cell shows `-` when resolved name is empty
- Time cell shows `-` for completed/cancelled tasks
- Empty state reset uses `router.replace(pathname)` instead of full page reload

**Follow-up center fixes (from this session):**
- `actionsTodayCount` derived from recent actions panel via callback (was hardcoded to 0)
- Empty state reset uses `router.replace(pathname)` instead of `window.location.reload()`
- Skeleton no longer renders side panel containers inside main column
- `applyFilter` wrapped in `useCallback` to avoid unnecessary re-renders
- Board `filters` prop typed as `BoardQuery` instead of `Record<string, unknown>`
- Arabic filter labels aligned with task board

**Additional changes from this session (spec/plan sync):**

| Change | Why |
|--------|-----|
| **New cross-task endpoint `GET /v1/follow-up/actions`** | Backend shipped a dedicated recent-actions endpoint before MVP shipped. Replaced planned client-side aggregation from first 3 board tasks. |
| **New hook `useAllFollowUpActions(filters)`** in `use-follow-up.ts` | Cursor-paginated `useInfiniteQuery` against the cross-task endpoint. |
| **New query key `queryKeys.followUp.actionsAll(filters)`** in `query-keys.ts` | Supports the cross-task actions list. |
| **`useCreateFollowUpAction` also invalidates `queryKeys.followUp.actionsAll({})`** | Ensures recent-actions panel refreshes after logging a new action. |
| **BottleneckPanel: `MAX_VISIBLE=3` with "View all" Dialog** (was top 10 hardcoded) | Prevents sidebar overflow; dialog provides full view. |
| **BottleneckPanel: Option A layout** with side-by-side counts + red/amber left border | Semantic color coding: `bg-red-500` when `overdue>0`, `bg-amber-500` otherwise. |
| **BottleneckPanel: All states wrapped inside Card** | Preserves panel layout skeleton consistently. |
| **RecentActionsPanel: `ActionEntry` sub-component** with three-line layout (note+display_id / author+contact / date+time+HH:MM) | Richer metadata display matching requirements. |
| **RecentActionsPanel: "View all" Dialog** with `ScrollArea` + `Load More` button | Cursor-paginated browsing of all actions. |
| **EscalationsPanel: Timeline feed layout** with circular icons + connecting line | Visual hierarchy: `AlertTriangle` in red circle for auto, `User` in amber circle for manual. |
| **EscalationsPanel: Open/Resolved tab toggle** | Default Open (status=1), tab switch refetches with status=2. |
| **EscalationsPanel: Event sentences + reason in quotes** | `t('event_auto', { task })` / `t('event_manual', { task })` with italicized `"reason"`. |
| **EscalationsPanel: "View all" Dialog** with `ScrollArea` + `Load More` | Paginated browsing of escalation list. |
| **EscalationsPanel: Separate empty states** for Open vs Resolved tabs | Translation keys `empty_title_open`/`empty_title_resolved`. |
| **New translate keys**: `board.columns.*`, `bottlenecks.view_all_stages`, `recent_actions.view_all_actions`/`load_more`, `escalations.tab_*`/`event_*`/`view_all`/`load_more` | Supporting expanded panel UI. |
| **Test: `escalate-dialog.test.tsx`** | Tests validation + submit for the Escalate dialog. |
| **MSW: `GET /v1/follow-up/actions` handler** | Supports cross-task actions endpoint mocking. |