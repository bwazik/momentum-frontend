# Review Report: Spec 012 — Department Manager Dashboard

**Date:** 2026-07-12
**Reviewer:** Subagent (Deep Review)

---

## Critical Issues

### 1. Default department auto-resolution is missing entirely

| | |
|---|---|
| **Files** | `department-dashboard.tsx` |
| **Spec** | "If URL does not contain `departmentId`, the dashboard attempts to default to the current user's primary department" (AC line 71) |
| **Plan** | Has a full `useEffect` + `useRef` pattern at container snippet lines 500-513 |
| **Implementation** | The `useEffect` + `initialized.current` logic is absent. There is no import of `useEffect` or `useRef`. When no `departmentId` is in the URL, the component falls straight through to the "Select a department" empty state without ever resolving the default from `/me`. This breaks the primary workflow for scoped users (`analytics.view.department` only) who would never see a selector but also never get auto-navigated. |

Additionally, the `isLoading` term `(!urlFilters.departmentId && isUserLoading)` on line 70 is redundant (`isUserLoading` is already checked on line 69). Even if it were correct, once user data loads with no departmentId, `isLoading` becomes false and the component shows the empty-prompt state — the resolution logic never fires.

### 2. Stat cards use `status`/`slaHealth` instead of `metric` — unsupported drill-down param

| | |
|---|---|
| **Files** | `department-dashboard-types.ts`, `department-dashboard-utils.ts`, `department-performance-cards.tsx` |
| **Spec** | "Active, overdue, and at-risk cards are clickable and navigate to the department drill-down task list pre-filtered by the corresponding metric" (AC line 82) |
| **Plan** | Clicking a stat card sets `metric` URL param (plan item 7, line 859-864) |
| **Implementation** | The types define `slaHealth?: string` and `status?: string` but **no `metric` field**. The performance cards set `status=active` for the active card, `slaHealth=red` for overdue, and `slaHealth=amber` for at-risk. The drill-down query builder sends `sla_health` to the endpoint. |

**Backend contract violation:** The OpenAPI spec for `departmentDashboard.drillDown` (lines 4603-4612) defines `metric` as a query parameter — NOT `sla_health`. There is no `sla_health` param on any of the three endpoints. The backend will silently ignore the unrecognized param, meaning the drill-down will **never be filtered** by the card click. The `status` param IS recognized (line 4573), so the `active` filter may work, but the overdue/at-risk drill-down is broken.

*Note: Backend team confirmed adding `sla_health` support separately — if deployed, this issue is resolved.*

### 3. Generated API types not used for query parameter types

| | |
|---|---|
| **Files** | `use-analytics.ts` lines 80-82, `department-dashboard-utils.ts` |
| **Spec** | "Use generated types from `lib/generated/api-types.ts`" (spec line 167) |
| **Plan** | Shows typed `DepartmentPerformanceQuery`, `DepartmentTeamQuery`, `DepartmentDrillDownQuery` using `operations['departmentDashboard.*']` |
| **Implementation** | Types are defined as bare `Record<string, unknown>`: `export type DepartmentPerformanceQuery = Record<string, unknown>;` |

This violates the coding standard: "Types from generated OpenAPI client — not hand-written API types." The generated `operations` types exist in `api-types.ts` (the `departmentDashboard.performance`, `departmentDashboard.team`, `departmentDashboard.drillDown` operationIds are confirmed present in the OpenAPI spec).

---

## Major Issues

### 4. Empty state reset button drops `departmentId`

| | |
|---|---|
| **Files** | `department-dashboard.tsx` lines 143-147 |
| **Plan** | "Reset clears everything except departmentId" (plan item 6, line 738) |
| **Implementation** | The reset button in the empty state uses `router.replace(pathname)` which strips all params including `departmentId`. This is inconsistent with the `DepartmentDashboardFilters.resetFilters()` which correctly preserves `departmentId`. After clearing via the empty state CTA, the user has to re-select their department. |

### 5. Drill-down loading state not included in main loading check

| | |
|---|---|
| **Files** | `department-dashboard.tsx` lines 68-72 |
| **Implementation** | `isLoading` checks `isUserLoading`, `performanceQuery.isLoading`, and `teamQuery.isLoading` — but NOT `drillDownQuery.isLoading`. This means the main skeleton disappears before the drill-down has loaded, causing a visual flash where stat cards and team panel render while the drill-down area shows its own skeleton independently. |

### 6. `formatDuration` duplicated instead of reused

| | |
|---|---|
| **Files** | `department-dashboard-utils.ts` lines 100-118, `executive-dashboard-utils.ts` lines 151-169 |
| **Plan** | "Reuse `formatDuration` from `executive-dashboard-utils.ts`" (plan item 3, line 249) |
| **Implementation** | `department-dashboard-utils.ts` defines its own identical copy of `formatDuration` instead of re-exporting from `executive-dashboard-utils.ts`. This duplicates 18 lines of code. |

### 7. `activeCount` in filters doesn't count all active filter params

| | |
|---|---|
| **Files** | `department-dashboard-filters.tsx` lines 28-30, `department-dashboard.tsx` lines 123-130 |
| **Spec** | Filter changes update URL and refetch data (AC line 111) |
| **Implementation** | `DepartmentDashboardFilters.activeCount` counts only `dateFrom`, `dateTo`, `priorityId`, `blueprintCategoryId` — it ignores `status`, `slaHealth`, `metric`, and `assigneeId`. A stat card click or team row click that sets these params will not show the correct badge count. The `hasFilters` check in the dashboard container DOES include status/slaHealth/assigneeId, so the empty state filter detection is correct but the filter badge count is wrong. |

