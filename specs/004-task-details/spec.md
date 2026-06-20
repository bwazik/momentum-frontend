# Spec: Task Details

> **Number:** 004
> **Date:** 2026-06-20
> **Status:** `completed`
> **Milestone:** F2 — Task board & task details
> **Depends on:** `001-core-shell`, `003-task-board`
> **Backend spec:** `../backend/specs/005-task-execution/` — `Contract status: stable`; `../backend/specs/006-stage-lifecycle/` — `Contract status: stable`; `../backend/specs/007-sla-escalation/` — `Contract status: stable` (read-only SLA health endpoint consumed); `../backend/specs/004-blueprint-engine/` — `Contract status: stable` (transitions endpoint consumed for return-target filtering); `../backend/specs/003-iam-abac/` — `Contract status: stable` (users endpoint consumed for assignment override combobox); `../backend/specs/012-documents-attachments/` — `Contract status: draft` (⬜ Not Started — feature deferred); `../backend/specs/013-comments-collaboration/` — `Contract status: draft` (⬜ Not Started — feature deferred)
> **Contract status:** `stable`
> **Author:** OpenCode
> **Branch:** `feat/004-task-details`
> **Base branch:** `main`

---

## Problem

The task board (spec 003) lets users *find* work, but once they click a row there is nowhere to go. Today a user who opens a task sees nothing — no context, no stage progression, no assignees, no SLA countdown, and no way to act on the task. They cannot answer the most basic operational questions: "What stage is this at?", "Who has the ball right now?", "How long has it been here?", "Is the SLA at risk?", or "What has happened so far?".

More critically, the stage lifecycle engine (backend spec 006) is fully built — stage completion, advancement, return, sub-stage progression, and assignment override all exist as stable API endpoints — but there is no UI surface to invoke them. An assignee cannot mark their stage complete, cannot return a task to a previous stage, and an authorized manager cannot reassign an active stage. The platform's core operational loop (find task → open task → act on stage → advance) is broken at the second step.

Government workflows demand precise accountability: every stage entry, every assignee, every completion note, every return reason, and every SLA timer must be visible and auditable. Without a task details screen, that accountability is invisible.

---

## Goal

Deliver `/tasks/[publicId]` as a comprehensive task detail page inside the authenticated dashboard shell. The screen shows the full task lifecycle context — overview header, stage timeline with current/past stages, active assignees, SLA health countdown, and a compact recent-activity feed — and provides the stage-level action surface: complete stage/sub-stage, return to a previous stage, override assignment, and task-level lifecycle actions (suspend, resume, cancel).

**Layout reference:** `../_blueprints/ui-concepts/03-task-details.html` — a two-column stacked-card layout (no tabs). Main column (2/3) stacks: Title & Meta card → Stage Timeline card → (future: Comments card). Sidebar (1/3) stacks: Details card → (future: Attachments, External References cards) → Recent Activity card. The activity log is a compact sidebar card showing the last few events with a "View Full Audit Trail →" link, not a main-column tab. Return history folds into the recent activity feed and the stage timeline nodes (returned nodes show the return reason inline).

The page consumes the stable task show endpoint (`GET /v1/tasks/{task}` returning `TaskDetailResource` with embedded stages, sub-stages, and assignments), the SLA health endpoint (`GET /v1/tracking/sla/tasks/{task}`), the timeline endpoint (`GET /v1/tasks/{task}/timeline`), and the return history endpoint (`GET /v1/tasks/{task}/returns`). Mutations use the stage lifecycle endpoints (complete, return, override-assignment) and task lifecycle endpoints (suspend, resume, cancel).

Comments (backend 013) and document attachments (backend 012) are not yet implemented and are explicitly out of scope. The page architecture reserves insertion points for them in the stacked-card layout (Comments after Stage Timeline in the main column; Attachments and External References in the sidebar).

---

## User Stories

### Internal User / Stage Assignee

- As a **stage assignee**, I want to open a task and immediately see which stage it is at and who is assigned, so that I know whether the ball is with me.
- As a **stage assignee**, I want to see the SLA countdown for my active stage, so that I know how much time I have left before breach.
- As a **stage assignee**, I want to submit a completion note and mark my stage complete, so that the task advances to the next stage and the next assignees are notified.
- As a **sub-stage assignee**, I want to mark my sub-stage complete, so that the next sub-stage activates or the parent stage can evaluate its completion rule.
- As an **active stage assignee**, I want to return the task to a previous stage with a reason, so that the previous assignees can fix issues before the workflow continues.
- As an **internal user**, I want to view the full stage timeline, so that I can see every stage the task passed through with assignees, durations, and outcomes.
- As an **internal user**, I want to see the description and context of the task, so that I understand what work is required.

### Manager / Authorized User

- As a **manager** with `task.override_assignment` capability, I want to reassign an active stage's assignee with a reason, so that accountability transfers when the original assignee is unavailable.
- As a **manager** with `task.suspend_resume` capability, I want to suspend an active task with a reason, so that all SLA timers pause when work is blocked by an external dependency.
- As a **manager** with `task.suspend_resume` capability, I want to resume a suspended task, so that SLA timers restart and assignees are notified.
- As a **manager** with `task.cancel` capability, I want to cancel a task with a mandatory reason, so that the task is terminated and all parties are informed.

