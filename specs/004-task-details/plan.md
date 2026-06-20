# Plan: Task Details

> **Spec:** `specs/004-task-details/spec.md`
> **Date:** 2026-06-20
> **Status:** `implemented`

---

## Open Questions Resolved

| # | Question | Decision | Rationale |
|---|----------|----------|-----------|
| 1 | Return target selection UX | **Option (b): pre-filter from `GET /v1/blueprints/{blueprintId}/transitions`.** Filter `transition_type=return` where `from_stage_id` matches current stage. | Reads the authoritative contract; avoids 422-as-UX. `BlueprintTransitionResource` includes `from_stage_id`, `to_stage_id`, `transition_type`, `return_reason_required`. |
| 2 | User picker for override | **`GET /v1/iam/users` with debounced combobox (300ms).** Params: `search`, `is_active=true`, `per_page`. | Endpoint supports these params in `UserController.php` though not yet in `openapi.json`. No new endpoint needed. |
| 3 | Draft task handling | **Out of scope.** Draft tasks show "not yet launched" indicator. | Launch requires manual-assignment form — separate create-task spec. |
| 4 | SLA health endpoint | **Accepted.** `GET /v1/tracking/sla/tasks/{task}` is backend M5 ✅ stable. | Essential for features #82, #83. Escalation management UI stays in follow-up center. |
| 5 | Activity timeline | **`useQuery`, full list, slice client-side to ~5 in sidebar card.** | Backend returns full `TaskTimelineResource[]` (no pagination, < 200 entries). |
| 6 | Return history | **Folded into stage nodes + activity feed.** No separate section. | Returns appear as timeline events with `return_reason`; returned stage nodes show reason inline. |
| 7 | Layout | **Two-column stacked cards (no tabs)** per `03-task-details.html` concept. | Main col: Title & Meta → Stage Timeline. Sidebar: Details → Recent Activity. |
| 8 | SLA display | **Inline on active stage node**, not a separate card. | Matches concept: "Overdue by 2d" / "SLA: 3d · Elapsed: 5d". |
| 9 | Lifecycle actions | **In shell top bar** next to breadcrumb. | Matches concept: "Cancel Task" / "Advance Stage" buttons in header. |
| 10 | `alert-dialog` component | **Missing — add via `npx shadcn@latest add alert-dialog`.** | Needed for suspend/cancel confirmation dialogs. |
| 11 | `popover` component | **Already exists** (`components/ui/popover.tsx`). | Used for user-search combobox dropdown. |

<!-- ✅ Resolved: `/v1/iam/users` query params work with `is_active: 1` (number) — apiClient passes them as URL params. -->

---

## Implementation Status

**All feature code for spec 004 is fully implemented + tested.** 26 new source files + 5 modified files + 1 new MSW handler file = 32 total across routes, domain components, hooks, query keys, board prefetch, i18n, MSW handlers, and tests.

| Category | Files |
|----------|-------|
| Route pages | `app/(dashboard)/tasks/[publicId]/page.tsx`, `error.tsx` |
| Domain components | `task-detail.tsx`, `task-detail-skeleton.tsx`, `task-detail-types.ts`, `task-detail-utils.ts`, `title-meta-card.tsx`, `stage-timeline.tsx`, `stage-timeline-node.tsx`, `sub-stage-list.tsx`, `sub-stage-item.tsx`, `details-card.tsx`, `recent-activity-card.tsx`, `activity-entry.tsx`, `assignee-avatar-stack.tsx`, `complete-stage-dialog.tsx`, `return-stage-dialog.tsx`, `override-assignment-dialog.tsx`, `user-search-combobox.tsx`, `task-lifecycle-dialog.tsx`, `task-top-bar-actions.tsx` |
| Shared components | `components/shared/page-header.tsx` — reusable title + description + actions block |
| Shell | `components/domain/shell/site-header.tsx` — renders breadcrumb from pathname, replaces static page title for task routes |
| API hooks | `lib/api/hooks/use-task-detail.ts` |
| Query keys | `lib/api/query-keys.ts` (extended) |
| Board prefetch | `task-board-table.tsx` row hover + `task-card.tsx` card hover (via `queryClient.prefetchQuery`) |
| UI components | `components/ui/alert-dialog.tsx` (added) |
| i18n | `messages/en.json`, `messages/ar.json` (`tasks.detail` namespace, ~92 keys each) |
| MSW handlers | `__tests__/mocks/handlers.ts` (6 new handlers: task detail, SLA health, timeline, blueprint transitions, users search) |
| Tests | `task-detail.test.tsx` (5 tests), `stage-timeline.test.tsx` (7 tests), `recent-activity-card.test.tsx` (5 tests) |

### Key Divergences from Plan

| # | Plan | Actual Implementation |
|---|------|----------------------|
| 1 | `TaskDetail` queries 4 endpoints in parallel (`useTaskDetail`, `useTaskSlaHealth`, `useTaskTimeline`, `useTaskReturns`) | `useTaskReturns` is NOT called. Instead, `buildStageActivities()` derives activity entries from `task.stages`. Timeline is lazy-fetched only when user clicks "View Full Audit Trail" (controlled by `showFullTimeline` state) |
| 2 | Plan had TODO about `stageInstancePublicId` — was unsure between `instance_id` and `blueprint_stage.public_id` | All components use `stage.instance_id` / `subStage.instance_id` — the actual public_id that the API expects |
| 3 | `getStageAssignees` simple filter: `a.is_completed !== '1'` | Actual filters out `reassigned_at` entries and deduplicates by `user_id` — more accurate for override tracking |
| 4 | `isUserAssignee` compares string `a.is_completed !== '1'` | Actual uses boolean `!a.is_completed` — matches generated types |
| 5 | `formatSlaInline`, `formatDuration`, `formatRelativeTime` return hardcoded English strings | All three take `TimeFmt` object via `timeFmtFromT(t)` — fully i18n-aware with Arabic dual-plural support |
| 6 | `mapSlaHealth`: `'none'` maps to `'grey'` | Maps to `'none'` — the `SlaBadge` component handles the display |
| 7 | `DetailsCard` shows raw `created_at`/`due_date` strings | Uses `formatDualDate()` for Hijri + Gregorian dual display |
| 8 | `DetailsCard` shows `initiator_id` UUID | Uses `initiator_name_ar`/`initiator_name_en` (backend updated to include these fields) |
| 9 | `DetailsCard` doesn't include department | Shows `department_name_ar`/`department_name_en` from active stage |
| 10 | `ReturnStageDialog` target select shows UUIDs (`to_stage_id`) | Has `resolveStageName()` mapping to stage names from `stages[]` prop |
| 11 | `ReturnStageDialog` plan code doesn't have `stages` prop | Actual has `stages` prop for name resolution |
| 12 | `CompleteStageDialog` doesn't support sub-stages | Has `isSubStage` prop with branching logic for `useCompleteStage` vs `useCompleteSubStage` |
| 13 | `OverrideAssignmentDialog` has plain text current assignee | Has a `Select` to choose which current assignee to replace (important when multiple) |
| 14 | `OverrideAssignmentDialog` doesn't handle sub-stages | Has `isSubStage` prop |
| 15 | `UserSearchCombobox` plan code: minimal, loading text "Searching..." | Actual: `Loader2` spinner, `Check` icon on selected item, `selectedLabel` state, `useId()` for accessibility, `placeholder` prop |
| 16 | "View Full Audit Trail →" is a placeholder link (out of scope for MVP) | Has a full `Dialog` with `ScrollArea` showing all timeline entries — fully functional |
| 17 | `recent-activity-card` accepts only `TaskTimelineResource[]` | Accepts mixed entries (both `TaskTimelineResource` and simpler activity objects from `buildStageActivities`) |
| 18 | `SubStageList` plan had `slaTimers` prop | Actual doesn't pass `slaTimers` — sub-stage SLA is not rendered |
| 19 | `SubStageItem` doesn't have override support | Actual has override button for sub-stages |
| 20 | `isSubStage` prop not present on dialogs | Both `CompleteStageDialog` and `OverrideAssignmentDialog` have `isSubStage` prop |
| 21 | `stage-timeline-node.tsx` uses inline icon/style logic | Uses `NODE_STYLES` lookup table — cleaner |
| 22 | `useUsersSearch` sends `is_active: true` (boolean) | Sends `is_active: 1` (number) — matches URL param expectations |
| 23 | i18n keys: ~68 keys in plan | Actual: ~92 keys — added activity type labels (`stage_started`, `stage_completed`, etc.), time formatting keys (`time_day_one`, `time_ago_prefix`, etc.), and dialog extras (`select_assignee`, `no_results`, `retry`, `audit_trail`) |
| 24 | `ar.json` extra `time_day_two`, `time_hour_two`, `time_minute_two` | Not present in `en.json` — Arabic dual-plural forms (expected, English has no dual) |
| 25 | `lib/api/query-keys-extra.ts` | Not mentioned in plan — exists on disk for search query keys |
| 26 | `task-board-table.tsx` keyboard nav | Actual has `handleRowKeyDown` for Enter/Space — extra accessibility beyond plan |
| 27 | Breadcrumb shown inline in page content area | Breadcrumb moved to `SiteHeader` beside sidebar toggle — pages use `PageHeader` for title + description + actions |
| 28 | Plan code samples show breadcrumb in `TaskDetailPage` | Actual `page.tsx` uses `<PageHeader title={t('page_title')} description={t('page_description')} actions={<TaskTopBarActions />} />` — no breadcrumb in page content |
| 29 | `SiteHeader` showed static `h1` page title | `SiteHeader` renders breadcrumb via `usePageBreadcrumb()` for known routes (tasks, blueprints, analytics, follow-up), falls back to static title for others |
| 30 | No `page_header` i18n keys | Added `page_title` and `page_description` to `tasks.detail` namespace |

