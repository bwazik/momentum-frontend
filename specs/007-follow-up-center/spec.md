# Spec: Follow-Up Center

> **Number:** 007
> **Date:** 2026-06-24
> **Status:** `completed`
> **Milestone:** F4 — Follow-up & Workflow Viz
> **Depends on:** `003-task-board`, `006-workflow-visualization`
> **Backend spec:** `../backend/specs/007-sla-escalation/`, `../backend/specs/010-follow-up-board/` — `Contract status: stable`
> **Contract status:** `stable`
> **Author:** Codex
> **Branch:** `feat/007-follow-up-center`
> **Base branch:** `main`

---

## Problem

Follow-up specialists (*متابعة*), department directors, and senior managers need a single operational hub to answer "what is stuck, who has the ball, and what has already been tried?" Today they must piece this together from the general task board, the SLA/escalation APIs, phone calls, and ad-hoc messages. There is no dedicated place to:

- See a monitoring-scope-aware summary of active, at-risk, overdue, and recently-followed work.
- Identify cross-department bottlenecks at a glance.
- Log and view manual follow-up actions (phone calls, messages, meetings) against a task.
- See open escalations and resolve them with a note.

Without a follow-up center, the organization loses the operational accountability layer that Gov TMS promises.

---

## Goal

Deliver `/follow-up` as the primary operational follow-up workspace inside the authenticated dashboard shell. The screen aggregates the stable backend follow-up board API, SLA/escalation APIs, and the follow-up action log into one view:

- A monitoring-scope-aware header with stats cards and an alert banner for overdue work.
- A filterable, cursor-paginated follow-up board showing tasks with SLA health, current stage, assignees, department, and time at stage.
- A stage bottleneck panel ranking stage-type + department combinations by overdue/at-risk load.
- A recent manual follow-up actions panel.
- An open escalations panel with the ability to resolve escalations inline.
- Row/cell actions to log a follow-up action, escalate a task, or open task details/workflow.

The follow-up center is read-only with respect to task execution state; it only writes follow-up action log entries and escalation resolutions through dedicated backend endpoints.

---

## User Stories

### Follow-Up Specialist

- As a **follow-up specialist**, I want a scope-aware summary of tasks in my monitoring grant, so that I know the volume of active, at-risk, overdue, and recently-followed work at a glance.
- As a **follow-up specialist**, I want an alert banner when tasks in my scope are overdue by more than N days, so that I can act on the most critical items first.
- As a **follow-up specialist**, I want to filter the board by status, department, stage type, priority, blueprint category, assignee, and date range, so that I can triage a specific queue.
- As a **follow-up specialist**, I want to see time elapsed at the current stage in working hours/days, so that I can prioritize stalled work.
- As a **follow-up specialist**, I want to log a manual follow-up action against a task with a type, note, and optional contact name, so that the next person knows what was already tried.
- As a **follow-up specialist**, I want to see recent follow-up actions across my scope, so that I can coordinate with my team.
- As a **follow-up specialist**, I want to see stage-level bottlenecks by department, so that I can target systemic delays.

### Department Director / Manager

- As a **department director**, I want to filter the board to tasks whose current stage is owned by my department, so that I can focus on work flowing through my directorate.
- As a **manager**, I want to see open escalations assigned to me or my position, so that I can decide what action is needed.
- As a **manager**, I want to resolve an escalation with a written action note, so that the escalation history shows how it was handled.

### System

- As the **system**, I want all follow-up center endpoints to enforce ABAC visibility and confidentiality rules, so that sensitive tasks are never leaked.
- As the **system**, I want follow-up action log entries to be append-only, so that follow-up history is reliable.
- As the **system**, I want the board to poll for fresh SLA health periodically, so that overdue/at-risk status stays current without a full page reload.

---

## Acceptance Criteria

### Route and Page Structure

- [x] Route `/follow-up` renders inside the authenticated dashboard shell.
- [x] The page header shows the localized title "Follow-Up Center" / "مركز المتابعة" and a short description of the monitoring scope.
- [x] The page uses the standard list-page layout: header, summary stats, alert banner, filter bar, data view, and supporting side panels.
- [x] The route is reachable from the sidebar "Follow-Up" nav item (already present in shell).