### 8. Department selector clears incomplete set of filter params

| | |
|---|---|
| **Files** | `department-selector.tsx` lines 37-39 |
| **Implementation** | On department change, clears `assigneeId`, `status`, and `slaHealth` but does NOT clear `dateFrom`, `dateTo`, `priorityId`, `blueprintCategoryId`, or the non-existent `metric`. Date range and priority/category filters persist across department switches, which may produce confusing results (a date range that made sense for dept A applied to dept B data). The plan's intent was to "clear `assigneeId`/`metric` so the new department starts fresh" (plan item 5, line 644) but the implementation goes further (clears `status`/`slaHealth`) yet not far enough (leaves date/category filters). |

---

## Minor Issues

### 9. Page is fully client-side, not a server component shell

| | |
|---|---|
| **Files** | `app/(dashboard)/analytics/department/page.tsx` |
| **Plan** | Server page renders `PageHeader` with translated `title`/`description` + `DepartmentDashboard` client component (plan item 4, lines 436-449) |
| **Implementation** | The page is a bare client-wrapped server component with no `getTranslations` call. The `PageHeader` has been moved **inside** the `DepartmentDashboard` client component and is rendered in every state. While functional, this bypasses the server-side i18n pattern used by every other analytics page in the codebase. |

### 10. Sidebar analytics nav items not individually capability-gated

| | |
|---|---|
| **Files** | `app-sidebar.tsx` lines 90-100 |
| **Spec** | "The Analytics sidebar group gains a new item: 'Department Dashboard'" (AC line 65) |
| **Implementation** | Both `department_dashboard` and `aging_report` items are shown when `canViewAnalytics` is true. A user with only `task.view.follow_up_scope` (no `analytics.view.department` or `analytics.view.organization`) would see the department dashboard nav item, even though they'd get a 403 when visiting the page. Ideally each item should be individually capability-gated. |

### 11. `calendar_system` param not sent to any endpoint

| | |
|---|---|
| **Files** | `department-dashboard-utils.ts` `buildBaseQuery` |
| **OpenAPI** | All three department endpoints accept optional `calendar_system` query param |
| **Implementation** | Not sent. Minor — backend likely has a server default — but inconsistent with the contract. |

### 12. `buildBaseQuery` sets undefined params to `null` instead of omitting them

| | |
|---|---|
| **Files** | `department-dashboard-utils.ts` lines 34-42 |
| **Implementation** | When a filter is undefined, it's set to `null` in the query param object. The `apiClient` filters out `null` values before sending, so this works. But the `null` values are still included in the memoized filter object, creating distinct query keys for the same effective filter state (e.g., `{ status: null }` vs `{}`). This causes unnecessary cache fragmentation. |

---

## Test Issues

### 13. `useCurrentUser` mock doesn't expose `isLoading`

| | |
|---|---|
| **Files** | `department-dashboard.test.tsx` line 77 |
| **Implementation** | Mock returns `{ data: { public_id: 'user-1' } }` without `isLoading`. Since `isUserLoading` destructures as `undefined` (falsy), the loading check works incidentally, but this is fragile. |

### 14. No test for default department auto-resolution

| | |
|---|---|
| **Files** | `department-dashboard.test.tsx` |
| **Spec AC** | Default department derivation from `/me` |
| **Implementation** | No test verifies that opening `/analytics/department` without `departmentId` param auto-fills the URL. All tests hardcode `departmentId=dept-1` in the mock params. |

### 15. No test for stat card drill-down navigation

| | |
|---|---|
| **Files** | `department-dashboard.test.tsx` |
| **Spec AC** | "Clicking a stat card navigates to the correct drill-down route" (testing AC line 265) |
| **Implementation** | No test clicks a stat card and asserts the URL changes. |

### 16. No test for team row drill-down navigation

| | |
|---|---|
| **Files** | `department-dashboard.test.tsx` |
| **Spec AC** | "Clicking a team row" drill-down |
| **Implementation** | No test clicks a team row and asserts `assigneeId` param is set. |

---

## Summary Table

| # | Severity | Category | Issue |
|---|----------|----------|-------|
| 1 | **Critical** | Missing feature | Default department auto-resolution absent |
| 2 | **Critical** | API contract violation | `sla_health` sent instead of `metric` to drill-down |
| 3 | **Critical** | Coding standard | `Record<string, unknown>` instead of generated OpenAPI types |
| 4 | **Major** | Logic | Empty state reset button drops `departmentId` |
| 5 | **Major** | UX | Drill-down loading state not included in main skeleton decision |
| 6 | **Major** | DRY | `formatDuration` duplicated |
| 7 | **Major** | UX | Filter badge count doesn't include all filter params |
| 8 | **Major** | Logic | Department selector clears incomplete set of filter params |
| 9 | Minor | Pattern | Page has no server-side i18n / PageHeader |
| 10 | Minor | UX | Sidebar nav items not individually capability-gated |
| 11 | Minor | Contract | `calendar_system` not sent |
| 12 | Minor | Performance | Null values cause cache key fragmentation |
| 13 | Minor | Test | Fragile `useCurrentUser` mock |
| 14 | Minor | Test | Missing auto-department resolution test |
| 15 | Minor | Test | Missing stat card click test |
| 16 | Minor | Test | Missing team row click test |

**Files not created that ARE in the plan:** All planned files exist. No missing files.
