# Spec: Department Manager Dashboard

> **Number:** 012
> **Date:** 2026-07-11
> **Status:** `completed`
> **Milestone:** F5 — Dashboards & Analytics
> **Depends on:** `009-analytics-reporting`, `002-executive-dashboard`
> **Backend spec:** `../backend/specs/009-analytics-reporting/` — `Contract status: stable`
> **Contract status:** `stable`
> **Author:** OpenCode
> **Branch:** `feat/012-department-manager-dashboard`
> **Base branch:** `main`

---

## Problem

Department directors and managers need a focused, read-only view of their own directorate's throughput and workload. The executive dashboard (`002`) is organization-wide and optimized for ministers and undersecretaries who scan high-level RAG health across all departments. The task board and follow-up center are operational workspaces for triaging individual tasks. None of these surfaces answer the day-to-day questions a department manager has:

- How many active tasks currently sit in my department?
- How many are overdue or at risk inside my department?
- What is the average time my team spends completing a stage?
- Which team members are carrying the most active assignments, and who has overdue work?
- Which tasks make up these numbers so I can drill into them?

Without a department-specific dashboard, managers must manually filter the task board or aging report by department and then mentally aggregate data. This is slow and makes it hard to run data-driven team stand-ups or workload-balancing conversations.

---

## Goal

Deliver `/analytics/department` as the department manager dashboard: a read-only, department-scoped summary of team throughput and workload. The page displays KPI stat cards for the selected department, a team workload list showing per-employee assignment counts, and a drill-down task list of the tasks contributing to the department's metrics. Managers can switch departments if they have organization-wide analytics access, or view their own department by default if they have department-scoped access.

This spec covers only the **Department Manager Dashboard**. The executive dashboard is implemented by `002-executive-dashboard` at `/analytics`, and the task aging report is implemented by `009-analytics-reporting` at `/analytics/aging`.

---

## User Stories

### Department Director / Manager

- As a **department director**, I want to see my department's active, overdue, and at-risk task counts on one screen, so that I can gauge team load in seconds.
- As a **department manager**, I want to see the average stage delay inside my department, so that I can spot whether work is moving slower than usual.
- As a **department manager**, I want to see per-employee active assignments, overdue assignments, and completed stages, so that I can balance workload and identify blockers.
- As a **department director**, I want to click a metric and see the underlying task list filtered to my department, so that I can investigate without leaving the analytics context.
- As a **manager with oversight of multiple departments**, I want a department selector so that I can switch between departments I am authorized to view.

### Follow-Up Specialist

- As a **follow-up specialist**, I want to open the department dashboard to see workload distribution before contacting a team, so that I can tailor my follow-up approach.

### System

- As the **system**, I want the dashboard to be read-only and enforce the same ABAC visibility rules as the task board, so that confidential or out-of-scope tasks are never leaked through department analytics.
- As the **system**, I want summary data to refresh automatically at a sensible interval, so that SLA health stays current while the page is open.

---

## Acceptance Criteria

### Route and Page Structure

- [x] Route `/analytics/department` renders the department manager dashboard inside the authenticated dashboard shell.
- [x] The page header shows the localized title "Department Dashboard" / "لوحة تحكم القسم" and a short description.
- [x] The Analytics sidebar group gains a new item: "Department Dashboard" → `/analytics/department`, alongside the existing "Aging Report" item. (The Executive Dashboard is the default landing page at `/` under the Main group.)
- [x] The page uses the dashboard-page layout: stat cards, two-column team/drill-down sections.

### Department Selection

- [x] If the URL contains `?departmentId={publicId}`, the dashboard loads that department.
- [x] If the URL does not contain `departmentId`, the dashboard attempts to default to the current user's primary department.
- [x] Users with `analytics.view.organization` see a department selector populated from `/v1/organization/departments`.
- [x] Users with only `analytics.view.department` or `analytics.view.individuals_in_department` see their scoped department without a selector; the backend returns 403 if they manipulate the URL to an unauthorized department.
- [x] Selecting a department updates the `departmentId` URL search param so the view is bookmarkable.

