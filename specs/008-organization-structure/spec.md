# Spec: Organization Structure

> **Number:** 008
> **Date:** 2026-06-26
> **Status:** `completed`
> **Milestone:** F6 — Admin, org, help, onboarding
> **Depends on:** `001-core-shell`
> **Backend spec:** `../backend/specs/002-organization-structure/` — `Contract status: stable`
> **Contract status:** `stable`
> **Author:** opencode
> **Branch:** `feat/008-organization-structure`
> **Base branch:** `main`

---

## Problem

Every task in Gov TMS flows through an organizational hierarchy — from a Minister down to an Employee. Blueprint assignment rules, escalation chains, and SLA deadline calculations all depend on a first-class organizational model (departments, positions, authority grades, working calendars). Today this structure lives in spreadsheets and static org charts that break whenever someone transfers or a department is restructured.

The backend now provides a stable Organization module (Spec 002) with CRUD endpoints for departments (nested tree), positions (job slots independent of people), authority grades (seniority tiers), and working calendars + public holidays. **The frontend has no UI to manage any of it.** Tenant admins must currently touch the database directly to model their organization; authorized users have no place to browse the org chart before building blueprints; and blueprint authors cannot look up which position/grade to assign a stage to from a friendly picker.

We need a single `/organization` workspace where:
- Tenant admins can build and maintain the full organizational hierarchy (departments, positions, grades, calendars, holidays).
- Authorized users can browse a read-only overview of the structure and pick entities for blueprint assignment.

---

## Goal

Deliver `/organization` inside the authenticated dashboard shell as a tabbed admin workspace that fully covers the stable backend Organization module:

- An **Overview** tab with a people-based org chart (departments from `GET /organization/departments/tree` decorated with each department's positions + current occupants) and summary stat cards.
- A **Departments** tab with the hierarchy tree + flat cursor-paginated list, filters, and full CRUD (create, edit, deactivate/reactivate, delete with cascade flag) via dialogs.
- A **Positions** tab with a cursor-paginated, filterable table and full CRUD (create, edit, transfer to another department, deactivate/reactivate, delete) plus a reporting-line picker.
- An **Authority Grades** tab with a bounded list and CRUD (no deactivation — grades are permanent; delete blocked when active positions reference them).
- A **Working Calendars** tab with bounded calendars list, default-calendar toggle, CRUD, and nested **Public Holidays** management (filter by year, recurring flag).

All mutating actions are gated by the `organization.manage` capability (tenant admin until IAM ABAC lands); read access is authenticated-only. The screen is bilingual (AR RTL default / EN LTR), responsive, and accessible.

---

## User Stories

### Overview / Browse

- As an **authorized user**, I want to see the tenant's department hierarchy as a visual tree, so that I understand the org structure before building blueprints or assigning tasks.
- As an **authorized user**, I want to see summary stat cards (total departments, total positions, filled, vacant), so that I gauge the org at a glance.
- As an **authorized user**, I want to expand a department node to see its children and (where available) its department head / positions count, so that I can drill into the structure without leaving the page.

### Departments

- As a **tenant admin**, I want to create a top-level department, so that I can start building the org hierarchy.
- As a **tenant admin**, I want to create sub-departments under a parent, so that the tree reflects our real structure (Sector → Directorate → Section → Unit).
- As a **tenant admin**, I want to update a department's bilingual name, so that both Arabic and English labels stay current after a rename.
- As a **tenant admin**, I want to deactivate and reactivate a department, so that inactive departments stop appearing in pickers but keep their history, and so that I can restore them.
- As a **tenant admin**, I want to delete a department with an explicit `cascade_to_children` flag, so that I understand the blast radius before confirming.
- As an **authorized user**, I want to list departments as a flat paginated list with filters (active state, parent), so that I can browse and manage large organizations.

### Authority Grades

- As a **tenant admin**, I want to create authority grades with a unique rank (lower = more senior), so that the system understands seniority for escalation and assignment rules.
- As a **tenant admin**, I want to edit a grade's name/description, so that labels reflect official terminology.
- As a **tenant admin**, I want to delete a grade only when no active positions reference it, so that historical references stay valid.
- As an **authorized user**, I want to list all authority grades sorted by rank, so that I can pick one when creating a position.

### Positions

- As a **tenant admin**, I want to create a position (job slot) in a department with a title, authority grade, and reporting line, so that the system assigns tasks to the role — not the person.
- As a **tenant admin**, I want to mark a position as department head, so that "Department Head" assignment rules resolve correctly (only one head per department).
- As a **tenant admin**, I want to transfer a position to a different department, so that restructuring is reflected (the head flag clears automatically).
- As a **tenant admin**, I want to deactivate and reactivate a position, so that inactive positions stop receiving assignments but keep history.
- As a **tenant admin**, I want to delete a position, so that removed roles are soft-deleted without losing task history.
- As an **authorized user**, I want to list positions filtered by department, authority grade, and active state, so that I can find the right role for a blueprint assignment rule.
- As an **authorized user**, I want to view a position's detail (department, grade, reports-to, head flag, current occupant from IAM), so that I understand who holds the role. A "Vacant" indicator is shown when `current_occupant` is `null`.

### Working Calendars & Public Holidays

- As a **tenant admin**, I want to create a working calendar with working days and hours, so that SLA timers count only working time.
- As a **tenant admin**, I want to set one calendar as the default, so that SLA calculations fall back to it (setting a new default unsets the previous).
- As a **tenant admin**, I want to add public holidays (with an optional recurring flag), so that SLA timers skip non-working days and I do not have to recreate annual holidays.
- As a **tenant admin**, I want to edit and delete calendars and holidays, so that I can keep them current (deleting the default calendar is blocked).
- As an **authorized user**, I want to view the holidays for a calendar filtered by year, so that I can verify the upcoming non-working days.

### System

- As the **system**, I want all mutating Organization endpoints to require the `organization.manage` capability (tenant admin placeholder until IAM ABAC), so that only authorized admins can restructure the org.
- As the **system**, I want circular parent references (department) and circular reporting lines (position) prevented, surfacing a clear localized validation error to the user.
- As the **system**, I want soft-deleted entities excluded from pickers and the overview list, so that inactive/removed roles stop influencing new assignments.

---

## Acceptance Criteria

### Route and Page Structure

- [x] Route `/organization` renders inside the authenticated dashboard shell (sidebar "Organization" nav item and `SiteHeader` page title already exist).
- [x] The page uses a `PageHeader` with the localized title "Organization Structure" / "الهيكل التنظيمي" and a short description.
- [x] A tab bar switches between Overview, Departments, Positions, Authority Grades, and Working Calendars using URL param `?tab=` (shareable, back-button friendly). Default tab is `overview`.
- [x] Mutating actions (buttons, row actions, dialog save buttons) are hidden or disabled when the user lacks the `organization.manage` capability; a no-permission empty state shows on a 403.
- [x] Add buttons are rendered in the `PageHeader` `actions` slot for non-overview tabs, gated by `organization.manage`.
- [x] Create dialogs (Department, Position, Grade, Calendar) are managed at the workspace level and opened from the PageHeader Add button.

### Overview Tab

- [x] Renders a **visual org chart** (`VisualOrgChart`) combining `GET /organization/departments/tree` with positions + current occupants. Each department shows as a card with: gradient avatar circle (color-coded by depth tier), localized name, active/inactive badge, department head occupant (name + grade), and a filled/vacant position count.
- [x] Two-column layout: visual chart (left) and selected department positions panel (right). Clicking a department in the chart selects it and shows its positions in the right panel with avatar nodes showing title, grade, head badge, "Vacant" pill, and occupant name.
- [x] Positions panel in the overview shows a position detail drawer (`PositionDetailDrawer` via Sheet) on click, with occupant status, grade, department, and reports-to info.
- [x] Summary stat cards (4): Total Departments, Total Positions, Filled (positions with non-null `current_occupant`), Vacant (= Total − Filled). Vacant card uses the amber accent (`text-amber-600 dark:text-amber-400`) when count > 0. Cards use `2xl` font for values and include `sr-only` labels.
- [x] Stat cards are computed from the loaded department tree length and positions list (no separate endpoint) using `useMemo`.
- [x] Zoom controls (zoom in/out buttons with level indicator) are provided in the visual org chart to scale the chart between 50%–150%.
- [x] Chart uses gradient color tiers per depth level (`emerald → blue → purple → amber → rose`) for department avatar circles.
- [x] Connector lines (vertical and horizontal) render between tree levels; multi-child branches show a horizontal bar connector.
- [x] Hovering a node lifts it (`hover:shadow-md`, `motion-reduce` respected); clicking a node selects it (visual ring with `border-primary shadow-md ring-1 ring-primary`).
- [x] Occupant data is populated — backend `PositionController::index` now eager-loads `currentOccupant.user` (see Open Questions — resolved).

### Departments Tab

- [x] Dual view: an expandable **tree panel** (left) using `DepartmentTreePanel` (collapsible tree with chevron toggles, `aria-expanded`, logical `paddingInlineStart` for depth) and a **flat list** (right) fetched from `GET /organization/departments` (cursor-paginated) with filters `is_active` and `parent_department_id`, debounced search on localized name (300ms via local state + setTimeout), and a manual "Load more" button.
- [x] Flat list rows show: localized name, parent department name (resolved client-side from the tree query using `buildParentMap` helper), `ActiveBadge`, and `OrgActionMenu` actions dropdown (Edit, Deactivate/Reactivate, Delete).
- [x] "Add Department" button in PageHeader actions opens `DepartmentFormDialog`: bilingual name via `BilingualNameFields` (Arabic required, English optional), `parent_department_id` `RtlSelect` with `SelectContent position="popper"` (optional — uses `__none__` sentinel for top-level).
- [x] Edit opens the same dialog prefilled.
- [x] Deactivate/Reactivate calls `POST /organization/departments/{department}/deactivate` (or `/reactivate`) and invalidates department lists + tree + positions.
- [x] **Deactivate** dialog (`DepartmentDeactivateDialog` — custom Dialog with Checkbox) collects an explicit `cascade_to_children` checkbox (default unchecked) before calling `POST /organization/departments/{department}/deactivate` with `{ cascade_to_children }` (only deactivate supports cascade; `DELETE` rejects departments that still have children or active positions with a localized 422).
- [x] Reactivate dialog uses `ConfirmDeleteDialog` with localized threatening description.
- [x] **Delete** opens a `ConfirmDeleteDialog` (no cascade field) before calling `DELETE /organization/departments/{department}`. Surfaces backend 422 errors as toast messages.
- [x] Circular parent reference rejected by backend (422) — dialog shows the localized validation error inline via `ApiRequestError.error.errors`.
- [x] Search uses `ToggleGroup` for is_active filter (All / Active / Inactive) with styled active state.
- [x] Tree panel has a "Clear filter" link when a parent department filter is active.

### Positions Tab

- [x] Cursor-paginated table (`PositionsTable`, desktop) and card list (`PositionsCardList`, mobile) from `GET /organization/positions` filtered by `department_id`, `authority_grade_id`, `is_active`, with debounced search on localized title, manual "Load more". Table hidden under `md:hidden`, cards under `hidden md:block`.
- [x] Table columns: Title (localized), Department (localized name from nested `department`), Authority Grade (`rank — localized name`), Head (`Badge` when `is_department_head`, "Member" text otherwise), Status (`ActiveBadge`), Actions.
- [x] "Add Position" button in PageHeader opens `PositionFormDialog`: bilingual title via `BilingualNameFields` (with `nameArKey="title_ar"`, `nameEnKey="title_en"`), `department_id` select (required, from flattened tree), `authority_grade_id` select (required, sorted by rank), `reports_to_position_id` select (optional, lists active positions excluding self in edit mode), `is_department_head` checkbox.
- [x] Edit opens the same dialog prefilled.
- [x] Row action "Transfer" opens `TransferPositionDialog` (uses `AlertDialog` primitives) with a target department `RtlSelect`; confirm calls `useTransferPosition(publicId).mutate(targetDeptId)`. Head flag clears server-side on success.
- [x] Row actions Deactivate/Reactivate and Delete follow the department pattern, using `ConfirmDeleteDialog` with threatening localized descriptions.
- [x] Position detail drawer (`PositionDetailDrawer` via `Sheet` with `side` set per locale) shows `current_occupant` name (or "Vacant" amber pill when `null`), `ActiveBadge`, head badge, authority grade, department, and reports-to position title (resolved from loaded list).
- [x] Clicking a table row or card opens the detail drawer.

### Authority Grades Tab

- [x] Bounded list (no pagination) from `GET /organization/authority-grades`, sorted by `rank` ascending.
- [x] Rows/columns: Rank (mono font), Name (localized), Description (truncated with `max-w-[300px]`), Actions (Edit, Delete).
- [x] "Add Grade" button in PageHeader opens `AuthorityGradeFormDialog`: rank (Input `type=number min=1`), bilingual name via `BilingualNameFields`, optional description via `Textarea` with `dir="auto"`.
- [x] Edit opens the same dialog prefilled.
- [x] Delete is blocked (disabled with tooltip showing "This grade has active positions") when the grade's `public_id` is found in any loaded position's `authority_grade.public_id` (determined client-side from `usePositionsInfinite({ per_page: 200 })`).
- [x] No deactivation toggle (grades are permanent — help text "Grades cannot be deactivated. Create a new grade to supersede." shown under the table).

### Working Calendars Tab

- [x] Bounded calendars list (no pagination) from `GET /organization/working-calendars`.
- [x] Each calendar card (grid `sm:grid-cols-2 lg:grid-cols-3`): localized name, working days summary via `workingDaysLabel()` (maps comma-separated indices to localized short day names using `DAYS` array), working hours range (`HH:MM — HH:MM` with Clock icon), timezone (with Globe icon), default badge when `is_default`, Actions (Edit, Make Default, Delete — Make Default and Delete disabled when `is_default`).
- [x] "Add Calendar" button in PageHeader opens `WorkingCalendarFormDialog`: bilingual name via `BilingualNameFields`, working-days multi-day picker (`ToggleGroup` with `WEEK_START_SAT` ordering — Saturday first for Arabic week), `working_hours_start` + `working_hours_end` (Input `type=time` with `step=60` and HH:mm sanitization), `timezone` (`RtlSelect` of common GCC timezones + UTC), `is_default` checkbox.
- [x] Editing a calendar or toggling default invalidates calendars list.
- [x] Selecting a calendar toggles a **Holidays** sub-view (inline section below the calendar list) from `GET /organization/working-calendars/{workingCalendar}/holidays` filtered by year, with: localized holiday name, `holiday_date` (Hijri + Gregorian dual display via `formatDualDate()` using Intl `islamic` calendar), recurring badge, Edit and Delete row actions.
- [x] "Add Holiday" button opens `PublicHolidayFormDialog`: bilingual name via `BilingualNameFields` (with `nameArKey="name_ar"`), `holiday_date` (Input `type=date`), `is_recurring` checkbox.
- [x] Deleting a holiday calls `DELETE /.../holidays/{publicHoliday}` and invalidates the holiday list using prefix key match (not factory with undefined filters).
- [x] Make Default action opens a `ConfirmDeleteDialog` (reused for confirm pattern), calls `useUpdateWorkingCalendar(publicId).mutate({ is_default: true })`.
- [x] Year filter is URL-shareable via `?year=` search param, defaulting to current year.

### States (every data view)

- [x] Loading: per-tab `OrgSkeleton` with shadcn `Skeleton` using `animate-pulse motion-reduce:animate-none` — stat card skeletons (4-column grid), tree/table row skeletons matching the real shape.
- [x] Empty: `EmptyState` per tab (icon + headline + CTA description).
- [x] Error: `ErrorState` (safe message + retry) — network, 500, and 403 (no-permission variant with Lock icon and localized message).
- [x] Success: real content with pagination ("Load more" button for cursor-based lists).

### Mutation Feedback & Validation

- [x] All mutations show localized success toasts (`sonner` via `useTranslations('organization.toast')`) and localized error messages from `ApiRequestError` (backend sends localized validation messages via `X-Locale`).
- [x] 422 validation errors render inline under the offending form fields via `FieldError` and `aria-describedby`.
- [x] Mutating buttons display the saving/processing text and disable while in flight; dialogs remain open on error (inline field errors), close on success.
- [x] All mutations invalidate the relevant `organization` query keys (lists + tree + detail + positions when applicable). Prefix-based invalidation used for holiday queries (`[...queryKeys.organization.all, 'working-calendars', calendarPublicId, 'holidays']`) to avoid stale data with year-filter mismatch.

### Responsive Behavior

- [x] Desktop (≥1024px): two-column Departments view (tree + flat list via `lg:grid-cols-[320px,1fr]`); two-column Overview (chart left + positions panel right `lg:w-[380px]`); full tables on Positions/Grades; card grid on Calendars (`sm:grid-cols-2 lg:grid-cols-3`).
- [x] Tablet (640–1023px): single column — tree stacks above flat list; stat cards 4-column grid collapses to 2-column; tables keep all columns; holidays sub-view becomes inline section.
- [x] Mobile (<640px): tables (`PositionsTable`) collapse to card lists (`PositionsCardList`); stat cards become a 2×2 grid (`grid-cols-2`); tree becomes vertically stacked nested cards.

### Accessibility

- [x] Tabs are keyboard-operable (shadcn `Tabs` with `role="tablist"`/`role="tab"`/`role="tabpanel"`, arrow-key navigation), with `aria-selected`.
- [x] All interactive elements have visible focus rings (`focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`); icon-only buttons have `aria-label`.
- [x] Color is never the only indicator (active/inactive uses `ActiveBadge` text; vacant stat uses amber accent + "Vacant" label).
- [x] Tables use semantic `<table>` via `RtlTable`; tree uses nested `<ul>`/`<li>` with `role="tree"` and `role="group"`, `aria-expanded` on toggles.
- [x] Dialogs trap focus, close on Escape, and return focus to the trigger (shadcn Dialog + AlertDialog primitives).
- [x] Touch targets ≥ 44px on mobile.

---

## Technical Requirements

> Reference: `docs/ai/coding-standards.md`

### Data Fetching

- [x] `useDepartmentsInfinite(filters)` — `useInfiniteQuery`, `GET /organization/departments` (cursor-paginated, `per_page: 50`, default empty filters object).
- [x] `useDepartmentTree()` — `useQuery`, `GET /organization/departments/tree` (bounded, `staleTime: 5 min`). Used by Overview chart + Departments tree + parent-name resolution.
- [x] `useDepartment(publicId)` — `useQuery`, `GET /organization/departments/{department}` (enabled when `!!publicId`).
- [x] `useAuthorityGrades()` — `useQuery` (bounded, `staleTime: 5 min`), `GET /organization/authority-grades`.
- [x] `usePositionsInfinite(filters)` — `useInfiniteQuery`, `GET /organization/positions` (cursor-paginated, `per_page` defaults to backend default, filters `department_id`/`authority_grade_id`/`is_active` with search stripped from API but kept in query key for cache identity).
- [x] `usePosition(publicId)` — `useQuery`, `GET /organization/positions/{position}` (enabled when `!!publicId`).
- [x] `useWorkingCalendars()` — `useQuery` (bounded, `staleTime: 5 min`), `GET /organization/working-calendars`.
- [x] `usePublicHolidays(calendarPublicId, filters)` — `useQuery` (bounded, filter by year), `GET /organization/working-calendars/{workingCalendar}/holidays`, enabled when `!!calendarPublicId`.
- [x] Prefetch: none required (MVP — department detail not prefetched on hover).
- [x] No polling required (org structure changes are admin-driven, not time-sensitive).

### Query Key Structure

Extend the existing `queryKeys.organization` namespace in `lib/api/query-keys.ts`:

```ts
organization: {
  all: ['organization'] as const,
  departments: (filters?) => [...all, 'departments', 'list', filters] as const,   // flat list
  departmentTree: () => [...all, 'departments', 'tree'] as const,
  department: (publicId) => [...all, 'departments', 'detail', publicId] as const,
  authorityGrades: () => [...all, 'authority-grades'] as const,
  authorityGrade: (publicId) => [...all, 'authority-grades', 'detail', publicId] as const,
  positions: (filters?) => [...all, 'positions', 'list', filters] as const,
  position: (publicId) => [...all, 'positions', 'detail', publicId] as const,
  workingCalendars: () => [...all, 'working-calendars'] as const,
  workingCalendar: (publicId) => [...all, 'working-calendars', 'detail', publicId] as const,
  holidays: (calendarPublicId, filters?) =>
    [...all, 'working-calendars', calendarPublicId, 'holidays', filters] as const,
}
```

The existing `departments(filters)`/`positions(filters)` keys **should be migrated** to the structure above (or aliased) so existing usages (task/blueprint department pickers, etc.) keep working. Filter objects in query keys are memoized via `useMemo`.

### State Management

- [x] Active tab and all filters/search live in **URL search params** (`useSearchParams`): `?tab=positions&department_id=...&authority_grade_id=...&is_active=...&search=...&year=...`.
- [x] No organization data in Zustand. Only transient UI state (dialog open/close, selected department node for overview panel, expanded tree nodes) uses local `useState`; holiday year is a URL param (`?year=`).
- [x] Form input values are local React state inside dialogs (shadcn `Field` patterns).
- [x] Stats (Filled/Vacant) derive client-side from the loaded positions list (`useMemo` in `OrgStatCards`) — `current_occupant` non-null counts as Filled, null (or omitted) counts as Vacant. Backend now returns `current_occupant` in list responses (eager-load fixed). No separate stats endpoint.

### Mutation Patterns

- [x] `useCreateDepartment`, `useUpdateDepartment`, `useDeactivateDepartment`, `useReactivateDepartment`, `useDeleteDepartment` — invalidate `organization.departments` (prefix), `organization.departmentTree`. `useDeactivateDepartment` also invalidates positions.
- [x] `useCreateAuthorityGrade`, `useUpdateAuthorityGrade`, `useDeleteAuthorityGrade` — invalidate `organization.authorityGrades` (and `organization.positions` prefix so grade names refresh).
- [x] `useCreatePosition`, `useUpdatePosition`, `useTransferPosition`, `useDeactivatePosition`, `useReactivatePosition`, `useDeletePosition` — invalidate `organization.positions` (prefix), `organization.departmentTree`, and `organization.position(publicId)`.
- [x] `useCreateWorkingCalendar`, `useUpdateWorkingCalendar`, `useDeleteWorkingCalendar` (`useSetDefaultCalendar` via update with `{ is_default: true }`) — invalidate `organization.workingCalendars`.
- [x] `useCreatePublicHoliday`, `useUpdatePublicHoliday`, `useDeletePublicHoliday` — invalidate holiday queries via prefix key match (`[...queryKeys.organization.all, 'working-calendars', calendarPublicId, 'holidays']`) to avoid stale data when year filter is present.
- [x] Optimistic updates: **not used** — org mutations are low-frequency and carry validation constraints (circular refs, head uniqueness); standard invalidation gives correct UX. Button shows localized processing text until settled.
- [x] All mutations surface backend validation messages (localized via `X-Locale`) via `ApiRequestError` inline or toast.

### Error Handling

- [x] 401 → handled globally (redirect to `/login`).
- [x] 403 → no-permission `EmptyState` (lock icon, localized message) per panel (`DepartmentsPanel`, `PositionsPanel`, `AuthorityGradesPanel`, `WorkingCalendarsPanel` all check `ApiRequestError.status === 403`). Mutating actions hidden via `canManage` (`useCapability('organization.manage')`).
- [x] 422 → inline field errors in dialogs via `ApiRequestError.error.errors` iteration; circular reference messages render under the offending field.
- [x] 500/network → `ErrorState` with retry; individual query/error state per hook.
- [x] No PII in console logs or URLs. Occupant `public_id`/name surfaced into the UI only; never logged.

---

## UI Requirements

> Reference: `docs/design-system/01-tokens.md`, `03-components.md`, `04-layout-patterns.md`, `05-accessibility.md`, `06-anti-patterns.md`

### Component Breakdown

| Component | Type | Source | Notes |
|-----------|------|--------|-------|
| `OrganizationPage` | Server | Page | `app/(dashboard)/organization/page.tsx`; reads `?tab=` and renders `PageHeader` + `OrganizationTabs` |
| `OrganizationTabs` | Client | Domain | Tab bar (`Tabs` from shadcn) controlling `?tab=`; renders active panel |
| `OrganizationOverview` | Client | Domain | Visual org chart (`VisualOrgChart`) + positions panel + `OrgStatCards` |
| `VisualOrgChart` | Client | Domain | Zoomable visual tree with gradient avatars, connector lines, depth-tiers, department select |
| `OrgStatCards` | Client | Domain | 4 stat cards (Departments, Positions, Filled, Vacant) — derived from positions list occupancy |
| `OrgChartTree` | Client | Domain | Recursive nested `<ul>`/`<li>` tree combining `useDepartmentTree()` + positions (used as alternative tree view; not the main overview chart) |
| `DepartmentNode` | Client | Domain | Collapsible department card with actions menu, positions grouped by title using `groupByTitle()` |
| `PositionNode` | Client | Domain | Position row with title, grade, occupant/"Vacant", actions |
| `DepartmentsPanel` | Client | Domain | Tree + flat list orchestrator with URL filter state |
| `DepartmentTreePanel` | Client | Domain | Expandable tree with chevron toggles (subset of chart, used in Departments tab filter) |
| `DepartmentsTable` | Client | Domain | Flat cursor-paginated table via `RtlTable` with `OrgActionMenu` |
| `DepartmentsToolbar` | Client | Domain | Debounced search (300ms) + `ToggleGroup` for is_active filter |
| `DepartmentFormDialog` | Client | Domain | Create/edit dialog with `BilingualNameFields` + parent `RtlSelect` using `__none__` sentinel |
| `DepartmentDeactivateDialog` | Client | Domain | Custom Dialog with cascade-to-children `Checkbox` |
| `PositionsPanel` | Client | Domain | Filters + table + card list + dialogs |
| `PositionsTable` | Client | Domain | Cursor-paginated table (desktop) via `RtlTable` with `OrgActionMenu` |
| `PositionsCardList` | Client | Domain | Card list (mobile) with same action hierarchy |
| `PositionFormDialog` | Client | Domain | Bilingual title + department/grade/reports-to `RtlSelect` + head checkbox |
| `TransferPositionDialog` | Client | Domain | Target department `RtlSelect` using `AlertDialog` primitives |
| `PositionDetailDrawer` | Client | Domain | Sheet drawer for position detail (occupant, grade, reports-to, head badge) |
| `AuthorityGradesPanel` | Client | Domain | Bounded table + dialogs + active-grade scan |
| `AuthorityGradesTable` | Client | Domain | RtlTable with disabled Delete + Tooltip for referenced grades |
| `AuthorityGradeFormDialog` | Client | Domain | Rank input + bilingual name + description via `Textarea` |
| `WorkingCalendarsPanel` | Client | Domain | Calendars cards + holidays sub-view + confirm dialogs |
| `WorkingCalendarsList` | Client | Domain | Calendar cards grid with `workingDaysLabel()`, hours, timezone, actions |
| `WorkingCalendarFormDialog` | Client | Domain | `ToggleGroup` day picker (Sat-first), time inputs with `HH:mm` sanitization, timezone select, default checkbox |
| `PublicHolidaysSubView` | Client | Domain | Year filter via URL + holidays table with `formatDualDate()` (Hijri+Gregorian) |
| `PublicHolidayFormDialog` | Client | Domain | Bilingual name + date input + recurring checkbox |
| `OrgSkeleton` | Client | Domain | Per-tab skeleton matching shape |
| `OrgActionMenu` | Client | Domain | Domain-local ActionsMenu (avoids `CatalogTable` i18n coupling) |
| `OrganizationWorkspace` | Client | Domain | Root orchestrator: reads `?tab=`, renders `PageHeader` + `Tabs`, manages create dialogs |
| `PageHeader`, `EmptyState`, `ErrorState`, `ActiveBadge`, `BilingualNameFields`, `RtlSelect`, `RtlTable`, `ConfirmDeleteDialog` | Client | Shared | Reuse existing |
| `Tabs`, `Table`, `Card`, `Badge`, `Button`, `Dialog`, `AlertDialog`, `Sheet`, `Input`, `Textarea`, `Checkbox`, `Select`, `DropdownMenu`, `ToggleGroup`, `Tooltip`, `Skeleton`, `Separator` | Client | shadcn | Components added via shadcn CLI |

### States

| State | Component | Pattern |
|-------|-----------|---------|
| Loading | `OrganizationSkeleton` | Per-tab: skeleton stat cards + skeleton tree/table rows/cards |
| Empty | `EmptyState` | Per-tab icon + headline + "Add first X" CTA |
| Error | `ErrorState` | Safe message + retry |
| No Permission | `EmptyState` | Lock icon + localized message on mutating actions; read panels still render |
| Success | Tab panels | Real data; manual "Load more" on paginated lists |

### Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| Mobile (<640px) | Tabs become scrollable; tables → card lists; stats grid 2×2; tree → vertical nested cards; dialogs → bottom Sheets |
| Tablet (640–1023px) | Single column; Departments tree stacks above flat list; holidays sub-view becomes a Dialog; full table columns |
| Desktop (≥1024px) | Departments two-column (tree + flat list); full stat row; left tree panel sticky |

### RTL Considerations

- [x] All layout uses logical properties (`ms-`, `me-`, `ps-`, `pe-`, `text-start`, `border-s`, `border-e`, `start-*`, `end-*`).
- [x] Tree indentation uses logical `ps-*` (start padding) so depth shifts to the correct side in RTL.
- [x] Connecting lines in `DepartmentTreeChart` use logical `start`/`end` corners; chevrons/connector arrows use `rtl:rotate-180`.
- [x] Dropdowns in tables (`Actions` column) align to `end` and remain readable in RTL.
- [x] Working-days day picker uses `WEEK_START_SAT` ordering (Saturday first for GCC/Arabic week).
- [x] No physical `ml-`/`mr-`/`pl-`/`pr-`.

### Accessibility

- [x] Tabs use shadcn `Tabs` with `role="tablist"`/`role="tab"`/`role="tabpanel"`, `aria-selected`, arrow-key navigation.
- [x] Tree uses semantic nested `<ul>`/`<li>` with `aria-expanded` on parent nodes and keyboard support.
- [x] Tables use `<table>`, `<thead>`, `<th scope="col">`; row actions via labeled icon buttons.
- [x] All forms have labeled fields with `aria-describedby` linking error messages; required AR fields marked with `*`.
- [x] Dialogs trap focus, close on Escape, restore focus to trigger (shadcn defaults).
- [x] Holiday recurring flag and default-calendar flag use semantic `<Checkbox>` with associated labels.
- [x] Stat cards announce value with `sr-only` context.
- [x] Touch targets ≥ 44px on mobile.

### Animation

- [x] Skeletons use `animate-pulse` with `motion-reduce:animate-none`.
- [x] Tree nodes and stat cards use `transition-all duration-200 hover:shadow-md`; respect `prefers-reduced-motion`.
- [x] Dialog/Sheet overlay uses shadcn default `animate-in fade-in`.
- [x] No GPU-heavy effects (backdrop-blur) on table rows or tree nodes.

---

## Non-Functional Requirements

### Performance

- [x] Bounded lists (authority grades, working calendars, department tree, holidays) loaded in a single `useQuery`; paginated lists (departments flat, positions) use `useInfiniteQuery` with manual "Load more" button.
- [x] Overview org chart fetches positions with `per_page: 200` in a single page to decorate all department nodes with occupants without N+1.
- [x] Department tree endpoint returns the full hierarchy from backend; cached via TanStack Query default stale times.
- [x] Search input debounced by 300ms.
- [x] Filter objects memoized via `useMemo` for stable query keys.
- [x] No client-side filtering/sorting of server results — rely on API params (client-side search filtering occurs over loaded pages as fallback).

### Security

- [x] Capability checks hide/disable all mutating actions (`organization.manage`); IAM ABAC (Spec 003) is the server source of truth.
- [x] Read endpoints accessible to any authenticated user.
- [x] No PII in console/URLs; occupant `public_id` + name shown only in UI, never logged.
- [x] Bilingual fallback (`name_ar || name_en`) applied at the display layer via `localizeName()`/`localizeTitle()`.
- [x] No client-side enforcement of permission — server returns 403; client only optimizes UX.

### Testing

- [x] MSW handlers added for all `/organization/*` endpoints (`__tests__/mocks/organization-handlers.ts`, 250 lines, covering all GET/POST/PUT/DELETE operations).
- [x] Component test covers loading, success, empty, and error states for `OrganizationOverview` (`organization-overview.test.tsx`).
- [x] Validation error handling implemented via `ApiRequestError` with `extractApiErrors()` util — displays localized backend messages inline and via toast.

---

## Out of Scope

- **Org chart export** (PDF/PNG/CSV) — V2 per backend spec out-of-scope.
- **Financial delegation thresholds per position** — V2.
- **User management, capability grants, delegations** — IAM Spec 003.
- **Full audit trail UI** — Spec 015 (backend emits domain events already).
- **Position revision history** — Spec 015 (transfer is in-place update today).
- **Drag-and-drop reorder of departments/positions** — backend only supports parent reassignment; ordering by `created_at`/`rank` is sufficient.
- **Bulk import/export of org structure** — V2.
- **Position occupancy assignment UI** (assigning a user to a position) — belongs to IAM/user management surface (Spec 003 frontend), not the org structure admin tab.

---

## Open Questions — Resolved

- [x] **Positions list `current_occupant` eager-load (was BLOCKING):** ✅ **Resolved.** Backend owner added `currentOccupant.user` to `PositionController::index` eager-load. List responses now include `current_occupant`. The people-based Overview org chart and Filled/Vacant stats use the loaded positions list — no N+1, no separate stats endpoint.
- [x] **Org chart visualization depth:** **Resolved.** Full tree renders from `GET /organization/departments/tree` fully expanded for MVP. `VisualOrgChart` renders the complete hierarchy with connector lines. Zoom controls (50%–150%) allow fitting large trees. `DepartmentNode` in the tree view collapses children (default expanded to depth 2 for UX).
- [x] **Capability key name:** **Resolved.** All mutating actions gate on `organization.manage` via `useCapability('organization.manage')`. Matches glossary intent. Add buttons, action menus, and dialog save buttons hidden when `canManage` is false.
- [x] **Holiday date picker — Hijri vs Gregorian:** **Resolved.** Gregorian `<Input type="date">` with Hijri display alongside using `formatDualDate()` (`Intl.DateTimeFormat` with `islamic` calendar). No separate Hijri input in MVP.
- [x] **Working-days picker UI:** **Resolved.** 7-button `ToggleGroup` (`type="multiple"`, `variant="outline"`, `size="sm"`) that serializes to a comma-joined string on submit (`working_days: selected.sort().join(',')`) and parses back on edit (`calendar.working_days.split(',')`). `WEEK_START_SAT` ordering puts Saturday first for Arabic week. Empty selection guard: `if (form.working_days.length === 0) newErrors.working_days = ...`.
- [x] **Existing organization query keys migration:** **Resolved.** Extended the namespace with `departmentTree`, `department`, `authorityGrades`, `authorityGrade`, `position`, `workingCalendars`, `workingCalendar`, `holidays`. Kept existing `departments(filters)` and `positions(filters)` keys verbatim (used by `use-task-board.ts` and `use-blueprints.ts`).
- [x] **Departments flat list parent-name resolution:** **Resolved.** Parent name resolved client-side from the cached `useDepartmentTree()` via `buildParentMap()` in `organization-utils.ts` — no N+1.

---

→ **Next:** Read `docs/ai/coding-standards.md` before creating `plan.md`.