### Summary Stats

- [x] Four stat cards at the top of the page:
  - **Monitoring Scope** — count of active tasks visible to the user in their scope.
  - **At Risk** — count of tasks with `sla_health = amber` (active stage SLA in warning).
  - **Overdue** — count of tasks with `sla_health = red` (active stage SLA breached).
  - **Follow-ups Today** — count of manual follow-up actions logged by the current user today.
- [x] Stat cards update when filters change (scope-aware counts).
- [x] Overdue and at-risk cards use tinted borders matching their semantic color.

### Alert Banner

- [x] A dismissible alert banner appears when there are tasks in scope overdue by more than 3 days.
- [x] The banner shows the count and a "View All" link that applies the overdue filter to the board.
- [x] The banner is not shown if no tasks match the threshold.

### Follow-Up Board

- [x] The board fetches `GET /v1/follow-up/board` using generated OpenAPI types for `BoardTaskResource`.
- [x] Desktop table columns include: SLA health, Task (rich cell with `display_id`, localized title, classification badge, status badge, priority badge), Current Stage (with stage type + department subtext), Assignees (stacked avatars), Time at Stage (with due date subtext), Actions.
- [x] Row accent border (`border-s-4`) is derived from SLA health color, consistent with the task board pattern.
- [x] SLA health text label and dot use the standard mapping: green=on track, amber=at risk, red=overdue, grey=suspended.
- [x] Time at stage is formatted in working hours/days from `time_at_current_stage_seconds`.
- [x] Row click navigates to `/tasks/[publicId]`.
- [x] Actions dropdown per row includes: Open Details, Open Workflow, Log Follow-Up, Escalate (capability-gated).

### Filters and Search

- [x] URL search params drive board filters so the view is bookmarkable and back-button friendly.
- [x] Quick filter chips include: Active (default), My Tasks, Overdue, At Risk, Suspended, All.
- [x] "My Tasks" maps to `assignee_id={currentUser.public_id}`.
- [x] Advanced filters in a collapsible panel or Sheet on mobile: Department, Stage Type, Priority (multi-select), Blueprint Category, Date Range, Search.
- [x] Sort dropdown with field select (`time_at_stage`, `priority`, `due_date`, `created_at`, `department`, `stage_type`) + ascending/descending toggle.
- [x] Default sort is `time_at_stage` descending.
- [x] Reset filters button clears all filter search params.
- [x] External reference filter is omitted; backend rejects it until Spec `014-external-references` is implemented.

### Pagination

- [x] Board uses `useInfiniteQuery` with cursor pagination and a manual "Load more" button.
- [x] Previously loaded rows remain visible while the next page loads.

### Bottleneck Panel

- [x] Fetches `GET /v1/follow-up/bottlenecks` and shows a bounded preview (first 5 items) of stage-type + department combinations.
- [x] "View all" link opens a Dialog showing the full list.
- [x] Each item shows: stage type + department name on one line, side-by-side overdue count (red) and at-risk count (amber), and average time at stage.
- [x] Left border accent: red (`bg-red-500`) when `overdue_count > 0`, amber (`bg-amber-500`) otherwise.
- [x] Items are sorted by the backend score (`overdue_count × 2 + at_risk_count`) descending.
- [x] Clicking a bottleneck item applies the corresponding `stage_type_id` and `department_id` filters to the board.

### Recent Follow-Up Actions Panel

- [x] Fetches `GET /v1/follow-up/actions` — a dedicated cross-task recent-actions endpoint (cursor-paginated).
- [x] Shows the most recent actions across all tasks visible to the user (not client-side aggregation).
- [x] Each action renders as an `ActionEntry` with three-line metadata layout: note (localized), author + contact name (second line), dual date + time with HH:MM (third line).
- [x] Action type icon color-mapped: `PhoneCall`, `MessageSquare`, `Users`, `Mail`, `HelpCircle`.
- [x] Panel shows preview (first 3 items) with "View all" link.
- [x] "View All" opens a Dialog with `ScrollArea` and a "Load More" button for cursor-based pagination.