### Follow-Up Specialist

- As a **follow-up specialist**, I want to see the SLA health and elapsed time at the current stage, so that I can prioritise follow-up on overdue or at-risk tasks.
- As a **follow-up specialist**, I want to view the chronological timeline of all stage events, so that I understand the full history of what has happened on this task.

### System

- As the **system**, I want the task details page to enforce ABAC visibility on every data fetch, so that users only see tasks they are authorized to view.
- As the **system**, I want stage actions to be gated by assignment (only active assignees can complete/return) and capability (only `task.override_assignment` can override), so that the server remains the sole authority.
- As the **system**, I want mutation success to invalidate the task detail and board caches, so that the UI reflects the new state immediately.

---

## Acceptance Criteria

### Route and Page Structure

- [x] Route `/tasks/[publicId]` renders inside the authenticated dashboard shell.
- [x] The page uses the **two-column stacked-card layout** from `../_blueprints/ui-concepts/03-task-details.html` (matches the detail page template in `docs/design-system/04-layout-patterns.md`): main column (2/3) + sidebar (1/3) on desktop, stacked on mobile. **No tabs** — all content is stacked cards within each column.
- [x] **Main column** stacks: Title & Meta card (title, priority/category/classification badges, reference, description) → Stage Timeline card → (future insertion point for Comments card).
- [x] **Sidebar** stacks: Details/metadata card → (future insertion points for Attachments and External References cards) → Recent Activity card.
- [x] Breadcrumb shows `Dashboard › Task Board › [task public_id or short title]` with a link back to `/tasks` that preserves board filters via browser history.
- [x] The route param `publicId` is the task `public_id` (never internal `id`), per `glossary.md` URL rules.
- [x] The page fetches `GET /v1/tasks/{publicId}` (returns `TaskDetailResource`) using generated OpenAPI types — no hand-written API DTOs.
- [x] A 404 response renders a "task not found" empty state with a link back to the task board.

### Title & Meta Card (Main Column — First Card)

- [x] The card shows a badge row: `PriorityBadge` (reused from spec 003) + `ClassificationBadge` (reused from spec 003, when not `public`) + `TaskStatusBadge` (reused from spec 003) + `SlaBadge` reflecting overall SLA health from `GET /v1/tracking/sla/tasks/{task}` (`overall_health`: `none`, `on_track`, `warning`, `breached`).
- [x] The card shows the localized task title (`title_ar` / `title_en` picked by locale) as the heading.
- [x] The card shows the task `public_id` (and external reference if available) as a muted "Ref:" line.
- [x] The card shows the task description (`description_ar` / `description_en`) in a readable paragraph below the title, preserving line breaks.
- [x] The card includes a bookmark/flag icon button in the top-end corner (non-functional placeholder in MVP — watch list is V2).

### Sidebar — Details Card

- [x] The sidebar details card shows a "Details" header and a stacked metadata list: Status (with stage progress, e.g. "Active — Stage 3 of 5"), Initiator (name), Blueprint (name), Department (owning department of current stage), Created (date + relative), Overall Due (date), Confidentiality (classification badge), and task-level status timestamps (suspended/resumed/completed/cancelled with reasons where applicable).
- [x] Dates display in dual Hijri + Gregorian format via `Intl.DateTimeFormat` (display layer only; API returns Gregorian ISO).
- [x] The current active stage is highlighted with stage name, owning department, assignees, and time elapsed since `entered_at`.

### Stage Timeline (Main Column)

- [x] A vertical stage timeline renders all stage instances from `TaskDetailResource.stages`, ordered by `created_at` (oldest at top in reading direction).
- [x] Completed stage node: emerald check icon, solid connecting line, stage name, assignees, duration (`entered_at` → `exited_at`), and completion note (truncated with expand).
- [x] Active stage node: blue pulse dot, bold stage name, current assignees with avatar stack, SLA status inline (e.g. "Overdue by 2d" or "SLA: 3d · Elapsed: 5d"), and action buttons ("Submit & Advance" / "Return to Previous" per concept).
- [x] Pending stage node (status `pending`): grey number, dashed connecting line, stage name.
- [x] Returned stage node: distinct indicator (return arrow icon, muted/dashed), with `return_reason` shown.
- [x] Each stage node shows its sub-stages (from `TaskSubStageInstanceResource`) as nested checklist items with status (pending/active/completed/returned), assignee, and completion note.
- [x] Active sub-stage shows Complete and Return actions when the current user is an assignee.
- [x] The timeline uses the design system `Stage Timeline` pattern from `docs/design-system/03-components.md`: completed = emerald check + solid line, active = blue pulse + bold, pending = grey + dashed.

### SLA Health Display

- [x] The page fetches `GET /v1/tracking/sla/tasks/{publicId}` (returns `TaskSlaHealthResource`) and displays the overall health badge in the Title & Meta card badge row.
- [x] For the active stage, the SLA status is shown inline on the active stage node (matching the concept: "Overdue by 2d" or "SLA: 3d · Elapsed: 5d"), not as a separate sidebar card. The inline status uses the timer's `deadline_at`, `warning_at`, and elapsed time.
- [x] SLA colors follow the glossary mapping: emerald = on track, amber = at risk (warning), red = overdue (breached), slate = suspended (paused). Always paired with a text label — never color-only.
- [x] When `overall_health` is `none` (no active timers, e.g. draft or completed task), the SLA badge shows a neutral "no active SLA" state and the active stage node omits the SLA inline status.