### KPI Stat Cards

- [x] Four stat cards are displayed: Active Tasks, Overdue Tasks, At-Risk Tasks, Average Stage Delay.
- [x] Each card shows a large number, a localized label, and a tinted icon.
- [x] Overdue and at-risk cards use red/amber tinted borders.
- [x] Average stage delay card formats `average_stage_delay_seconds` as a duration (e.g. "2 days 4 hours" / "يومان و 4 ساعات").
- [x] Active, overdue, and at-risk cards are clickable and navigate to the department drill-down task list pre-filtered by status or SLA health.

### Team Workload Panel

- [x] A panel lists team members in the selected department with their workload counts.
- [x] Each row shows: employee name (localized from `name_ar`/`name_en` returned by the team endpoint), active assignments count, overdue assignments count, completed stages count.
- [x] Rows are sorted by overdue assignments descending, then active assignments descending, then employee name.
- [x] Each row is clickable and drills down to the department task list filtered to tasks assigned to that employee.
- [x] Workload highlighting/overload badges are deferred to V2; no amber or red tint is applied to active assignment counts in MVP.

### Department Drill-Down Task List

- [x] A panel shows the cursor-paginated task list from `GET /v1/analytics/departments/{department}/performance/drill-down`.
- [x] The list reuses the existing `TaskListItemResource` row/card patterns from the executive dashboard drill-downs.
- [x] Filters from the dashboard (status, priority, date range, blueprint category) are forwarded to the drill-down endpoint.
- [x] Additional drill-down filters from SLA health, status, or employee selection are merged with the dashboard filters.
- [x] Row click navigates to `/tasks/[publicId]`.

### Data Fetching

- [x] The dashboard fetches `GET /v1/analytics/departments/{department}/performance` for KPI cards.
- [x] The dashboard fetches `GET /v1/analytics/departments/{department}/team` for the team workload list.
- [x] The dashboard fetches `GET /v1/organization/departments` (bounded list) for the department selector (org-wide users only).
- [x] All endpoints require `analytics.view.department`, `analytics.view.individuals_in_department`, or `analytics.view.organization` capability within scope; backend returns 403 when missing.

### Filters

- [x] URL search params drive dashboard filters so the view is shareable and back-button friendly.
- [x] Supported filters: `dateFrom`, `dateTo`, `priorityId`, `status`, `slaHealth`, `blueprintCategoryId`, `assigneeId`.
- [x] A filter button in the PageHeader actions slot opens `AdvancedFiltersSheet` with the same filter fields used by the executive dashboard.
- [x] Filter changes update the URL and refetch all dashboard data.

### States

- [x] Loading state shows skeleton stat cards, skeleton team rows, and skeleton drill-down rows matching final shapes.
- [x] Empty state appears when the department has no tasks or no team members; includes a CTA to clear filters when filters are active.
- [x] Error state shows a safe message and retry button via `ErrorState`.
- [x] No-permission state appears when the user lacks any required capability or is not scoped to the requested department.

---

## Technical Requirements

> Reference: `docs/ai/coding-standards.md`

### Data Fetching

- [x] Query hooks (extend `lib/api/hooks/use-analytics.ts`):
  - `useDepartmentPerformance(departmentPublicId, filters)` → `GET /v1/analytics/departments/{department}/performance`
  - `useDepartmentTeam(departmentPublicId, filters)` → `GET /v1/analytics/departments/{department}/team`
  - `useDepartmentDrillDownInfinite(departmentPublicId, filters)` → `GET /v1/analytics/departments/{department}/performance/drill-down`
  - `useDepartmentsInfinite()` → existing `useOrganization` hook