### Manual Follow-Up Action Log

- [x] "Log Follow-Up" button opens a Dialog with a form:
  - Action type select: Phone Call, Message, Meeting, Email, Other.
  - Bilingual note fields: Arabic (required), English (optional).
  - Contact name input (optional).
- [x] Submitting the form calls `POST /v1/follow-up/tasks/{task}/actions`.
- [x] On success, the dialog closes, a success toast appears, and related queries are invalidated.
- [x] Validation errors appear below fields.

### Escalations Panel

- [x] Fetches `GET /v1/tracking/escalations?status=1` (open escalations) scoped to tasks visible to the user.
- [x] Timeline feed layout with circular icons connected by a vertical line: `AlertTriangle` in red circle for auto escalations, `User` in amber circle for manual escalations.
- [x] Shows escalations with event sentence (e.g. "Auto escalation — T-2026-0001"), notified/escalated-to name, reason in quotes, and date.
- [x] Open/Resolved tab toggle at the top filters the query (`status=1` or `status=2`).
- [x] Panel shows preview (first 3 items) with "View all" link opening a Dialog with `ScrollArea` + "Load More" for cursor-paginated browsing.
- [x] Managers/target users can resolve an escalation with a mandatory resolution note via `POST /v1/tracking/escalations/{escalation}/resolve`.
- [x] Resolved escalations disappear from the open list on success.
- [x] "Escalate" row action opens a dialog to create a manual escalation (`POST /v1/tracking/escalations`) with mandatory reason and optional target position.

### Responsive Behavior

- [x] Desktop (`>=1024px`) shows stats row, full board table, and side panels (bottlenecks + actions/escalations) in a two-column layout.
- [x] Tablet (`640px–1023px`) stacks side panels below the board; filters wrap into two rows.
- [x] Mobile (`<640px`) shows cards instead of the table; side panels collapse into accordions or a bottom Sheet.

### States

- [x] Loading state shows skeleton stats, skeleton table rows/cards, and skeleton side panels matching final shapes.
- [x] Empty state appears when the board returns no tasks; includes reset filters CTA.
- [x] Error state shows a safe message and retry button via `ErrorState`.
- [x] No-permission state appears when the user lacks any required capability.

---

## Technical Requirements

> Reference: `docs/ai/coding-standards.md`

### Data Fetching

- [x] `useFollowUpBoardInfinite(filters)` uses `useInfiniteQuery`, `queryKeys.followUp.board.list(filters)`, and `GET /v1/follow-up/board`.
- [x] `useFollowUpOverdueInfinite(filters)` and `useFollowUpAtRiskInfinite(filters)` reuse the same query hook structure against `GET /v1/follow-up/overdue` and `GET /v1/follow-up/at-risk` for the alert banner and quick views.
- [x] `useFollowUpBottlenecks(filters)` uses `useQuery` and `GET /v1/follow-up/bottlenecks`.
- [x] `useAllFollowUpActions(filters)` uses `useInfiniteQuery` and `GET /v1/follow-up/actions` (cross-task endpoint for recent-actions panel).
- [x] `useFollowUpActionsInfinite(taskPublicId)` uses `useInfiniteQuery` and `GET /v1/follow-up/tasks/{task}/actions`.
- [x] `useCreateFollowUpAction()` uses `useMutation` and `POST /v1/follow-up/tasks/{task}/actions`.
- [x] `useEscalationsInfinite(filters)` uses `useInfiniteQuery` and `GET /v1/tracking/escalations`.
- [x] `useCreateEscalation()` uses `useMutation` and `POST /v1/tracking/escalations`.
- [x] `useResolveEscalation()` uses `useMutation` and `POST /v1/tracking/escalations/{escalation}/resolve`.
- [x] Lookup hooks reuse existing patterns: `useTaskPriorities()`, `useDepartments()`, `useBlueprintCategories()`, `useStageTypes()` from the task board domain.
- [x] Stats counts are derived from the same board response plus the follow-up actions query; no separate "stats" endpoint is required.
- [x] Prefetch strategy: not implemented in MVP.

