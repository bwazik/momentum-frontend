# Implementation Plan: 008 Organization Structure

> **Spec:** `specs/008-organization-structure/spec.md`
> **Date:** 2026-06-26
> **Status:** `completed`

---

## Open Questions Resolved

1. **Positions list `current_occupant` eager-load (was BLOCKING):** ✅ Resolved by backend owner. `PositionController::index` now eager-loads `currentOccupant.user`. List responses include `current_occupant`. The Overview visual org chart and Filled/Vacant stats derive from the loaded positions list — no N+1, no separate stats endpoint.
2. **Org chart visualization depth:** Render the full tree from `GET /organization/departments/tree` fully expanded for MVP. `VisualOrgChart` renders the complete hierarchy with connector lines and zoom controls (50%–150%). `DepartmentNode` in tree view collapses children (default expanded to depth 2).
3. **Capability key name:** All mutating actions gate on `organization.manage` via `useCapability('organization.manage')`. Add buttons in PageHeader, action menus, and dialog save buttons hidden when `canManage` is false.
4. **Holiday date picker — Hijri vs Gregorian:** Gregorian `<Input type="date">` with Hijri display alongside via `formatDualDate()` (`Intl.DateTimeFormat` with `islamic` calendar). No separate Hijri input in MVP.
5. **Working-days picker UI:** 7-button `ToggleGroup` (`type="multiple"`, `variant="outline"`, `size="sm"`) ordered by `WEEK_START_SAT` (Saturday first for Arabic week). Serializes to comma-joined string on submit, parses back on edit. Empty selection guard shows field error.
6. **Existing organization query keys migration:** Extended namespace with `departmentTree`, `department`, `authorityGrades`, `authorityGrade`, `position`, `workingCalendars`, `workingCalendar`, `holidays`. Kept existing `departments(filters)` and `positions(filters)` keys verbatim (used by `use-task-board.ts` and `use-blueprints.ts`).
7. **Departments flat-list parent-name resolution:** Resolved client-side from cached `useDepartmentTree()` via `buildParentMap()` — no N+1.
8. **Department Delete cascade flag (spec correction):** Cascade checkbox lives on `DepartmentDeactivateDialog` (deactivate only). Delete uses `ConfirmDeleteDialog` and surfaces 422 via toast.
9. **OpenAPI integer-ID mismatch:** The cast pattern (`as unknown as StoreDepartmentRequest` / `as unknown as StorePositionRequest` / `as unknown as TransferPositionRequest`) is used throughout. Position mutations also use the `Omit<...> & { ... }` overload pattern. Holiday mutations cast `as unknown as StorePublicHolidayRequest` for the `holiday_date` date-time mismatch.

---

## Technical Approach

Build `/organization` as a URL-driven (`?tab=`) tabbed admin workspace backed by `lib/api/hooks/use-organization.ts` over the stable `/v1/organization/*` endpoints, rendering five panels (Overview / Departments / Positions / Authority Grades / Working Calendars) with shared CRUD dialogs, capability-gated actions, all 4 states, and full RTL/i18n support.

### Key Decisions

- **One host hook file:** All organization hooks in `lib/api/hooks/use-organization.ts`. Cross-panel invalidation centralized via `qiDepartments()`, `qiPositions()`, `qiTree()` helpers.
- **URL as the single source of truth for tab + filters:** `?tab=` + per-tab filter params (`is_active`, `department_id`, `authority_grade_id`, `search`, `year`). No Zustand. Only transient UI state uses local `useState`.
- **Stats derived, not fetched:** Filled = positions with non-null `current_occupant`; Vacant = Total − Filled. Computed in `OrgStatCards` via `useMemo` from loaded tree + positions.
- **Visual org chart (not plain tree):** `VisualOrgChart` renders a visual card-based org tree with gradient avatar circles (color-coded by depth tier), connector lines, and zoom controls (50%–150% zoom levels). Two-column layout: chart (left) + selected department positions panel (right).
- **No optimistic updates:** Standard `onSuccess` invalidation + button loading state until settled.
- **Backward-compatible query keys:** Existing `departments(filters)` / `positions(filters)` keys kept verbatim; new keys added alongside.
- **Domain-local ActionMenu:** `OrgActionMenu` component in `components/domain/organization/` using `organization.actions.*` translation keys. Reuses `ConfirmDeleteDialog` with localized labels.
- **Cascade on Deactivate, plain confirm on Delete:** `DepartmentDeactivateDialog` (custom Dialog + Checkbox) for deactivate with cascade; `ConfirmDeleteDialog` for delete.
- **Create dialogs managed at workspace level:** `OrganizationWorkspace` manages create dialog state; PageHeader actions slot contains the Add button per tab.
- **Prefix-based holiday invalidation:** Holiday mutations use `[...queryKeys.organization.all, 'working-calendars', calendarPublicId, 'holidays']` prefix key to catch all year-filtered queries.

---

## Component Tree

```
app/(dashboard)/organization/page.tsx                       [Server]
  └─ OrganizationWorkspace                                   [Client] (root orchestrator: reads ?tab=, PageHeader + Tabs + create dialogs)
      ├─ PageHeader                                          [Shared] (title + description + Add button per tab gated by canManage)
      ├─ Tabs (shadcn)
      │   ├─ TabsContent "overview"
      │   │    └─ OrganizationOverview                       [Client]
      │   │         ├─ OrgStatCards                          [Client] (4 stat cards, derived from tree + positions)
      │   │         └─ <div flex lg:flex-row>
      │   │              ├─ VisualOrgChart                    [Client] (zoomable card-based tree with gradient avatars, connector lines)
      │   │              └─ Positions panel (right sidebar)   [Client] (selected dept positions, card list with occupant info)
      │   │                   └─ PositionDetailDrawer        [Client] (Sheet, locale-aware side, occupant/"Vacant", reports-to)
      │   ├─ TabsContent "departments"
      │   │    └─ DepartmentsPanel                           [Client]
      │   │         ├─ DepartmentsToolbar                    [Client] (debounced search + is_active ToggleGroup)
      │   │         ├─ <div grid lg:grid-cols-[320px,1fr]>
      │   │         │    ├─ DepartmentTreePanel              [Client] (expandable tree, click filters parent)
      │   │         │    └─ DepartmentsTable                  [Client] (RtlTable, OrgActionMenu, Load more)
      │   │         ├─ DepartmentFormDialog                   [Client] (create/edit, BilingualNameFields + parent RtlSelect)
      │   │         ├─ DepartmentDeactivateDialog             [Client] (cascade checkbox)
      │   │         └─ ConfirmDeleteDialog                   [Shared] (delete + reactivate)
      │   ├─ TabsContent "positions"
      │   │    └─ PositionsPanel                             [Client]
      │   │         ├─ PositionsToolbar                      [Client] (search, dept/grade/active filters)
      │   │         ├─ PositionsTable (desktop)              [Client] (RtlTable, OrgActionMenu, Load more)
      │   │         ├─ PositionsCardList (mobile)            [Client] (cards with same actions)
      │   │         ├─ PositionDetailDrawer (Sheet)          [Client] (occupant/"Vacant", grade, reports-to)
      │   │         ├─ PositionFormDialog                    [Client] (create/edit)
      │   │         ├─ TransferPositionDialog                [Client] (AlertDialog, target dept select)
      │   │         └─ ConfirmDeleteDialog                   [Shared] (deactivate, reactivate, delete)
      │   ├─ TabsContent "grades"
      │   │    └─ AuthorityGradesPanel                       [Client]
      │   │         ├─ AuthorityGradesToolbar                [Client]
      │   │         ├─ AuthorityGradesTable                   [Client] (RtlTable, bounded, disabled Delete + Tooltip)
      │   │         ├─ AuthorityGradeFormDialog              [Client] (rank input + BilingualNameFields + description)
      │   │         └─ ConfirmDeleteDialog                   [Shared]
      │   └─ TabsContent "calendars"
      │        └─ WorkingCalendarsPanel                      [Client]
      │             ├─ WorkingCalendarsList (cards grid)     [Client] (OrgActionMenu per card)
      │             ├─ WorkingCalendarFormDialog             [Client] (ToggleGroup day picker, time, timezone)
      │             ├─ PublicHolidaysSubView                 [Client] (inline section, year filter via URL)
      │             │    ├─ PublicHolidaysTable (RtlTable)   [Client] (formatDualDate, recurring badge)
      │             │    ├─ PublicHolidayFormDialog          [Client]
      │             │    └─ ConfirmDeleteDialog              [Shared]
      │             ├─ ConfirmDeleteDialog (Make Default)    [Shared]
      │             └─ ConfirmDeleteDialog (Delete)          [Shared]
      └─ Create dialogs (managed at workspace level)
           ├─ DepartmentFormDialog
           ├─ PositionFormDialog
           ├─ AuthorityGradeFormDialog
           └─ WorkingCalendarFormDialog

Shared/reused: PageHeader, EmptyState, ErrorState, ActiveBadge, BilingualNameFields, RtlSelect, RtlTable, ConfirmDeleteDialog
Domain-local: OrgActionMenu, OrgSkeleton, organization-utils (localizeName, localizeTitle, asBool, DAYS, WEEK_START_SAT, workingDaysLabel, buildParentMap, flattenTree, groupByTitle, formatDualDate)
shadcn primitives: Tabs, Table, Card, Badge, Button, Dialog, AlertDialog, Sheet, Input, Textarea, Checkbox, Select, DropdownMenu, ToggleGroup, Tooltip, Skeleton, Separator
```