- [x] Pagination: performance and team endpoints return bounded objects/arrays; drill-down endpoint uses `useInfiniteQuery` with cursor pagination.
- [x] Prefetch: none in MVP.
- [x] Cache invalidation: dashboard data is read-only; rely on TanStack Query `staleTime` and background refetch. Performance endpoint polls every 60s.

### Query Key Structure

- [x] Extend `lib/api/query-keys.ts` under `queryKeys.analytics.department`:
  - `queryKeys.analytics.department.performance(departmentPublicId, filters)`
  - `queryKeys.analytics.department.team(departmentPublicId, filters)`
  - `queryKeys.analytics.department.drillDown(departmentPublicId, filters)`
- [x] Filter objects and `departmentPublicId` included in query keys are memoized via `useMemo`.
- [x] No component uses hardcoded query key strings.

### State Management

- [x] The selected `departmentId` and dashboard filters live in URL search params so filtered views are shareable.
- [x] API data stays in TanStack Query only; no Zustand store for dashboard data.
- [x] Local component state is used only for transient UI: filter sheet open/close and department resolution tracking.
- [x] Default department derivation reads `current_position.position.department.public_id` from `GET /v1/iam/auth/me`; the resolved default is written to the URL search param once (replace, not push) so the browser back button remains predictable.

### Mutation Patterns

- [x] No mutations in this spec; dashboard is read-only.

### Error Handling

- [x] 401 → redirect to login (handled globally by QueryCache).
- [x] 403 → render no-permission `EmptyState`.
- [x] 422 → surface filter validation errors via `toast.error()` (where applicable).
- [x] 500/network errors → render `ErrorState` with retry button; do not expose stack traces.

### Type Safety

- [x] Use generated types from `lib/generated/api-types.ts` for request/response shapes.
- [x] The OpenAPI contract serializes several numeric fields (`active_tasks`, `overdue_tasks`, `at_risk_tasks`, `average_stage_delay_seconds`, `active_assignments`, `overdue_assignments`, `completed_stages`) as `string`. Use a runtime narrowing adapter to convert these to proper numeric types, following the same pattern as `narrowExecutiveSummary()` and `narrowAgingItems()` in specs `002` and `009`.
- [x] No `any` annotations — use `unknown` and narrow where runtime validation is required.

---

## UI Requirements

> Reference: `docs/design-system/01-tokens.md`, `02-glassmorphism.md`, `03-components.md`, `04-layout-patterns.md`, `05-accessibility.md`, `06-anti-patterns.md`

### Component Breakdown

| Component | Type | Source | Notes |
|-----------|------|--------|-------|
| `DepartmentDashboardPage` | Server | Page | `app/(dashboard)/analytics/department/page.tsx`; renders page shell and translated title |
| `DepartmentDashboard` | Client | Domain | Orchestrates stat cards, team panel, drill-down panel, department selector, and error/empty states |
| `DepartmentPerformanceCards` | Client | Domain | Grid of 4 KPI stat cards with icons and drill-down links |
| `DepartmentTeamPanel` | Client | Domain | Team workload list with per-employee counts |
| `DepartmentTeamRow` | Client | Domain | Single employee row with active/overdue/completed counts |
| `DepartmentDrillDownList` | Client | Domain | Cursor-paginated task list for the department |
| `DepartmentDrillDownTable` | Client | Domain | Desktop/tablet table reusing executive drill-down patterns |
| `DepartmentDrillDownMobileList` | Client | Domain | Mobile card list reusing executive drill-down patterns |
| `DepartmentDashboardSkeleton` | Client | Domain | Skeleton stat cards + skeleton team rows + skeleton drill-down rows |
| `DepartmentSelector` | Client | Domain | shadcn `Select` populated with departments; hidden for scoped users |
| `StatCard` | Client | Shared | Reuse existing shared `StatCard` from `002` |
| `AdvancedFiltersSheet` | Client | Shared | Reuse existing shared filter sheet (hide fields not supported by department endpoints) |
| `EmptyState`, `ErrorState`, `PageHeader` | Client | Shared | Reuse existing shared components |
| `Card`, `Badge`, `Button`, `Skeleton`, `Sheet`, `Select`, `Table` | Client | shadcn | Run `npx shadcn@latest docs <component>` before implementation if adding missing components |