### Query Key Structure

- [x] Extend `lib/api/query-keys.ts` with:
  - `queryKeys.followUp.all`
  - `queryKeys.followUp.board.lists()` / `queryKeys.followUp.board.list(filters)`
  - `queryKeys.followUp.overdue.lists()` / `queryKeys.followUp.overdue.list(filters)`
  - `queryKeys.followUp.atRisk.lists()` / `queryKeys.followUp.atRisk.list(filters)`
  - `queryKeys.followUp.bottlenecks(filters)`
  - `queryKeys.followUp.actions.task(taskPublicId)`
  - `queryKeys.followUp.actions.all(filters)` (cross-task actions list)
  - `queryKeys.escalations.all` / `queryKeys.escalations.list(filters)` / `queryKeys.escalations.detail(publicId)`
- [x] Filter objects included in query keys are memoized via `useMemo`.
- [x] No component uses hardcoded query key strings.

### State Management

- [x] Filters, search, and sort live in URL search params (`useSearchParams`).
- [x] API data stays in TanStack Query only.
- [x] No follow-up data is stored in Zustand.
- [x] Local component state is used only for transient UI: dialog open/close, search input before debounce, alert banner dismissed state.

### Mutations

- [x] `useCreateFollowUpAction()` invalidates:
  - `queryKeys.followUp.actions.task(taskPublicId)`
  - `queryKeys.followUp.actions.all({})`
  - `queryKeys.followUp.board.lists()`
- [x] `useResolveEscalation()` invalidates:
  - `queryKeys.escalations.list(filters)`
  - `queryKeys.followUp.board.lists()`
- [x] `useCreateEscalation()` invalidates:
  - `queryKeys.escalations.lists()`
  - `queryKeys.followUp.board.lists()`
- [x] All mutation success/error toasts use localized strings via `useTranslations('followUp')`.

### Error Handling

- [x] 401 is handled globally by the query client and redirects to `/login`.
- [x] 403 renders a no-permission `EmptyState`.
- [x] 422 filter validation errors are surfaced inline or as a toast; invalid filter combinations reset gracefully.
- [x] 500/network errors render `ErrorState` with retry and do not expose stack traces.
- [x] Polling failures do not crash the UI; the last successful data remains visible and a subtle error indicator is shown.

---

## UI Requirements

> Reference: `docs/design-system/01-tokens.md`, `02-glassmorphism.md`, `03-components.md`, `04-layout-patterns.md`, `05-accessibility.md`, `06-anti-patterns.md`

### Component Breakdown

| Component | Type | Source | Notes |
|-----------|------|--------|-------|
| `FollowUpPage` | Server | Page | `app/(dashboard)/follow-up/page.tsx`; renders page shell and translated title |
| `FollowUpCenter` | Client | Domain | Orchestrates stats, board, panels, and dialogs |
| `FollowUpStats` | Client | Domain | Four stat cards with scope-aware counts |
| `FollowUpAlertBanner` | Client | Domain | Dismissible overdue alert with "View All" action |
| `FollowUpFilters` | Client | Domain | Thin wrapper around shared `BoardFilters` |
| `FollowUpBoard` | Client | Domain | Fetches and renders board data |
| `FollowUpBoardTable` | Client | Domain | Thin wrapper around shared `BoardTable` with follow-up actions |
| `FollowUpBoardMobileList` | Client | Domain | Mobile card list |
| `FollowUpTaskCard` | Client | Domain | Thin wrapper around shared `BoardTaskCard` with follow-up labels |
| `BottleneckPanel` | Client | Domain | Top 5 preview + "View all" Dialog; side-by-side overdue/at-risk counts; red/amber left border accent |
| `RecentActionsPanel` | Client | Domain | Cross-task `GET /v1/follow-up/actions`; 3-line ActionEntry; "View all" Dialog with ScrollArea + Load More; reports `actionsTodayCount` to parent |
| `EscalationsPanel` | Client | Domain | Timeline feed layout with circular icons + connecting line; Open/Resolved tab toggle; "View all" Dialog with ScrollArea + Load More |
| `LogFollowUpDialog` | Client | Domain | Form to create a follow-up action |
| `EscalateDialog` | Client | Domain | Form to create a manual escalation |
| `ResolveEscalationDialog` | Client | Domain | Form to resolve an escalation |
| `FollowUpBoardSkeleton` | Client | Domain | Skeleton for stats, filters, table, and cards |
| `BoardTable` | Client | Shared | Shared 6-column table with configurable `renderActions` prop |
| `BoardTaskCard` | Client | Shared | Shared mobile card with optional `onLogFollowUp`/`onEscalate` callbacks |
| `BoardFilters` | Client | Shared | Shared filter bar: ToggleGroup, debounced search, sort, AdvancedFiltersSheet |
| `AdvancedFiltersSheet` | Client | Shared | Shared filter Sheet: department, stage type, priority, category, date range |
| `SlaBadge`, `TaskStatusBadge`, `PriorityBadge`, `ClassificationBadge` | Client | Domain/shared | Reuse task board badges |
| `EmptyState`, `ErrorState`, `PageHeader` | Client | Shared | Reuse existing shared components |
| `Button`, `Badge`, `Card`, `Table`, `Input`, `Select`, `Dialog`, `DropdownMenu`, `Skeleton`, `Tooltip`, `Sheet`, `Accordion`, `Textarea` | Client | shadcn | Run `npx shadcn@latest docs <component>` before implementation if adding missing components |