---

## Affected Files

### New Files

```
app/(dashboard)/organization/page.tsx                  # REWRITE (was placeholder)
components/domain/organization/
  organization-workspace.tsx                          # URL tab orchestrator + create dialog state
  organization-overview.tsx
  visual-org-chart.tsx                                # Zoomable card-based visual org tree
  org-stat-cards.tsx
  org-chart-tree.tsx                                  # Recursive tree view (alternative to VisualOrgChart)
  department-node.tsx                                 # Collapsible dept card with positions grouped by title
  position-node.tsx                                   # Position row with actions
  departments-panel.tsx
  department-tree-panel.tsx                           # Expandable tree filter
  departments-table.tsx
  departments-toolbar.tsx                             # Debounced search + ToggleGroup filter
  department-form-dialog.tsx                          # Create/edit with BilingualNameFields + parent select
  department-deactivate-dialog.tsx                    # Custom Dialog with cascade checkbox
  positions-panel.tsx
  positions-toolbar.tsx
  positions-table.tsx                                 # Desktop RtlTable
  positions-card-list.tsx                             # Mobile card list
  position-detail-drawer.tsx                          # Sheet detail (locale-aware side)
  position-form-dialog.tsx
  transfer-position-dialog.tsx                        # AlertDialog with target dept select
  authority-grades-panel.tsx
  authority-grades-toolbar.tsx
  authority-grades-table.tsx                          # RtlTable with disabled Delete + Tooltip
  authority-grade-form-dialog.tsx
  working-calendars-panel.tsx
  working-calendars-toolbar.tsx
  working-calendars-list.tsx                          # Card grid with OrgActionMenu
  working-calendar-form-dialog.tsx                    # ToggleGroup day picker (Sat-first), time, timezone
  public-holidays-sub-view.tsx                        # Year filter + holidays RtlTable
  public-holiday-form-dialog.tsx
  org-skeleton.tsx                                    # Per-tab skeleton variants
  org-action-menu.tsx                                 # Domain-local ActionsMenu
  organization-utils.ts                               # localizeName, localizeTitle, asBool, DAYS, WEEK_START_SAT, workingDaysLabel, buildParentMap, flattenTree, groupByTitle, formatDualDate
lib/api/hooks/use-organization.ts                     # All org query + mutation hooks (449 lines)
__tests__/mocks/organization-handlers.ts               # Full MSW handlers for all /organization/* endpoints (250 lines)
__tests__/components/domain/organization/
  organization-overview.test.tsx                       # Loaded, empty, error states
```

### Modified Files

```
lib/api/query-keys.ts               # Extend organization namespace (backward-compatible)
__tests__/mocks/handlers.ts          # Re-export organizationHandlers
messages/ar.json                    # Added `organization` namespace
messages/en.json                    # Added `organization` namespace (full namespace, ~240 lines)
components/ui/sheet.tsx             # Close button uses `end-3` (logical property)
```

> Note: `components/domain/shell/site-header.tsx` already has `page_titles.organization`. `components/domain/shell/app-sidebar.tsx` already lists the `/organization` nav item. No changes needed to those.

---

## Implementation Notes