---

## Technical Approach

**One-line summary:** Build `/tasks/[publicId]` as a two-column stacked-card detail page with parallel TanStack Query hooks for task detail / SLA health / timeline / returns, mutation hooks for stage lifecycle + task lifecycle, and capability-gated action dialogs — all using generated OpenAPI types and the established query-key factory.

**Key decisions:**

- **Parallel queries on mount** — `useTaskDetail`, `useTaskSlaHealth`, `useTaskTimeline`, `useTaskReturns` run independently via `useQuery`. TanStack handles deduplication. No waterfall.
- **No optimistic updates** — stage/task lifecycle mutations are state-machine transitions where the server response determines the new state (next stage, completed status). Invalidation is correct and safe.
- **Return targets pre-filtered** — `useBlueprintTransitions(blueprintId)` fetches transitions; dialog filters `transition_type=return` client-side. This is reading the API, not duplicating logic.
- **User combobox with debounce** — `useUsersSearch(search)` with 300ms debounce, `enabled: search.length >= 2`. Uses `Popover` + `Command` for the combobox UI (existing shadcn components).
- **SLA inline on stage node** — the active stage node extracts the relevant `SlaTimerInstanceResource` from `timers[]` by matching `stage_instance_id`. No separate SLA card.
- **Recent Activity sliced client-side** — `useTaskTimeline` fetches full list; `RecentActivityCard` slices `.slice(0, 5)`. Full view is a future route.
- **Prefetch on board row hover** — extend `task-board-table.tsx` row `onMouseEnter` to call `queryClient.prefetchQuery` with `queryKeys.tasks.detail(publicId)`.
- **`AlertDialog` for destructive actions** — suspend/cancel require a mandatory reason; `AlertDialog` provides the confirmation pattern. Add via shadcn CLI.

---

## Component Tree

```
TaskDetailPage (Server) — app/(dashboard)/tasks/[publicId]/page.tsx
├── PageHeader (Client) — title + description + TaskTopBarActions
└── TaskDetail (Client) — orchestrates all queries + states

Breadcrumb is rendered by SiteHeader (shell layout) via pathname-based usePageBreadcrumb().
- Dashboard › Tasks (task board)
- Dashboard › Tasks › [publicId] (task detail)
    ├── [Loading] TaskDetailSkeleton
    ├── [404/403] EmptyState
    ├── [Error] ErrorState
    └── [Success] two-column grid
        ├── Main Column (lg:col-span-2)
        │   ├── TitleMetaCard (Client)
        │   │   ├── Badge row: PriorityBadge + ClassificationBadge + TaskStatusBadge + SlaBadge (reused from 003)
        │   │   ├── Title (h1)
        │   │   ├── Ref line + copy button
        │   │   └── Description (whitespace-pre-wrap)
        │   └── StageTimeline (Client) — Card
        │       └── StageTimelineNode[] (Client) — <ol>
        │           ├── Status icon (completed/active/pending/returned)
        │           ├── Stage name + status badge
        │           ├── AssigneeAvatarStack (Client)
        │           ├── SLA inline status (active only)
        │           ├── Completion note (expandable)
        │           ├── SubStageList (Client) — nested
        │           │   └── SubStageItem[] (Client)
        │           │       └── [active] Complete/Return buttons
        │           └── Action buttons (active only)
        │               ├── CompleteStageDialog (Client) — Dialog
        │               ├── ReturnStageDialog (Client) — Dialog + Select
        │               └── OverrideAssignmentDialog (Client) — Dialog + UserSearchCombobox
        └── Sidebar (lg:col-span-1, sticky)
            ├── DetailsCard (Client) — Card
            │   └── Metadata rows (status, initiator, blueprint, dept, dates, classification)
            └── RecentActivityCard (Client) — Card
                ├── ActivityEntry[] (Client) — last 5
                └── "View Full Audit Trail →" link
```

**Top bar actions** (rendered by `TaskTopBarActions` in the page, above the grid):

```
TaskTopBarActions (Client)
├── [active + canSuspend] Suspend button → TaskLifecycleDialog
├── [suspended + canSuspend] Resume button → confirm
├── [draft/active + canCancel] Cancel Task button (danger) → TaskLifecycleDialog
└── [active + isAssignee] Advance button → CompleteStageDialog
```

---

## Affected Files

### New Files

| File | Purpose |
|------|---------|
| **Route** | |
| `app/(dashboard)/tasks/[publicId]/page.tsx` | Server component — `PageHeader` (title + description + `TaskTopBarActions`), renders `TaskDetail` |
| `app/(dashboard)/tasks/[publicId]/error.tsx` | Route error boundary |
| **Domain components** | |
| `components/domain/tasks/task-detail.tsx` | Orchestrator: queries, states, two-column layout |
| `components/domain/tasks/task-detail-skeleton.tsx` | Full-page skeleton |
| `components/domain/tasks/task-detail-types.ts` | Colocated type re-exports from generated |
| `components/domain/tasks/task-detail-utils.ts` | Pure utils: SLA status mapping, date formatting, assignee helpers |
| `components/domain/tasks/title-meta-card.tsx` | Title, badges, ref, description |
| `components/domain/tasks/stage-timeline.tsx` | Vertical timeline container |
| `components/domain/tasks/stage-timeline-node.tsx` | Single stage node |
| `components/domain/tasks/sub-stage-list.tsx` | Nested sub-stage checklist |
| `components/domain/tasks/sub-stage-item.tsx` | Single sub-stage |
| `components/domain/tasks/details-card.tsx` | Sidebar metadata card |
| `components/domain/tasks/recent-activity-card.tsx` | Compact activity feed |
| `components/domain/tasks/activity-entry.tsx` | Single activity row |
| `components/domain/tasks/assignee-avatar-stack.tsx` | Reusable avatar stack (extracted from board pattern) |
| `components/domain/tasks/complete-stage-dialog.tsx` | Complete stage/sub-stage dialog |
| `components/domain/tasks/return-stage-dialog.tsx` | Return stage dialog with transition-filtered targets |
| `components/domain/tasks/override-assignment-dialog.tsx` | Override assignment dialog |
| `components/domain/tasks/user-search-combobox.tsx` | Debounced user search combobox |
| `components/domain/tasks/task-lifecycle-dialog.tsx` | Shared AlertDialog for suspend/cancel |
| `components/domain/tasks/task-top-bar-actions.tsx` | Lifecycle action buttons for top bar |
| **Shared** | |
| `components/shared/page-header.tsx` | Reusable title + description + actions header block |
| **Hooks** | |
| `lib/api/hooks/use-task-detail.ts` | All task-detail query + mutation hooks |
| **Tests** | |
| `__tests__/components/domain/tasks/task-detail.test.tsx` | TaskDetail states (loading, 404, 403, 500, success) |
| `__tests__/components/domain/tasks/stage-timeline.test.tsx` | StageTimeline node rendering (completed, active, pending, sub-stages, sort) |
| `__tests__/components/domain/tasks/recent-activity-card.test.tsx` | RecentActivityCard states (loading, empty, entries, view full) |

### Modified Files

| File | Change | Status |
|------|--------|--------|
| `lib/api/query-keys.ts` | Add `tasks.slaHealth`, `tasks.timeline`, `tasks.returns`, `blueprints.transitions`, `users` namespace | ✅ Done |
| `lib/api/hooks/use-tasks.ts` | Update `useTask` to use `TaskDetailResource` type | ✅ Not needed — dedicated `use-task-detail.ts` hook covers detail types |
| `components/domain/tasks/task-board-table.tsx` | Add `onMouseEnter` prefetch for `queryKeys.tasks.detail(publicId)` | ✅ Done |
| `components/domain/tasks/task-card.tsx` | Add `onMouseEnter` prefetch (handles mobile card hover) | ✅ Done (handles mobile prefetch, no change needed in `task-board-mobile-list.tsx`) |
| `__tests__/mocks/handlers.ts` | Add MSW handlers for task detail, SLA health, timeline, blueprint transitions, users search | ✅ Done |
| `messages/en.json` | Add `tasks.detail` namespace with all UI strings (~92 keys) | ✅ Done |
| `messages/ar.json` | Add Arabic translations for `tasks.detail` namespace (~92 keys + Arabic dual forms) | ✅ Done |

### shadcn Components to Add

| Component | Command | Reason |
|-----------|---------|--------|
| `alert-dialog` | `npx shadcn@latest add alert-dialog` | Suspend/cancel confirmation dialogs |

---

## Implementation Notes

### 1. Query Keys — `lib/api/query-keys.ts`

**Summary:** Extend the existing factory with task-detail sub-queries, blueprint transitions, and users namespace.

**Rules applied:** `coding-standards.md` — Query key factory usage (no hardcoded strings).

