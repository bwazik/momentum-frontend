# Spec: Executive Dashboard

> **Number:** 002
> **Date:** 2026-07-09
> **Status:** `completed`
> **Milestone:** F5 — Dashboards & Analytics
> **Depends on:** `009-analytics-reporting`
> **Backend spec:** `../backend/specs/009-analytics-reporting/` — `Contract status: stable`
> **Contract status:** `stable`
> **Author:** OpenCode
> **Branch:** `feat/002-executive-dashboard`
> **Base branch:** `main`

---

## Problem

Ministers, undersecretaries, and executive leadership need to understand the organization's operational pulse at a glance. Today, the task board and follow-up center are optimized for operational users who search and triage individual tasks. Executives must either drill through lists or rely on manual reports to answer basic questions: How much work is active? How much is overdue or at risk? Which departments are healthy and which are bottlenecked?

Without a dedicated executive dashboard, leadership lacks a fast, read-only, visually scannable summary of organizational throughput. This slows decision-making in government and enterprise settings where quick situational awareness directly affects resource allocation and follow-up priorities.

---

## Goal

Deliver `/analytics` as the executive dashboard: a read-only, at-a-glance summary of organizational task health. The page displays KPI stat cards, department-level red/amber/green health indicators, and top bottlenecking stage types. Every summary metric is clickable and drills down to a task list so executives can investigate without losing context.

This spec covers only the **Executive Dashboard**. The Task Aging Report is implemented by `009-analytics-reporting` at `/analytics/aging`, and the Department Manager Dashboard is covered by `012-department-manager-dashboard`.

---

## User Stories

### Executive / Minister

- As a **minister or top executive**, I want to see total active, overdue, at-risk, suspended, and completed task counts on one screen, so that I can grasp the organization's operational pulse in seconds.
- As an **executive**, I want red/amber/green health indicators per department, so that I can instantly identify underperforming directorates.
- As an **executive**, I want to see the top bottlenecking stage types grouped by department, so that I can direct corrective action where it matters most.
- As an **executive**, I want to click any summary metric and see the underlying task list, so that I can investigate without leaving the analytics context.

### Follow-Up Specialist

- As a **follow-up specialist**, I want to open the executive dashboard to see the overall health snapshot before diving into the aging report or follow-up center, so that I can prioritize my monitoring work.

### System

- As the **system**, I want the dashboard to be read-only and enforce the same ABAC visibility rules as the task board, so that confidential or out-of-scope tasks are never leaked through summary APIs.
- As the **system**, I want summary data to refresh automatically at a sensible interval, so that SLA health stays current while the page is open.

---

## Acceptance Criteria

### Route and Page Structure

- [x] Route `/` renders the executive dashboard inside the authenticated dashboard shell.
- [x] The page header shows the localized title "Executive Dashboard" / "لوحة التحكم التنفيذية" and a short description.
- [x] The sidebar has an Analytics group with "Aging Report" linking to `/analytics/aging`. The executive dashboard itself lives at `/` (the Dashboard nav item).
- [x] The page uses the dashboard-page layout: stat cards, two-column health/bottleneck section, and optional bottom widgets.

### Data Fetching

- [x] The dashboard fetches `GET /api/v1/analytics/executive/summary` for KPI cards.
- [x] The dashboard fetches `GET /api/v1/analytics/executive/department-health` for the department health list.
- [x] The dashboard fetches `GET /api/v1/analytics/executive/bottlenecks?limit=10` for the top bottlenecks panel.
- [x] All endpoints require the `analytics.view.organization` capability; backend returns 403 when missing.
- [x] Summary and department-health endpoints support optional `date_from`, `date_to`, `priority_id`, `department_id`, and `blueprint_category_id` filters via URL search params.

### KPI Stat Cards

- [x] Five stat cards are displayed: Total Active, At Risk, Overdue, Suspended, Completion Rate.
- [x] Each card shows a large number, a localized label, and a tinted icon.
- [x] At-risk and overdue cards use amber/red tinted borders.
- [x] Cards are clickable and navigate to a drill-down task list for the corresponding metric.
- [x] Completion rate card displays `Math.round(rate * 100)` with a `%` suffix and a supporting caption showing completed count. If cancelled count > 0, both completed and cancelled appear as separate clickable drill-down links in the subtitle.

### Department Health Panel

- [x] A two-thirds-width panel lists all active departments with their health status.
- [x] Each row shows: localized department name, health badge, a stacked micro bar (emerald/amber/red proportion of active tasks), and a count line: "N active · N overdue · N at risk".
- [x] Rows are sorted by health severity (red first, then amber, then green) and then by department name.
- [x] Each row is clickable and drills down to a filtered task list for that department.