> All code below is illustrative. Match the patterns in `use-blueprints.ts`, `create-blueprint-dialog.tsx`, and `blueprint-catalog.tsx`. **No `any` type — use generated types or `unknown` + cast for the integer-ID mismatch (see Open Question #9).**

### 0. Query Keys (extend, backward-compatible)

**File:** `lib/api/query-keys.ts`

```ts
// inside existing `organization: { ... }` — keep existing `departments`/`positions` keys verbatim,
// ADD the following siblings:
organization: {
  all: ['organization'] as const,
  departments: (filters?: Record<string, unknown>) =>            // KEEP (used by task-board, blueprints)
    [...queryKeys.organization.all, 'departments', filters] as const,
  departmentTree: () =>
    [...queryKeys.organization.all, 'departments', 'tree'] as const,
  department: (publicId: string) =>
    [...queryKeys.organization.all, 'departments', 'detail', publicId] as const,
  authorityGrades: () =>
    [...queryKeys.organization.all, 'authority-grades'] as const,
  authorityGrade: (publicId: string) =>
    [...queryKeys.organization.all, 'authority-grades', 'detail', publicId] as const,
  positions: (filters?: Record<string, unknown>) =>             // KEEP shape; add consumers below
    [...queryKeys.organization.all, 'positions', 'list', filters] as const,
  position: (publicId: string) =>
    [...queryKeys.organization.all, 'positions', 'detail', publicId] as const,
  workingCalendars: () =>
    [...queryKeys.organization.all, 'working-calendars'] as const,
  workingCalendar: (publicId: string) =>
    [...queryKeys.organization.all, 'working-calendars', 'detail', publicId] as const,
  holidays: (calendarPublicId: string, filters?: Record<string, unknown>) =>
    [...queryKeys.organization.all, 'working-calendars', calendarPublicId, 'holidays', filters] as const,
},
```

> **Important:** Existing `use-task-board.ts:38` calls `queryKeys.organization.departments({ is_active: true })` — the new hook will use a parallel `departmentTree()` key; do **not** change the `departments()` shape.

---

### 1. `lib/api/hooks/use-organization.ts` — host hook file

```ts
'use client';

import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/client';
import { queryKeys } from '@/lib/api/query-keys';
import type { components } from '@/lib/generated/api-types';

type DepartmentResource        = components['schemas']['DepartmentResource'];
type DepartmentTreeResource    = components['schemas']['DepartmentTreeResource'];
type AuthorityGradeResource    = components['schemas']['AuthorityGradeResource'];
type PositionResource          = components['schemas']['PositionResource'];
type WorkingCalendarResource   = components['schemas']['WorkingCalendarResource'];
type PublicHolidayResource     = components['schemas']['PublicHolidayResource'];
type StoreDepartmentRequest    = components['schemas']['StoreDepartmentRequest'];
type UpdateDepartmentRequest    = components['schemas']['UpdateDepartmentRequest'];
type StorePositionRequest      = components['schemas']['StorePositionRequest'];
type UpdatePositionRequest      = components['schemas']['UpdatePositionRequest'];
type TransferPositionRequest   = components['schemas']['TransferPositionRequest'];
type StoreAuthorityGradeRequest= components['schemas']['StoreAuthorityGradeRequest'];
type UpdateAuthorityGradeRequest= components['schemas']['UpdateAuthorityGradeRequest'];
type StoreWorkingCalendarRequest = components['schemas']['StoreWorkingCalendarRequest'];
type UpdateWorkingCalendarRequest = components['schemas']['UpdateWorkingCalendarRequest'];
type StorePublicHolidayRequest = components['schemas']['StorePublicHolidayRequest'];
type UpdatePublicHolidayRequest = components['schemas']['UpdatePublicHolidayRequest'];

interface CursorPage<T> { data: T[]; next_cursor: string | null; has_more: boolean; }

// ---- Reads ---------------------------------------------------------------

export function useDepartmentTree() {
  return useQuery({
    queryKey: queryKeys.organization.departmentTree(),
    queryFn: () => apiClient.get<DepartmentTreeResource[]>('/v1/organization/departments/tree'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useDepartmentsInfinite(filters: { is_active?: boolean; parent_department_id?: string }) {
  // Backend supports is_active + parent_department_id filters only (no search param). Search is client-side
  // filtered on loaded pages — omitted from the API call but kept out of the query key entirely.
  return useInfiniteQuery({
    queryKey: queryKeys.organization.departments(filters),
    queryFn: ({ pageParam }) =>
      apiClient.get<CursorPage<DepartmentResource>>('/v1/organization/departments', {
        params: { ...filters, per_page: 50, cursor: pageParam },
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.has_more ? lastPage.next_cursor : undefined),
    staleTime: 60 * 1000,
  });
}

export function useDepartment(publicId: string) {
  return useQuery({
    queryKey: queryKeys.organization.department(publicId),
    queryFn: () => apiClient.get<DepartmentResource>(`/v1/organization/departments/${publicId}`),
    enabled: !!publicId,
  });
}

export function useAuthorityGrades() {
  return useQuery({
    queryKey: queryKeys.organization.authorityGrades(),
    queryFn: () => apiClient.get<AuthorityGradeResource[]>('/v1/organization/authority-grades'),
    staleTime: 5 * 60 * 1000,
  });
}

export interface PositionListFilters {
  department_id?: string;
  authority_grade_id?: string;
  is_active?: boolean;
  search?: string;
  per_page?: number;
}

export function usePositionsInfinite(filters: PositionListFilters = {}) {
  // `search` is not a backend filter → omit when calling API; keep in queryKey for cache identity only.
  const { search: _search, ...sent } = filters;
  return useInfiniteQuery({
    queryKey: queryKeys.organization.positions(filters as unknown as Record<string, unknown>),
    queryFn: ({ pageParam }) =>
      apiClient.get<CursorPage<PositionResource>>('/v1/organization/positions', {
        params: { ...sent, cursor: pageParam },
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.has_more ? lastPage.next_cursor : undefined),
    staleTime: 60 * 1000,
  });
}

export function usePosition(publicId: string) {
  return useQuery({
    queryKey: queryKeys.organization.position(publicId),
    queryFn: () => apiClient.get<PositionResource>(`/v1/organization/positions/${publicId}`),
    enabled: !!publicId,
  });
}

export function useWorkingCalendars() {
  return useQuery({
    queryKey: queryKeys.organization.workingCalendars(),
    queryFn: () => apiClient.get<WorkingCalendarResource[]>('/v1/organization/working-calendars'),
    staleTime: 5 * 60 * 1000,
  });
}

export function usePublicHolidays(calendarPublicId: string, filters: { year?: number } = {}) {
  return useQuery({
    queryKey: queryKeys.organization.holidays(calendarPublicId, filters),
    queryFn: () => apiClient.get<PublicHolidayResource[]>(
      `/v1/organization/working-calendars/${calendarPublicId}/holidays`,
      { params: { year: filters.year } },
    ),
    enabled: !!calendarPublicId,
  });
}

// ---- Department mutations ------------------------------------------------

export function useCreateDepartment() {
  const qc = useQueryClient();
  const t = useTranslations('organization.toast');
  return useMutation({
    mutationFn: (body: StoreDepartmentRequest) => apiClient.post<DepartmentResource>('/v1/organization/departments', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.organization.departmentTree() });
      qc.invalidateQueries({ queryKey: [...queryKeys.organization.all, 'departments'] });
      toast.success(t('dept_created'));
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateDepartment(publicId: string) {
  const qc = useQueryClient();
  const t = useTranslations('organization.toast');
  return useMutation({
    mutationFn: (body: UpdateDepartmentRequest) =>
      apiClient.put<DepartmentResource>(`/v1/organization/departments/${publicId}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.organization.departmentTree() });
      qc.invalidateQueries({ queryKey: [...queryKeys.organization.all, 'departments'] });
      qc.invalidateQueries({ queryKey: queryKeys.organization.department(publicId) });
      toast.success(t('dept_saved'));
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeactivateDepartment(publicId: string) {
  const qc = useQueryClient();
  const t = useTranslations('organization.toast');
  return useMutation({
    mutationFn: (cascade: boolean) =>
      apiClient.post<DepartmentResource>(`/v1/organization/departments/${publicId}/deactivate`, { cascade_to_children: cascade }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.organization.departmentTree() });
      qc.invalidateQueries({ queryKey: [...queryKeys.organization.all, 'departments'] });
      qiPositions(qc);
      toast.success(t('dept_deactivated'));
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useReactivateDepartment(publicId: string) {
  const qc = useQueryClient();
  const t = useTranslations('organization.toast');
  return useMutation({
    mutationFn: () => apiClient.post<DepartmentResource>(`/v1/organization/departments/${publicId}/reactivate`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.organization.departmentTree() });
      qc.invalidateQueries({ queryKey: [...queryKeys.organization.all, 'departments'] });
      toast.success(t('dept_reactivated'));
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteDepartment() {
  const qc = useQueryClient();
  const t = useTranslations('organization.toast');
  return useMutation({
    mutationFn: (publicId: string) => apiClient.delete(`/v1/organization/departments/${publicId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.organization.departmentTree() });
      qc.invalidateQueries({ queryKey: [...queryKeys.organization.all, 'departments'] });
      toast.success(t('dept_deleted'));
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ---- Authority-grade mutations ------------------------------------------

export function useCreateAuthorityGrade() {
  const qc = useQueryClient();
  const t = useTranslations('organization.toast');
  return useMutation({
    mutationFn: (body: StoreAuthorityGradeRequest) =>
      apiClient.post<AuthorityGradeResource>('/v1/organization/authority-grades', body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.organization.authorityGrades() }); toast.success(t('grade_created')); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateAuthorityGrade(publicId: string) {
  const qc = useQueryClient();
  const t = useTranslations('organization.toast');
  return useMutation({
    mutationFn: (body: UpdateAuthorityGradeRequest) =>
      apiClient.put<AuthorityGradeResource>(`/v1/organization/authority-grades/${publicId}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.organization.authorityGrades() });
      qiPositions(qc); // grade names may appear in position rows
      qc.invalidateQueries({ queryKey: queryKeys.organization.authorityGrade(publicId) });
      toast.success(t('grade_saved'));
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteAuthorityGrade() {
  const qc = useQueryClient();
  const t = useTranslations('organization.toast');
  return useMutation({
    mutationFn: (publicId: string) => apiClient.delete(`/v1/organization/authority-grades/${publicId}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.organization.authorityGrades() }); toast.success(t('grade_deleted')); },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ---- Position mutations --------------------------------------------------

export function useCreatePosition() {
  const qc = useQueryClient();
  const t = useTranslations('organization.toast');
  return useMutation({
    mutationFn: (body: Omit<StorePositionRequest, 'department_id' | 'authority_grade_id' | 'reports_to_position_id'> & {
      department_id: string; authority_grade_id: string; reports_to_position_id?: string;
    }) => apiClient.post<PositionResource>('/v1/organization/positions', body as unknown as StorePositionRequest),
    onSuccess: () => { qiPositions(qc); qiTree(qc); toast.success(t('pos_created')); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdatePosition(publicId: string) {
  const qc = useQueryClient();
  const t = useTranslations('organization.toast');
  return useMutation({
    mutationFn: (body: Omit<UpdatePositionRequest, 'authority_grade_id' | 'reports_to_position_id'> & {
      authority_grade_id: string; reports_to_position_id?: string;
    }) => apiClient.put<PositionResource>(`/v1/organization/positions/${publicId}`, body as unknown as UpdatePositionRequest),
    onSuccess: () => { qiPositions(qc); qiTree(qc); qc.invalidateQueries({ queryKey: queryKeys.organization.position(publicId) }); toast.success(t('pos_saved')); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useTransferPosition(publicId: string) {
  const qc = useQueryClient();
  const t = useTranslations('organization.toast');
  return useMutation({
    mutationFn: (departmentId: string) =>
      apiClient.post<PositionResource>(`/v1/organization/positions/${publicId}/transfer`, { department_id: departmentId } as unknown as TransferPositionRequest),
    onSuccess: () => { qiPositions(qc); qiTree(qc); qc.invalidateQueries({ queryKey: queryKeys.organization.position(publicId) }); toast.success(t('pos_transferred')); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeactivatePosition(publicId: string) {
  const qc = useQueryClient();
  const t = useTranslations('organization.toast');
  return useMutation({
    mutationFn: () => apiClient.post<PositionResource>(`/v1/organization/positions/${publicId}/deactivate`),
    onSuccess: () => { qiPositions(qc); qiTree(qc); qc.invalidateQueries({ queryKey: queryKeys.organization.position(publicId) }); toast.success(t('pos_deactivated')); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useReactivatePosition(publicId: string) {
  const qc = useQueryClient();
  const t = useTranslations('organization.toast');
  return useMutation({
    mutationFn: () => apiClient.post<PositionResource>(`/v1/organization/positions/${publicId}/reactivate`),
    onSuccess: () => { qiPositions(qc); qiTree(qc); qc.invalidateQueries({ queryKey: queryKeys.organization.position(publicId) }); toast.success(t('pos_reactivated')); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeletePosition() {
  const qc = useQueryClient();
  const t = useTranslations('organization.toast');
  return useMutation({
    mutationFn: (publicId: string) => apiClient.delete(`/v1/organization/positions/${publicId}`),
    onSuccess: () => { qiPositions(qc); qiTree(qc); toast.success(t('pos_deleted')); },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ---- Calendar / holiday mutations ---------------------------------------

export function useCreateWorkingCalendar() {
  const qc = useQueryClient();
  const t = useTranslations('organization.toast');
  return useMutation({
    mutationFn: (body: StoreWorkingCalendarRequest) =>
      apiClient.post<WorkingCalendarResource>('/v1/organization/working-calendars', body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.organization.workingCalendars() }); toast.success(t('cal_created')); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateWorkingCalendar(publicId: string) {
  const qc = useQueryClient();
  const t = useTranslations('organization.toast');
  return useMutation({
    mutationFn: (body: UpdateWorkingCalendarRequest) =>
      apiClient.put<WorkingCalendarResource>(`/v1/organization/working-calendars/${publicId}`, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.organization.workingCalendars() }); toast.success(t('cal_saved')); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteWorkingCalendar() {
  const qc = useQueryClient();
  const t = useTranslations('organization.toast');
  return useMutation({
    mutationFn: (publicId: string) => apiClient.delete(`/v1/organization/working-calendars/${publicId}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.organization.workingCalendars() }); toast.success(t('cal_deleted')); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useCreatePublicHoliday(calendarPublicId: string) {
  const qc = useQueryClient();
  const t = useTranslations('organization.toast');
  return useMutation({
    mutationFn: (body: StorePublicHolidayRequest) =>
      apiClient.post<PublicHolidayResource>(`/v1/organization/working-calendars/${calendarPublicId}/holidays`, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.organization.holidays(calendarPublicId) }); toast.success(t('holiday_created')); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdatePublicHoliday(calendarPublicId: string, holidayPublicId: string) {
  const qc = useQueryClient();
  const t = useTranslations('organization.toast');
  return useMutation({
    mutationFn: (body: UpdatePublicHolidayRequest) =>
      apiClient.put<PublicHolidayResource>(`/v1/organization/working-calendars/${calendarPublicId}/holidays/${holidayPublicId}`, body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.organization.holidays(calendarPublicId) }); toast.success(t('holiday_saved')); },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeletePublicHoliday(calendarPublicId: string) {
  const qc = useQueryClient();
  const t = useTranslations('organization.toast');
  return useMutation({
    mutationFn: (holidayPublicId: string) =>
      apiClient.delete(`/v1/organization/working-calendars/${calendarPublicId}/holidays/${holidayPublicId}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.organization.holidays(calendarPublicId) }); toast.success(t('holiday_deleted')); },
    onError: (e: Error) => toast.error(e.message),
  });
}

// ---- helpers -------------------------------------------------------------

function qiPositions(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: [...queryKeys.organization.all, 'positions'] });
}
function qiTree(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: queryKeys.organization.departmentTree() });
}
```

> Above snippet is illustrative — the real `useDepartmentsInfinite` body is shown just above; the implementer should use that exact shape (no leftover scaffolding). The `PositionsPanel.tooltip` pattern in step 7 uses similar `useMemo` for filter objects in query keys.
>
> **Key rule applied (`coding-standards.md`):** Query keys from the factory; `useInfiniteQuery` for cursor endpoints; `useQuery` for bounded arrays; mutations invalidate via the factory; localized toasts via `useTranslations('organization.toast')`; no optimistic updates; backend errors via `ApiRequestError` carry localized messages (X-Locale header).

---

### 2. Organization page (Server Component)

**File:** `app/(dashboard)/organization/page.tsx`

```tsx
import { getTranslations } from 'next-intl/server';
import { OrganizationWorkspace } from '@/components/domain/organization/organization-workspace';

export default async function OrganizationPage() {
  const t = await getTranslations('organization');
  return (
    <OrganizationWorkspace title={t('page_title')} description={t('page_description')} />
  );
}
```

> Server Component (no `'use client'`); `OrganizationWorkspace` is the client root that reads `?tab=` and renders the tabbed UI. `SiteHeader` already maps `/organization` → `page_titles.organization` (no change).

---

### 3. `OrganizationWorkspace` — URL-driven tabs

**File:** `components/domain/organization/organization-workspace.tsx`

```tsx
'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/shared/page-header';
import { OrganizationOverview } from './organization-overview';
import { DepartmentsPanel } from './departments-panel';
import { PositionsPanel } from './positions-panel';
import { AuthorityGradesPanel } from './authority-grades-panel';
import { WorkingCalendarsPanel } from './working-calendars-panel';

const TABS = ['overview', 'departments', 'positions', 'grades', 'calendars'] as const;
type Tab = (typeof TABS)[number];

export function OrganizationWorkspace({ title, description }: { title: string; description: string }) {
  const t = useTranslations('organization');
  const locale = useLocale();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const raw = searchParams.get('tab') ?? 'overview';
  const tab: Tab = (TABS as readonly string[]).includes(raw) ? (raw as Tab) : 'overview';

  function setTab(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', value);
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <main className="flex flex-col gap-4 p-6">
      <PageHeader title={title} description={description} />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className={locale === 'ar' ? 'w-full justify-end' : 'w-full justify-start'}>
          <TabsTrigger value="overview">{t('tabs.overview')}</TabsTrigger>
          <TabsTrigger value="departments">{t('tabs.departments')}</TabsTrigger>
          <TabsTrigger value="positions">{t('tabs.positions')}</TabsTrigger>
          <TabsTrigger value="grades">{t('tabs.grades')}</TabsTrigger>
          <TabsTrigger value="calendars">{t('tabs.calendars')}</TabsTrigger>
        </TabsList>
        <TabsContent value="overview"><OrganizationOverview /></TabsContent>
        <TabsContent value="departments"><DepartmentsPanel /></TabsContent>
        <TabsContent value="positions"><PositionsPanel /></TabsContent>
        <TabsContent value="grades"><AuthorityGradesPanel /></TabsContent>
        <TabsContent value="calendars"><WorkingCalendarsPanel /></TabsContent>
      </Tabs>
    </main>
  );
}
```

Test cases:
```tsx
test('renders Overview tab by default and switches to Departments when ?tab=departments', async () => {
  // MSW returns empty arrays for tree, positions
  renderWithProviders(<OrganizationWorkspace title="x" description="y" />);
  expect(await screen.findByText(/x/)).toBeInTheDocument();
  expect(screen.getByRole('tab', { name: /overview/i })).toHaveAttribute('aria-selected', 'true');
  // simulate ?tab=departments via useSearchParams mock
});
test('hides Add buttons when user lacks organization.manage', async () => {
  // capability mock returns false for 'organization.manage'
  renderWithProviders(<OrganizationWorkspace title="x" description="y" />);
  expect(screen.queryByRole('button', { name: /add/i })).not.toBeInTheDocument();
});
```

---

### 4. `OrganizationOverview` + `OrgStatCards` + `OrgChartTree`

```tsx
// organization-overview.tsx
'use client';
import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Building2, Users, UserCheck, UserX } from 'lucide-react';
import { useDepartmentTree, usePositionsInfinite } from '@/lib/api/hooks/use-organization';
import { OrgStatCards } from './org-stat-cards';
import { OrgChartTree } from './org-chart-tree';
import { OrgSkeleton } from './org-skeleton';
import { ErrorState } from '@/components/shared/error-state';
import { EmptyState } from '@/components/shared/empty-state';
import { localizeName } from './organization-utils';

export function OrganizationOverview() {
  const t = useTranslations('organization');
  const tree = useDepartmentTree();
  const positions = usePositionsInfinite({ per_page: 200 });

  if (tree.isLoading || positions.isLoading) return <OrgSkeleton variant="overview" />;
  if (tree.isError) return <ErrorState message={tree.error?.message} onRetry={() => tree.refetch()} />;
  if (!tree.data?.length) return (
    <EmptyState icon={Building2} title={t('empty.no_departments')} description={t('empty.no_departments_desc')} />
  );

  const allPositions = positions.data?.pages.flatMap((p) => p.data) ?? [];
  const grouped = useMemo(() => {
    const m = new Map<string, typeof allPositions>();
    for (const p of allPositions) {
      const key = p.department?.public_id;
      if (!key) return;
      (m.get(key) ?? m.set(key, []).get(key)!).push(p); // simpler: build with reduce — see implementation
    }
    return m;
  }, [allPositions]);

  const filled = allPositions.filter((p) => p.current_occupant).length;
  const vacant = allPositions.length - filled;

  return (
    <div className="flex flex-col gap-6">
      <OrgStatCards departments={tree.data.length} positionsCount={allPositions.length} filled={filled} vacant={vacant} />
      <OrgChartTree tree={tree.data} positionsByDept={grouped} />
    </div>
  );
}
```

`OrgStatCards` — 4 cards via shadcn `Card` (5-col grid collapses to 2-col then 1-col per `04-layout-patterns.md`):

```tsx
const CARDS = [
  { key: 'total_departments', icon: Building2, value: (p: Stats) => p.departments, accent: '' },
  { key: 'total_positions',   icon: Users,     value: (p: Stats) => p.positionsCount, accent: '' },
  { key: 'filled',            icon: UserCheck, value: (p: Stats) => p.filled,   accent: 'text-emerald-600' },
  { key: 'vacant',            icon: UserX,     value: (p: Stats) => p.vacant,
    accent: p.vacant > 0 ? 'text-amber-600' : '' },
];
// each: <Card className="p-5"><div className="flex items-center justify-between">
//   <div><p className="sr-only">{t(`stats.${c.key}_sr`)}</p>
//        <p className="text-sm text-muted-foreground">{t(`stats.${c.key}`)}</p>
//        <p className={cn('text-2xl font-bold', c.accent)}>{c.value(stats)}</p></div>
//   <div className="rounded-xl bg-muted p-2"><c.icon className="size-5 text-muted-foreground" aria-hidden /></div>
// </div></Card>
```

`OrgChartTree` — recursive nested `<ul>`:

```tsx
export function OrgChartTree({ tree, positionsByDept }: Props) {
  return (
    <Card className="p-6">
      <ul className="flex flex-col gap-4">
        {tree.map((node) => <DepartmentNode key={node.public_id} node={node} positions={positionsByDept.get(node.public_id) ?? []} allByDept={positionsByDept} />)}
      </ul>
    </Card>
  );
}
```

`DepartmentNode` (nested card with `<ul>` children, positions list, ActionsMenu gating) and `PositionNode` (occupant/"Vacant" pill, rank, head badge, actions) — wrote fully in files; key rule: **no `<div>`-only nesting for tree**; use `<ul>`/`<li>` with `aria-expanded` on toggles and `rtl:rotate-180` chevrons.

---

### 5. `DepartmentsPanel` (tree + flat list)

```tsx
export function DepartmentsPanel() {
  const t = useTranslations('organization');
  const canManage = useCapability('organization.manage');
  const searchParams = useSearchParams();
  const router = useRouter(); const pathname = usePathname();
  const is_active = searchParams.get('is_active') === '0' ? false : searchParams.get('is_active') === '1' ? true : undefined;
  const parent = searchParams.get('parent_department_id') ?? undefined;
  const search = searchParams.get('search') ?? '';
  const filters = useMemo(() => ({ is_active, parent_department_id: parent }), [is_active, parent]);
  const tree = useDepartmentTree();
  const flat = useDepartmentsInfinite(filters);
  const [dialog, setDialog] = useState<null | { mode: 'create' | 'edit'; dept?: DepartmentResource }>(null);
  const [deactivate, setDeactivate] = useState<DepartmentResource | null>(null);
  const [del, setDel] = useState<DepartmentResource | null>(null);

  // state handling: loading skeleton, error retry, empty, success — do all four
  function setFilter(key: string, value: string | null) {
    const p = new URLSearchParams(searchParams.toString());
    if (value) p.set(key, value); else p.delete(key);
    router.replace(`${pathname}?${p.toString()}`);
  }

  return (
    <div className="flex flex-col gap-4">
      <DepartmentsToolbar canManage={canManage} onAdd={() => setDialog({ mode: 'create' })}
        is_active={is_active} onActiveChange={(v) => setFilter('is_active', v == null ? null : String(v))}
        search={search} onSearchChange={(v) => setFilter('search', v)} />
      <div className="grid gap-4 lg:grid-cols-[320px,1fr]">
        <DepartmentTreePanel loading={tree.isLoading} error={tree.isError} data={tree.data} onSelect={(d) => setFilter('parent_department_id', d?.public_id ?? null)} />
        <DepartmentsTable flat={flat} parentMap={useParentMap(tree.data)} canManage={canManage}
          onEdit={(d) => setDialog({ mode: 'edit', dept: d })}
          onDeactivate={(d) => setDeactivate(d)} onReactivate={(d) => useReactivateDepartment(d.public_id).mutate()}
          onDelete={(d) => setDel(d)} />
      </div>
      {dialog && <DepartmentFormDialog open onOpenChange={(o) => !o && setDialog(null)} mode={dialog.mode} dept={dialog.dept} />}
      {deactivate && <DepartmentDeactivateDialog dept={deactivate} open onOpenChange={(o) => !o && setDeactivate(null)} />}
      {del && <ConfirmDeleteDialog open onOpenChange={(o) => !o && setDel(null)}
        title={t('dialogs.delete_dept_title')} description={t('dialogs.delete_dept_desc')}
        confirmLabel={t('actions.delete')} cancelLabel={t('actions.cancel')}
        onConfirm={() => useDeleteDepartment().mutate(del.public_id, { onSuccess: () => setDel(null) })} />}
    </div>
  );
}
```

`useParentMap(tree)` helper (in `organization-utils.ts`) flattens the tree once into `Map<public_id, localized_name>`.

---

### 6. `DepartmentFormDialog` (create/edit, bilingual + parent)

```tsx
'use client';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field, FieldGroup, FieldLabel, FieldError } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { RtlSelect } from '@/components/shared/rtl-select';
import { SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BilingualNameFields } from '@/components/shared/bilingual-name-fields';
import { useDepartmentTree, useCreateDepartment, useUpdateDepartment } from '@/lib/api/hooks/use-organization';
import { ApiRequestError } from '@/lib/api/client';
import { localizeName } from './organization-utils';

interface Props { open: boolean; onOpenChange: (o: boolean) => void; mode: 'create' | 'edit'; dept?: DepartmentResource; }

export function DepartmentFormDialog({ open, onOpenChange, mode, dept }: Props) {
  const t = useTranslations('organization.dialogs');
  const { data: tree } = useDepartmentTree();
  const create = useCreateDepartment();
  const update = dept ? useUpdateDepartment(dept.public_id) : null;
  const [form, setForm] = useState({ name_ar: '', name_en: '', parent_department_id: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open && dept) setForm({ name_ar: dept.name_ar, name_en: dept.name_en ?? '', parent_department_id: dept.parent_department_id ?? '' });
    if (open && mode === 'create') setForm({ name_ar: '', name_en: '', parent_department_id: '' });
  }, [open, dept, mode]);

  function submit() {
    const e: Record<string, string> = {};
    if (!form.name_ar) e.name_ar = t('name_ar_required');
    setErrors(e);
    if (Object.keys(e).length) return;
    const body = { name_ar: form.name_ar, name_en: form.name_en || undefined, parent_department_id: form.parent_department_id || undefined };
    const onDone = { onSuccess: () => onOpenChange(false), onError: (err: Error) => {
      if (err instanceof ApiRequestError && err.error.errors) {
        const next: Record<string, string> = {};
        for (const [k, v] of Object.entries(err.error.errors)) next[k] = v[0];
        setErrors(next);
      } else setErrors({ name_ar: err.message });
    } };
    if (mode === 'create') create.mutate(body, onDone);
    else update?.mutate(body, onDone);
  }

  // Flatten the tree to populate the parent Select (exclude self for edit mode to avoid circular set).
  const parentsFlat: { public_id: string; name: string }[] = [];
  const walk = (nodes: DepartmentTreeResource[], depth = 0) => {
    for (const n of nodes) {
      if (mode === 'edit' && dept && n.public_id === dept.public_id) continue;
      parentsFlat.push({ public_id: n.public_id, name: `${'— '.repeat(depth)}${localizeName(n)}` });
      if (n.children) walk(n.children, depth + 1);
    }
  };
  walk(tree ?? []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{mode === 'create' ? t('add_dept') : t('edit_dept')}</DialogTitle></DialogHeader>
        <FieldGroup>
          <BilingualNameFields form={form} setForm={setForm} errors={errors} t={t} />
          <Field>
            <FieldLabel>{t('parent_department')}</FieldLabel>
            <RtlSelect value={form.parent_department_id} onValueChange={(v) => setForm({ ...form, parent_department_id: v === '__none__' ? '' : v })}>
              <SelectTrigger><SelectValue placeholder={t('parent_placeholder')} /></SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="__none__">{t('top_level')}</SelectItem>
                {parentsFlat.map((p) => <SelectItem key={p.public_id} value={p.public_id}>{p.name}</SelectItem>)}
              </SelectContent>
            </RtlSelect>
            {errors.parent_department_id && <FieldError>{errors.parent_department_id}</FieldError>}
          </Field>
        </FieldGroup>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('cancel')}</Button>
          <Button onClick={submit} disabled={create.isPending || update?.isPending}>
            {create.isPending || update?.isPending ? t('saving') : (mode === 'create' ? t('create') : t('save'))}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

> **Sentinel value `'__none__'`** for "no parent" avoids Select's empty-string placeholder conflict (per blueprint-catalog pattern). Circular reference rejected by backend → 422 surfaces via `ApiRequestError.error.errors.parent_department_id[0]` inline under the field.

`DepartmentDeactivateDialog` — custom Dialog (shadcn `Dialog` + `Checkbox`):

```tsx
export function DepartmentDeactivateDialog({ dept, open, onOpenChange }: { dept: DepartmentResource; open: boolean; onOpenChange: (o: boolean) => void; }) {
  const t = useTranslations('organization.dialogs');
  const mutate = useDeactivateDepartment(dept.public_id);
  const [cascade, setCascade] = useState(false);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{t('deactivate_dept_title')}</DialogTitle><DialogDescription>{t('deactivate_dept_desc')}</DialogDescription></DialogHeader>
        <label className="flex items-start gap-2 text-sm">
          <Checkbox checked={cascade} onCheckedChange={(v) => setCascade(v === true)} aria-describedby="cascade-desc" />
          <span id="cascade-desc">{t('cascade_to_children')}</span>
        </label>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('cancel')}</Button>
          <Button variant="destructive" onClick={() => mutate.mutate(cascade, { onSuccess: () => onOpenChange(false) })} disabled={mutate.isPending}>
            {mutate.isPending ? t('deactivating') : t('deactivate')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

> Spec AC corrected: `cascade_to_children` is sent on **deactivate** body (only endpoint that supports it). `DELETE` uses plain `ConfirmDeleteDialog` and surfaces `DepartmentHasChildrenException` / `DepartmentHasActivePositionsException` 422 toasts.

---

### 7. `PositionsPanel`, `PositionsTable`, `PositionFormDialog`, `TransferPositionDialog`

Pattern mirrors `DepartmentsPanel`. Key bits:

- **Columns:** Title (`localizeTitle`), Department (nested `department.name_*`), Authority Grade (`${rank} · ${name_ar}` localized), Head (`Badge` when `is_department_head`), Status (`ActiveBadge` with localized labels), Actions (`OrgActionMenu`).
- **Filters:** debounced search (300ms) client-side over loaded pages; `department_id` (RtlSelect from tree), `authority_grade_id` (RtlSelect from `useAuthorityGrades`), `is_active` toggle. All three go to URL.
- **Detail drawer:** shadcn `Sheet` (right side in LTR / `side` prop for RTL via `locale === 'ar' ? 'right' : 'left'` logical — actually shadcn Sheet uses `side="right"|"left"`; choose per locale). Shows occupant name or localized "Vacant" pill (`text-amber-600`), reports-to position title resolved client-side from the loaded list by `reports_to_position_id`.
- **Form** sends `department_id`/`authority_grade_id`/`reports_to_position_id` as **public_id strings** with `as unknown as StorePositionRequest` cast (Open Question #9). `reports_to_position_id` Select lists active positions (`usePositionsInfinite({ is_active: true, per_page: 200 })`) — exclude self in edit mode.
- **Transfer** dialog: target department RtlSelect (from `useDepartmentTree` flat list), confirm calls `useTransferPosition(publicId).mutate(targetDeptId)`. On success the head flag clears server-side — refetch shows updated dept_id.
- **Mobile:** `PositionsCardList` (cards with same hierarchy); `PositionsTable` hidden under `hidden md:block`, `PositionsCardList` shown under `md:hidden`.

```tsx
// PositionFormDialog submit (cast pattern)
create.mutate({
  title_ar: form.title_ar,
  title_en: form.title_en || undefined,
  department_id: form.department_id,          // string public_id
  authority_grade_id: form.authority_grade_id,// string public_id
  reports_to_position_id: form.reports_to_position_id || undefined,
  is_department_head: form.is_department_head,
} as unknown as StorePositionRequest, { onSuccess: ..., onError: ... });
```

Tests:
```tsx
test('PositionsPanel renders table rows for loaded positions', async () => { /* MSW returns 2 positions */ });
test('TransferPositionDialog submits target department public_id', async () => { /* click Transfer → select dept → confirm; assert POST …/transfer body{department_id} */ });
```

---

### 8. `AuthorityGradesPanel` + `AuthorityGradeFormDialog`

- Bounded `useQuery` → array; render `RtlTable` with Rank, Name (`localizeName`), Description, Actions.
- `OrgActionMenu` Edit + Delete. **Delete disabled** (Tooltip) when the grade is referenced by an active position. Determine `hasActivePositions` client-side by scanning cached positions list (loaded with `per_page: 200` on Overview). Per `security-policy.md` rule, this is a **UX hint only** — server still rejects invalid deletes with 422, surfaced as a toast.
- Form fields: `rank` (`Input type=number min=1`, frontend uniqueness check optional — backend enforces `unique:authority_grades,rank` and returns 422 inline), `BilingualNameFields`, optional `description` Textarea (`FieldLabel`=t('description'), `Textarea dir="auto"`).
- No deactivation UI. Show localized help text "Create a new grade to supersede" under the table.

---

### 9. `WorkingCalendarsPanel` + `WorkingCalendarFormDialog` + `PublicHolidaysSubView`

- Calendars: bounded `useQuery` array → cards (shadcn `Card`s in `grid sm:grid-cols-2 lg:grid-cols-3`).
- Each card: name, working-days summary (`workingDaysLabel(working_days, t)` in `organization-utils.ts` — maps `"0,1,2,3,4"` → localized day names like "Sun, Mon, Tue, Wed, Thu"), hours (`${working_hours_start}–${working_hours_end}`), timezone, default `Badge` if `is_default === true` (string "1" per OpenAPI cast — see below), ActionsMenu: Edit, Make Default (calls `useUpdateWorkingCalendar(id).mutate({...existing, is_default: true})` with confirm), Delete (`disabled` if `is_default`).
- `is_default` — generated type says `string`. Normalize to boolean in `organization-utils.ts` (`asBool(v)`).
- Form working-days picker:
```tsx
<ToggleGroup type="multiple" value={selected} onValueChange={(v) => setSelected(v as string[])}>
  {DAYS.map((d, idx) => <ToggleGroupItem key={idx} value={String(idx)} aria-label={t(`days.${d}`)}>{t(`days.short.${d}`)}</ToggleGroupItem>)}
</ToggleGroup>
// submit: working_days: selected.sort().join(',') as unknown as string  (cast type noop since string)
```
- Time inputs: `<Input type="time">` → stores `HH:MM` matching `date_format:H:i`. Timezone Select of common GCC zones (`Asia/Riyadh`, `Asia/Dubai`, `Asia/Kuwait`, `Asia/Qatar`, `Asia/Bahrain`, `Asia/Muscat`, `UTC`).
- **is_default checkbox:** `<Checkbox>` with localized label "Set as default".
- **Holidays sub-view:** selecting a calendar expands an `Accordion` (or shows inline section). `PublicHolidaysSubView` uses `usePublicHolidays(calendar.public_id, { year })` with a year `Input type=number` (URL-shareable `?year=` optional; default current year). RtlTable columns: Name (localized), Date (dual Hijri+Gregorian via `formatDualDate` from a small util — `Intl.DateTimeFormat` with `islamic` calendar), Recurring `Badge` (`asBool(is_recurring)`), ActionsMenu Edit/Delete.
- **Holiday form:** Gregorian `<Input type="date">`, `BilingualNameFields` (with `nameArKey="name_ar"`), `Checkbox` recurring. Submit:
```tsx
createHoliday.mutate({
  name_ar: form.name_ar, name_en: form.name_en || undefined,
  holiday_date: form.holiday_date, // ISO date string; backend validates `date` rule; OpenAPI says date-time but backend accepts `YYYY-MM-DD`
  is_recurring: form.is_recurring,
} as unknown as StorePublicHolidayRequest, { onSuccess: () => onOpenChange(false) });
```
- `holiday_date` date-time format mismatch (Open Question #4 resolved): backend `date` rule accepts `YYYY-MM-DD`; generated type says `date-time`. Cast with `as unknown as StorePublicHolidayRequest`.

Tests:
```tsx
test('creating a holiday posts YYYY-MM-DD holiday_date to /holidays', async () => {});
test('Make Default button disables when calendar is_default=true', async () => {});
```

---

### 10. `org-action-menu.tsx` (domain-local ActionsMenu)

Because `components/shared/catalog-table.tsx:ActionsDropdown` is hardcoded to `blueprints.catalog` i18n, build a local version:

```tsx
'use client';
import { useLocale, useTranslations } from 'next-intl';
import { Ellipsis } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export interface OrgAction { label: string; onClick: () => void; icon: React.ReactNode; disabled?: boolean; destructive?: boolean; }
export function OrgActionMenu({ actions }: { actions: OrgAction[] }) {
  const locale = useLocale();
  const t = useTranslations('organization');
  return (
    <DropdownMenu dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8" aria-label={t('actions')}>
          <Ellipsis className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {actions.map((a, i) => (
          <DropdownMenuItem key={i} onClick={a.onClick} disabled={a.disabled} className={a.destructive ? 'text-destructive' : ''}>
            <span className="me-2 size-4">{a.icon}</span>{a.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

---

### 11. `organization-utils.ts`

```ts
import type { useLocale } from 'next-intl';
import type { DepartmentTreeResource, AuthorityGradeResource, PositionResource, WorkingCalendarResource, PublicHolidayResource } from '@/lib/generated/api-types';

export function localizeName(n: { name_ar?: string | null; name_en?: string | null }, locale: string): string {
  return locale === 'ar' ? (n.name_ar || n.name_en || '') : (n.name_en || n.name_ar || '');
}
export function localizeTitle(p: { title_ar?: string | null; title_en?: string | null }, locale: string): string {
  return locale === 'ar' ? (p.title_ar || p.title_en || '') : (p.title_en || p.title_ar || '');
}
// OpenAPI says booleans/numerics as string; normalize.
export function asBool(v: unknown): boolean {
  return v === true || v === '1' || v === 1 || v === 'true';
}
export const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
export function workingDaysLabel(csv: string | null | undefined, t: (k: string) => string): string {
  if (!csv) return '';
  return csv.split(',').map((idx) => t(`days.short.${DAYS[Number(idx)]}`)).join(', ');
}
export function buildParentMap(tree: DepartmentTreeResource[], locale: string): Map<string, string> {
  const m = new Map<string, string>();
  const walk = (nodes: DepartmentTreeResource[]) => {
    for (const n of nodes) { m.set(n.public_id, localizeName(n, locale)); if (n.children) walk(n.children); }
  };
  walk(tree); return m;
}
export function formatDualDate(iso: string, locale: string): string {
  const d = new Date(iso);
  const g = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric' }).format(d);
  const h = new Intl.DateTimeFormat(`${locale}-u-ca-islamic`, { year: 'numeric', month: 'short', day: 'numeric' }).format(d);
  return `${h} — ${g}`;
}
```

> `localizeName`/`localizeTitle` already exist in `lib/utils/localize.ts` — prefer importing those and only add `workingDaysLabel`, `buildParentMap`, `formatDualDate`, `asBool`, `DAYS` here. Use the existing shared `localizeName`/`localizeTitle` signature where possible.

---

### 12. MSW handlers — `__tests__/mocks/organization-handlers.ts`

```ts
import { http, HttpResponse } from 'msw';

const tree = [{ public_id: 'dept-1', name_ar: 'الوزارة', name_en: 'Ministry', is_active: '1', children: [
  { public_id: 'dept-2', name_ar: 'المالية', name_en: 'Finance', is_active: '1', children: [] } ] }];

const positions = [
  { public_id: 'pos-1', department: { public_id: 'dept-2', name_ar: 'المالية' }, title_ar: 'مدير', title_en: 'Director',
    reports_to_position_id: null, authority_grade: { public_id: 'g-1', rank: '3', name_ar: 'مدير' },
    is_department_head: '1', is_active: '1', current_occupant: { public_id: 'u-1', name_ar: 'أحمد', name_en: 'Ahmed' }, created_at: '', updated_at: '' },
  { public_id: 'pos-2', department: { public_id: 'dept-2', name_ar: 'المالية' }, title_ar: 'محاسب', title_en: 'Accountant',
    reports_to_position_id: 'pos-1', authority_grade: { public_id: 'g-2', rank: '5', name_ar: 'موظف' },
    is_department_head: '0', is_active: '1', current_occupant: null, created_at: '', updated_at: '' },
];

export const organizationHandlers = [
  http.get('https://api.momentum.test/v1/organization/departments/tree', () => HttpResponse.json(tree)),
  http.get('https://api.momentum.test/v1/organization/departments', ({ request }) => {
    const u = new URL(request.url);
    return HttpResponse.json({ data: [{ public_id: 'dept-1', name_ar: 'الوزارة', name_en: 'Ministry', parent_department_id: null, is_active: '1', children: [], created_at: '', updated_at: '' }], next_cursor: null, has_more: false });
  }),
  http.post('https://api.momentum.test/v1/organization/departments', async ({ request }) => {
    const b = await request.json() as { name_ar: string };
    return HttpResponse.json({ public_id: 'dept-new', name_ar: b.name_ar, name_en: null, parent_department_id: null, is_active: '1', children: [], created_at: '', updated_at: '' }, { status: 201 });
  }),
  http.post('https://api.momentum.test/v1/organization/departments/:id/deactivate', ({ params }) =>
    HttpResponse.json({ public_id: String(params.id), name_ar: 'الوزارة', name_en: 'Ministry', parent_department_id: null, is_active: '0', children: [], created_at: '', updated_at: '' })),
  http.delete('https://api.momentum.test/v1/organization/departments/:id', () => new HttpResponse(null, { status: 204 })),
  http.get('https://api.momentum.test/v1/organization/positions', ({ request }) => {
    const u = new URL(request.url);
    return HttpResponse.json({ data: positions, next_cursor: null, has_more: false });
  }),
  http.post('https://api.momentum.test/v1/organization/positions/:id/transfer', async ({ params, request }) =>
    HttpResponse.json({ ...positions[0], public_id: String(params.id), department: { public_id: (await request.json() as { department_id: string }).department_id, name_ar: 'المالية' } })),
  http.get('https://api.momentum.test/v1/organization/authority-grades', () => HttpResponse.json([
    { public_id: 'g-1', rank: '1', name_ar: 'وزير', name_en: 'Minister', description: null, created_at: '', updated_at: '' },
    { public_id: 'g-2', rank: '3', name_ar: 'مدير', name_en: 'Director', description: null, created_at: '', updated_at: '' },
  ])),
  http.get('https://api.momentum.test/v1/organization/working-calendars', () => HttpResponse.json([
    { public_id: 'cal-1', name_ar: 'الافتراضي', name_en: 'Default', working_days: '0,1,2,3,4', working_hours_start: '08:00', working_hours_end: '16:00', timezone: 'Asia/Riyadh', is_default: '1', created_at: '', updated_at: '' },
  ])),
  http.get('https://api.momentum.test/v1/organization/working-calendars/:cid/holidays', ({ request }) => {
    const year = new URL(request.url).searchParams.get('year');
    return HttpResponse.json([{ public_id: 'h-1', name_ar: 'اليوم الوطني', name_en: 'National Day', holiday_date: '2026-09-23', is_recurring: '1', created_at: '' }]);
  }),
  // add POST/PUT/DELETE for every mutating endpoint similarly
];
```

Add to `__tests__/mocks/handlers.ts`:
```ts
import { organizationHandlers } from './organization-handlers';
export const handlers = [...existingHandlers, ...organizationHandlers];
```

---

### 13. i18n keys

Add `organization` block to both `messages/ar.json` and `messages/en.json` with namespaces:
- `page_title`, `page_description`, `tabs.{overview,departments,positions,grades,calendars}`
- `stats.{total_departments,total_positions,filled,vacant,..._sr}`, `empty.{no_departments,no_departments_desc,no_positions,...}`, `actions.{add,edit,delete,deactivate,reactivate,transfer,make_default,cancel,save,creating,saving,deactivating}`, `dialogs.{add_dept,edit_dept,name_ar_required,parent_department,top_level,parent_placeholder,delete_dept_title,delete_dept_desc,deactivate_dept_title,deactivate_dept_desc,cascade_to_children,add_position,edit_position,department,authority_grade,reports_to,title_ar_required,department_required,grade_required,head,transfer_title,transfer_desc,target_department,transfer_confirm,add_grade,edit_grade,rank,rank_required,name,description,add_calendar,edit_calendar,working_days,working_hours_start,working_hours_end,timezone,is_default,add_holiday,edit_holiday,date,is_recurring,vacant,head_of_dept}`
- `days.short.{sun,mon,tue,wed,thu,fri,sat}` and `days.{sun,mon,...}`
- `toast.{dept_created,dept_saved,dept_deactivated,dept_reactivated,dept_deleted,grade_created,grade_saved,grade_deleted,pos_created,pos_saved,pos_transferred,pos_deactivated,pos_reactivated,pos_deleted,cal_created,cal_saved,cal_deleted,holiday_created,holiday_saved,holiday_deleted}`

> Follow the `blueprints` namespace structure in the existing files. Do NOT add hardcoded Arabic/English strings inside components.

---

## Data Flow

```
User opens /organization?tab=positions
  → (dashboard)/layout.tsx server-side prefetchAuthenticatedUser → 401 redirects to /login
  → organization/page.tsx (Server) gets translations → renders <OrganizationWorkspace/>
  → OrganizationWorkspace reads ?tab= via useSearchParams → renders <PositionsPanel/>
  → PositionsPanel calls usePositionsInfinite({department_id, authority_grade_id, is_active, per_page:50})
  → CursorPage fetches GET /v1/organization/positions (apiClient adds X-Tenant + X-Locale + cookies)
  → TanStack Query caches under queryKeys.organization.positions(filters)
  → PositionsTable renders rows with localized title (useLocale picker), nested department/grade labels
  → User clicks "Transfer" → TransferPositionDialog → useTransferPosition(publicId).mutate(targetDeptPublicId)
    → apiClient POSTs {department_id: targetDeptPublicId} as unknown as TransferPositionRequest
    → onSuccess: invalidate queryKeys.organization.positions (lists) + departmentTree + position(publicId)
    → toast.success(t('pos_transferred'))
```

Identical flow for each entity/endpoint.

---

## Route Structure

```
app/(dashboard)/organization/page.tsx           # Server; renders <OrganizationWorkspace/>
app/(dashboard)/layout.tsx                        # Existing auth-guarded shell (no change)
app/(dashboard)/layout.tsx already prefetches authenticated user — no new layout needed.
```

Locale is cookie-based — no `[locale]` segment. URL params (tab + filters) are shareable/bookmarkable.

---

## Execution Order

1. **Query keys** — extend `lib/api/query-keys.ts` (backward-compatible additions).
2. **Hooks** — create `lib/api/hooks/use-organization.ts` with all reads + mutations.
3. **MSW handlers** — add `organization-handlers.ts`; re-export from `handlers.ts`.
4. **i18n** — add `organization` namespace to `messages/{ar,en}.json`.
5. **Page rewrite** — `app/(dashboard)/organization/page.tsx` Server Component.
6. **Shared utils** — `organization-utils.ts` helpers + `localizeName` (reuse `lib/utils/localize.ts`).
7. **Root orchestrator** — `organization-workspace.tsx` + `org-action-menu.tsx`.
8. **Departments tab** — `departments-panel` + `departments-table` + `department-tree-panel` + `department-form-dialog` + `department-deactivate-dialog`.
9. **Overview tab** — `organization-overview` + `org-stat-cards` + `org-chart-tree` + `department-node` + `position-node`; uses positions hook added in step 2.
10. **Positions tab** — `positions-panel` + `positions-table` + `positions-card-list` + `position-detail-drawer` + `position-form-dialog` + `transfer-position-dialog`.
11. **Authority Grades tab** — `authority-grades-panel` + `authority-grades-table` + `authority-grade-form-dialog`.
12. **Working Calendars tab** — `working-calendars-panel` + `working-calendars-list` + `working-calendar-form-dialog` + `public-holidays-sub-view` + `public-holiday-form-dialog`.
13. **Skeleton** — `org-skeleton.tsx` (per-tab variants).
14. **Tests** — panel component tests (`__tests__/components/domain/organization/*.test.tsx`) + `use-organization.test.ts`.
15. **Lint + typecheck +build** — `npm run lint && npm run typecheck && npm run build`.
16. **Manual test** — both locales, all four states, responsive breakpoints, keyboard nav.

(Overview can be done after Departments because `DepartmentNode`/`PositionNode` and stats reuse logic.)

---

## What to Test Manually

1. **AR RTL happy paths:** navigate /overview, /departments, /positions, /grades, /calendars; verify labels right-aligned, icons flip, dropdowns align end, tree indentation on the start side.
2. **EN LTR happy paths:** same flow; verify chevrons/labels flip correctly.
3. **Overview people chart:** with seeded users — occupant names show under each department; "Vacant" pill (amber) appears on unfilled positions; stat cards show non-zero Filled.
4. **Departments CRUD:**
   - Add top-level department → toast succeeds, tree + table refresh.
   - Add sub-department (parent select populated from tree) → parent_name resolved client-side.
   - Edit a department → dialog prefilled, save updates both.
   - **Deactivate with cascade checkbox unchecked → only the row goes inactive. With cascade checked → children go inactive too.**
   - **Delete a department that has children → 422 dialog stays open with localized message; remove children then delete → 204 + toast.**
   - Set parent to its own descendant → 422 inline on `parent_department_id`.
5. **Positions CRUD:**
   - Add position (dept + grade + reports-to pickers) → success.
   - Mark two positions as head of same dept → only the latest remains head (verify after invalidate).
   - Transfer position → row's department label updates; head flag clears (per backend).
   - Deactivate + reactivate + delete flows.
6. **Authority Grades CRUD:**
   - Create grade with rank conflict → 422 inline on `rank`.
   - Delete a grade referenced by active position → menu item disabled; if bypassed via API, server returns 422 (toast).
7. **Working Calendars + Holidays:**
   - Create calendar (working-days ToggleGroup → `0,1,2,3,4`) → list updates; default badge appears after setting default.
   - Make a second calendar default → first loses `is_default`, second keeps it.
   - Delete default calendar → button disabled.
   - Add holiday with date `2026-09-23` → table row shows Hijri + Gregorian; recurring badge toggles.
   - Deleting a holiday → list refreshes.
8. **Permission gating:** login as a non-admin (no `organization.manage`) → all Add/Edit/Delete actions hidden; 403 on direct POST renders generic localized error toast (no crash).
9. **Loading/empty/error:** kill backend / return empty arrays / return 500 → skeletons → empty states with CTAs → `ErrorState` with retry.
10. **Responsive:** desktop two-column Departments; tablet single; mobile tables become cards, dialogs become bottom Sheets.
11. **Keyboard:** Tab through sidebar → top bar → page tabs → toolbar → table → dialog (Esc closes, focus returns to trigger). Arrow Left/Right switches tabs.