### States

| State | Component | Pattern |
|-------|-----------|---------|
| Loading | `DepartmentDashboardSkeleton` | Skeleton stat cards (4) + skeleton team rows (5) + skeleton drill-down rows (5) |
| Empty | `EmptyState` | Icon, headline, short copy, CTA to clear filters when filtered |
| Error | `ErrorState` | Safe message and retry button |
| No Permission | `EmptyState` | Lock icon, localized message |
| Success | `DepartmentDashboard` | Loaded stat cards, team panel, and drill-down panel |

### Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| Mobile (<640px) | Single-column layout; stat cards stack 1-column; team panel and drill-down panel stack vertically; drill-down renders cards |
| Tablet (640–1023px) | Stat cards grid 2 columns; team panel full width above drill-down panel; drill-down renders table with reduced columns |
| Desktop (≥1024px) | 4-column stat grid; two-column row with team panel (1/3) and drill-down panel (2/3) |

### RTL Considerations

- [x] All new components use only logical properties (`ms-`, `me-`, `ps-`, `pe-`, `text-start`, `text-end`, `border-s`, `border-e`, `start-*`, `end-*`).
- [x] Directional icons (`ChevronRight`, `ArrowLeft`, `TrendingUp`) use `rtl:rotate-180`.
- [x] Stat card icon positions flip automatically when layout uses logical properties.
- [x] Team rows align counts to `text-end` in both directions.
- [x] Drill-down table text columns align `text-start`; numeric/action columns align `text-end`.

### Accessibility

- [x] All interactive elements have visible focus rings.
- [x] Icon-only buttons have `aria-label`.
- [x] Stat cards are clickable and behave as links with proper focus and keyboard activation.
- [x] Department selector has an associated `Label` and announces changes.
- [x] Team rows use semantic button markup with proper labels.
- [x] Loading states use `Skeleton` with `animate-pulse` and `motion-reduce:animate-none`.
- [x] Touch targets are ≥ 44px on mobile.
- [x] Drill-down tables use semantic `<table>`, `<thead>`, `<th scope="col">`.

### Animation

- [x] Skeleton uses `animate-pulse` (shadcn default).
- [x] Stat cards use `transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5` on hover.
- [x] Team and drill-down rows use `transition-colors duration-150` on hover.
- [x] All motion respects `prefers-reduced-motion` via `motion-reduce:` variants.

---

## Non-Functional Requirements

### Performance

- [x] Dashboard queries use a shared filter object memoized via `useMemo`.
- [x] Poll performance endpoint every 60s to keep SLA health current (`refetchInterval` on performance query only).
- [x] No client-side aggregation of server data.
- [x] No extra user lookup is required; team metrics now include localized names from the backend.

### Security

- [x] Backend ABAC is the source of truth for visible data.
- [x] Client does not reconstruct visibility rules.
- [x] Capability checks hide the department selector and restrict navigation items when the user lacks appropriate access.
- [x] No PII written to URLs (only department `public_id` and dashboard filters).
- [x] No `console.log` of dashboard or drill-down data.

### Testing

- [x] Component tests cover loading, success, empty, error, and no-permission states.
- [x] Tests assert that stat cards render correct counts and labels.
- [x] Tests assert that team rows are sorted by overdue then active load.
- [x] Tests assert drill-down task list renders when data loads.
- [x] Tests use MSW handlers for department analytics endpoints.

---

## Out of Scope