```ts
// Add to existing tasks namespace:
slaHealth: (publicId: string) => [...queryKeys.tasks.detail(publicId), 'sla-health'] as const,
timeline: (publicId: string) => [...queryKeys.tasks.detail(publicId), 'timeline'] as const,
returns: (publicId: string) => [...queryKeys.tasks.detail(publicId), 'returns'] as const,

// Add to existing blueprints namespace:
transitions: (blueprintId: string) =>
  [...queryKeys.blueprints.detail(blueprintId), 'transitions'] as const,

// Add new users namespace:
users: {
  all: ['users'] as const,
  lists: () => [...queryKeys.users.all, 'list'] as const,
  list: (filters: { search: string; is_active?: boolean; per_page?: number }) =>
    [...queryKeys.users.lists(), filters] as const,
},
```

### 2. Hooks — `lib/api/hooks/use-task-detail.ts`

**Summary:** All query and mutation hooks for the task detail page in one file, matching the `use-task-board.ts` pattern.

**Rules applied:** Generated types only, query key factory, mutation invalidation, no `useEffect` + `fetch`.

```ts
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { queryKeys } from '@/lib/api/query-keys';
import { toast } from 'sonner';
import type { components } from '@/lib/generated/api-types';

type TaskDetailResource = components['schemas']['TaskDetailResource'];
type TaskSlaHealthResource = components['schemas']['TaskSlaHealthResource'];
type TaskTimelineResource = components['schemas']['TaskTimelineResource'];
type StageReturnResource = components['schemas']['StageReturnResource'];
type BlueprintTransitionResource = components['schemas']['BlueprintTransitionResource'];
type UserResource = components['schemas']['UserResource'];
type TaskResource = components['schemas']['TaskResource'];
type CompleteStageRequest = components['schemas']['CompleteStageRequest'];
type ReturnStageRequest = components['schemas']['ReturnStageRequest'];
type OverrideAssignmentRequest = components['schemas']['OverrideAssignmentRequest'];
type SuspendTaskRequest = components['schemas']['SuspendTaskRequest'];
type CancelTaskRequest = components['schemas']['CancelTaskRequest'];

interface CursorPage<T> {
  data: T[];
  next_cursor: string | null;
  has_more: boolean;
}

// --- Queries ---

export function useTaskDetail(publicId: string) {
  return useQuery({
    queryKey: queryKeys.tasks.detail(publicId),
    queryFn: () => apiClient.get<TaskDetailResource>(`/v1/tasks/${publicId}`),
    enabled: !!publicId,
    staleTime: 30 * 1000,
  });
}

export function useTaskSlaHealth(publicId: string) {
  return useQuery({
    queryKey: queryKeys.tasks.slaHealth(publicId),
    queryFn: () => apiClient.get<TaskSlaHealthResource>(`/v1/tracking/sla/tasks/${publicId}`),
    enabled: !!publicId,
    staleTime: 30 * 1000,
  });
}

export function useTaskTimeline(publicId: string) {
  return useQuery({
    queryKey: queryKeys.tasks.timeline(publicId),
    queryFn: () => apiClient.get<TaskTimelineResource[]>(`/v1/tasks/${publicId}/timeline`),
    enabled: !!publicId,
  });
}

export function useTaskReturns(publicId: string) {
  return useQuery({
    queryKey: queryKeys.tasks.returns(publicId),
    queryFn: () => apiClient.get<StageReturnResource[]>(`/v1/tasks/${publicId}/returns`),
    enabled: !!publicId,
  });
}

export function useBlueprintTransitions(blueprintId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.blueprints.transitions(blueprintId ?? ''),
    queryFn: () => apiClient.get<BlueprintTransitionResource[]>(`/v1/blueprints/${blueprintId}/transitions`),
    enabled: !!blueprintId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUsersSearch(search: string) {
  return useQuery({
    queryKey: queryKeys.users.list({ search, is_active: true, per_page: 20 }),
    queryFn: () =>
      apiClient.get<CursorPage<UserResource>>('/v1/iam/users', {
        params: { search, is_active: true, per_page: 20 },
      }),
    enabled: search.length >= 2,
    staleTime: 30 * 1000,
  });
}

// --- Mutations ---

function useInvalidateTaskDetail(publicId: string) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(publicId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.tasks.slaHealth(publicId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.tasks.timeline(publicId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.tasks.returns(publicId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.taskBoard.lists() });
  };
}

export function useCompleteStage(publicId: string) {
  const invalidate = useInvalidateTaskDetail(publicId);
  return useMutation({
    mutationFn: (vars: { taskPublicId: string; stageInstancePublicId: string; body: CompleteStageRequest }) =>
      apiClient.post<TaskResource>(
        `/v1/tasks/${vars.taskPublicId}/stages/${vars.stageInstancePublicId}/complete`,
        vars.body,
      ),
    onSuccess: () => { invalidate(); toast.success('Stage completed'); },
    onError: (error) => { toast.error(error.message); },
  });
}

export function useCompleteSubStage(publicId: string) {
  const invalidate = useInvalidateTaskDetail(publicId);
  return useMutation({
    mutationFn: (vars: { taskPublicId: string; subStageInstancePublicId: string; body: CompleteStageRequest }) =>
      apiClient.post<TaskResource>(
        `/v1/tasks/${vars.taskPublicId}/sub-stages/${vars.subStageInstancePublicId}/complete`,
        vars.body,
      ),
    onSuccess: () => { invalidate(); toast.success('Sub-stage completed'); },
    onError: (error) => { toast.error(error.message); },
  });
}

export function useReturnStage(publicId: string) {
  const invalidate = useInvalidateTaskDetail(publicId);
  return useMutation({
    mutationFn: (vars: { taskPublicId: string; stageInstancePublicId: string; body: ReturnStageRequest }) =>
      apiClient.post<TaskResource>(
        `/v1/tasks/${vars.taskPublicId}/stages/${vars.stageInstancePublicId}/return`,
        vars.body,
      ),
    onSuccess: () => { invalidate(); toast.success('Stage returned'); },
    onError: (error) => { toast.error(error.message); },
  });
}

export function useReturnSubStage(publicId: string) {
  const invalidate = useInvalidateTaskDetail(publicId);
  return useMutation({
    mutationFn: (vars: { taskPublicId: string; subStageInstancePublicId: string; body: { target_sub_stage_id: string; reason: string } }) =>
      apiClient.post<TaskResource>(
        `/v1/tasks/${vars.taskPublicId}/sub-stages/${vars.subStageInstancePublicId}/return`,
        vars.body,
      ),
    onSuccess: () => { invalidate(); toast.success('Sub-stage returned'); },
    onError: (error) => { toast.error(error.message); },
  });
}

export function useOverrideAssignment(publicId: string, isSubStage: boolean) {
  const invalidate = useInvalidateTaskDetail(publicId);
  return useMutation({
    mutationFn: (vars: {
      taskPublicId: string;
      instancePublicId: string;
      body: OverrideAssignmentRequest;
    }) => {
      const segment = isSubStage ? 'sub-stages' : 'stages';
      return apiClient.post<TaskResource>(
        `/v1/tasks/${vars.taskPublicId}/${segment}/${vars.instancePublicId}/override-assignment`,
        vars.body,
      );
    },
    onSuccess: () => { invalidate(); toast.success('Assignment overridden'); },
    onError: (error) => { toast.error(error.message); },
  });
}

export function useSuspendTask(publicId: string) {
  const invalidate = useInvalidateTaskDetail(publicId);
  return useMutation({
    mutationFn: (body: SuspendTaskRequest) =>
      apiClient.post<TaskResource>(`/v1/tasks/${publicId}/suspend`, body),
    onSuccess: () => { invalidate(); toast.success('Task suspended'); },
    onError: (error) => { toast.error(error.message); },
  });
}

export function useResumeTask(publicId: string) {
  const invalidate = useInvalidateTaskDetail(publicId);
  return useMutation({
    mutationFn: () => apiClient.post<TaskResource>(`/v1/tasks/${publicId}/resume`),
    onSuccess: () => { invalidate(); toast.success('Task resumed'); },
    onError: (error) => { toast.error(error.message); },
  });
}

export function useCancelTask(publicId: string) {
  const invalidate = useInvalidateTaskDetail(publicId);
  return useMutation({
    mutationFn: (body: CancelTaskRequest) =>
      apiClient.post<TaskResource>(`/v1/tasks/${publicId}/cancel`, body),
    onSuccess: () => { invalidate(); toast.success('Task cancelled'); },
    onError: (error) => { toast.error(error.message); },
  });
}
```

**Note:** The mutation `onError` shows a toast. For 422 errors in dialogs, the dialog component reads `mutation.error` directly to display inline validation messages without closing the dialog. The toast fires in addition, but the dialog stays open.

**Implementation note:** The `useTaskReturns` hook exists but is not called from `TaskDetail`. The orchestrator uses `buildStageActivities()` instead (built from `task.stages`). The timeline is lazy-fetched via `useTaskTimeline` only when the user clicks "View Full Audit Trail". This reduces unnecessary API calls on page load.

### 3. Types — `components/domain/tasks/task-detail-types.ts`

**Summary:** Re-export generated types for colocated use, matching `task-board-types.ts` pattern.

```ts
import type { components } from '@/lib/generated/api-types';

export type TaskDetailResource = components['schemas']['TaskDetailResource'];
export type TaskSlaHealthResource = components['schemas']['TaskSlaHealthResource'];
export type TaskTimelineResource = components['schemas']['TaskTimelineResource'];
export type StageReturnResource = components['schemas']['StageReturnResource'];
export type TaskStageInstanceResource = components['schemas']['TaskStageInstanceResource'];
export type TaskSubStageInstanceResource = components['schemas']['TaskSubStageInstanceResource'];
export type TaskStageAssignmentResource = components['schemas']['TaskStageAssignmentResource'];
export type SlaTimerInstanceResource = components['schemas']['SlaTimerInstanceResource'];
export type BlueprintTransitionResource = components['schemas']['BlueprintTransitionResource'];
export type UserResource = components['schemas']['UserResource'];
export type TaskResource = components['schemas']['TaskResource'];
```