### Bottlenecks Panel

- [x] A one-third-width panel shows the top bottlenecking stage types.
- [x] Each card shows the localized stage type name, the primary department, overdue count, at-risk count, and average time at stage.
- [x] Bottleneck cards show severity via `border-s-4` accent: red when overdue count > 0, amber when only at-risk, slate otherwise. Both overdue and at-risk counts are shown when present.
- [x] Each card is clickable and navigates to the bottleneck drill-down task list.

### Drill-Down Navigation

- [x] Clicking a KPI card navigates to `/analytics/aging?status={metric}` or `/analytics/executive/drill-down/{metric}` depending on the metric.
- [x] Clicking a department health row navigates to `/analytics/aging?departmentId={publicId}`.
- [x] Clicking a bottleneck card navigates to `/analytics/executive/bottlenecks/{stageType}/drill-down`.
- [x] Drill-down pages reuse the existing task board / aging report table patterns and enforce the same ABAC rules.

### States

- [x] Loading state shows skeleton stat cards, skeleton department rows, and skeleton bottleneck cards matching final shapes.
- [x] Empty state appears when no dashboard data is available; includes a CTA to open the aging report.
- [x] Error state shows a safe message and retry button via `ErrorState`.
- [x] No-permission state appears when the user lacks `analytics.view.organization`.

---

## Technical Requirements

> Reference: `docs/ai/coding-standards.md`

### Data Fetching

- [x] Query hooks:
  - `useExecutiveSummary(filters)` → `GET /api/v1/analytics/executive/summary`
  - `useExecutiveDepartmentHealth(filters)` → `GET /api/v1/analytics/executive/department-health`
  - `useExecutiveBottlenecks(filters)` → `GET /api/v1/analytics/executive/bottlenecks`
  - `useExecutiveSummaryDrillDown(metric, filters)` → `GET /api/v1/analytics/executive/summary/drill-down/{metric}`
  - `useExecutiveBottleneckDrillDown(stageType, filters)` → `GET /api/v1/analytics/executive/bottlenecks/{stageType}/drill-down`
- [x] Pagination: summary and health endpoints return bounded arrays; drill-down endpoints use `useInfiniteQuery` with cursor pagination.
- [x] Prefetch: none in MVP.
- [x] Cache invalidation: dashboard data is read-only; rely on TanStack Query `staleTime` and background refetch. Summary endpoints are cached 300s on the backend.

### Query Key Structure

- [x] Extend `lib/api/query-keys.ts` with:
  - `queryKeys.analytics.executive.summary(filters)`
  - `queryKeys.analytics.executive.departmentHealth(filters)`
  - `queryKeys.analytics.executive.bottlenecks(filters)`
  - `queryKeys.analytics.executive.drillDown(metric, filters)`
  - `queryKeys.analytics.executive.bottleneckDrillDown(stageType, filters)`
- [x] Filter objects included in query keys are memoized via `useMemo`.
- [x] No component uses hardcoded query key strings.

### State Management

- [x] Dashboard date-range and filter state lives in URL search params so filtered views are shareable.
- [x] API data stays in TanStack Query only; no Zustand store for dashboard data.
- [x] Local component state is used only for transient UI: filter sheet open/close, drill-down dialog open/close.

### Mutation Patterns

- [x] No mutations in this spec; dashboard is read-only.

### Error Handling

- [x] 401 → redirect to login (handled globally by QueryCache).
- [x] 403 → render no-permission `EmptyState`.
- [x] 422 → surface filter validation errors via `toast.error()` (where applicable).
- [x] 500/network errors → render `ErrorState` with retry button; do not expose stack traces.

### Type Safety

- [x] Use generated types from `lib/generated/api-types.ts` for request/response shapes.
- [x] The OpenAPI contract serializes several numeric fields (counts, completion rate, health enum values) as `string`. Use a runtime narrowing adapter to convert these to proper numeric types, following the same pattern as `narrowAgingItems()` in spec `009-analytics-reporting`.
- [x] No `any` annotations — use `unknown` and narrow where runtime validation is required.

---

## UI Requirements

> Reference: `docs/design-system/01-tokens.md`, `02-glassmorphism.md`, `03-components.md`, `04-layout-patterns.md`, `05-accessibility.md`, `06-anti-patterns.md`

### Component Breakdown