### Stage Actions

- [x] **Complete Stage**: The active stage node shows a "Complete" button when the current user is an active (non-completed) assignee of that stage. Clicking opens a `Dialog` with an optional `completion_note` textarea and a confirm button.
- [x] On confirm, `POST /v1/tasks/{task}/stages/{stageInstance}/complete` is called. On success: toast notification, invalidate task detail + SLA health + timeline, and the timeline re-renders with the advanced/completed state.
- [x] **Return Stage**: The active stage node shows a "Return to Previous" button when the current user is an active assignee. Clicking opens a `Dialog` with a target stage selector and a required `reason` textarea.
- [x] The target stage selector is pre-filtered to valid return targets: the dialog fetches `GET /v1/blueprints/{blueprintId}/transitions` (returns `BlueprintTransitionResource[]`), filters to `transition_type=return` where `from_stage_id` matches the current stage's `blueprint_stage.public_id`, and offers only the valid `to_stage_id` targets. The stage name for each target is resolved from the task's stage instances or the blueprint show response.
- [x] On confirm, `POST /v1/tasks/{task}/stages/{stageInstance}/return` is called with `target_stage_id` and `reason`. 422 errors are still handled gracefully (defensive), but the UX should never present an invalid target.
- [x] **Sub-stage Complete/Return**: Same pattern for sub-stages via `POST /v1/tasks/{task}/sub-stages/{subStageInstance}/complete` and `.../return`.
- [x] Buttons are hidden when the user is not an assignee of the active stage (capability/assignment gating for UX; server enforces regardless).
- [x] All mutation buttons show a loading spinner during the request and are disabled.

### Assignment Override

- [x] The active stage node shows an "Override Assignment" action (in a dropdown menu or button) when the current user has `task.override_assignment` capability (checked via `useCapability`).
- [x] Clicking opens a `Dialog` showing the current assignee(s) with a debounced user-search combobox (300ms debounce) for the new assignee and a required `reason` field. The combobox queries `GET /v1/iam/users` with `search`, `is_active=true`, and `per_page`, rendering `UserResource` results with localized name + department/position context.
- [x] On confirm, `POST /v1/tasks/{task}/stages/{stageInstance}/override-assignment` is called with `assignments` array (`{current_user_id, new_user_id}`) and `reason`.
- [x] Sub-stage assignment override uses the sub-stage variant endpoint.
- [x] On success: toast, invalidate task detail, and the stage node re-renders with the new assignee.

### Task Lifecycle Actions (Top Bar)

- [x] The shell top bar (page header area, next to the breadcrumb) shows task lifecycle action buttons gated by capabilities and current status — matching the concept which places "Cancel Task" and "Advance Stage" buttons in the top bar.
- [x] **Suspend** (visible when `status=active` and user has `task.suspend_resume`): outline button; opens `AlertDialog` with required `reason` textarea.
- [x] **Resume** (visible when `status=suspended` and user has `task.suspend_resume`): outline button; direct action with confirmation.
- [x] **Cancel Task** (visible when `status=draft` or `status=active` and user has `task.cancel`): danger-outline button (red text/border per concept); opens `AlertDialog` with required `reason` textarea and danger-styled confirm button.
- [x] **Complete / Advance** primary action (visible when current user is an active assignee of the current stage): primary button (emerald per concept); opens the complete-stage dialog (same as the stage node "Submit & Advance" button — provides a shortcut from the top bar).
- [x] On success: toast, invalidate task detail + board lists, and the page re-renders with the new state.
- [x] Suspend calls `POST /v1/tasks/{task}/suspend`, resume calls `POST /v1/tasks/{task}/resume`, cancel calls `POST /v1/tasks/{task}/cancel`.
- [x] Confirmation dialogs follow `docs/design-system/04-layout-patterns.md`: danger button label is specific ("Cancel Task" not "Confirm"), cancel button always available.

### Sidebar — Recent Activity Card

- [x] The page fetches `GET /v1/tasks/{publicId}/timeline` (returns array of `TaskTimelineResource`) and renders a compact "Recent Activity" card in the sidebar (matching the concept: last ~4–5 events with a "View Full Audit Trail →" link).
- [x] Each activity entry shows a small dot marker, actor name (bold), action description, and relative timestamp (e.g. "Noura Al-Qahtani added a comment · 2 hours ago", "System SLA breach alert sent · 4 hours ago").
- [x] The "View Full Audit Trail →" link opens a full chronological view — either a dedicated route (`/tasks/[publicId]/timeline`) or a full-screen dialog/sheet showing all timeline entries. This full view is out of scope for MVP (the link can be a placeholder that navigates to a future route); the compact card is the MVP deliverable.
- [x] The activity feed is a full list render via `useQuery` (backend spec 006 says timeline returns full list, expected < 200 entries); the sidebar card shows only the most recent ~4–5, sliced client-side.

### Return History (Folded Into Activity + Stage Nodes)