- Pending approvals panel (reference UI concept; no backend endpoint exists in `009-analytics-reporting`).
- Team availability / leave / out-of-office calendar panel (reference UI concept; delegation/OOF endpoints exist in backend spec `016-delegation-oof` but are consumed by `017-user-settings-delegation`, not this dashboard).
- Real-time team activity feed (reference UI concept; no backend endpoint exists).
- Individual employee performance charts, scorecards, or historical trends.
- Department SLA rate percentage card (reference UI concept; backend `performance` endpoint returns counts and average delay, not a compliance percentage).
- Workload progress bars as percentages (reference UI shows percentage bars; MVP shows counts only because the backend does not provide capacity or max-load data).
- CSV/PDF export of dashboard data (V2).
- Predictive workload risk or forecasting (V3).
- Editing tasks, logging follow-up actions, or any write operations (covered by task details and follow-up center).
- Real-time websocket push (MVP uses 60s polling).

---

## Relationship to Executive Dashboard and Aging Report

The department manager dashboard (`012`), executive dashboard (`002`), and task aging report (`009`) are sibling analytics screens under `/analytics`:

| Aspect | Executive Dashboard (`002`) | Department Dashboard (`012`) | Aging Report (`009`) |
|--------|-----------------------------|------------------------------|----------------------|
| **Primary user** | Ministers, executives, undersecretaries | Department directors, managers | Follow-up specialists, managers, executives |
| **Purpose** | Organization-wide health snapshot | Department throughput & team workload | Detailed list of stalled work |
| **Route** | `/analytics` | `/analytics/department` | `/analytics/aging` |
| **Data** | Aggregated counts, department health, bottleneck ranking | Department counts, per-employee workload, department drill-down | Individual tasks sorted by time at current stage |
| **Scope** | Organization-wide (`analytics.view.organization`) | Department-scoped (`analytics.view.department`, `analytics.view.individuals_in_department`, or `analytics.view.organization`) | Analytics or follow-up visibility |
| **Polling** | 60s refresh on summary | 60s refresh on performance | No polling |

---

## Open Questions — All Resolved

- [x] **Default department derivation:** — **Resolved.** `GET /v1/iam/auth/me` now returns `current_position.position.department.public_id`. No extra `/iam/users/{id}` call is needed. Regenerate types to pick up the new field.
- [x] **Route path:** — **Resolved.** Use `/analytics/department?departmentId={publicId}` for consistency with sibling analytics screens.
- [x] **Team endpoint user names:** — **Resolved.** `GET /v1/analytics/departments/{department}/team` now returns `name_ar` and `name_en` per member. No separate user lookup is needed.
- [x] **Team workload sorting threshold:** — **Resolved.** Workload highlighting is intentionally deferred until the backend exposes a meaningful workload capacity metric (e.g., employee capacity, workload score, utilization, or assignment limit). Until then, the UI sorts employees by overdue assignments descending, then active assignments descending, then name.
- [x] **Drill-down filters from employee row:** — **Resolved.** `GET /v1/analytics/departments/{department}/performance/drill-down` now accepts `?assignee_id={userPublicId}`. Clicking a team row navigates to the drill-down with that param.
- [x] **Department selector for scoped users:** — **Resolved.** Hide the selector for users with only `analytics.view.department` or `analytics.view.individuals_in_department`; default to the department from `/me`. Backend returns 403 for unauthorized department URLs.
- [x] **Stat card KPI clicks:** — **Resolved.** Backend added `?sla_health=red|amber` and `?status=active` filter support to the drill-down endpoint. Active card sets `?status=active`, Overdue sets `?sla_health=red`, At Risk sets `?sla_health=amber`.
- [x] **Department drill-down loading state:** — **Resolved.** Skeleton shown during drill-down refetches. Main page skeleton includes drill-down loading via `isFetching` check.
- [x] **Breadcrumb hierarchy:** — **Resolved.** Breadcrumb follows sidebar group structure. Analytics items show `Analytics > [Page]`. Main group items show `Main > [Page]`.

---

→ **Next:** Read `docs/ai/coding-standards.md` before creating `plan.md`.