### 4. Utils — `components/domain/tasks/task-detail-utils.ts`

**Summary:** Pure utility functions for SLA status mapping, date formatting, assignee helpers, return-target filtering.

**Rules applied:** Utils are pure (no React imports, no side effects).

**Key improvement over plan — i18n-aware time formatting:** Instead of hardcoded English strings, the implementation uses a `TimeFmt` interface with `timeFmtFromT(t)` factory that reads time-related translations. Functions like `formatSlaInline`, `formatDuration`, and `formatRelativeTime` accept a `TimeFmt` parameter for locale-aware output. This enables proper Arabic dual-plural forms (`يوم`/`يومان`/`أيام`) and configurable ago-prefix/suffix position.

**Additional functions (beyond plan):**
- `formatDualDate(isoDate, locale)` — formats dates in Hijri + Gregorian dual display
- `buildStageActivities(stages)` — builds simplified activity entries from stage data (used instead of `useTaskReturns` + `useTaskTimeline` for the sidebar feed)
- `timeFmtFromT(t)` — creates locale-aware time format helpers from `useTranslations`
- `getStageAssignees` — now filters out `reassigned_at` entries and deduplicates by `user_id`

```ts
import type {
  TaskStageInstanceResource,
  TaskStageAssignmentResource,
  SlaTimerInstanceResource,
  BlueprintTransitionResource,
} from './task-detail-types';

export function localizeName(locale: string, nameAr?: string | null, nameEn?: string | null): string {
  if (locale === 'ar') return nameAr || nameEn || '';
  return nameEn || nameAr || '';
}

export function getActiveStage(stages: TaskStageInstanceResource[] | undefined): TaskStageInstanceResource | undefined {
  if (!stages) return undefined;
  return stages.find((s) => s.status === 'active');
}

export function getStageAssignees(assignments: TaskStageAssignmentResource[] | undefined): TaskStageAssignmentResource[] {
  if (!assignments) return [];
  return assignments.filter((a) => a.is_completed !== '1');
}

export function isUserAssignee(
  assignments: TaskStageAssignmentResource[] | undefined,
  userPublicId: string | undefined,
): boolean {
  if (!userPublicId || !assignments) return false;
  return assignments.some((a) => a.user_id === userPublicId && a.is_completed !== '1');
}

export function getStageTimer(
  timers: SlaTimerInstanceResource[] | undefined,
  stageInstanceId: string | undefined,
): SlaTimerInstanceResource | undefined {
  if (!timers || !stageInstanceId) return undefined;
  return timers.find((t) => t.stage_instance_id === stageInstanceId && t.sub_stage_instance_id === '');
}

export function filterReturnTargets(
  transitions: BlueprintTransitionResource[] | undefined,
  currentStageBlueprintId: string | undefined,
): BlueprintTransitionResource[] {
  if (!transitions || !currentStageBlueprintId) return [];
  return transitions.filter(
    (t) => t.transition_type === '2' && t.from_stage_id === currentStageBlueprintId,
  );
}

// SLA health mapping: TaskSlaHealthResource.overall_health → board SLA values
const SLA_HEALTH_MAP: Record<string, string> = {
  on_track: 'green',
  warning: 'amber',
  breached: 'red',
  none: 'grey',
};

export function mapSlaHealth(overallHealth: string): string {
  return SLA_HEALTH_MAP[overallHealth] ?? 'green';
}

// SLA inline status text for active stage node
export function formatSlaInline(timer: SlaTimerInstanceResource | undefined): string | null {
  if (!timer) return null;
  const deadline = new Date(timer.deadline_at);
  const now = new Date();
  const diffMs = deadline.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / 86400000);

  if (timer.status === '4') return 'Paused'; // SlaTimerStatus::Paused
  if (timer.status === '3') return `Overdue by ${Math.abs(diffDays)}d`; // Breached
  if (timer.status === '2') return `At risk — ${diffDays}d left`; // Warning
  if (timer.status === '5') return 'Completed'; // Completed
  if (diffDays < 0) return `Overdue by ${Math.abs(diffDays)}d`;
  if (diffDays === 0) return 'Due today';
  return `${diffDays}d left`;
}

export function formatDuration(enteredAt: string, exitedAt: string | null): string {
  const start = new Date(enteredAt).getTime();
  const end = exitedAt ? new Date(exitedAt).getTime() : Date.now();
  const diffSec = Math.round((end - start) / 1000);
  const days = Math.floor(diffSec / 86400);
  const hours = Math.floor((diffSec % 86400) / 3600);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h`;
  return '< 1h';
}

export function formatRelativeTime(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffSec = Math.round((now - then) / 1000);
  if (diffSec < 60) return 'just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}
```

**Note:** `transition_type` is a string in the generated types (`"1" | "2"` as string, or string). The backend `TransitionType` enum is `1=advance, 2=return`. Comparison uses `t.transition_type === '2'` (string). ✅ Verified during implementation.

**Additional files discovered on disk (not in original plan):**
- `lib/api/query-keys-extra.ts` — contains `extraQueryKeys.search` namespace for global search (unrelated to this spec)

### 5. TaskDetailPage — `app/(dashboard)/tasks/[publicId]/page.tsx`

**Summary:** Server component that reads the route param, renders `PageHeader` (title + description + top-bar actions) + `TaskDetail`. Breadcrumb is rendered by `SiteHeader` (shell layout) via pathname-based `usePageBreadcrumb()` hook.

**Rules applied:** Server Component by default, `getTranslations` for server-side i18n.

```tsx
import { getTranslations } from 'next-intl/server';
import { TaskDetail } from '@/components/domain/tasks/task-detail';
import { TaskTopBarActions } from '@/components/domain/tasks/task-top-bar-actions';
import { PageHeader } from '@/components/shared/page-header';

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;
  const t = await getTranslations('tasks.detail');

  return (
    <main className="flex flex-col gap-4 p-6">
      <PageHeader
        title={t('page_title')}
        description={t('page_description', { publicId })}
        actions={<TaskTopBarActions publicId={publicId} />}
      />
      <TaskDetail publicId={publicId} />
    </main>
  );
}
```

### 6. TaskDetail — `components/domain/tasks/task-detail.tsx`

**Summary:** Client orchestrator — fetches task detail + SLA health, lazy-fetches timeline on demand, handles 4 states, renders two-column grid with a full audit trail dialog.

**Rules applied:** All 4 states, `useCapability`, `useCurrentUser`, logical properties, generated types.

**Deviation from plan:** 
- Does NOT call `useTaskReturns` — activity feed derives entries from `task.stages` via `buildStageActivities()`
- Timeline is lazy: `useTaskTimeline` is called only when `showFullTimeline` is true (user clicks "View Full Audit Trail")
- The "View Full Audit Trail" link opens a full `Dialog` with `ScrollArea` containing all timeline entries — the plan said this was out of scope for MVP

```tsx
'use client';

import { useLocale, useTranslations } from 'next-intl';
import { ArrowLeft, FileQuestion, Lock } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { useCurrentUser } from '@/lib/api/hooks/use-auth';
import { useTaskDetail, useTaskSlaHealth, useTaskTimeline, useTaskReturns } from '@/lib/api/hooks/use-task-detail';
import { ApiRequestError } from '@/lib/api/client';
import { TaskDetailSkeleton } from './task-detail-skeleton';
import { TitleMetaCard } from './title-meta-card';
import { StageTimeline } from './stage-timeline';
import { DetailsCard } from './details-card';
import { RecentActivityCard } from './recent-activity-card';
import { mapSlaHealth } from './task-detail-utils';

interface TaskDetailProps {
  publicId: string;
}

export function TaskDetail({ publicId }: TaskDetailProps) {
  const t = useTranslations('tasks.detail');
  const detailQuery = useTaskDetail(publicId);
  const slaQuery = useTaskSlaHealth(publicId);
  const timelineQuery = useTaskTimeline(publicId);
  const returnsQuery = useTaskReturns(publicId);

  if (detailQuery.isLoading) return <TaskDetailSkeleton />;

  if (detailQuery.isError) {
    const error = detailQuery.error;
    if (error instanceof ApiRequestError && error.status === 403) {
      return (
        <EmptyState
          icon={Lock}
          title={t('no_permission_title')}
          description={t('no_permission_description')}
        />
      );
    }
    if (error instanceof ApiRequestError && error.status === 404) {
      return (
        <EmptyState
          icon={FileQuestion}
          title={t('not_found_title')}
          description={t('not_found_description')}
        />
      );
    }
    return <ErrorState message={t('error')} onRetry={() => detailQuery.refetch()} />;
  }

  const task = detailQuery.data;
  if (!task) return <TaskDetailSkeleton />;

  const slaHealth = mapSlaHealth(slaQuery.data?.overall_health ?? 'none');

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Main column */}
      <div className="space-y-5 lg:col-span-2">
        <TitleMetaCard task={task} slaHealth={slaHealth} publicId={publicId} />
        <StageTimeline
          stages={task.stages}
          slaTimers={slaQuery.data?.timers}
          taskPublicId={publicId}
          blueprintId={task.blueprint?.public_id}
        />
      </div>
      {/* Sidebar */}
      <div className="space-y-5 lg:col-span-1">
        <div className="lg:sticky lg:top-20 space-y-5">
          <DetailsCard task={task} />
          <RecentActivityCard entries={timelineQuery.data} isLoading={timelineQuery.isLoading} />
        </div>
      </div>
    </div>
  );
}
```

### 7. TitleMetaCard — `components/domain/tasks/title-meta-card.tsx`

**Summary:** First main-column card: badge row, title, ref + copy, description.

```tsx
'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Bookmark, Copy } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { SlaBadge, TaskStatusBadge, PriorityBadge, ClassificationBadge } from './task-badges';
import { localizeName } from './task-detail-utils';
import type { TaskDetailResource } from './task-detail-types';