- [x] The page fetches `GET /v1/tasks/{publicId}/returns` (returns array of `StageReturnResource`) and shows returns in two places — no separate section or tab:
  - **Inline in the stage timeline**: returned stage nodes show the `return_reason` and a distinct visual indicator (return arrow icon, muted/dashed style).
  - **In the Recent Activity card**: return events appear as activity entries (the timeline endpoint already includes return events with `return_reason`).
- [x] Each return entry shows: target stage name, return reason, who returned it (`returned_by`), and when (`exited_at`).

### States

- [x] **Loading**: Full-page skeleton matching the detail layout — header skeleton (title + badges), side panel skeleton (metadata rows), stage timeline skeleton (3-4 stage nodes), activity timeline skeleton (3-4 rows). Uses shadcn `Skeleton` with `animate-pulse`.
- [x] **Empty (task not found / 404)**: `EmptyState` with a "task not found" icon, headline, and a link back to `/tasks`.
- [x] **Error (500 / network)**: `ErrorState` with safe message and retry button that refetches the task detail.
- [x] **Error (403 / no permission)**: `EmptyState` with lock icon, localized "no permission" message, no task data shown.
- [x] **Success**: Full detail content rendered with all data.

### Responsive Behavior

- [x] **Desktop (≥1024px)**: Two-column `grid-cols-1 lg:grid-cols-3` stacked-card layout (matching concept). Main column spans 2 cols: Title & Meta card → Stage Timeline card → (future: Comments). Sidebar spans 1 col: Details card → (future: Attachments, External References) → Recent Activity card. Sidebar is sticky on scroll.
- [x] **Tablet (640–1023px)**: Single column; sidebar cards (Details, Recent Activity) move below the main column cards. Stage timeline remains vertical full-width.
- [x] **Mobile (<640px)**: Single column, stacked cards. Stage timeline nodes are compact. Top-bar action buttons collapse into an overflow menu or remain as compact icon buttons. Dialogs become bottom sheets or full-screen on small viewports.

### Navigation and Cross-Linking

- [x] The top bar breadcrumb shows a back arrow (link to `/tasks`, `rtl:rotate-180`), "Task Board /" label, and the task `public_id` — matching the concept layout.
- [x] Breadcrumb "Task Board" link navigates back to `/tasks` and preserves the board's URL filter state via browser history (no explicit filter passing needed — Next.js history handles it).
- [x] The task `public_id` in the Title & Meta card is copyable (icon button with `aria-label`, success toast on copy).
- [x] Assignee names are displayed as text (no link to user profile in MVP — user directory is V2).

---

## Technical Requirements

> Reference: `docs/ai/coding-standards.md`

### Data Fetching

- [x] `useTaskDetail(publicId)` — `GET /v1/tasks/{publicId}`, query key `queryKeys.tasks.detail(publicId)`, returns `TaskDetailResource` (includes embedded `stages` with `sub_stages` and `assignments`). `enabled: !!publicId`. Stale time: 30s (task state changes frequently during active work).
- [x] `useTaskSlaHealth(publicId)` — `GET /v1/tracking/sla/tasks/{publicId}`, query key `queryKeys.tasks.slaHealth(publicId)`, returns `TaskSlaHealthResource` (overall_health + timers array). `enabled: !!publicId` (fetch regardless; the component decides what to render based on `overall_health === 'none'`). Stale time: 30s.
- [x] `useTaskTimeline(publicId)` — `GET /v1/tasks/{publicId}/timeline`, query key `queryKeys.tasks.timeline(publicId)`, returns `TaskTimelineResource[]` (full list, no cursor pagination per backend spec 006). `enabled: !!publicId`.
- [x] `useTaskReturns(publicId)` — `GET /v1/tasks/{publicId}/returns`, query key `queryKeys.tasks.returns(publicId)`, returns `StageReturnResource[]`. `enabled: !!publicId`.
- [x] `useBlueprintTransitions(blueprintId)` — `GET /v1/blueprints/{blueprintId}/transitions`, query key `queryKeys.blueprints.transitions(blueprintId)`, returns `BlueprintTransitionResource[]`. `enabled: !!blueprintId`. Used by the Return Stage dialog to pre-filter valid return targets (`transition_type=return` where `from_stage_id` matches current stage). Stale time: 5min (transitions are immutable once blueprint is locked).
- [x] `useUsersSearch(search, filters)` — `GET /v1/iam/users` with `search`, `is_active=true`, `per_page` params, query key `queryKeys.users.list({ search, ...filters })`, returns cursor-paginated `UserResource[]`. `enabled: search.length >= 2`. Used by the Override Assignment dialog combobox. 300ms debounce on the search input. Note: these query params are supported in `UserController.php` but not yet documented in `openapi.json` — see Open Questions Resolved.
- [x] Prefetch strategy: prefetch the task detail query on task board row hover (via `queryClient.prefetchQuery`) to make navigation to details feel instant. This extends the existing `queryKeys.tasks.detail(publicId)` placeholder.
- [x] All response types come from `lib/generated/api-types.ts`; no hand-written API DTOs.
- [x] No `useEffect` + `fetch`; all API calls go through TanStack Query hooks.

### Query Key Structure

> Extend `lib/api/query-keys.ts` (existing `tasks` namespace already has `detail`):