### States

| State | Component | Pattern |
|-------|-----------|---------|
| Loading | `FollowUpBoardSkeleton` | Skeleton stats cards + 8 table skeleton rows / 5 card skeletons + skeleton side panels |
| Empty | `EmptyState` | Icon, headline, short copy, reset filters button when filtered |
| Error | `ErrorState` | Safe message and retry button |
| No Permission | `EmptyState` | Lock icon, localized message |
| Success | `FollowUpBoardTable` / `FollowUpBoardMobileList` + panels | Loaded data and pagination |

### Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| Mobile (<640px) | Single-column layout; board renders cards; stats grid 2×2; side panels collapse into accordions; filters in a Sheet |
| Tablet (640–1023px) | Board table with reduced columns; stats grid 4 columns; side panels stack below board; filters wrap |
| Desktop (≥1024px) | Two-column layout: main column (board) + sticky side column (bottlenecks + recent actions + escalations); full stats row; full table |

### RTL Considerations

- [x] All new components use only logical properties (`ms-`, `me-`, `ps-`, `pe-`, `text-start`, `text-end`, `border-s`, `border-e`, `start-*`, `end-*`).
- [x] Directional icons (`ChevronRight`, `ArrowLeft`, `ArrowUpDown`) use `rtl:rotate-180`.
- [x] Table text columns align `text-start`; actions column aligns `text-end`.
- [x] Stat card icon positioning flips with logical properties.
- [x] Mobile cards preserve the same information hierarchy in RTL and LTR.

### Accessibility

- [x] All interactive elements have visible focus rings.
- [x] Icon-only buttons (row actions, sort direction, close banner) have `aria-label`.
- [x] SLA badges use color + text label — never color-only.
- [x] Table uses semantic `<table>`, `<thead>`, `<th scope="col">`, and accessible row labels.
- [x] Filter controls have labels via `sr-only` `FieldLabel` or `aria-label`.
- [x] Dialogs trap focus, close on Escape, and return focus to the trigger on close.
- [x] Form fields have associated labels and error messages via `aria-describedby`.
- [x] Loading states use `Skeleton` with `animate-pulse` and `motion-reduce:animate-none`.
- [x] Touch targets are ≥ 44px on mobile.

### Animation

- [x] Skeleton uses `animate-pulse` (shadcn default).
- [x] Stat cards use `transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5`.
- [x] Dialog overlay uses `animate-in fade-in`.
- [x] All motion respects `prefers-reduced-motion` via `motion-reduce:` variants.
- [x] No glass effects on table rows or dense lists.

---

## Non-Functional Requirements

### Performance

