# Spec: Analytics & Reporting — Task Aging Report

> **Number:** 009
> **Date:** 2026-07-09
> **Status:** `completed`
> **Milestone:** F5 — Dashboards & Analytics
> **Depends on:** `003-task-board`, `007-follow-up-center`
> **Backend spec:** `../backend/specs/009-analytics-reporting/` — `Contract status: stable`
> **Contract status:** `stable`
> **Author:** OpenCode
> **Branch:** `feat/009-analytics-reporting`
> **Base branch:** `main`

---

## Problem

Executives, department managers, and follow-up specialists all need to answer one operational question: *which work has been stuck the longest?* Today the task board shows tasks but is optimized for search and triage, not for ranking work by stagnation. The follow-up center surfaces overdue and at-risk items for active monitoring, but it is an operational workspace with side panels, action logging, and escalations — not a clean, read-only report sorted by age.

Without a dedicated aging report, users must manually scan the task board or follow-up board to find tasks that have sat at their current stage the longest. This is inefficient and makes it hard to prioritize manual follow-up or weekly review meetings.

---

## Goal

Deliver `/analytics/aging` as the first analytics screen: a read-only, filterable report that lists open tasks sorted by how long they have been waiting at their current stage (oldest first). The page reuses the established board table patterns from the task board and follow-up center, but strips away operational actions and side panels so the user can focus purely on identifying stalled work.

This spec intentionally covers only the **Task Aging Report**. The executive dashboard (`002-executive-dashboard`) and department manager dashboard (`012-department-manager-dashboard`) are separate frontend specs that consume other analytics endpoints under the same backend module.

---

## User Stories

### Follow-Up Specialist

- As a **follow-up specialist**, I want a report of all open tasks sorted by time at current stage, so that I can prioritize the work that has been stuck the longest.
- As a **follow-up specialist**, I want to filter the aging report by status, priority, department, blueprint category, and date range, so that I can narrow the report to the scope I am monitoring.
- As a **follow-up specialist**, I want to see the current stage, active assignees, and SLA health for each aging task, so that I know who to contact and how urgent it is.

### Department Director / Manager

- As a **department director**, I want to filter the aging report to tasks whose current stage is owned by my department, so that I can identify stalled work inside my directorate.
- As a **manager**, I want to see how long each task has been at its current stage in working hours/days, so that I can run data-driven follow-up meetings.

### Executive

- As an **executive**, I want to open the aging report from the analytics navigation, so that I can inspect the oldest stalled work across the organization without searching the operational boards.

### System

- As the **system**, I want the aging report to be read-only and enforce the same ABAC visibility rules as the task board, so that confidential or out-of-scope tasks are never leaked.

---

## Acceptance Criteria

### Route and Page Structure

- [x] Route `/analytics/aging` renders inside the authenticated dashboard shell.
- [x] The page header shows the localized title "Aging Report" / "تقرير تقادم المهام" and a short description.
- [x] The route is reachable from the sidebar "Analytics" nav item linking directly to `/analytics/aging`.
- [x] The page uses the standard list-page layout: header, filter bar, data table, manual pagination.

### Data Fetching

- [x] The report fetches `GET /api/v1/analytics/tasks/aging` using generated OpenAPI types.
- [x] The endpoint returns tasks sorted by `entered_at` ascending (oldest current stage first).
- [x] The response uses cursor pagination (`data`, `next_cursor`, `has_more`).

### Table Columns

- [x] Desktop table columns include: SLA health, Task (localized title), Priority, Current Stage, Active Assignees (stacked avatars), Time at Stage (calendar), Created At.
- [x] Row accent border (`border-s-4`) is derived from SLA health color, consistent with the task board pattern.
- [x] SLA health text label and dot use the standard mapping: green=on track, amber=at risk, red=overdue, grey=suspended.
- [x] Time at stage is formatted in calendar days/hours from `entered_at`.
- [x] Row click navigates to `/tasks/[publicId]`.
- [x] No row actions are required (read-only report).

### Filters and Search