```ts
tasks: {
  all: ['tasks'] as const,
  lists: () => [...queryKeys.tasks.all, 'list'] as const,
  list: (filters) => [...queryKeys.tasks.lists(), filters] as const,
  details: () => [...queryKeys.tasks.all, 'detail'] as const,
  detail: (publicId: string) => [...queryKeys.tasks.details(), publicId] as const,
  priorities: () => [...queryKeys.tasks.all, 'priorities'] as const,
  // NEW for 004:
  slaHealth: (publicId: string) => [...queryKeys.tasks.detail(publicId), 'sla-health'] as const,
  timeline: (publicId: string) => [...queryKeys.tasks.detail(publicId), 'timeline'] as const,
  returns: (publicId: string) => [...queryKeys.tasks.detail(publicId), 'returns'] as const,
},
blueprints: {
  // existing keys...
  // NEW for 004:
  transitions: (blueprintId: string) =>
    [...queryKeys.blueprints.detail(blueprintId), 'transitions'] as const,
},
users: {
  all: ['users'] as const,
  lists: () => [...queryKeys.users.all, 'list'] as const,
  list: (filters: { search: string; is_active?: boolean; per_page?: number }) =>
    [...queryKeys.users.lists(), filters] as const,
},
```

- [x] All new keys are nested under `tasks.detail(publicId)` so that invalidating the detail also enables granular invalidation of sub-queries.
- [x] No hardcoded query key strings in any component.

### State Management

- [x] **TanStack Query**: all API-derived state (task detail, SLA health, timeline, returns).
- [x] **URL state**: `publicId` comes from the route param (`/tasks/[publicId]`). No additional URL params needed for the detail page in MVP (no tab state — the layout uses stacked cards).
- [x] **Zustand**: none required for this spec. No API data in Zustand.
- [x] **Local component state**: dialog open/close states (complete dialog, return dialog, override dialog, suspend/cancel dialogs), completion note input value, return target selection, expand/collapse of timeline entries (completion notes truncated with expand).
- [x] No tab state needed — the layout uses stacked cards, not tabs.

### Mutations

> Reference: `docs/ai/coding-standards.md` — Mutation patterns

- [x] `useCompleteStage()` — `POST /v1/tasks/{task}/stages/{stageInstance}/complete`. On success: invalidate `queryKeys.tasks.detail(publicId)`, `queryKeys.tasks.slaHealth(publicId)`, `queryKeys.tasks.timeline(publicId)`, and `queryKeys.tasks.returns(publicId)`. Also invalidate `queryKeys.taskBoard.lists()` so the board reflects the new stage. Toast on success.
- [x] `useCompleteSubStage()` — `POST /v1/tasks/{task}/sub-stages/{subStageInstance}/complete`. Same invalidation as above.
- [x] `useReturnStage()` — `POST /v1/tasks/{task}/stages/{stageInstance}/return` (`target_stage_id`, `reason`). Same invalidation. On 422, show inline error in dialog (do not close dialog).
- [x] `useReturnSubStage()` — `POST /v1/tasks/{task}/sub-stages/{subStageInstance}/return`. Same pattern.
- [x] `useOverrideAssignment()` — `POST /v1/tasks/{task}/stages/{stageInstance}/override-assignment` (`assignments[]`, `reason`). Invalidate task detail + board lists. Toast on success.
- [x] `useOverrideSubStageAssignment()` — sub-stage variant endpoint.
- [x] `useSuspendTask()` — `POST /v1/tasks/{task}/suspend` (`reason`). Invalidate task detail + SLA health + board lists. Toast.
- [x] `useResumeTask()` — `POST /v1/tasks/{task}/resume`. Invalidate task detail + SLA health + board lists. Toast.
- [x] `useCancelTask()` — `POST /v1/tasks/{task}/cancel` (`reason`). Invalidate task detail + SLA health + board lists. Toast.
- [x] No optimistic updates for stage/lifecycle mutations in MVP — these are state-machine transitions where the server response determines the new state (next stage, completed status, etc.). Simple invalidation is correct and safe.
- [x] All mutations use `toast.success()` / `toast.error()` from sonner for feedback per `coding-standards.md`.

### Error Handling

- [x] 401 → redirect to login (handled globally by query client `QueryCache.onError`).
- [x] 403 → `EmptyState` with lock icon and localized "no permission" message (server ABAC is source of truth).
- [x] 404 → `EmptyState` with "task not found" and link back to `/tasks`.
- [x] 422 (mutation validation, e.g. invalid return target, required sub-stages incomplete, user not assignee) → show backend error message inline in the active dialog; do not close the dialog.
- [x] 500 / network error → `ErrorState` with safe message and retry button (no stack traces, no internal IDs).
- [x] Mutation errors show `toast.error()` with the backend message (localized via `X-Locale` header).

---

## UI Requirements

> Reference: `docs/design-system/01-tokens.md`, `02-glassmorphism.md`, `03-components.md`, `04-layout-patterns.md`, `05-accessibility.md`, `06-anti-patterns.md`

### Component Breakdown