- [x] Cursor pagination with manual "Load more"; do not load all tasks at once.
- [x] Search debounced by 300ms.
- [x] Filters memoized via `useMemo` in query key dependencies.
- [x] Task deduplication via `Set` on page flattening.
- [x] Board data refreshes every 60 seconds via `refetchInterval` to keep SLA health current.
- [x] Bottleneck panel cached by backend (300s TTL); no client-side cache beyond TanStack Query defaults.
- [x] No client-side filtering of server results.

### Security

- [x] Backend ABAC is the source of truth for visible tasks and escalations.
- [x] Client does not reconstruct visibility rules.
- [x] Capability checks hide actions the user likely cannot perform (`task.escalate`, `task.resolve_escalations`, follow-up action logging).
- [x] No PII written to URLs.
- [x] No `console.log` of task, escalation, or follow-up action data.
- [x] Confidential tasks render only metadata with the classification badge.

### Testing

- [x] Component tests cover loading, success, empty, error, and no-permission states.
- [x] Tests cover filter interactions (quick chips, search, reset).
- [x] Tests cover logging a follow-up action and resolving an escalation.
- [x] Tests cover RTL layout for at least one populated state.
- [x] Tests use MSW handlers for board, overdue, at-risk, bottlenecks, actions, and escalations endpoints.
- [x] SLA badge tests assert text appears with correct labels.

---

## Out of Scope

- Real-time websocket updates for board changes.
- Bulk follow-up actions or bulk escalation resolution.
- Editing or deleting follow-up action log entries (append-only in MVP).
- Export to CSV/PDF.
- Saved filter configurations or personal watchlists.
- External reference filtering until backend Spec `014-external-references` is implemented.
- Advanced charts or analytics beyond the bottleneck list.
- Chain escalation beyond first-level manager.
- Creating tasks or modifying task execution state from the follow-up center.
- Full-screen follow-up action log history page (panel only in MVP).

---

## Open Questions — Resolved

- [x] **Recent actions panel data source?** Approved: dedicated cross-task endpoint `GET /v1/follow-up/actions` (added during implementation). Replaced the planned client-side aggregation from first 3 board tasks (which would have caused N+1 queries). Uses `useAllFollowUpActions` (cursor-paginated `useInfiniteQuery`). Single query, cursor-paginated, no N+1 concern.
- [x] **Escalations panel scope?** Approved: all open escalations visible to the user (`GET /v1/tracking/escalations?status=1`), not just those assigned to the current user. Resolve action gated by `task.resolve_escalations` capability OR being the escalation target (the person assigned the escalation). Matches the operational "see everything stuck" intent of the follow-up center.
- [x] **Bottleneck items clickable to filter the board?** Approved: yes — clicking a bottleneck item writes `stageTypeId` + `departmentId` to the URL search params, which drives the board query. High-value UX at low implementation cost.
- [x] **Default monitoring-scope label when org-wide?** Approved: "Organization-wide" / "على مستوى الجهة" when user has `task.view.organization`; otherwise "Monitoring Scope" / "نطاق المتابعة" (generic). Matches spec recommendation.
- [x] **Board default status?** Approved: `status=active` when no `status`/`scope` URL param present. "All" quick filter clears `status`. Matches task board (003) precedent and spec recommendation.
- [x] **Stats card data source (no dedicated stats endpoint)?** Approved: page-local counts derived from the currently-loaded board rows (MVP). "Monitoring Scope" = `allTasks.length`; "At Risk" = count of `sla_health === 'amber'`; "Overdue" = count of `sla_health === 'red'`; "Follow-ups Today" = recent-actions created today. Backend cursor pagination returns no total count; three extra `per_page=100` queries would be heavy and still capped. Page-local counts are honest, update with filters, and need no extra endpoint.
- [x] **Alert banner "overdue by more than 3 days" threshold?** Approved: MVP triggers banner when overdue count > 0, text: "N tasks in your scope are overdue". "View All" applies `status=overdue` to the board. `BoardTaskResource` exposes `time_at_current_stage_seconds` but not breach duration — computing exact "days overdue" is not possible without the SLA timer deadline.

---

→ **Next:** Read `docs/ai/coding-standards.md` before creating `plan.md`.