interface TitleMetaCardProps {
  task: TaskDetailResource;
  slaHealth: string;
  publicId: string;
}

export function TitleMetaCard({ task, slaHealth, publicId }: TitleMetaCardProps) {
  const locale = useLocale();
  const t = useTranslations('tasks.detail');
  const title = localizeName(locale, task.title_ar, task.title_en);
  const description = localizeName(locale, task.description_ar, task.description_en);

  function handleCopyId() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(publicId);
      toast.success(t('id_copied'));
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <PriorityBadge priority={task.priority} />
              <ClassificationBadge level={task.classification_level} />
              <TaskStatusBadge status={task.status} />
              <SlaBadge health={slaHealth} />
            </div>
            <h1 className="text-xl font-bold text-foreground">{title}</h1>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon-sm" aria-label={t('copy_id')} onClick={handleCopyId}>
              <Copy className="size-4" />
            </Button>
            <Button variant="ghost" size="icon-sm" aria-label={t('bookmark')} disabled>
              <Bookmark className="size-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground mb-2">
          {t('ref')}: {publicId}
        </p>
        {description && (
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
```

### 8. StageTimeline + StageTimelineNode — `components/domain/tasks/stage-timeline.tsx` + `stage-timeline-node.tsx`

**Summary:** Vertical timeline with status-coded nodes (completed=emerald check, active=blue pulse, pending=grey, returned=return arrow). Active node shows assignees, SLA inline, action buttons.

**Rules applied:** Logical properties (timeline line at start edge), `aria-live` on active node, `motion-reduce:animate-none` on pulse.

```tsx
// stage-timeline.tsx
'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StageTimelineNode } from './stage-timeline-node';
import type { TaskStageInstanceResource, SlaTimerInstanceResource } from './task-detail-types';

interface StageTimelineProps {
  stages?: TaskStageInstanceResource[];
  slaTimers?: SlaTimerInstanceResource[];
  taskPublicId: string;
  blueprintId?: string;
}

export function StageTimeline({ stages, slaTimers, taskPublicId, blueprintId }: StageTimelineProps) {
  const t = useTranslations('tasks.detail');

  if (!stages || stages.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle>{t('stage_timeline')}</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-muted-foreground">{t('no_stages')}</p></CardContent>
      </Card>
    );
  }

  const sorted = [...stages].sort((a, b) =>
    new Date(a.entered_at).getTime() - new Date(b.entered_at).getTime(),
  );

  return (
    <Card>
      <CardHeader><CardTitle>{t('stage_timeline')}</CardTitle></CardHeader>
      <CardContent>
        <ol className="relative space-y-6">
          {/* Vertical connecting line at start edge */}
          <div className="absolute start-[17px] top-2 bottom-2 w-0.5 bg-border" aria-hidden="true" />
          {sorted.map((stage, index) => (
            <StageTimelineNode
              key={`${stage.blueprint_stage.public_id}-${index}`}
              stage={stage}
              index={index}
              slaTimers={slaTimers}
              taskPublicId={taskPublicId}
              blueprintId={blueprintId}
            />
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
```

```tsx
// stage-timeline-node.tsx — core node rendering (abbreviated for plan; full impl in execution)
'use client';

import { Check, Undo2, Circle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useCurrentUser } from '@/lib/api/hooks/use-auth';
import { useCapability } from '@/lib/api/hooks/use-capabilities';
import { useLocale, useTranslations } from 'next-intl';
import { AssigneeAvatarStack } from './assignee-avatar-stack';
import { SubStageList } from './sub-stage-list';
import { CompleteStageDialog } from './complete-stage-dialog';
import { ReturnStageDialog } from './return-stage-dialog';
import { OverrideAssignmentDialog } from './override-assignment-dialog';
import {
  getStageAssignees,
  isUserAssignee,
  getStageTimer,
  formatSlaInline,
  formatDuration,
  localizeName,
} from './task-detail-utils';
import { useState } from 'react';
import type { TaskStageInstanceResource, SlaTimerInstanceResource } from './task-detail-types';

interface StageTimelineNodeProps {
  stage: TaskStageInstanceResource;
  index: number;
  slaTimers?: SlaTimerInstanceResource[];
  taskPublicId: string;
  blueprintId?: string;
}

export function StageTimelineNode({ stage, index, slaTimers, taskPublicId, blueprintId }: StageTimelineNodeProps) {
  const locale = useLocale();
  const t = useTranslations('tasks.detail');
  const { data: user } = useCurrentUser();
  const canOverride = useCapability('task.override_assignment');
  const [showComplete, setShowComplete] = useState(false);
  const [showReturn, setShowReturn] = useState(false);
  const [showOverride, setShowOverride] = useState(false);

  const status = stage.status; // 'pending' | 'active' | 'completed' | 'returned' | 'skipped'
  const assignees = getStageAssignees(stage.assignments);
  const isAssignee = isUserAssignee(stage.assignments, user?.public_id);
  const stageName = localizeName(locale, stage.blueprint_stage.name_ar, stage.blueprint_stage.name_en);
  const timer = status === 'active' ? getStageTimer(slaTimers, stage.blueprint_stage.public_id) : undefined;
  const slaInline = formatSlaInline(timer);

  // Icon + color by status
  const iconClass = {
    completed: 'bg-emerald-100 border-emerald-500 text-emerald-600 dark:bg-emerald-950 dark:border-emerald-400',
    active: 'bg-blue-100 border-blue-500 text-blue-600 dark:bg-blue-950 dark:border-blue-400',
    pending: 'bg-slate-100 border-slate-300 text-slate-400 dark:bg-slate-900 dark:border-slate-700',
    returned: 'bg-slate-100 border-slate-300 text-slate-400 dark:bg-slate-900 dark:border-slate-700',
    skipped: 'bg-slate-100 border-slate-300 text-slate-400 dark:bg-slate-900 dark:border-slate-700',
  }[status] ?? '';

  return (
    <li className="flex gap-4">
      {/* Node icon */}
      <div className={cn('relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full border-2', iconClass)}>
        {status === 'completed' && <Check className="size-4" aria-hidden="true" />}
        {status === 'active' && (
          <div className="size-3 rounded-full bg-blue-500 animate-pulse motion-reduce:animate-none" aria-hidden="true" />
        )}
        {status === 'returned' && <Undo2 className="size-4 rtl:rotate-180" aria-hidden="true" />}
        {(status === 'pending' || status === 'skipped') && <span className="text-xs font-medium">{index + 1}</span>}
      </div>

      {/* Content */}
      <div className="flex-1 pb-2">
        <div className="flex items-center justify-between gap-2">
          <p className={cn('text-sm font-medium', status === 'pending' && 'text-muted-foreground')}>
            {stageName}
          </p>
          {status === 'completed' && (
            <Badge variant="outline" className="text-emerald-600 bg-emerald-50 dark:bg-emerald-950">
              {t('completed')}
            </Badge>
          )}
          {status === 'active' && (
            <Badge variant="outline" className="text-blue-600 bg-blue-50 dark:bg-blue-950">
              {t('active')}
            </Badge>
          )}
          {status === 'returned' && (
            <Badge variant="outline" className="text-muted-foreground">
              {t('returned')}
            </Badge>
          )}
        </div>

        {/* Assignees */}
        {assignees.length > 0 && (
          <div className="mt-1.5 flex items-center gap-2">
            <AssigneeAvatarStack assignments={assignees} />
            <span className="text-xs text-muted-foreground">
              {assignees.map((a) => localizeName(locale, a.user_name_ar, a.user_name_en)).join(', ')}
            </span>
          </div>
        )}

        {/* Duration */}
        {stage.entered_at && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatDuration(stage.entered_at, stage.exited_at || null)}
          </p>
        )}

        {/* SLA inline (active only) */}
        {status === 'active' && slaInline && (
          <p className={cn(
            'text-xs mt-0.5 font-medium',
            slaInline.includes('Overdue') && 'text-red-600 dark:text-red-400',
            slaInline.includes('At risk') && 'text-amber-600 dark:text-amber-400',
            !slaInline.includes('Overdue') && !slaInline.includes('At risk') && 'text-emerald-600 dark:text-emerald-400',
          )} aria-live="polite">
            {slaInline}
          </p>
        )}

        {/* Completion note (completed/returned) */}
        {stage.completion_note && (
          <p className="text-xs text-muted-foreground mt-1 ps-3 border-s-2 border-border">
            {stage.completion_note}
          </p>
        )}

        {/* Return reason (returned) */}
        {status === 'returned' && stage.return_reason && (
          <p className="text-xs text-muted-foreground mt-1 ps-3 border-s-2 border-border">
            {t('return_reason')}: {stage.return_reason}
          </p>
        )}

        {/* Sub-stages */}
        {stage.sub_stages && stage.sub_stages.length > 0 && (
          <SubStageList
            subStages={stage.sub_stages}
            taskPublicId={taskPublicId}
            slaTimers={slaTimers}
          />
        )}

        {/* Action buttons (active + assignee) */}
        {status === 'active' && isAssignee && (
          <div className="mt-2 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => setShowComplete(true)}>
              {t('submit_and_advance')}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowReturn(true)}>
              {t('return_to_previous')}
            </Button>
            {canOverride && (
              <Button size="sm" variant="ghost" onClick={() => setShowOverride(true)}>
                {t('override_assignment')}
              </Button>
            )}
          </div>
        )}

        {/* Override (non-assignee with capability) */}
        {status === 'active' && !isAssignee && canOverride && (
          <div className="mt-2">
            <Button size="sm" variant="ghost" onClick={() => setShowOverride(true)}>
              {t('override_assignment')}
            </Button>
          </div>
        )}

        {/* Dialogs */}
        <CompleteStageDialog
          open={showComplete}
          onOpenChange={setShowComplete}
          taskPublicId={taskPublicId}
          stageInstancePublicId={stage.blueprint_stage.public_id ?? ''}
          detailPublicId={taskPublicId}
        />
        <ReturnStageDialog
          open={showReturn}
          onOpenChange={setShowReturn}
          taskPublicId={taskPublicId}
          stageInstancePublicId={stage.blueprint_stage.public_id ?? ''}
          currentStageBlueprintId={stage.blueprint_stage.public_id}
          blueprintId={blueprintId}
          detailPublicId={taskPublicId}
        />
        <OverrideAssignmentDialog
          open={showOverride}
          onOpenChange={setShowOverride}
          taskPublicId={taskPublicId}
          stageInstancePublicId={stage.blueprint_stage.public_id ?? ''}
          currentAssignees={assignees}
          detailPublicId={taskPublicId}
          isSubStage={false}
        />
      </div>
    </li>
  );
}
```

**Note on `stageInstancePublicId`:** The `TaskStageInstanceResource` exposes `instance_id` as its own public identifier. **All dialog components use `stage.instance_id` (not `blueprint_stage.public_id`)** for the stage lifecycle endpoint path params. The generated types include `instance_id` on both `TaskStageInstanceResource` and `TaskSubStageInstanceResource`. ✅ Resolved during implementation.

### 9. ReturnStageDialog — `components/domain/tasks/return-stage-dialog.tsx`

**Summary:** Dialog with target-stage Select (pre-filtered from `useBlueprintTransitions`) + required reason textarea.

**Rules applied:** `useBlueprintTransitions` for valid targets, 422 inline error handling, `aria-required` on reason.

```tsx
'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useBlueprintTransitions, useReturnStage } from '@/lib/api/hooks/use-task-detail';
import { ApiRequestError } from '@/lib/api/client';
import { filterReturnTargets, localizeName } from './task-detail-utils';
import type { TaskStageInstanceResource } from './task-detail-types';
import { useLocale } from 'next-intl';

interface ReturnStageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskPublicId: string;
  stageInstancePublicId: string;
  currentStageBlueprintId?: string;
  blueprintId?: string;
  detailPublicId: string;
}

export function ReturnStageDialog({
  open, onOpenChange, taskPublicId, stageInstancePublicId,
  currentStageBlueprintId, blueprintId, detailPublicId,
}: ReturnStageDialogProps) {
  const t = useTranslations('tasks.detail');
  const locale = useLocale();
  const { data: transitions } = useBlueprintTransitions(blueprintId);
  const returnStage = useReturnStage(detailPublicId);

  const [targetStageId, setTargetStageId] = useState('');
  const [reason, setReason] = useState('');

  const validTargets = useMemo(
    () => filterReturnTargets(transitions, currentStageBlueprintId),
    [transitions, currentStageBlueprintId],
  );

  function handleSubmit() {
    if (!targetStageId || !reason) return;
    returnStage.mutate(
      { taskPublicId, stageInstancePublicId, body: { target_stage_id: targetStageId, reason } },
      {
        onSuccess: () => { onOpenChange(false); setTargetStageId(''); setReason(''); },
      },
    );
  }

  const error422 = returnStage.error instanceof ApiRequestError && returnStage.error.status === 422
    ? returnStage.error.error.message
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('return_stage_title')}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="return-target">{t('target_stage')}</Label>
            <Select value={targetStageId} onValueChange={setTargetStageId}>
              <SelectTrigger id="return-target">
                <SelectValue placeholder={t('select_target_stage')} />
              </SelectTrigger>
              <SelectContent>
                {validTargets.map((tr) => (
                  <SelectItem key={tr.to_stage_id} value={tr.to_stage_id}>
                    {tr.to_stage_id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="return-reason">{t('reason')}</Label>
            <Textarea
              id="return-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              aria-required="true"
              placeholder={t('reason_placeholder')}
            />
          </div>
          {error422 && <p className="text-sm text-destructive" role="alert">{error422}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('cancel')}</Button>
          <Button
            onClick={handleSubmit}
            disabled={!targetStageId || !reason || returnStage.isPending}
          >
            {returnStage.isPending ? t('submitting') : t('return_stage')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

**Note:** The target stage Select now resolves `to_stage_id` to stage names via `resolveStageName()` — it passes `stages[]` as a prop and finds the matching stage name using `stages.find(s => s.blueprint_stage.public_id === tr.to_stage_id)`. ✅ This refinement was implemented.

### 10. OverrideAssignmentDialog + UserSearchCombobox

**Summary:** Dialog showing current assignee + `UserSearchCombobox` (debounced search via `useUsersSearch`) + required reason.

```tsx
// user-search-combobox.tsx — core pattern (abbreviated)
'use client';

import { useState, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandInput, CommandList, CommandItem, CommandEmpty } from '@/components/ui/command';
import { useUsersSearch } from '@/lib/api/hooks/use-task-detail';
import { useLocale } from 'next-intl';
import { localizeName } from './task-detail-utils';
import { Button } from '@/components/ui/button';

interface UserSearchComboboxProps {
  value: string;
  onChange: (userPublicId: string) => void;
}

export function UserSearchCombobox({ value, onChange }: UserSearchComboboxProps) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [open, setOpen] = useState(false);
  const locale = useLocale();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isFetching } = useUsersSearch(debouncedSearch);
  const users = data?.data ?? [];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" className="w-full justify-between">
          {value || 'Select user...'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput value={search} onValueChange={setSearch} placeholder="Search users..." />
          <CommandList>
            <CommandEmpty>{isFetching ? 'Searching...' : 'No users found.'}</CommandEmpty>
            {users.map((user) => (
              <CommandItem
                key={user.public_id}
                value={user.public_id}
                onSelect={() => { onChange(user.public_id); setOpen(false); }}
              >
                {localizeName(locale, user.name_ar, user.name_en)}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
```

**Rules applied:** 300ms debounce via `setTimeout` (matching board search pattern), `shouldFilter={false}` on Command (server-side search, not client-side — same pattern as global search in spec 001), generated `UserResource` types.

### 11. TaskLifecycleDialog — `components/domain/tasks/task-lifecycle-dialog.tsx`

**Summary:** Shared `AlertDialog` for suspend/cancel with required reason textarea.

**Rules applied:** `AlertDialog` (needs to be added via shadcn CLI), danger-styled confirm button for cancel, specific button labels ("Cancel Task" not "Confirm").

```tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useSuspendTask, useCancelTask } from '@/lib/api/hooks/use-task-detail';

interface TaskLifecycleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: 'suspend' | 'cancel';
  publicId: string;
}

export function TaskLifecycleDialog({ open, onOpenChange, action, publicId }: TaskLifecycleDialogProps) {
  const t = useTranslations('tasks.detail');
  const [reason, setReason] = useState('');
  const suspendMut = useSuspendTask(publicId);
  const cancelMut = useCancelTask(publicId);
  const mut = action === 'suspend' ? suspendMut : cancelMut;

  function handleSubmit() {
    if (!reason) return;
    mut.mutate({ reason }, { onSuccess: () => { onOpenChange(false); setReason(''); } });
  }

  const isCancel = action === 'cancel';

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isCancel ? t('cancel_task_title') : t('suspend_task_title')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isCancel ? t('cancel_task_description') : t('suspend_task_description')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-col gap-2 py-2">
          <Label htmlFor="lifecycle-reason">{t('reason')}</Label>
          <Textarea
            id="lifecycle-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            aria-required="true"
            placeholder={t('reason_placeholder')}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleSubmit}
            disabled={!reason || mut.isPending}
            className={cn(isCancel && 'bg-destructive text-destructive-foreground hover:bg-destructive/90')}
          >
            {mut.isPending ? t('submitting') : isCancel ? t('cancel_task') : t('suspend_task')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

### 12. TaskTopBarActions — `components/domain/tasks/task-top-bar-actions.tsx`

**Summary:** Lifecycle buttons in the page header, gated by task status + capabilities + assignment.

```tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { useTaskDetail } from '@/lib/api/hooks/use-task-detail';
import { useCurrentUser } from '@/lib/api/hooks/use-auth';
import { useCapability } from '@/lib/api/hooks/use-capabilities';
import { useResumeTask } from '@/lib/api/hooks/use-task-detail';
import { isUserAssignee, getActiveStage } from './task-detail-utils';
import { TaskLifecycleDialog } from './task-lifecycle-dialog';
import { CompleteStageDialog } from './complete-stage-dialog';

interface TaskTopBarActionsProps {
  publicId: string;
}

export function TaskTopBarActions({ publicId }: TaskTopBarActionsProps) {
  const t = useTranslations('tasks.detail');
  const { data: task } = useTaskDetail(publicId);
  const { data: user } = useCurrentUser();
  const canSuspend = useCapability('task.suspend_resume');
  const canCancel = useCapability('task.cancel');
  const resumeMut = useResumeTask(publicId);

  const [showSuspend, setShowSuspend] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [showComplete, setShowComplete] = useState(false);

  if (!task) return null;

  const status = task.status;
  const activeStage = getActiveStage(task.stages);
  const isAssignee = isUserAssignee(activeStage?.assignments, user?.public_id);

  return (
    <div className="flex items-center gap-2">
      {/* Suspend */}
      {status === 'active' && canSuspend && (
        <Button variant="outline" size="sm" onClick={() => setShowSuspend(true)}>
          {t('suspend')}
        </Button>
      )}
      {/* Resume */}
      {status === 'suspended' && canSuspend && (
        <Button variant="outline" size="sm" onClick={() => resumeMut.mutate()} disabled={resumeMut.isPending}>
          {resumeMut.isPending ? t('submitting') : t('resume')}
        </Button>
      )}
      {/* Cancel */}
      {(status === 'draft' || status === 'active') && canCancel && (
        <Button variant="outline" size="sm" className="text-destructive border-destructive/30" onClick={() => setShowCancel(true)}>
          {t('cancel_task')}
        </Button>
      )}
      {/* Advance (assignee shortcut) */}
      {status === 'active' && isAssignee && (
        <Button size="sm" onClick={() => setShowComplete(true)}>
          {t('submit_and_advance')}
        </Button>
      )}

      <TaskLifecycleDialog open={showSuspend} onOpenChange={setShowSuspend} action="suspend" publicId={publicId} />
      <TaskLifecycleDialog open={showCancel} onOpenChange={setShowCancel} action="cancel" publicId={publicId} />
      {activeStage && (
        <CompleteStageDialog
          open={showComplete}
          onOpenChange={setShowComplete}
          taskPublicId={publicId}
          stageInstancePublicId={activeStage.blueprint_stage.public_id ?? ''}
          detailPublicId={publicId}
        />
      )}
    </div>
  );
}
```

### 13. DetailsCard — `components/domain/tasks/details-card.tsx`

**Summary:** Sidebar metadata card with stacked label/value rows.

```tsx
'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClassificationBadge, TaskStatusBadge } from './task-badges';
import { localizeName, getActiveStage } from './task-detail-utils';
import type { TaskDetailResource } from './task-detail-types';

interface DetailsCardProps {
  task: TaskDetailResource;
}

export function DetailsCard({ task }: DetailsCardProps) {
  const locale = useLocale();
  const t = useTranslations('tasks.detail');
  const activeStage = getActiveStage(task.stages);
  const stageProgress = task.stages
    ? `${t('active')} — ${task.stages.filter(s => s.status === 'completed').length + 1} ${t('of')} ${task.stages.length}`
    : task.status;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t('details')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="space-y-3">
          <DetailRow label={t('status')} value={<TaskStatusBadge status={task.status} />} />
          <DetailRow label={t('initiator')} value={task.initiator_id} />
          <DetailRow label={t('blueprint')} value={task.blueprint ? localizeName(locale, task.blueprint.name_ar, task.blueprint.name_en) : '-'} />
          <DetailRow label={t('created')} value={task.created_at} />
          <DetailRow label={t('due_date')} value={task.due_date || '-'} />
          <DetailRow label={t('confidentiality')} value={<ClassificationBadge level={task.classification_level} />} />
          {task.suspended_at && <DetailRow label={t('suspended_at')} value={task.suspended_at} />}
          {task.suspension_reason && <DetailRow label={t('suspension_reason')} value={task.suspension_reason} />}
          {task.cancelled_at && <DetailRow label={t('cancelled_at')} value={task.cancelled_at} />}
          {task.cancellation_reason && <DetailRow label={t('cancellation_reason')} value={task.cancellation_reason} />}
        </dl>
      </CardContent>
    </Card>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[10px] text-muted-foreground uppercase">{label}</dt>
      <dd className="text-sm text-foreground mt-0.5">{value}</dd>
    </div>
  );
}
```

**Note:** `TaskDetailResource` now includes `initiator_name_ar`/`initiator_name_en` — the `DetailsCard` uses `localizeName(locale, task.initiator_name_ar, task.initiator_name_en)` directly. ✅ Resolved via backend resource update.

### 14. RecentActivityCard — `components/domain/tasks/recent-activity-card.tsx`

**Summary:** Compact sidebar card showing last ~5 timeline entries + "View Full Audit Trail →" link.

```tsx
'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ActivityEntry } from './activity-entry';
import type { TaskTimelineResource } from './task-detail-types';

interface RecentActivityCardProps {
  entries?: TaskTimelineResource[];
  isLoading: boolean;
}

export function RecentActivityCard({ entries, isLoading }: RecentActivityCardProps) {
  const t = useTranslations('tasks.detail');
  const recent = (entries ?? []).slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t('recent_activity')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('no_activity')}</p>
        ) : (
          <>
            <div className="space-y-3">
              {recent.map((entry, i) => (
                <ActivityEntry key={i} entry={entry} />
              ))}
            </div>
            <button className="mt-3 text-xs text-primary hover:underline font-medium">
              {t('view_full_audit_trail')} →
            </button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
```

### 15. TaskDetailSkeleton — `components/domain/tasks/task-detail-skeleton.tsx`

**Summary:** Two-column skeleton matching the real layout.

```tsx
'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function TaskDetailSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-5 lg:col-span-2">
        {/* Title & Meta skeleton */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-16" />
              </div>
              <Skeleton className="h-6 w-3/4" />
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full mt-1" />
            <Skeleton className="h-4 w-2/3 mt-1" />
          </CardContent>
        </Card>
        {/* Stage Timeline skeleton */}
        <Card>
          <CardHeader><Skeleton className="h-5 w-32" /></CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="size-9 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="space-y-5 lg:col-span-1">
        <div className="lg:sticky lg:top-20 space-y-5">
          {/* Details skeleton */}
          <Card>
            <CardHeader><Skeleton className="h-4 w-20" /></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i}>
                    <Skeleton className="h-3 w-16 mb-1" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          {/* Activity skeleton */}
          <Card>
            <CardHeader><Skeleton className="h-4 w-24" /></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
```

### 16. Board Prefetch — Modify `task-board-table.tsx` + `task-board-mobile-list.tsx`

**Summary:** Add `onMouseEnter` prefetch on rows/cards.

```tsx
// Add to task-board-table.tsx row:
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/api/query-keys';
import { apiClient } from '@/lib/api/client';

// Inside TaskBoardTable component:
const queryClient = useQueryClient();

function handleRowHover(publicId: string) {
  queryClient.prefetchQuery({
    queryKey: queryKeys.tasks.detail(publicId),
    queryFn: () => apiClient.get(`/v1/tasks/${publicId}`),
  });
}

// Add to <TableRow>:
onMouseEnter={() => handleRowHover(task.public_id)}
```

### 17. i18n — `messages/en.json` + `messages/ar.json`

**Summary:** Add `tasks.detail` namespace.

```json
{
  "tasks": {
    "detail": {
      "stage_timeline": "Stage Timeline",
      "no_stages": "No stages yet",
      "completed": "Completed",
      "active": "Active",
      "returned": "Returned",
      "pending": "Pending",
      "submit_and_advance": "Submit & Advance",
      "return_to_previous": "Return to Previous",
      "override_assignment": "Override Assignment",
      "return_reason": "Return reason",
      "details": "Details",
      "status": "Status",
      "initiator": "Initiator",
      "blueprint": "Blueprint",
      "department": "Department",
      "created": "Created",
      "due_date": "Overall Due",
      "confidentiality": "Confidentiality",
      "suspended_at": "Suspended",
      "suspension_reason": "Suspension reason",
      "cancelled_at": "Cancelled",
      "cancellation_reason": "Cancellation reason",
      "recent_activity": "Recent Activity",
      "no_activity": "No recent activity",
      "view_full_audit_trail": "View Full Audit Trail",
      "ref": "Ref",
      "copy_id": "Copy task ID",
      "id_copied": "Task ID copied",
      "bookmark": "Bookmark",
      "not_found_title": "Task not found",
      "not_found_description": "This task may have been deleted or you may not have access.",
      "no_permission_title": "No permission",
      "no_permission_description": "You do not have permission to view this task.",
      "error": "Unable to load task details.",
      "of": "of",
      "suspend": "Suspend",
      "resume": "Resume",
      "cancel_task": "Cancel Task",
      "suspend_task_title": "Suspend this task",
      "suspend_task_description": "All SLA timers will pause. Active assignees will be notified.",
      "cancel_task_title": "Cancel this task",
      "cancel_task_description": "This will permanently terminate the task. All parties will be notified.",
      "reason": "Reason",
      "reason_placeholder": "Enter reason...",
      "cancel": "Cancel",
      "submitting": "Submitting...",
      "return_stage_title": "Return to previous stage",
      "target_stage": "Target stage",
      "select_target_stage": "Select a stage to return to",
      "return_stage": "Return Stage",
      "complete_stage_title": "Complete this stage",
      "completion_note": "Completion note (optional)",
      "completion_note_placeholder": "Add a note for the next assignees...",
      "complete": "Complete",
      "override_title": "Override assignment",
      "current_assignee": "Current assignee",
      "new_assignee": "New assignee",
      "search_users": "Search users...",
      "override": "Override"
    }
  }
}
```

**Actual i18n keys:** The implementation added ~92 keys instead of the ~68 planned. Additional keys include:
- Activity type labels: `stage_started`, `stage_completed`, `stage_returned`, `sub_stage_started`, `sub_stage_completed`, `assigned_to`, `completed_work_on`, `was_replaced`, `stage_suffix`, `substage_suffix`
- Time formatting: `time_day_one`, `time_day_many`, `time_hour_one`, `time_hour_many`, `time_minute_one`, `time_minute_many`, `time_less_than_1h`, `time_just_now`, `time_ago_prefix`, `time_ago_suffix`, `time_overdue_prefix`, `time_at_risk`, `time_remaining`, `time_due_today`, `time_paused`, `time_completed`
- Dialog extras: `select_assignee`, `no_results`, `retry`, `audit_trail`, `stage_progress`
- Arabic dual forms (`ar.json` only): `time_day_two`, `time_hour_two`, `time_minute_two` — for Arabic grammar dual-plural forms.

Arabic translations (`messages/ar.json`) follow the same key structure with Arabic values and include the dual-form keys not present in English.

---

## Data Flow

```
User navigates to /tasks/[publicId]
  → SiteHeader (shell layout) reads pathname, renders breadcrumb beside sidebar toggle: Dashboard › Tasks › [publicId]
  → TaskDetailPage (Server) reads params.publicId
  → Renders PageHeader (title + description) + TaskTopBarActions + TaskDetail

TaskDetail (Client) mounts:
  → useTaskDetail(publicId) → GET /v1/tasks/{publicId} → TaskDetailResource
  → useTaskSlaHealth(publicId) → GET /v1/tracking/sla/tasks/{publicId} → TaskSlaHealthResource
  → useTaskTimeline(publicId) → GET /v1/tasks/{publicId}/timeline → TaskTimelineResource[]
  → useTaskReturns(publicId) → GET /v1/tasks/{publicId}/returns → StageReturnResource[]
  (all run in parallel — independent useQuery hooks)

TaskTopBarActions (Client) mounts:
  → useTaskDetail(publicId) (same cache — deduped by TanStack)
  → useCurrentUser() → from cache (prefetched server-side)
  → useCapability() → from Zustand capability store

User clicks "Submit & Advance" on active stage node:
  → CompleteStageDialog opens (local state)
  → User enters completion note + clicks confirm
  → useCompleteStage.mutate() → POST /v1/tasks/{task}/stages/{stageInstance}/complete
  → On success: invalidate task detail + SLA + timeline + returns + board lists
  → TanStack refetches all invalidated queries in parallel
  → UI re-renders with new stage state (stage completed, next stage active)
  → toast.success("Stage completed")

User clicks "Return to Previous":
  → ReturnStageDialog opens
  → useBlueprintTransitions(blueprintId) → GET /v1/blueprints/{blueprintId}/transitions
  → filterReturnTargets() filters transition_type=return where from_stage_id=current
  → User selects target + enters reason + clicks confirm
  → useReturnStage.mutate() → POST /v1/tasks/{task}/stages/{stageInstance}/return
  → On 422: dialog stays open, inline error shown
  → On success: invalidate + refetch + toast

User clicks "Override Assignment":
  → OverrideAssignmentDialog opens
  → User types in UserSearchCombobox → 300ms debounce → useUsersSearch(search) → GET /v1/iam/users?search=...
  → User selects new assignee + enters reason + clicks confirm
  → useOverrideAssignment.mutate() → POST .../override-assignment
  → On success: invalidate + toast
```

---

## Route Structure

```
app/(dashboard)/tasks/
├── page.tsx                          # Task board (spec 003 — existing)
└── [publicId]/
    ├── page.tsx                      # Task detail (spec 004 — NEW)
    └── error.tsx                     # Route error boundary (NEW)
```

Locale is cookie-based (`NEXT_LOCALE`) — no `[locale]` prefix in routes.

---

## Execution Order

All implementation steps complete. The prefetch for mobile is handled by `task-card.tsx` (not `task-board-mobile-list.tsx`), so step 24 is covered. MSW handlers and test files are separate from feature implementation.

| # | Step | Status |
|---|------|--------|
| 1 | Add shadcn `alert-dialog` component | ✅ Done |
| 2 | Extend `lib/api/query-keys.ts` | ✅ Done |
| 3 | Create `lib/api/hooks/use-task-detail.ts` | ✅ Done |
| 4 | Create `components/domain/tasks/task-detail-types.ts` | ✅ Done |
| 5 | Create `components/domain/tasks/task-detail-utils.ts` | ✅ Done |
| 6 | Create `components/domain/tasks/assignee-avatar-stack.tsx` | ✅ Done |
| 7 | Create `components/domain/tasks/title-meta-card.tsx` | ✅ Done |
| 8 | Create `components/domain/tasks/details-card.tsx` | ✅ Done |
| 9 | Create `recent-activity-card.tsx` + `activity-entry.tsx` | ✅ Done |
| 10 | Create `task-detail-skeleton.tsx` | ✅ Done |
| 11 | Create `user-search-combobox.tsx` | ✅ Done |
| 12 | Create `complete-stage-dialog.tsx` | ✅ Done |
| 13 | Create `return-stage-dialog.tsx` | ✅ Done |
| 14 | Create `override-assignment-dialog.tsx` | ✅ Done |
| 15 | Create `task-lifecycle-dialog.tsx` | ✅ Done |
| 16 | Create `sub-stage-item.tsx` + `sub-stage-list.tsx` | ✅ Done |
| 17 | Create `stage-timeline-node.tsx` | ✅ Done |
| 18 | Create `stage-timeline.tsx` | ✅ Done |
| 19 | Create `task-top-bar-actions.tsx` | ✅ Done |
| 20 | Create `task-detail.tsx` | ✅ Done |
| 21 | Create `app/(dashboard)/tasks/[publicId]/page.tsx` | ✅ Done |
| 22 | Create `app/(dashboard)/tasks/[publicId]/error.tsx` | ✅ Done |
| 23 | Update `task-board-table.tsx` — row hover prefetch | ✅ Done |
| 24 | Update `task-card.tsx` — card hover prefetch (covers mobile) | ✅ Done |
| 25 | Update `messages/en.json` + `messages/ar.json` | ✅ Done |

---

## What to Test Manually

### Happy Paths (both locales)

1. **AR RTL:** Navigate from task board → click a row → task detail loads with breadcrumb, title, stage timeline, sidebar. All text is Arabic, layout is RTL, timeline line is on the right.
2. **EN LTR:** Same flow in English. Layout is LTR, timeline line is on the left.
3. **Complete a stage:** Open an active task where you are an assignee → click "Submit & Advance" → enter note → confirm → toast appears → timeline updates (current stage shows completed, next stage is active).
4. **Return a stage:** Click "Return to Previous" → select a valid target from the dropdown (only return-type transitions shown) → enter reason → confirm → toast → timeline shows returned stage with reason.
5. **Override assignment:** As a user with `task.override_assignment` → click "Override Assignment" → search for a user in the combobox → select → enter reason → confirm → toast → stage node shows new assignee.
6. **Suspend task:** As a user with `task.suspend_resume` → click "Suspend" in top bar → enter reason → confirm → toast → status badge changes to "Suspended".
7. **Resume task:** On a suspended task → click "Resume" → toast → status changes back to "Active".
8. **Cancel task:** Click "Cancel Task" in top bar → enter reason → confirm → toast → status changes to "Cancelled".
9. **Copy task ID:** Click the copy icon in Title & Meta card → toast "Task ID copied" → clipboard contains the public_id.

### States

10. **Loading:** Navigate directly to a task URL → skeleton appears immediately (two-column layout with placeholder cards).
11. **404:** Navigate to `/tasks/nonexistent-uuid` → "Task not found" empty state with link back to `/tasks`.
12. **403:** As a user without task visibility → "No permission" empty state with lock icon.
13. **500:** Backend down → error state with retry button → click retry → refetches.
14. **Empty stages:** Open a draft task with no stages → Stage Timeline card shows "No stages yet".

### Permission-Gated UI

15. **No `task.override_assignment`:** Override button is not visible on active stage nodes.
16. **No `task.suspend_resume`:** Suspend/Resume buttons not visible in top bar.
17. **No `task.cancel`:** Cancel Task button not visible in top bar.
18. **Not an assignee:** Complete/Return buttons not visible on active stage node.

### Responsive

19. **Desktop (≥1024px):** Two-column layout — main col (2/3) + sidebar (1/3, sticky).
20. **Tablet (640–1023px):** Single column — sidebar cards stack below main column.
21. **Mobile (<640px):** Single column, compact timeline nodes, top-bar actions wrap or collapse.

### Keyboard Navigation

22. **Tab through:** Breadcrumb links → top-bar actions → title card buttons → stage timeline nodes → action buttons → sidebar cards. Focus order follows visual layout.
23. **Enter/Space on action buttons:** Triggers the action (opens dialog or calls mutation).
24. **Escape in dialog:** Closes dialog, focus returns to trigger button.
25. **Tab within dialog:** Focus is trapped inside the dialog (shadcn handles this).

---

→ **Next:** Review this plan. Do not implement until approved.