| Component | Type | Source | Notes |
|-----------|------|--------|-------|
| `TaskDetailPage` | Server | Page | `app/(dashboard)/tasks/[publicId]/page.tsx`; renders breadcrumb + top-bar actions + `TaskDetail` |
| `TaskDetail` | Client | Domain | Orchestrates all queries, renders two-column stacked-card layout; handles all 4 states |
| `TaskTopBarActions` | Client | Domain | Lifecycle buttons (suspend/resume/cancel/advance) in the shell top bar, capability-gated |
| `TitleMetaCard` | Client | Domain | Main col card 1: badge row (priority/classification/status/SLA), title, ref, description, bookmark button |
| `StageTimeline` | Client | Domain | Main col card 2: vertical timeline of `TaskStageInstanceResource[]` with stage/sub-stage nodes |
| `StageTimelineNode` | Client | Domain | Single stage node: icon, name, status, assignees, SLA inline status (active), duration, note, actions |
| `SubStageList` | Client | Domain | Nested sub-stage checklist within a stage node |
| `SubStageItem` | Client | Domain | Single sub-stage with status, assignee, note, actions |
| `DetailsCard` | Client | Domain | Sidebar card 1: metadata (status, initiator, blueprint, dept, dates, confidentiality, timestamps) |
| `RecentActivityCard` | Client | Domain | Sidebar card: compact last ~4–5 `TaskTimelineResource` entries + "View Full Audit Trail →" link |
| `ActivityEntry` | Client | Domain | Single compact activity row (dot, actor, action, relative time) |
| `CompleteStageDialog` | Client | Domain | Dialog with optional completion_note textarea + confirm |
| `ReturnStageDialog` | Client | Domain | Dialog with target stage selector (pre-filtered from `BlueprintTransitionResource[]` where `transition_type=return`) + required reason textarea |
| `OverrideAssignmentDialog` | Client | Domain | Dialog with current assignee, debounced user-search combobox (`useUsersSearch`), required reason |
| `UserSearchCombobox` | Client | Domain | Debounced combobox querying `GET /v1/iam/users` with `search` + `is_active=true`; renders `UserResource` with localized name + dept/position |
| `TaskLifecycleDialog` | Client | Domain | Shared AlertDialog for suspend/cancel with required reason |
| `AssigneeAvatarStack` | Client | Domain | Stacked avatars with tooltips (reuses pattern from spec 003 board) |
| `TaskDetailSkeleton` | Client | Domain | Full-page skeleton matching two-column stacked-card layout |
| `SlaBadge`, `TaskStatusBadge`, `PriorityBadge`, `ClassificationBadge` | Client | Domain | Reused from spec 003 (`components/domain/tasks/task-badges.tsx`) |
| `EmptyState`, `ErrorState` | Client | Shared | Reused from `components/shared/` |
| `Button`, `Badge`, `Card`, `Dialog`, `AlertDialog`, `Avatar`, `Tooltip`, `Skeleton`, `Textarea`, `Select`, `Separator`, `ScrollArea` | Client | shadcn | Run `npx shadcn@latest docs <component>` before implementation if adding missing components. **No `Tabs` component needed** (layout uses stacked cards, not tabs). |

### States

| State | Component | Pattern |
|-------|-----------|---------|
| Loading | `TaskDetailSkeleton` | Two-column skeleton: main col (Title & Meta card skeleton, Stage Timeline card skeleton with 4–5 node skeletons + connecting line), sidebar (Details card skeleton with 6 metadata rows, Recent Activity card skeleton with 4 row skeletons). Uses shadcn `Skeleton` with `animate-pulse`. |
| Empty (404) | `EmptyState` | `FileQuestion` icon, "task not found" headline, link to `/tasks` |
| Error (500/network) | `ErrorState` | Safe message + retry button (refetch task detail) |
| No Permission (403) | `EmptyState` | `Lock` icon, localized "no permission" message, link back to `/tasks` |
| Success | `TaskDetail` | Full stacked-card content: Title & Meta, Stage Timeline (main col); Details, Recent Activity (sidebar) |

### Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| Mobile (<640px) | Single column stacked cards: Title & Meta → Stage Timeline → Details → Recent Activity; top-bar actions collapse to overflow menu or compact icon buttons; dialogs full-screen or bottom sheet |
| Tablet (640–1023px) | Single column; sidebar cards (Details, Recent Activity) stack below main column cards; stage timeline full width |
| Desktop (≥1024px) | Two-column `grid-cols-1 lg:grid-cols-3` stacked cards (matching `03-task-details.html` concept): main col spans 2 (Title & Meta, Stage Timeline, future Comments); sidebar spans 1 (Details, future Attachments/Refs, Recent Activity) — sticky on scroll |

### RTL Considerations

- [x] All layout uses logical properties (`ms-`, `me-`, `ps-`, `pe-`, `text-start`, `text-end`, `border-s`, `border-e`). No physical direction classes (`ml-`, `mr-`, `text-left`, etc.).
- [x] Stage timeline connecting lines and node icons align to the start edge (right in RTL, left in LTR). Timeline grows in reading direction (top-to-bottom; vertical line at start edge).
- [x] Breadcrumb `ChevronRight` separator uses `rtl:rotate-180` (reused pattern from spec 003).
- [x] Back arrow icon in breadcrumb uses `rtl:rotate-180`.
- [x] Action buttons and dialog content align `text-start`.
- [x] Avatar stack order follows reading direction (first assignee at start).
- [x] SLA countdown card time values remain LTR even in RTL mode (numbers/durations are not direction-sensitive), but labels align `text-start`.
- [x] Side panel sticky position works on both edges (uses logical `start` / `end` anchoring).