| Component | Type | Source | Notes |
|-----------|------|--------|-------|
| `ExecutiveDashboardPage` | Server | Page | `app/(dashboard)/analytics/page.tsx`; renders page shell and translated title |
| `ExecutiveDashboard` | Client | Domain | Orchestrates stat cards, health panel, bottlenecks panel, and error/empty states |
| `ExecutiveSummaryCards` | Client | Domain | Grid of 5 KPI stat cards with icons and drill-down links |
| `StatCard` | Client | Shared | Single stat card: icon, value, label, subtitle, click handler; shared with Follow-Up center |
| `DepartmentHealthPanel` | Client | Domain | Two-thirds-width panel listing departments with health badges |
| `DepartmentHealthRow` | Client | Domain | Single department row with health badge and counts |
| `BottlenecksPanel` | Client | Domain | One-third-width panel listing top bottleneck stage types |
| `BottleneckCard` | Client | Domain | Single bottleneck card with stage type, department, counts, avg delay |
| `ExecutiveDashboardSkeleton` | Client | Domain | Skeleton stat cards + skeleton panels matching final layout |
| `ExecutiveDrillDownPage` | Server | Page | `app/(dashboard)/analytics/executive/drill-down/[metric]/page.tsx` |
| `BottleneckDrillDownPage` | Server | Page | `app/(dashboard)/analytics/executive/bottlenecks/[stageType]/drill-down/page.tsx` |
| `SlaBadge` | Client | Domain/shared | Reuse existing SLA badge component for drill-down rows |
| `EmptyState`, `ErrorState`, `PageHeader` | Client | Shared | Reuse existing shared components |
| `ExecutiveDashboardFilters` | Client | Domain | Filter button in PageHeader `actions` slot; opens `AdvancedFiltersSheet` for date/dept/priority/category filters |
| `ExecutiveDrillDownSkeleton` | Client | Domain | Skeleton matching drill-down table shape |
| `Card`, `Badge`, `Button`, `Skeleton`, `Sheet`, `Select` | Client | shadcn | Run `npx shadcn@latest docs <component>` before implementation if adding missing components |

### States

| State | Component | Pattern |
|-------|-----------|---------|
| Loading | `ExecutiveDashboardSkeleton` | Skeleton stat cards (5) + skeleton department rows (6) + skeleton bottleneck cards (4) |
| Empty | `EmptyState` | Icon, headline, short copy, CTA to aging report |
| Error | `ErrorState` | Safe message and retry button |
| No Permission | `EmptyState` | Lock icon, localized message |
| Success | `ExecutiveDashboard` | Loaded stat cards, health panel, and bottlenecks panel |

### Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| Mobile (<640px) | Single-column layout; stat cards stack 1-column; department health and bottlenecks panels stack vertically; panels collapse to compact cards |
| Tablet (640–1023px) | Stat cards grid 2–3 columns; department health panel full width above bottlenecks panel |
| Desktop (≥1024px) | 5-column stat grid; two-column row with department health (2/3) and bottlenecks (1/3) |

### RTL Considerations

- [x] All new components use only logical properties (`ms-`, `me-`, `ps-`, `pe-`, `text-start`, `text-end`, `border-s`, `border-e`, `start-*`, `end-*`).
- [x] Directional icons (`ChevronRight`, `ArrowLeft`, `TrendingUp`, `TrendingDown`) use `rtl:rotate-180`.
- [x] Stat card icon positions flip automatically when layout uses logical properties.
- [x] Department health rows align counts to `text-end` in both directions.
- [x] Bottleneck severity badges preserve reading order (label before count).

### Accessibility

- [x] All interactive elements have visible focus rings.
- [x] Icon-only buttons have `aria-label`.
- [x] Stat cards are clickable and behave as links with proper focus and keyboard activation.
- [x] Health badges use color + text label — never color-only.
- [x] Loading states use `Skeleton` with `animate-pulse` and `motion-reduce:animate-none`.
- [x] Touch targets are ≥ 44px on mobile.
- [x] Drill-down tables use semantic `<table>`, `<thead>`, `<th scope="col">`.

### Animation

- [x] Skeleton uses `animate-pulse` (shadcn default).
- [x] Stat cards use `transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5` on hover.
- [x] Bottleneck and health rows use `transition-colors duration-150` on hover.
- [x] All motion respects `prefers-reduced-motion` via `motion-reduce:` variants.

---

## Non-Functional Requirements

### Performance

- [x] Heavy drill-down table lazy-loaded with `next/dynamic`.
- [x] Dashboard summary queries use a shared filter object memoized via `useMemo`.
- [x] Poll summary endpoints every 60s to keep SLA health current (`refetchInterval` on summary query only).
- [x] No client-side aggregation of server data.