- [x] URL search params drive report filters so the view is bookmarkable and back-button friendly.
- [x] Quick filter chips include: Active (default), Suspended, All.
- [x] Advanced filters in a Sheet on mobile: Department, Priority, Blueprint Category, Date Range.
- [x] Reset filters button clears all filter search params.
- [x] Default sort is fixed to `entered_at` ascending; no user-facing sort control is required.

### Pagination

- [x] Report uses `useInfiniteQuery` with cursor pagination and a manual "Load more" button.
- [x] Previously loaded rows remain visible while the next page loads.

### Responsive Behavior

- [x] Desktop (`>=1024px`) shows the full table.
- [x] Tablet (`640px–1023px`) shows the table with reduced columns; filters wrap into two rows.
- [x] Mobile (`<640px`) shows cards instead of the table, preserving the SLA-first information hierarchy.

### States

- [x] Loading state shows skeleton table rows/cards matching final shapes.
- [x] Empty state appears when the report returns no tasks; includes reset filters CTA when filters are active.
- [x] Error state shows a safe message and retry button via `ErrorState`.
- [x] No-permission state appears when the user lacks any required capability.

---

## Technical Requirements

> Reference: `docs/ai/coding-standards.md`

### Data Fetching

- [x] Query hook: `useAgingReportInfinite(filters)` using `useInfiniteQuery`, `queryKeys.analytics.aging.list(filters)`, and `GET /api/v1/analytics/tasks/aging`.
- [x] Pagination: `useInfiniteQuery` for cursor-paginated list; `initialPageParam: undefined`; `getNextPageParam` derives from `has_more ? next_cursor : undefined`.
- [x] Prefetch: none in MVP.
- [x] Cache invalidation: aging list is read-only; no mutations in this spec.

### Query Key Structure

- [x] Extended `lib/api/query-keys.ts` with:
  - `queryKeys.analytics.all`
  - `queryKeys.analytics.aging.lists()` / `queryKeys.analytics.aging.list(filters)`
- [x] Filter objects included in query keys are memoized via `useMemo`.
- [x] No component uses hardcoded query key strings.

### State Management

- [x] Filters live in URL search params (`useSearchParams`) so views are shareable.
- [x] API data stays in TanStack Query only; no Zustand store for report data.
- [x] Local component state is used only for transient UI: mobile filter sheet open/close.

### Error Handling

- [x] 401 → redirect to login (handled globally by QueryCache).
- [x] 403 → render no-permission `EmptyState`.
- [x] 422 → surface filter validation errors via `toast.error()` (where applicable).
- [x] 500/network errors → render `ErrorState` with retry button; do not expose stack traces.

---

## UI Requirements

> Reference: `docs/design-system/01-tokens.md`, `02-glassmorphism.md`, `03-components.md`, `04-layout-patterns.md`, `05-accessibility.md`, `06-anti-patterns.md`

### Component Breakdown

| Component | Type | Source | Notes |
|-----------|------|--------|-------|
| `AgingReportPage` | Server | Page | `app/(dashboard)/analytics/aging/page.tsx`; renders page shell and translated title |
| `AgingReport` | Client | Domain | Orchestrates filters, table, and pagination |
| `AgingReportFilters` | Client | Domain | Thin wrapper around shared `BoardFilters`; removes search/sort controls not needed |
| `AgingReportTable` | Client | Domain | Desktop/tablet table built for the aging response shape; reuses styling and badge patterns from the task board |
| `AgingReportMobileList` | Client | Domain | Mobile card list built for the aging response shape |
| `AgingReportCard` | Client | Domain | Single aging mobile card |
| `AgingReportSkeleton` | Client | Domain | Skeleton table rows/cards matching final shape |
| `BoardFilters` | Client | Shared | Shared filter bar: ToggleGroup, AdvancedFiltersSheet (may be adapted if the shared component is too task-board-specific) |
| `AdvancedFiltersSheet` | Client | Shared | Shared filter Sheet: department, priority, category, date range |
| `SlaBadge`, `TaskStatusBadge`, `PriorityBadge`, `ClassificationBadge` | Client | Domain/shared | Reuse task board badges |
| `EmptyState`, `ErrorState`, `PageHeader` | Client | Shared | Reuse existing shared components |
| `Button`, `Badge`, `Card`, `Table`, `Input`, `Select`, `Skeleton`, `Sheet` | Client | shadcn | Run `npx shadcn@latest docs <component>` before implementation if adding missing components |