### Accessibility

- [x] All interactive elements (action buttons, dialog controls, tab triggers) have visible focus rings (`focus-visible:ring-2`).
- [x] Icon-only buttons (copy public_id, close dialogs) have `aria-label` in the active locale.
- [x] SLA badges use color + text label — never color-only (per `05-accessibility.md` SLA contrast rules).
- [x] Stage timeline uses semantic structure: each node is a `<article>` or `<li>` within an `<ol>`; status conveyed via `aria-label` or `role="status"`.
- [x] Dialogs (complete, return, override, suspend/cancel) trap focus on open, return focus to trigger on close, close on `Escape` (shadcn `Dialog`/`AlertDialog` handle this automatically).
- [x] Required form fields (return reason, cancel reason, suspend reason) are marked `aria-required="true"`; validation errors linked via `aria-describedby`.
- [x] Touch targets ≥ 44px on mobile for all action buttons.
- [x] `prefers-reduced-motion` disables the active stage pulse animation and skeleton `animate-pulse` (use `motion-reduce:animate-none`).
- [x] Screen reader: the active stage node announces "Current stage: [name], assigned to [names], [SLA status]" via `aria-live="polite"` region or `sr-only` summary.

### Animation

- [x] Active stage node: blue pulse dot (`animate-pulse`) to draw attention; disabled under `prefers-reduced-motion`.
- [x] Skeleton: `animate-pulse` on all skeleton elements; disabled under `prefers-reduced-motion`.
- [x] Dialog open/close: shadcn default `animate-in fade-in` overlay + `animate-in zoom-in-95` content.
- [x] Stage timeline node hover: subtle background tint (`transition-colors duration-200`), no lift/transform (timeline is not a card grid).
- [x] Toast: sonner default slide-in animation.
- [x] No glass effects on timeline nodes or dense content areas (per `02-glassmorphism.md` — glass is deferred and not for dense data).
- [x] No hover lift on timeline nodes (per spec 003 established pattern — no hover lift on dense rows).

---

## Non-Functional Requirements

### Performance

- [x] Task detail prefetch on board row hover (`queryClient.prefetchQuery` with `queryKeys.tasks.detail(publicId)`) to make navigation feel instant.
- [x] SLA health, timeline, and returns queries run in parallel on page mount (independent `useQuery` hooks, TanStack handles deduplication).
- [x] Timeline and returns responses are full lists (no pagination per backend spec 006); render directly without infinite scroll complexity. If the activity timeline grows large in practice, revisit with cursor pagination.
- [x] No heavy chart or canvas components on this page — no `next/dynamic` needed for MVP.
- [x] Memoize the stage instance filter/sort computations via `useMemo` if the stages array is processed (sorting by `created_at`, filtering active vs completed).

### Security

- [x] Backend ABAC is the source of truth for task visibility — client never reconstructs visibility rules.
- [x] Capability checks (`useCapability('task.override_assignment')`, `useCapability('task.suspend_resume')`, `useCapability('task.cancel')`) hide action buttons for UX only; server returns 403 regardless.
- [x] Stage complete/return buttons hidden when current user is not an active assignee (checked against `TaskStageAssignmentResource.user_id` + `is_completed`); server validates via `UserNotAssigneeException` (422).
- [x] No PII (assignee email, mobile, employee ID) in URLs or console logs. Assignee display uses `user_name_ar` / `user_name_en` only.
- [x] Confidential tasks (`classification_level=confidential`) render only metadata the backend returns; no client-side data enrichment that could leak PII.
- [x] No `console.log` of task data in committed code.
- [x] No `dangerouslySetInnerHTML` — task description is plain text with line-break preservation (React escapes by default).

### Testing

> Reference: `docs/ai/testing-policy.md`

- [x] Component tests for `TaskDetail`: loading skeleton, success (full stacked-card content), 404 empty, 403 no-permission, 500 error.
- [x] Component tests for `StageTimeline`: completed/active/pending/returned node rendering, sub-stage checklist, assignee avatar stack, SLA inline status on active node.
- [x] Component tests for `RecentActivityCard`: compact feed renders last ~4–5 events, "View Full Audit Trail →" link present.
- [x] Interaction tests: complete stage dialog (fill note → submit → success toast), return stage dialog (verifies only valid return targets from transitions are selectable + reason → submit), cancel task dialog (reason → submit → success).
- [x] Interaction test: override assignment dialog (search user via combobox → select → enter reason → submit → success toast); verifies `useUsersSearch` debounce and `is_active` filter.
- [x] Capability gating test: override button hidden without `task.override_assignment`; suspend/cancel hidden without relevant capabilities; top-bar actions reflect task status.
- [x] Badge tests: reuse existing spec 003 badge tests; add SLA health mapping tests for `on_track` / `warning` / `breached` / `none`.
- [x] MSW handlers for: `GET /tasks/{publicId}` (TaskDetailResource), `GET /tracking/sla/tasks/{publicId}` (TaskSlaHealthResource), `GET /tasks/{publicId}/timeline`, `GET /tasks/{publicId}/returns`, `GET /blueprints/{blueprintId}/transitions` (BlueprintTransitionResource[]), `GET /iam/users?search=...` (UserResource[] cursor-paginated), and all mutation endpoints.
- [x] Both locales tested (AR RTL + EN LTR) for the stage timeline layout, breadcrumb, and stacked-card two-column layout.
- [x] Tests use `renderWithProviders` wrapper with fresh `QueryClientProvider` per test.