### Security

- [x] Backend ABAC is the source of truth for visible data.
- [x] Client does not reconstruct visibility rules.
- [x] Capability checks hide the Analytics nav group when the user lacks `analytics.view.organization` and the page itself when the capability is missing.
- [x] No PII written to URLs.
- [x] No `console.log` of dashboard or drill-down data.

### Testing

- [x] Component tests cover loading, success, empty, error, and no-permission states.
- [x] Tests assert that stat cards render correct counts and labels.
- [x] Tests assert that department health rows are sorted by severity.
- [x] Tests assert that clicking a stat card navigates to the correct drill-down route.
- [x] Tests use MSW handlers for executive endpoints.
- [x] SLA badge tests assert text appears with correct labels in drill-down views.

---

## Out of Scope

- Department performance and team workload views (covered by `012-department-manager-dashboard`).
- Task aging report (covered by `009-analytics-reporting`).
- Period-over-period comparison or trend charts (V2).
- CSV/PDF export of dashboard data (V2).
- Real-time websocket push (MVP uses 60s polling).
- Predictive SLA risk or forecasting (V3).
- Per-employee performance charts or individual scorecards (V2).
- Custom tenant-configurable health thresholds (MVP uses backend hardcoded thresholds).
- Editing tasks, logging follow-up actions, or any write operations (covered by task details and follow-up center).

---

## Relationship to Analytics Reporting

The executive dashboard (`002-executive-dashboard`) and the task aging report (`009-analytics-reporting`) are sibling analytics screens under `/analytics`:

| Aspect | Executive Dashboard (`002`) | Aging Report (`009`) |
|--------|-----------------------------|----------------------|
| **Primary user** | Ministers, executives, undersecretaries | Follow-up specialists, managers, executives doing weekly reviews |
| **Purpose** | High-level organizational health snapshot | Detailed read-only list of stalled work |
| **Route** | `/analytics` | `/analytics/aging` |
| **Data** | Aggregated counts, department health, bottleneck ranking | Individual tasks sorted by time at current stage |
| **Actions** | Drill-down to task lists | None (read-only) |
| **Polling** | 60s refresh on summary | No polling |

---

## Open Questions — All Resolved

- [x] **Sidebar navigation grouping:** — **Resolved.** Convert the Analytics sidebar item into a collapsible navigation group now. It contains "Executive Dashboard" → `/analytics` and "Aging Report" → `/analytics/aging`. When `012-department-manager-dashboard` is implemented, a third item "Department Dashboard" → `/analytics/department` (or `/departments/[publicId]/dashboard`) is added to the same group. This avoids future nav churn and matches the F5 milestone structure.
- [x] **Drill-down destination:** — **Resolved.** Use dedicated executive drill-down routes. Summary metric drill-downs navigate to `/analytics/executive/drill-down/[metric]` and bottleneck drill-downs navigate to `/analytics/executive/bottlenecks/[stageType]/drill-down`. These routes reuse the existing task-board/aging-report table components but query the executive drill-down endpoints (`GET /analytics/executive/summary/drill-down/{metric}` and `GET /analytics/executive/bottlenecks/{stageType}/drill-down`). The aging report does not support SLA-health filters (`overdue`, `at_risk`) or stage-type filters, so `/analytics/aging` cannot serve all drill-down cases.
- [x] **Completion rate card caption:** — **Resolved.** Show the `completed` count only (e.g. "1,204 completed"). The large percentage value already conveys the rate; adding the denominator requires extra computation and can be confusing due to rounding. If users need the denominator, it can be added in V2.
- [x] **Department health sorting:** — **Resolved.** Sort by severity descending (red → amber → green), then alphabetically by localized department name. This surfaces problem departments first while keeping the list predictable.
- [x] **Bottleneck severity tinting:** — **Resolved.** Tint bottleneck cards by the same severity logic used in the backend: red if `overdue_count > 0`, amber if only `at_risk_count > 0`, slate/zinc otherwise. This keeps frontend semantics aligned with backend ranking.
- [x] **OpenAPI numeric-string fields:** — **Resolved.** Use a frontend runtime narrowing adapter to convert string-serialized numeric fields (`active`, `overdue`, `at_risk`, `suspended`, `completed`, `cancelled`, `completion_rate`, `health`, counts in bottleneck/health resources) to proper numeric types. Follow the same `narrowAgingItems()` adapter pattern established in `009-analytics-reporting`. Do not block implementation waiting for a backend Scramble fix.

---

→ **Next:** Read `docs/ai/coding-standards.md` before creating `plan.md`.