### States

| State | Component | Pattern |
|-------|-----------|---------|
| Loading | `AgingReportSkeleton` | Skeleton filters + 8 table skeleton rows / 5 card skeletons |
| Empty | `EmptyState` | Icon, headline, short copy, reset filters button when filtered |
| Error | `ErrorState` | Safe message and retry button |
| No Permission | `EmptyState` | Lock icon, localized message |
| Success | `AgingReportTable` / `AgingReportMobileList` | Loaded data and pagination |

### Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| Mobile (<640px) | Single-column layout; report renders cards; filters in a Sheet |
| Tablet (640–1023px) | Report table with reduced columns; filters wrap |
| Desktop (≥1024px) | Full table; filters inline |

### RTL Considerations

- [x] All new components use only logical properties (`ms-`, `me-`, `ps-`, `pe-`, `text-start`, `text-end`, `border-s`, `border-e`, `start-*`, `end-*`).
- [x] Directional icons (`ChevronRight`, `ArrowLeft`) use `rtl:rotate-180`.
- [x] Table text columns align `text-start`.
- [x] Mobile cards preserve the same information hierarchy in RTL and LTR.

### Accessibility

- [x] All interactive elements have visible focus rings.
- [x] SLA badges use color + text label — never color-only.
- [x] Table uses semantic `<table>`, `<thead>`, `<th scope="col">`, and accessible row labels.
- [x] Loading states use `Skeleton` with `animate-pulse` and `motion-reduce:animate-none`.
- [x] Touch targets are ≥ 44px on mobile.

### Animation

- [x] Skeleton uses `animate-pulse` (shadcn default).
- [x] Card/table rows may use `transition-colors duration-150` on hover.
- [x] All motion respects `prefers-reduced-motion` via `motion-reduce:` variants.

---

## Non-Functional Requirements

### Performance

- [x] Cursor pagination with manual "Load more"; do not load all tasks at once.
- [x] Filters memoized via `useMemo` in query key dependencies.
- [x] Task deduplication via `Set` on page flattening.
- [x] No client-side filtering of server results.

### Security

- [x] Backend ABAC is the source of truth for visible tasks.
- [x] Client does not reconstruct visibility rules.
- [x] Capability checks hide UI elements the user likely cannot perform (report is read-only, so this mainly affects whether the page is reachable).
- [x] No PII written to URLs.
- [x] No `console.log` of task or report data.

### Testing

- [x] Component tests cover loading, success, empty, error, and no-permission states.
- [x] Tests cover filter interactions (quick chips).
- [x] Tests use MSW handlers for the aging endpoint.
- [x] SLA badge tests assert text appears with correct labels.

---

## Out of Scope

- Executive summary KPI cards and trend charts (covered by `002-executive-dashboard`).
- Department performance and team workload views (covered by `012-department-manager-dashboard`).
- Drill-down task lists from summary metrics (covered by `002-executive-dashboard` and `012-department-manager-dashboard`).
- Charts, graphs, or data visualization of any kind.
- CSV/PDF export.
- Saved filter configurations or personal watchlists.
- Real-time polling or websocket updates.
- Manual follow-up actions, escalations, or any write operations (covered by `007-follow-up-center`).
- Side panels for recent actions, bottlenecks, or escalations (covered by `007-follow-up-center`).

---

## Relationship to Follow-Up Center

The aging report (`009-analytics-reporting`) and the follow-up center (`007-follow-up-center`) both surface tasks with SLA health, but they serve different users and use cases:

| Aspect | Follow-Up Center (`007`) | Aging Report (`009`) |
|--------|--------------------------|----------------------|
| **Primary user** | Follow-up specialists, operational monitors | Executives, managers, follow-up specialists doing weekly reviews |
| **Purpose** | Operational workspace: *what is stuck right now and what has been tried?* | Read-only report: *which work has been stuck the longest?* |
| **Default sort** | `time_at_stage` descending, user-configurable | `entered_at` ascending (oldest first), fixed |
| **Actions** | Log follow-up actions, escalate, resolve escalations | None (read-only) |
| **Side panels** | Bottlenecks, recent actions, open escalations | None |
| **Polling** | 60s refresh to keep SLA health current | No polling |
| **Filters** | Status, department, stage type, priority, category, assignee, date range, search, sort | Status, priority, department, category, date range |
| **Scope** | Monitoring-scope aware (`task.view.follow_up_scope`) | ABAC visibility via analytics or follow-up capabilities (`analytics.view.organization`, `analytics.view.department`, `task.view.follow_up_scope`) |

The aging report intentionally reuses the board table and filter components from `003-task-board` and `007-follow-up-center` but keeps the surface minimal.

---

## Open Questions — All Resolved

- [x] **Sidebar navigation entry:** — **Resolved.** Single Analytics nav item linking to `/analytics/aging` in MVP. Expands to a collapsible group once specs `002` and `012` add executive and department dashboards.
- [x] **Capability gating for the page:** — **Resolved.** Hide the Analytics nav item when the user lacks all of `analytics.view.organization`, `analytics.view.department`, and `task.view.follow_up_scope`. Direct access to `/analytics/aging` without any of these renders the no-permission `EmptyState`. Backend is the ABAC source of truth; frontend check is UX-only.
- [x] **"All" quick filter status value:** — **Resolved.** "All" clears the `status` URL param. Backend `AgingReportService` defaults to active + suspended tasks, so no status filter returns both. Matches follow-up center (`007`) precedent.
- [x] **Date range column for filtering:** — **Resolved.** Use `date_from`/`date_to` on `created_at` in MVP. This is what the backend `AgingReportRequest` supports today. Stage-entered date filtering deferred to V2.
- [x] **Overdue / At Risk as quick filters:** — **Resolved.** Not added. They are SLA health states shown per row; the aging endpoint's `status` filter only accepts `TaskStatus` enum (active/suspended/completed/cancelled). Quick chips are Active, Suspended, All.
- [x] **Backend OpenAPI returns `data: string[]` for aging:** — **Resolved.** Used a local display type + `unknown` narrowing adapter (`narrowAgingItems()`) until backend Scramble/OpenAPI is regenerated. Same adapter pattern already used for `BoardTaskResource.current_assignees` and `BottleneckResource.stage_type` in follow-up center.
- [x] **Reuse `AdvancedFiltersSheet` from task board or build custom?** — **Resolved.** Reused the shared `AdvancedFiltersSheet` by adding an optional `hideFields` prop to hide `stageTypeId` and `assigneeId` fields not supported by the aging endpoint. Backward-compatible — existing consumers unaffected.
- [x] **Add breadcrumb for `/analytics/aging`?** — **Resolved.** Extended `usePageBreadcrumb()` to handle `pathname.startsWith('/analytics/')`, showing Dashboard → Analytics → page title. Analytics title uses `analytics.aging.title` translation key.
- [x] **Priority dot color in aging report?** — **Resolved.** Backend added `severity_rank` and `color_code` to the priority object in `AgingReportResource`. Frontend updated `AgingReportItem.priority` type from `string` to `AgingPriority` object; `narrowAgingItem()` now parses the object; `PriorityBadge` receives full object with `severity_rank` for dot color. Matches task board behavior.
- [x] **Column labels differentiation between task board and aging report?** — **Resolved.** Task board and follow-up use "وقت العمل في المرحلة" / "Working Time in Stage" (working days). Aging report uses "الوقت التقويمي في المرحلة" / "Calendar Time in Stage" (calendar days). Prevents confusion when users compare values across pages.
- [x] **Working time display shows only whole days at certain hours?** — **Resolved.** Backend `WorkingDayCalculator` returns exact multiples of `working_day_seconds` when outside working hours (before 08:00 or after 16:00) or when tasks entered stages after hours. Hours appear naturally during working hours or when tasks have partial-day entries. No frontend fix needed — the math is correct.

---

→ **Next:** Read `docs/ai/coding-standards.md` before creating `plan.md`.