---

## Out of Scope

- **Comments & collaboration** (backend 013, ⬜ Not Started) — no comment input, list, or reply UI. The page architecture should reserve a tab/section insertion point but not implement it. Deferred until backend 013 is stable.
- **Document attachments** (backend 012, ⬜ Not Started) — no file upload, preview, or download UI. Per `AGENTS.md` critical rules: "No DMS UI". Deferred until backend 012 is stable.
- **External references** (backend 014, ⬜ Not Started) — no external reference display, add, or search. Deferred.
- **Task creation / draft editing / launch form** — the create-task flow (select blueprint, fill metadata, provide manual assignments, launch) is a separate frontend spec. This spec shows the task detail view only. Draft tasks display basic info and a "not yet launched" indicator; the launch action and draft editing form are out of scope.
- **Manual escalation creation / resolution** (backend 007, paired with frontend `007-follow-up-center`) — the escalate/resolve UI belongs to the follow-up center. This spec consumes SLA health for read-only display only.
- **Follow-up action logging** (backend 010, paired with frontend `007-follow-up-center`) — logging manual follow-up actions (phone calls, messages) is a follow-up center feature, not task details.
- **Workflow visualization diagram** (frontend `005-workflow-visualization`, backend 006) — the graphical stage/transition diagram is a separate spec. This spec shows the stage timeline (vertical list), not a visual flow graph.
- **User profile / directory links** — assignee names are plain text in MVP (user directory is V2, feature #17).
- **Task archiving** — logical archive exists in backend but archiving UI is deferred.
- **Real-time updates** — no websocket/SSE; data is fetched on mount and invalidated after mutations. Manual refresh via retry on error.
- **Full audit trail view** — the sidebar "Recent Activity" card shows a compact feed; the full chronological audit trail view (all timeline entries) is a future route/dialog, not MVP.
- **Saved views / bookmarks** — deferred to V2.

---

## Open Questions — Resolved

- [x] **Return target selection UX** — **Option (b): pre-filter valid return targets from the blueprint transitions API.** `GET /v1/blueprints/{blueprintId}/transitions` returns `BlueprintTransitionResource[]` with `transition_type` (1=advance, 2=return), `from_stage_id`, `to_stage_id`, and `return_reason_required`. The return dialog fetches the blueprint's transitions, filters to `transition_type=return` where `from_stage_id` matches the current stage's `blueprint_stage.public_id`, and offers only the valid `to_stage_id` targets as selectable options. This reads the authoritative contract — it does not duplicate transition logic. The `GET /v1/blueprints/{blueprintId}` show endpoint also eager-loads transitions (confirmed in `BlueprintController.php`), so the transitions may already be available via the blueprint show response; the dedicated transitions endpoint is the cleaner source. 422 errors are still handled gracefully (defensive), but the UX should never present an invalid target.
- [x] **User picker for assignment override** — **Use `GET /v1/iam/users` with a debounced combobox.** The endpoint supports `search`, `is_active`, `account_type`, `department_id`, and `per_page` query params (confirmed in `UserController.php:33`; note: these params are not yet documented in `openapi.json` — the OpenAPI schema only lists `X-Tenant`, but the code accepts them). The combobox debounces search input by 300ms, filters to `is_active=true`, and renders `UserResource` results with `name_ar`/`name_en` + department/position context. No new endpoint needed. **Action item:** regenerate `api-types.ts` or add the query params manually if the OpenAPI schema is not updated before implementation.
- [x] **Draft task handling** — **Out of scope.** `POST /v1/tasks/{task}/launch` exists (backend 005 ✅) but launching requires manual assignments for ManualAtLaunch stages, which is a form UX, not a single button. Draft tasks show basic info + "not yet launched" indicator. Launch and draft editing belong to a future create-task spec.
- [x] **SLA health endpoint dependency** — **Accepted.** `GET /v1/tracking/sla/tasks/{task}` is in backend M5 (✅ Done, stable). SLA health display is essential for the task details page (features #82, #83). The escalation management UI (create/resolve) remains in the follow-up center scope (frontend `007-follow-up-center`).
- [x] **Activity timeline** — **`useQuery` for MVP, full list render.** `GET /v1/tasks/{task}/timeline` returns the full `TaskTimelineResource` collection with no pagination backend-side. The backend has no blocker for showing all entries — truncating to ~5 in the sidebar Recent Activity card is purely a UI card design choice, not a backend limitation. The full list is fetched once and sliced client-side for the compact card; a future "View Full Audit Trail" view renders all entries.
- [x] **Return history** — **Folded into the stacked-card layout per the concept.** `GET /v1/tasks/{task}/returns` returns the `StageReturnResource` collection. Returns are shown inline on returned stage nodes (with `return_reason`) and as entries in the recent activity feed (the timeline endpoint already includes return events). No separate return-history section or tab.

---

→ **Next:** Review this spec. Do not create `plan.md` until the draft is approved.