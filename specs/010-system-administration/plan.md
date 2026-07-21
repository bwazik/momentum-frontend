# Plan: System Administration (Spec 010)

> **Spec:** 010-system-administration
> **Date:** 2026-07-19
> **Status:** `completed`

---

## Open Questions Resolved

All open questions in `spec.md` are pre-resolved. This plan re-states each resolution and adds implementation-level decisions.

| # | Spec Open Question | Decision for this plan |
|---|--------------------|------------------------|
| 1 | Public-ID generated-schema mismatch | Regenerate `lib/generated/api-types.ts` (`npm run generate:api`) before implementation. Every mutating request uses `string` UUID `public_id`s; never cast to integer. `AssignPositionRequest.position_id`, `GrantPositionCapabilityRequest.capability_id`, `GrantUserCapabilityRequest.capability_id` are `string` post-regen ✅. |
| 2 | Users cursor pagination | `GET /v1/iam/users` accepts `cursor` and returns `{ data, next_cursor, has_more }`. Use `useInfiniteQuery` with manual Load More. |
| 3 | Position-assignment read contract | `GET /v1/iam/users/{user}/positions` returns cursor-paginated `PositionAssignmentResource[]` with assignment `public_id`. Use that key for end/set-primary mutations. OpenAPI types the `{assignment}` path param as `string`; route binding resolves by `public_id` ✅. |
| 4 | Capability catalog edit contract | `UpdateCapabilityRequest` accepts only `name_ar`, `name_en`, `description`. UI displays `key` and `is_system_defined` as read-only; never offers key create/rename/delete. |
| 5 | Audit filter values | `entity_type` = stable 34-case int `AuditEntityType`. Build a static localized enum map in `lib/utils/audit-utils.ts`. `event_type` = free text with curated common-event list (`'created'`, `'updated'`, `'deactivated'`, `'reactivated'`, `'assigned'`, `'revoked'`, `'granted'`, `'ended'`, `'logged_in'`, `'logged_out'`) + free-text fallback `Input`. |
| 6 | User self-protection | Backend rejects self-deactivation + last-admin deactivation with localized 422. Surface `error.message` via `toast.error()`; do not preempt in UI. |
| 7 | Priority color constraints | `color_code` validated as `^#[0-9a-fA-F]{6}$`. Render a constrained accessible palette (8 swatches: emerald, amber, red, blue, purple, fuchsia, slate, cyan) plus optional hex `<input type="color">` with text fallback. Always pair swatch with the severity-rank text label. |
| 8 | Audit metadata detail | `GET /v1/audit-trail/system` returns AuditEventResource with raw `payload`, `ip_address`, `user_agent`. The OpenAPI contract currently types `data` as `string` (Scramble artifact). Build a runtime-narrowing adapter `narrowAuditEvent()` (see `009` aging / `007` bottleneck precedent). Behind an accessible `<Disclosure>` for IP + user-agent, only visible to `audit.view_system` and only when API provides values. Render `payload` as escaped key/value pairs — no `dangerouslySetInnerHTML`. |

**Contract gaps (resolved during implementation):**

- `GET /v1/iam/users/{user}/capability-grants` — added by backend, returns `UserCapabilityGrantResource[]` with `reason`, `granted_by`, `granted_at`, `revoked_at` ✅
- `GET /v1/audit-trail/system` — OpenAPI schema still declares `data: string`; frontend uses `narrowAuditPage()` runtime narrowing adapter. Real response is cursor-paginated `AuditEventResource[]`. **Deferred for OpenAPI typegen fix.**

---

## Technical Approach

> Bring tenant administration under one URL-driven, capability-gated `/admin` workspace with four tabs that compose existing shared primitives (`PageHeader`, `Tabs`, `Sheet`, `Dialog`, `RtlTable`, `EmptyState`, `ErrorState`, `ConfirmDeleteDialog`, `DualDateDisplay`, `UserSearchCombobox`) and four new TanStack Query hook files. All server state stays in TanStack Query; only URL state (`?tab`, `?userPublicId`, list filters, audit filters) and local component state (dialog/sheet open, form values, metadata disclosure) are used. No new Zustand store.

### Key Decisions

- **Tab pattern mirrors `/settings` (017).** Single route `/admin`, URL-driven `?tab=users|access|priorities|audit`, invalid → `users`. Capability-gated TabsTriggers are conditionally rendered (not just visually hidden) — same as `settings-workspace.tsx`.
- **Cursor pagination everywhere a list endpoint supports it.** Users (`GET /v1/iam/users`) and Audit Log (`GET /v1/audit-trail/system`) use `useInfiniteQuery` + manual Load More. Priors/capabilities/grants are bounded (≤50) and use `useQuery`.
- **SDK reuse over duplication.** Reuse `usePositionsInfinite`, `useDepartmentTree`, `useAuthorityGrades`, `useBlueprintCategories` (resp. from `use-organization.ts`, `use-blueprints.ts`) for selectors. Reuse `UserSearchCombobox` from `components/domain/tasks/` for the audit user picker.
- **Generated types only.** New types hand-written only for runtime adapters (`AuditEvent`, narrowed from `unknown`) and stable static enum maps (`AuditEntityType`, `ScopeType`, `AccountType`, `CalendarSystem`).
- **No optimistic updates on admin mutations.** Every write invalidates the relevant prefix; users see the toast then the refetched state. Aligns with security/audit gravity.
- **Single shared admin-page header action slot.** `PageHeader.actions` renders the **active tab's** primary action (Create User, Add Grant, Create Priority) — capability-gated — driven by a `tabAction` switch in `AdminWorkspace`.
- **Sheet on the logical end edge.** Pass `side={locale === 'ar' ? 'right' : 'left'}` to shadcn `Sheet` for `UserDetailSheet`. Spec mandates opens-from-end edge.
- **Date inputs via Spec 020 toolkit.** Audit date-range filter uses `DateRangePicker` with `calendarSystem` URL param. Position-assignment start/end, audit-grant date range use `DatePicker` with `calendarSystem` from the assignment request body (`AssignPositionRequest`, `GrantAuditGrantRequest` both accept `calendar_system`).
- **No glassmorphism, no charts, no new packages.** Solid `Card` / `Table` / `Sheet` surfaces.
- **PII in URLs banned.** User filters serialize `?userPublicId=<uuid>` (audit picker), `?departmentId=<uuid>`, `?search=<text>`. Search input is **not** PII-restricted by backend but must not contain email/employee-id/mobile-only queries; we still allow `search` URL param because backend filters on name + email + employee_id — accepted operational trade-off documented per spec — but inputs must accept generic text and never auto-persist sensitive values.
- **Permission UX only.** All capability gates via `useCapability()` from `lib/api/hooks/use-capabilities.ts`. Server returns 403 → render shared `PermissionDenied` (the existing inline muted-foreground block from `AdminPage`) and hide controls.

---

## Component Tree

```
app/(dashboard)/admin/page.tsx                                  (Server Component)
└── <PageHeader title={...} description={...} actions={...}/>
└── <AdminWorkspace/>                                           (Client - URL state + tab orchestration)
    ├── <Tabs value={tab}>
    │   ├── <TabsList> (capability-gated triggers)
    │   │   ├── <TabsTrigger value="users">                if iam.manage_users | audit.view_system
    │   │   ├── <TabsTrigger value="access">               if iam.manage_users | iam.manage_capabilities
    │   │   ├── <TabsTrigger value="priorities">            if task.manage_priorities
    │   │   └── <TabsTrigger value="audit">                if audit.view_system
    │   └── <TabsContent value="users">  → <UsersTabPanel/>
    │       └── <TabsContent value="access">  → <AccessTabPanel/>
    │       └── <TabsContent value="priorities">  → <PrioritiesTabPanel/>
    │       └── <TabsContent value="audit">  → <AuditTabPanel/>

UsersTabPanel                                                    (Client)
├── <UsersFilters/>                       (URL-driven, debounced search 300ms)
├── state: loading  → <AdminUsersSkeleton/>
├── state: error   → <ErrorState/> with Retry
├── state: empty   → <EmptyState/> with Reset + capability-gated Create User
├── state: success →
│   ├── Desktop: <RtlTable> → <UsersTableRow/> × N (row → opens UserDetailSheet)
│   ├── Mobile : <UsersCardList/> → <UsersMobileCard/>
│   └── <LoadMoreButton/>
└── <UserFormDialog/>                     (create/edit, capability-gated)

UserDetailSheet                                                  (Client, shadcn Sheet, side=end)
├── <Tabs value="profile|positions|access">
│   ├── <UserProfileTab/>                 (read-only identity + effective caps)
│   ├── <UserPositionsTab/>               → <UserPositionAssignments/>
│   │   ├── active list w/ primary badge
│   │   ├── ended list (history)
│   │   ├── <PositionAssignmentDialog/> (assign + is_primary)
│   │   └── Confirm end / set-primary
│   └── <UserAccessTab/>                 (selected user)
│       ├── <EffectiveCapabilitiesList/> (read-only)
│       ├── <DirectAccessPanel/>         → <DirectGrantRow/> × N + <GrantDirectCapabilityDialog/>
│       ├── <MonitoringScopesPanel/>     → <MonitoringScopeRow/> × N + <GrantMonitoringScopeDialog/>
│       └── {account_type === external_auditor &&
│              <AuditGrantsPanel/>       → <AuditGrantRow/> × N + <GrantAuditScopeDialog/>}

AccessTabPanel                                                   (Client)
├── <CapabilityCatalog/>                  (bounded, searchable from GET /iam/capabilities)
│   ├── Desktop: <RtlTable> rows;  <CapabilityEditDialog/>
│   └── Mobile: cards
└── <PositionCapabilityPanel/>            (Active position picker + grant list)
    ├── <RtlSelect position/>
    ├── <PositionGrantRow/> × N (active grants)
    ├── <GrantCapabilityDialog/>          (capability + scope + conditional department)
    └── <ConfirmDeleteDialog revoke/>

PrioritiesTabPanel                                               (Client)
├── <PrioritiesFilters/>                   (active + search)
├── 4 states as above
├── <RtlTable> overrides / mobile cards  → <PriorityRow/>
├── <PriorityFormDialog/> (create/edit)
└── <ConfirmDeleteDialog deactivate/reactivate/>

AuditTabPanel                                                    (Client)
├── <AuditFilters/>                       (URL: userPublicId, eventType, entityType, dateFrom, dateTo, calendarSystem)
│   ├── <UserSearchCombobox/> (reuse from tasks)
│   ├── <RtlSelect eventType/> (curated + free-text button)
│   ├── <RtlSelect entityType/> (static localized AuditEntityType map)
│   └── <DateRangePicker calendarSystem=.../> (Spec 020)
├── 4 states
├── Desktop <RtlTable> audit rows; mobile <AuditEventCardList/>
├── <AuditEventRow/>  → optional <DetailDisclosure/> (collapsible Technical Details)
└── <LoadMoreButton/>

Shared components reused (no edits):
- PageHeader, EmptyState, ErrorState, RtlSelect, RtlTable, ConfirmDeleteDialog,
  ActiveBadge, BilingualNameFields, BilingualDescriptionFields,
  DualDateDisplay, DateRangePicker, CalendarSystemToggle, UserSearchCombobox,
  CatalogTable actions factory (lower-level reuse)
```

**Server vs Client split (App Router):**
- `app/(dashboard)/admin/page.tsx` — **Server Component**. Resolves translations (`getTranslations`) and renders `<PageHeader>` + `<AdminWorkspace/>`.
- All other components in the tree are **Client** (`'use client'`) because they use TanStack Query, `useSearchParams`, `useRouter`, `useState`, `useCapability`.

---

## Affected Files

### New files

| Path | Purpose |
|------|---------|
| `lib/api/hooks/use-admin-users.ts` | Users list (infinite), create, update, deactivate, reactivate, position assignments + mutations (assign, end, set-primary), user detail. |
| `lib/api/hooks/use-admin-access.ts` | Capabilities catalog + update; position capabilities + grant + revoke; user direct grants + grant + revoke; monitoring scopes + grant + revoke; audit grants + grant + revoke. |
| `lib/api/hooks/use-task-priorities.ts` | Priorities bounded query + create / update / deactivate / reactivate. Already partially scaffolded? — no `priorities()` query-key only; create this. |
| `lib/api/hooks/use-audit-trail.ts` | `useSystemAuditInfinite` + `narrowAuditEvent()` adapter. |
| `lib/utils/admin-utils.ts` | `formatAdminAccountType(locale, accountType)`, `formatAdminScopeType(locale, scopeType)`, runtime scope-type predicates (`needsDepartment(scopeType)`), `formatUserStatus(...)` shared by tables. |
| `lib/utils/audit-utils.ts` | `AUDIT_ENTITY_TYPE_LABELS: Record<number, { ar: string; en: string }>`, `AUDIT_EVENT_TYPE_SUGGESTIONS: string[]`, `narrowAuditEvent(input: unknown): AuditEvent`, `narrowAuditPage(input): CursorPage<AuditEvent>`. |
| `components/domain/admin/admin-workspace.tsx` | URL-driven tab orchestrator + page-header action slot. |
| `components/domain/admin/users-tab-panel.tsx` | Users tab layout + 4 states. |
| `components/domain/admin/users-filters.tsx` | URL-driven filters (search debounce 300ms, active, account_type, department_id). |
| `components/domain/admin/users-table-row.tsx` | Desktop `<tr>` with localized name, employee_id, email, account_type, primary position+department, preferred_language, ActiveBadge, row menu. |
| `components/domain/admin/users-card-list.tsx` | Mobile cards matching table hierarchy. |
| `components/domain/admin/users-mobile-card.tsx` | Single mobile card. |
| `components/domain/admin/user-form-dialog.tsx` | Create/edit user dialog. |
| `components/domain/admin/admin-users-skeleton.tsx` | 8 table-row skeletons + mobile card skeletons. |
| `components/domain/admin/user-detail-sheet.tsx` | End-edge Sheet with Profile/Positions/Access tabs. |
| `components/domain/admin/user-profile-tab.tsx` | Read-only Profile tab. |
| `components/domain/admin/user-position-assignments.tsx` | Position assignment list + actions. |
| `components/domain/admin/position-assignment-dialog.tsx` | Assign position w/ `is_primary` + `started_at` `DatePicker`. |
| `components/domain/admin/user-access-tab.tsx` | Composes effective, direct, monitoring, audit panels. |
| `components/domain/admin/effective-capabilities-list.tsx` | Read-only effective-caps list from `GET /iam/users/{user}/capabilities`. |
| `components/domain/admin/direct-access-panel.tsx` | Direct grant list + create/revoke. |
| `components/domain/admin/monitoring-scopes-panel.tsx` | Monitoring scope list + create/revoke. |
| `components/domain/admin/audit-grants-panel.tsx` | External-auditor audit grants list + create/revoke. |
| `components/domain/admin/direct-grant-row.tsx` | Row for DirectAccessPanel. |
| `components/domain/admin/monitoring-scope-row.tsx` | Row for MonitoringScopesPanel. |
| `components/domain/admin/audit-grant-row.tsx` | Row for AuditGrantsPanel. |
| `components/domain/admin/grant-direct-capability-dialog.tsx` | Form: capability, scope, conditional department, required reason. |
| `components/domain/admin/grant-monitoring-scope-dialog.tsx` | Form: scope, conditional department, optional blueprint_category. |
| `components/domain/admin/grant-audit-scope-dialog.tsx` | Form: date_range_start/end `DatePicker` + optional department, sends `calendar_system`. |
| `components/domain/admin/access-tab-panel.tsx` | Access tab layout (capability catalog + position capability panel). |
| `components/domain/admin/capability-catalog.tsx` | Bounded, searchable capability table + edit dialog. |
| `components/domain/admin/capability-edit-dialog.tsx` | Edits `name_ar`, `name_en`, `description` only. |
| `components/domain/admin/position-capability-panel.tsx` | Position picker (reuse `usePositionsInfinite`) + grant list + grant/revoke. |
| `components/domain/admin/position-grant-row.tsx` | Row for PositionCapabilityPanel. |
| `components/domain/admin/grant-capability-dialog.tsx` | Form: capability, scope_type, conditional scope_department_id. |
| `components/domain/admin/access-skeleton.tsx` | Catalog + grant panel skeleton. |
| `components/domain/admin/priorities-tab-panel.tsx` | Priorities tab layout + 4 states. |
| `components/domain/admin/priorities-filters.tsx` | Active + search (URL). |
| `components/domain/admin/priorities-table-row.tsx` | Row with color swatch (paired with rank text), default flag, active badge, actions. |
| `components/domain/admin/priority-form-dialog.tsx` | Create/edit priority dialog with `BilingualNameFields` + severity_rank + color picker + is_default + display_order. |
| `components/domain/admin/priorities-skeleton.tsx` | 6 table-row skeletons. |
| `components/domain/admin/audit-tab-panel.tsx` | Audit tab layout + 4 states. |
| `components/domain/admin/audit-filters.tsx` | URL filters. |
| `components/domain/admin/audit-table-row.tsx` | Desktop row with `DualDateDisplay`, actor, event/entity type labels, summary, details disclosure control. |
| `components/domain/admin/audit-event-card-list.tsx` | Mobile cards. |
| `components/domain/admin/audit-event-card.tsx` | Single mobile card. |
| `components/domain/admin/audit-log-skeleton.tsx` | 8 row/card skeletons. |
| `__tests__/components/domain/admin/users-tab-panel.test.tsx` | Render + interaction tests. |
| `__tests__/components/domain/admin/audit-tab-panel.test.tsx` | Render + RTL test. |
| `__tests__/components/domain/admin/admin-utils.test.tsx` | `narrowAuditEvent`, `formatAdminScopeType`, `needsDepartment`. |

### Modified files

| Path | Change |
|------|--------|
| `lib/api/query-keys.ts` | Extend `users` namespace (add `details/detail`, `positions`, `capabilityGrants`, `monitoringScopes`, `auditGrants`). Replace the existing narrow `users.list` filter type with the broader `AdminUserFilters` type. Add `iam.capabilities()`, `iam.positionCapabilities(positionPublicId)`. Add `audit.systemLists()` / `audit.systemList(filters)`. Note: `tasks.priorities()` already exists. |
| `components/domain/shell/app-sidebar.tsx` | No change — `/admin` already capability-gated via `canAdmin` (`iam.manage_users`). Add `task.manage_priorities` capability check if a separate sidebar item is later desired; otherwise leave as-is. |
| `components/domain/shell/use-page-breadcrumb.ts` | Map `/admin` to `[{label: nav('label_admin')}, {label: nav('admin')}]` (currently falls back to static title — keep current behavior). Tab-aware breadcrumb is optional; keep current static behavior. |
| `components/domain/shell/site-header.tsx` | No edit needed (`/admin` already mapped). |
| `app/(dashboard)/admin/page.tsx` | Replace placeholder with `<PageHeader>` + `<AdminWorkspace/>`. Server Component reads `searchParams` for default tab + initial filter context. |
| `messages/ar.json` + `messages/en.json` | Add `admin.*` namespace (`admin.title`, `admin.description`, `admin.users.*`, `admin.access.*`, `admin.priorities.*`, `admin.audit.*`, `admin.toast.*`). ~250 keys. |
| `lib/generated/api-types.ts` | Regenerate via `npm run generate:api` after backend OpenAPI commit. No manual edits. |

**No changes** to: `lib/api/client.ts`, `proxy.ts`, root layout, providers, or any Zustand store.

---

## Implementation Notes

> Throughout: every data-fetching component handles all 4 states (loading skeleton, error w/ Retry, empty w/ Reset, success). Every mutation uses Sonner toasts from a `useTranslations('admin.toast')` hook. Every `RtlSelect`/`RtlTable` uses logical properties (`ms-`, `me-`, `text-start`, `text-end`, `border-s`, `border-e`). Every icon-only button has `aria-label`. Directional icons flip via `rtl:rotate-180`. Every permission gate uses `useCapability(cap)`. PII never in URL except non-PII `search` text (note below).

### 1. `lib/api/query-keys.ts` (extend)

```ts
users: {
  all: ['users'] as const,
  lists: () => [...queryKeys.users.all, 'list'] as const,
  list: (filters: AdminUserFilters) => [...queryKeys.users.lists(), filters] as const,
  details: () => [...queryKeys.users.all, 'detail'] as const,
  detail: (publicId: string) => [...queryKeys.users.details(), publicId] as const,
  positions: (publicId: string) => [...queryKeys.users.detail(publicId), 'positions'] as const,
  capabilityGrants: (publicId: string) => [...queryKeys.users.detail(publicId), 'capability-grants'] as const,
  monitoringScopes: (publicId: string) => [...queryKeys.users.detail(publicId), 'monitoring-scopes'] as const,
  auditGrants: (publicId: string) => [...queryKeys.users.detail(publicId), 'audit-grants'] as const,
},
iam: {
  all: ['iam'] as const,
  capabilities: () => [...queryKeys.iam.all, 'capabilities'] as const,
  positionCapabilities: (positionPublicId: string) =>
    [...queryKeys.iam.all, 'position-capabilities', positionPublicId] as const,
},
audit: {
  all: ['audit'] as const,
  systemLists: () => [...queryKeys.audit.all, 'system', 'list'] as const,
  systemList: (filters: AuditFilters) => [...queryKeys.audit.systemLists(), filters] as const,
},
// tasks.priorities() already exists; no edits to tasks.
```

Define new exported filter types in `lib/api/query-keys.ts`:

```ts
export interface AdminUserFilters {
  search?: string;
  is_active?: boolean;
  account_type?: 1 | 2 | 3;
  department_id?: string;
  per_page?: number;
}
export interface AuditFilters {
  user_id?: string;
  event_type?: string;
  entity_type?: number;
  date_from?: string;
  date_to?: string;
  calendar_system?: 'gregorian' | 'hijri';
  per_page?: number;
}
```

### 2. `lib/api/hooks/use-admin-users.ts`

```ts
'use client';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { apiClient, ApiRequestError } from '@/lib/api/client';
import { queryKeys, AdminUserFilters } from '@/lib/api/query-keys';
import type { CursorPage } from '@/lib/api/types';
import type {
  StoreUserRequest, UpdateUserRequest, AssignPositionRequest, EndPositionRequest,
  UserResource, UserDetailResource, PositionAssignmentResource,
} from '@/lib/generated/api-types';

export function useAdminUsersInfinite(filters: AdminUserFilters) {
  return useInfiniteQuery({
    queryKey: queryKeys.users.list(filters),
    queryFn: ({ pageParam }) =>
      apiClient.get<CursorPage<UserResource>>('/v1/iam/users', {
        params: { ...filters, cursor: pageParam, per_page: filters.per_page ?? 20 },
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => (last.has_more ? last.next_cursor : undefined),
    staleTime: 30 * 1000,
  });
}

export function useAdminUserDetail(publicId: string | null) {
  return useQuery({
    queryKey: queryKeys.users.detail(publicId ?? ''),
    queryFn: () => apiClient.get<UserDetailResource>(`/v1/iam/users/${publicId}`),
    enabled: !!publicId,
  });
}

export function usePrefetchUserDetail() {
  const qc = useQueryClient();
  return (publicId: string) =>
    qc.prefetchQuery({
      queryKey: queryKeys.users.detail(publicId),
      queryFn: () => apiClient.get<UserDetailResource>(`/v1/iam/users/${publicId}`),
      staleTime: 60 * 1000,
    });
}

export function useUserPositionsInfinite(publicId: string, perPage = 25) {
  return useInfiniteQuery({
    queryKey: queryKeys.users.positions(publicId),
    queryFn: ({ pageParam }) =>
      apiClient.get<CursorPage<PositionAssignmentResource>>(
        `/v1/iam/users/${publicId}/positions`,
        { params: { cursor: pageParam, per_page: perPage } },
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => (last.has_more ? last.next_cursor : undefined),
    enabled: !!publicId,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  const t = useTranslations('admin.toast');
  return useMutation({
    mutationFn: (body: StoreUserRequest) =>
      apiClient.post<UserDetailResource>('/v1/iam/users', body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.users.lists() });
      qc.invalidateQueries({ queryKey: queryKeys.audit.systemLists() });
      toast.success(t('user_created'));
    },
    onError: (e) => toast.error(localizedApiError(e, t)),
  });
}

export function useUpdateUser(publicId: string) {
  const qc = useQueryClient();
  const t = useTranslations('admin.toast');
  return useMutation({
    mutationFn: (body: UpdateUserRequest) =>
      apiClient.put<UserResource>(`/v1/iam/users/${publicId}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.users.lists() });
      qc.invalidateQueries({ queryKey: queryKeys.users.detail(publicId) });
      qc.invalidateQueries({ queryKey: queryKeys.audit.systemLists() });
      toast.success(t('user_updated'));
    },
    onError: (e) => toast.error(localizedApiError(e, t)),
  });
}

export function useDeactivateUser(publicId: string) {
  const qc = useQueryClient();
  const t = useTranslations('admin.toast');
  return useMutation({
    mutationFn: () => apiClient.post<UserResource>(`/v1/iam/users/${publicId}/deactivate`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.users.lists() });
      qc.invalidateQueries({ queryKey: queryKeys.users.detail(publicId) });
      qc.invalidateQueries({ queryKey: queryKeys.users.positions(publicId) });
      qc.invalidateQueries({ queryKey: queryKeys.organization.positions() });
      qc.invalidateQueries({ queryKey: queryKeys.organization.departmentTree() });
      qc.invalidateQueries({ queryKey: queryKeys.audit.systemLists() });
      toast.success(t('user_deactivated'));
    },
    onError: (e) => toast.error(localizedApiError(e, t)),
  });
}

export function useReactivateUser(publicId: string) {
  /* symmetric to deactivate; calls /reactivate */
}

export function useAssignPosition(publicId: string) {
  const qc = useQueryClient();
  const t = useTranslations('admin.toast');
  return useMutation({
    mutationFn: (body: AssignPositionRequest) =>
      apiClient.post<PositionAssignmentResource>(`/v1/iam/users/${publicId}/positions`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.users.positions(publicId) });
      qc.invalidateQueries({ queryKey: queryKeys.users.detail(publicId) });
      qc.invalidateQueries({ queryKey: queryKeys.organization.position(/* assigned */) });
      qc.invalidateQueries({ queryKey: queryKeys.organization.positions() });
      qc.invalidateQueries({ queryKey: queryKeys.audit.systemLists() });
      toast.success(t('position_assigned'));
    },
    onError: (e) => toast.error(localizedApiError(e, t)),
  });
}

export function useEndPositionAssignment(publicId: string, assignmentPublicId: string) {
  // POST /v1/iam/users/{user}/positions/{assignment}/end
  // body: EndPositionRequest (optional ended_at + calendar_system)
  // invalidates users.positions, organization.positions, audit.systemLists
}

export function useSetPrimaryAssignment(publicId: string, assignmentPublicId: string) {
  // POST /v1/iam/users/{user}/positions/{assignment}/set-primary
}
```

`localizedApiError(e, t)` helper in `lib/api/client.ts` shape; if `e instanceof ApiRequestError` and `error.message` non-empty, return `error.message` (already localized by backend); else `t('generic_error')`. Always return string — never logs PII.

### 3. `lib/api/hooks/use-admin-access.ts`

```ts
export function useCapabilities() {
  return useQuery({
    queryKey: queryKeys.iam.capabilities(),
    queryFn: () => apiClient.get<CapabilityResource[]>('/v1/iam/capabilities'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateCapability(publicId: number | string) {
  // PUT /v1/iam/capabilities/{capability}, invalidates iam.capabilities + audit.systemLists
}

export function usePositionCapabilities(positionPublicId: string | null) {
  return useQuery({
    queryKey: queryKeys.iam.positionCapabilities(positionPublicId ?? ''),
    queryFn: () =>
      apiClient.get<PositionCapabilityGrantResource[]>(
        `/v1/iam/positions/${positionPublicId}/capabilities`,
      ),
    enabled: !!positionPublicId,
    staleTime: 30 * 1000,
  });
}

export function useGrantPositionCapability(positionPublicId: string) {
  // POST /v1/iam/positions/{position}/capabilities, invalidate iam.positionCapabilities(positionPublicId),
  // invalidates users.detail() (capabilities), audit.systemLists, current-user capabilities query (effective)
}

export function useRevokePositionCapability() {
  // POST /v1/iam/position-capability-grants/{grant}/revoke
}

export function useUserDirectGrants(publicId: string) {
  return useQuery({
    queryKey: queryKeys.users.capabilityGrants(publicId),
    queryFn: () =>
      apiClient.get<EffectiveCapabilityResource[]>(`/v1/iam/users/${publicId}/capabilities`),
    enabled: !!publicId,
    staleTime: 30 * 1000,
  });
}

export function useGrantUserCapability(userPublicId: string) {
  // POST /v1/iam/users/{user}/capabilities
  // invalidate users.capabilityGrants(userPublicId), users.detail(userPublicId), audit.systemLists
}

export function useRevokeUserCapability() {
  // POST /v1/iam/user-capability-grants/{grant}/revoke
}

export function useUserMonitoringScopes(publicId: string) {
  return useQuery({
    queryKey: queryKeys.users.monitoringScopes(publicId),
    queryFn: () =>
      apiClient.get<MonitoringScopeGrantResource[]>(`/v1/iam/users/${publicId}/monitoring-scopes`),
    enabled: !!publicId,
  });
}

export function useGrantMonitoringScope(userPublicId: string) {
  // POST /v1/iam/users/{user}/monitoring-scopes
}

export function useRevokeMonitoringScope() {
  // POST /v1/iam/monitoring-scope-grants/{grant}/revoke
}

export function useUserAuditGrants(publicId: string) {
  return useQuery({
    queryKey: queryKeys.users.auditGrants(publicId),
    queryFn: () =>
      apiClient.get<AuditGrantResource[]>(`/v1/iam/users/${publicId}/audit-grants`),
    enabled: !!publicId,
  });
}

export function useGrantAuditScope(userPublicId: string) {
  // POST /v1/iam/users/{user}/audit-grants — body has calendar_system
}

export function useRevokeAuditGrant() {
  // POST /v1/iam/audit-grants/{grant}/revoke
}
```

**State rules:**
- URL: `?tab`, `?userPublicId`, `?search`, `?isActive`, `?accountType`, `?departmentId`, `?selectedPositionId` (Access tab), `?eventType`, `?entityType`, `?dateFrom`, `?dateTo`, `?calendarSystem`.
- Local: dialog/sheet open booleans, form input values, metadata disclosure open.
- Zustand: none new.

### 4. `lib/api/hooks/use-task-priorities.ts`

```ts
export function useTaskPriorities() {
  return useQuery({
    queryKey: queryKeys.tasks.priorities(),
    queryFn: () => apiClient.get<TaskPriorityResource[]>('/v1/tasks/priorities'),
    staleTime: 60 * 1000,
  });
}
export function useCreateTaskPriority() { /* POST /v1/tasks/priorities */ }
export function useUpdateTaskPriority(publicId: string) { /* PUT /v1/tasks/priorities/{priority} */ }
export function useDeactivateTaskPriority(publicId: string) { /* POST /v1/tasks/priorities/{priority}/deactivate */ }
export function useReactivateTaskPriority(publicId: string) { /* POST /v1/tasks/priorities/{priority}/reactivate */ }
```

All four invalidate `queryKeys.tasks.priorities()` + `queryKeys.taskBoard.lists()` + `queryKeys.audit.systemLists()`. Per spec acceptance criteria §104.

### 5. `lib/utils/audit-utils.ts` (narrowing adapter)

> OpenAPI declares `data: string` — runtime narrowing required (same pattern as `narrowAgingItems()` in `009` and `getBottleneckEntities()` in `007`).

```ts
import type { CursorPage } from '@/lib/api/types';

export interface AuditEvent {
  public_id: string;
  event_type: string;
  entity_type: number;
  entity_public_id: string | null;
  root_entity_type: number | null;
  root_entity_public_id: string | null;
  user: { public_id: string; name_ar: string; name_en: string } | null;
  ip_address: string | null;
  user_agent: string | null;
  payload: Record<string, unknown> | null;
  impersonated_by_public_id: string | null;
  created_at: string;
  created_at_hijri: string | null;
}

export const AUDIT_ENTITY_TYPE_LABELS: Record<number, { ar: string; en: string }> = {
  1: { ar: 'مهمة', en: 'Task' },
  2: { ar: 'مرحلة', en: 'Stage Instance' },
  3: { ar: 'مرحلة فرعية', en: 'Sub-stage Instance' },
  4: { ar: 'مستخدم', en: 'User' },
  5: { ar: 'منصب', en: 'Position' },
  6: { ar: 'إدارة', en: 'Department' },
  7: { ar: 'مخطط', en: 'Blueprint' },
  8: { ar: 'مستند', en: 'Document' },
  9: { ar: 'تصعيد', en: 'Escalation' },
  10: { ar: 'مؤقت SLA', en: 'SLA Timer' },
  11: { ar: 'إجراء متابعة', en: 'Follow-up Action' },
  12: { ar: 'تعليق', en: 'Comment' },
  13: { ar: 'مقالة مساعدة', en: 'Help Article' },
  14: { ar: 'رحلة الانضمام', en: 'Onboarding Journey' },
  15: { ar: 'مستأجر', en: 'Tenant' },
  16: { ar: 'مدير منصة', en: 'Platform Admin' },
  17: { ar: 'تمثيل', en: 'Impersonation' },
  18: { ar: 'تقويم عمل', en: 'Working Calendar' },
  19: { ar: 'عطلة رسمية', en: 'Public Holiday' },
  20: { ar: 'درجة سلطة', en: 'Authority Grade' },
  21: { ar: 'تكليف بمنصب', en: 'Position Assignment' },
  22: { ar: 'تفويض', en: 'Delegation' },
  23: { ar: 'نطاق مراقبة', en: 'Monitoring Scope Grant' },
  24: { ar: 'صلاحية تدقيق', en: 'Audit Grant' },
  25: { ar: 'صلاحية', en: 'Capability Grant' },
  26: { ar: 'نوع مرحلة', en: 'Stage Type' },
  27: { ar: 'سياسة SLA', en: 'SLA Policy' },
  28: { ar: 'فئة مخطط', en: 'Blueprint Category' },
  29: { ar: 'مرحلة مخطط', en: 'Blueprint Stage' },
  30: { ar: 'مرحلة فرعية مخطط', en: 'Blueprint Sub-stage' },
  31: { ar: 'انتقال مخطط', en: 'Blueprint Transition' },
  32: { ar: 'مرجع خارجي', en: 'External Reference' },
  33: { ar: 'تصنيف سري', en: 'Confidential Access' },
  34: { ar: 'إجراء', en: 'Action' },
};

export const AUDIT_EVENT_TYPE_SUGGESTIONS = [
  'created', 'updated', 'deactivated', 'reactivated', 'assigned', 'ended',
  'granted', 'revoked', 'logged_in', 'logged_out', 'submitted', 'returned',
  'overridden', 'sent', 'completed',
];

export function narrowAuditEvent(input: unknown): AuditEvent | null {
  if (typeof input !== 'object' || input === null) return null;
  const r = input as Record<string, unknown>;
  if (typeof r.public_id !== 'string' || typeof r.event_type !== 'string' || typeof r.created_at !== 'string') return null;
  return {
    public_id: r.public_id,
    event_type: r.event_type,
    entity_type: typeof r.entity_type === 'number' ? r.entity_type : Number(r.entity_type ?? 0),
    entity_public_id: typeof r.entity_public_id === 'string' ? r.entity_public_id : null,
    root_entity_type: r.root_entity_type == null ? null : Number(r.root_entity_type),
    root_entity_public_id: typeof r.root_entity_public_id === 'string' ? r.root_entity_public_id : null,
    user: typeof r.user === 'object' && r.user !== null ? (r.user as AuditEvent['user']) : null,
    ip_address: typeof r.ip_address === 'string' ? r.ip_address : null,
    user_agent: typeof r.user_agent === 'string' ? r.user_agent : null,
    payload: r.payload && typeof r.payload === 'object' ? (r.payload as Record<string, unknown>) : null,
    impersonated_by_public_id: typeof r.impersonated_by_public_id === 'string' ? r.impersonated_by_public_id : null,
    created_at: r.created_at,
    created_at_hijri: typeof r.created_at_hijri === 'string' ? r.created_at_hijri : null,
  };
}

export function narrowAuditPage(input: unknown): CursorPage<AuditEvent> {
  const r = (input ?? {}) as Record<string, unknown>;
  const data = Array.isArray(r.data) ? r.data.map(narrowAuditEvent).filter((x): x is AuditEvent => x !== null) : [];
  return {
    data,
    next_cursor: typeof r.next_cursor === 'string' ? r.next_cursor : null,
    has_more: Boolean(r.has_more),
  };
}
```

### 6. `app/(dashboard)/admin/page.tsx` (replace placeholder)

```tsx
import { getTranslations } from 'next-intl/server';
import { PageHeader } from '@/components/shared/page-header';
import { AdminWorkspace } from '@/components/domain/admin/admin-workspace';

export default async function AdminPage() {
  const t = await getTranslations('admin');
  return (
    <>
      <PageHeader title={t('title')} description={t('description')} />
      <AdminWorkspace />
    </>
  );
}
```

### 7. `components/domain/admin/admin-workspace.tsx`

```tsx
'use client';
import { useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useCapability } from '@/lib/api/hooks/use-capabilities';
import { UsersTabPanel } from './users-tab-panel';
import { AccessTabPanel } from './access-tab-panel';
import { PrioritiesTabPanel } from './priorities-tab-panel';
import { AuditTabPanel } from './audit-tab-panel';

const TAB_VALUES = ['users', 'access', 'priorities', 'audit'] as const;
type TabValue = (typeof TAB_VALUES)[number];

export function AdminWorkspace() {
  const t = useTranslations('admin');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const canManageUsers = useCapability('iam.manage_users');
  const canManageCapabilities = useCapability('iam.manage_capabilities');
  const canManagePriorities = useCapability('task.manage_priorities');
  const canViewAudit = useCapability('audit.view_system');
  const canManagePositions = useCapability('iam.manage_positions');

  // Capability-gated access: a tab is permitted if any relevant capability is present.
  const tabAllowed = useMemo<Record<TabValue, boolean>>(() => ({
    users: canManageUsers || canManagePositions || canViewAudit,
    access: canManageUsers || canManageCapabilities,
    priorities: canManagePriorities,
    audit: canViewAudit,
  }), [canManageUsers, canManageCapabilities, canManagePriorities, canViewAudit, canManagePositions]);

  const allowedTabs = useMemo(() => TAB_VALUES.filter((v) => tabAllowed[v]), [tabAllowed]);

  const rawTab = searchParams.get('tab');
  const activeTab: TabValue = (rawTab && TAB_VALUES.includes(rawTab as TabValue) && tabAllowed[rawTab as TabValue])
    ? (rawTab as TabValue)
    : (allowedTabs[0] ?? 'users');

  function setTab(next: TabValue) {
    if (next === activeTab) return;
    const params = new URLSearchParams(searchParams.toString());
    if (next === 'users') params.delete('tab'); // default → clean URL
    else params.set('tab', next);
    // Preserve filters; reset tab-specific secondary params on tab switch
    ['userPublicId', 'selectedPositionId', 'eventType', 'entityType', 'dateFrom', 'dateTo'].forEach((k) => params.delete(k));
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <Tabs value={activeTab} onValueChange={(v) => setTab(v as TabValue)} className="mt-2">
      <TabsList className="self-start">
        {tabAllowed.users && <TabsTrigger value="users">{t('tabs.users')}</TabsTrigger>}
        {tabAllowed.access && <TabsTrigger value="access">{t('tabs.access')}</TabsTrigger>}
        {tabAllowed.priorities && <TabsTrigger value="priorities">{t('tabs.priorities')}</TabsTrigger>}
        {tabAllowed.audit && <TabsTrigger value="audit">{t('tabs.audit')}</TabsTrigger>}
      </TabsList>
      {tabAllowed.users && <TabsContent value="users" className="mt-4"><UsersTabPanel /></TabsContent>}
      {tabAllowed.access && <TabsContent value="access" className="mt-4"><AccessTabPanel /></TabsContent>}
      {tabAllowed.priorities && <TabsContent value="priorities" className="mt-4"><PrioritiesTabPanel /></TabsContent>}
      {tabAllowed.audit && <TabsContent value="audit" className="mt-4"><AuditTabPanel /></TabsContent>}
    </Tabs>
  );
}
```

**Rules applied:** `useCapability` for permission UI only. URL state for tab. Specific filters for the tab cleared on tab switch. Capability-gated TabsTriggers and TabsContents (not just visually hidden). The first allowed tab is the default tab; if `?tab=audit` requested but `audit.view_system` missing, fall back to first allowed — server will still return 403 for the underlying fetch. Server Component `page.tsx` is plain, no `'use client'`.

### 8. `components/domain/admin/users-tab-panel.tsx` (canonical example)

```tsx
'use client';
import { useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {useDebouncedCallback } from 'use-debounce'; // existing lib/hooks/use-debounce.ts
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RtlSelect } from '@/components/shared/rtl-select';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { AdminUsersSkeleton } from './admin-users-skeleton';
import { UsersTableRow } from './users-table-row';
import { UsersCardList } from './users-card-list';
import { useAdminUsersInfinite } from '@/lib/api/hooks/use-admin-users';
import { useDepartmentTree } from '@/lib/api/hooks/use-organization';
import { queryKeys, AdminUserFilters } from '@/lib/api/query-keys';
import { UserPlus } from 'lucide-react';

export function UsersTabPanel() {
  const t = useTranslations('admin.users');
  const router = useRouter(), pathname = usePathname(), sp = useSearchParams();

  const filters = useMemo<AdminUserFilters>(() => ({
    search: sp.get('search') || undefined,
    is_active: sp.get('isActive') === 'inactive' ? false : sp.get('isActive') === 'active' ? true : undefined,
    account_type: sp.get('accountType') ? Number(sp.get('accountType')) as 1|2|3 : undefined,
    department_id: sp.get('departmentId') || undefined,
    per_page: 20,
  }), [sp]);

  const query = useAdminUsersInfinite(filters);
  const users = query.data?.pages.flatMap((p) => p.data) ?? [];

  function setParam(key: string, value: string | null) {
    const p = new URLSearchParams(sp.toString());
    if (value) p.set(key, value); else p.delete(key);
    router.replace(`${pathname}?${p.toString()}`);
  }
  const debouncedSetSearch = useDebouncedCallback((v: string) => setParam('search', v || null), 300);

  if (query.isLoading) return <AdminUsersSkeleton />;
  if (query.isError) return <ErrorState onRetry={() => query.refetch()} message={t('error')} />;
  if (users.length === 0) return (
    <EmptyState
      icon={UserPlus}
      title={t('empty_title')}
      description={t('empty_description')}
      action={<Button onClick={() => router.replace(`${pathname}?${new URLSearchParams(sp.toString()).toString()}`)} variant="outline">{t('reset_filters')}</Button>}
    />
  );
  return (
    <>
      <UsersFilters />
      <div className="hidden md:block">
        <RtlTable aria-label={t('table_aria_label')}>
          {/* thead/tbody using UsersTableRow */}
        </RtlTable>
      </div>
      <div className="md:hidden"><UsersCardList users={users} /></div>
      {query.hasNextPage && (
        <Button variant="outline" className="w-full" onClick={() => query.fetchNextPage()} disabled={query.isFetchingNextPage}>
          {query.isFetchingNextPage ? t('loading_more') : t('load_more')}
        </Button>
      )}
    </>
  );
}
```

**Rules applied:** Query key factory (`queryKeys.users.list(filters)` — no hardcoded strings). `useInfiniteQuery` for cursor pagination. All 4 states. Logical props throughout. Memoized filter object as query-key dependency (per `architecture.md` known risk).

### 9. `components/domain/admin/user-form-dialog.tsx`

- **Approach:** shadcn `Dialog` + `Field` + `FieldGroup` + `FieldLabel` + `InputGroup`. `BilingualNameFields` for `name_ar`/`name_en`. `RtlSelect` for `account_type`/`preferred_language`. `Input type="password"` for `password` — required on create, optional on edit. **Never pre-fill existing password on edit.**
- **Files to create:** `components/domain/admin/user-form-dialog.tsx`.
- **State:** local `useState` for form values; reset on dialog open via `useEffect(() => setTimeout(() => setForm(emptyOrEditingUser), 0), [open])` (pattern from `CategoryManager` in 025).
- **Validation:** client checks → `toast.error(t('name_ar_required'))` etc. Per coding-standards "**Do not use `FieldError`**".

```tsx
function submit() {
  if (!form.name_ar.trim()) return toast.error(t('name_ar_required'));
  if (!form.email.trim()) return toast.error(t('email_required'));
  if (!isEdit && form.password.length < 8) return toast.error(t('password_min'));
  if (!form.account_type) return toast.error(t('account_type_required'));
  createUser.mutate(form, { onSuccess: () => onOpenChange(false) });
}
```

### 10. `components/domain/admin/user-detail-sheet.tsx` (Sheet side=end)

```tsx
'use client';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useLocale } from 'next-intl';
import { useAdminUserDetail } from '@/lib/api/hooks/use-admin-users';
import { UserProfileTab } from './user-profile-tab';
import { UserPositionsTab } from './user-position-assignments';
import { UserAccessTab } from './user-access-tab';

export function UserDetailSheet({ publicId, onClose }: { publicId: string; onClose: () => void }) {
  const locale = useLocale();
  const side = locale === 'ar' ? 'right' : 'left';
  const detail = useAdminUserDetail(publicId);
  const t = useTranslations('admin.users.detail');
  return (
    <Sheet open onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent side={side} className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader><SheetTitle>{t('title')}</SheetTitle></SheetHeader>
        {detail.isLoading ? <ProfileSkeleton/> :
         detail.isError ? <ErrorState onRetry={() => detail.refetch()} message={t('error')} /> :
         <Tabs defaultValue="profile">
           <TabsList>
             <TabsTrigger value="profile">{t('tabs.profile')}</TabsTrigger>
             <TabsTrigger value="positions">{t('tabs.positions')}</TabsTrigger>
             <TabsTrigger value="access">{t('tabs.access')}</TabsTrigger>
           </TabsList>
           <TabsContent value="profile"><UserProfileTab user={detail.data} /></TabsContent>
           <TabsContent value="positions"><UserPositionsTab userPublicId={publicId} /></TabsContent>
           <TabsContent value="access"><UserAccessTab user={detail.data} /></TabsContent>
         </Tabs>}
      </SheetContent>
    </Sheet>
  );
}
```

Closing the Sheet: parent `UsersTabPanel` deletes `?userPublicId` from URL (preserves filters + tab).

### 11. `components/domain/admin/grant-direct-capability-dialog.tsx` (conditional department)

```tsx
'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Field, FieldGroup, FieldLabel, FieldDescription } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { RtlSelect } from '@/components/shared/rtl-select';
import { Button } from '@/components/ui/button';
import { useCapabilities, useGrantUserCapability } from '@/lib/api/hooks/use-admin-access';
import { useDepartmentTree } from '@/lib/api/hooks/use-organization';

export function GrantDirectCapabilityDialog({ userPublicId, open, onOpenChange }: Props) {
  const t = useTranslations('admin.access.direct_grant');
  const { data: caps } = useCapabilities();
  const grant = useGrantUserCapability(userPublicId);
  const [capabilityId, setCapabilityId] = useState('');
  const [scopeType, setScopeType] = useState<number>(1);
  const [scopeDepartmentId, setScopeDepartmentId] = useState<string>('');
  const [reason, setReason] = useState('');

  useEffect(() => { if (open) setTimeout(() => { setCapabilityId(''); setScopeType(1); setScopeDepartmentId(''); setReason(''); }, 0); }, [open]);

  const needsDept = [3, 4].includes(scopeType);  // specific_department, department_tree

  function submit() {
    if (!capabilityId) return toast.error(t('capability_required'));
    if (needsDept && !scopeDepartmentId) return toast.error(t('department_required'));
    if (!reason.trim()) return toast.error(t('reason_required'));
    grant.mutate({ capability_id: capabilityId, scope_type: scopeType, scope_department_id: needsDept ? scopeDepartmentId : undefined, reason }, { onSuccess: () => onOpenChange(false) });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>{t('title')}</DialogTitle></DialogHeader>
        <FieldGroup className="flex flex-col gap-4">
          <Field>
            <FieldLabel>{t('capability')}</FieldLabel>
            <RtlSelect value={capabilityId} onValueChange={setCapabilityId}>
              {(caps ?? []).map((c) => <SelectItem key={c.public_id} value={c.public_id}>{c.name_ar}</SelectItem>)}
            </RtlSelect>
          </Field>
          <Field>
            <FieldLabel>{t('scope')}</FieldLabel>
            <RtlSelect value={String(scopeType)} onValueChange={(v) => setScopeType(Number(v))}>
              <SelectItem value="1">{t('scope_tenant')}</SelectItem>
              <SelectItem value="2">{t('scope_own_department')}</SelectItem>
              <SelectItem value="3">{t('scope_specific_department')}</SelectItem>
              <SelectItem value="4">{t('scope_department_tree')}</SelectItem>
              <SelectItem value="5">{t('scope_own_tasks')}</SelectItem>
            </RtlSelect>
          </Field>
          {needsDept && (
            <Field>
              <FieldLabel>{t('department')}</FieldLabel>
              <RtlSelect value={scopeDepartmentId} onValueChange={setScopeDepartmentId}>
                {(departments ?? []).map((d) => <SelectItem key={d.public_id} value={d.public_id}>{d.name_ar}</SelectItem>)}
              </RtlSelect>
            </Field>
          )}
          <Field>
            <FieldLabel>{t('reason')}</FieldLabel>
            <FieldDescription>{t('reason_help')}</FieldDescription>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} aria-describedby="reason-help" maxLength={1000} />
          </Field>
        </FieldGroup>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('cancel')}</Button>
          <Button onClick={submit} disabled={grant.isPending}>{t('grant')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

**Rules applied:** shadcn Field + InputGroup (nova); `RtlSelect`; conditional department via sentinel-free state (the `needsDept` predicate); toast-based validation; `RangeDescription` provides accessible `aria-describedby`; mutation invalidates (no optimistic).

### 12. `components/domain/admin/priority-form-dialog.tsx` (color picker)

- **Approach:** `BilingualNameFields` + number inputs + accessible palette of 8 swatches (`#emerald/amber/red/blue/purple/fuchsia/slate/cyan`) shown as `<button>` rows, plus native `<input type="color">` for hex. **Always pair swatch with severity-rank text label** (the swatch is supplemental per spec §103).
- **Files:** `components/domain/admin/priority-form-dialog.tsx`.
- **Validation:** `name_ar` required, `severity_rank` integer > 0, `color_code` matches `^#[0-9a-fA-F]{6}$` (fallback to client check before submit), `display_order` integer ≥ 0.

### 13. `components/domain/admin/audit-table-row.tsx`

- **Display:** timestamp via `<DualDateDisplay gregorian={row.created_at} hijri={row.created_at_hijri} />`; actor = `row.user` localized name fallback; entity type via `AUDIT_ENTITY_TYPE_LABELS[row.entity_type]`; event type via raw `row.event_type` (escaped); summary = `row.entity_public_id` or `t('no_target')`; row button toggles `<Disclosure>` for `payload` rendered as a `<dl>` of escaped key/values.
- **Technical details disclosure:** accessible `<Disclosure>` (Radix `Collapsible`) labeled `t('technical_details')`. Show IP + user-agent **only** when `useCapability('audit.view_system')` is true AND the API returned non-null values. If API omits IP/UA, hide the disclosure entirely (per spec "must not expose values omitted or nulled").
- **No `dangerouslySetInnerHTML`.** All payload rendering via `<span>{value}</span>`. Number/boolean/array values coerced via `String(value)`.

### 14. `components/domain/admin/audit-filters.tsx`

- `<UserSearchCombobox>` reused from `components/domain/tasks/user-search-combobox.tsx` for `?userPublicId`. Stores **only** the user `public_id` in the URL — never the name/email. (UserSearchCombobox includes a secondary `useQuery(['users','by-ids', v])` to resolve display names.)
- `<RtlSelect>` for `entityType` populated from `AUDIT_ENTITY_TYPE_LABELS` with `'all'` sentinel → `null`.
- `<RtlSelect>` for `eventType` showing curated `AUDIT_EVENT_TYPE_SUGGESTIONS` plus an `'custom'` option that reveals `<Input>` for free text. `toApiQuery()` sends `'all'` → `undefined`.
- `<DateRangePicker calendarSystem={...}>` (Spec 020) writing `?dateFrom`, `?dateTo`, `?calendarSystem`. Toggling calendar clears date values (per Spec 020 pattern).
- Sentinels `'all'` → `null` and clearing date values on calendar toggle per the 009/020 established pattern.

### 15. `components/domain/admin/capability-catalog.tsx`

- **Approach:** `useCapabilities()` (bounded, ≤50). Local `useState(search)` filtered client-side (small bounded list). `RtlTable` desktop / cards mobile. Row edit via `<CapabilityEditDialog key={cap.public_id} capability={cap} open={openCap === cap.public_id} onOpenChange={...} />`. Edit only `name_ar`, `name_en`, `description`. Render `key` and `is_system_defined` as read-only. No create/delete/rename.
- **Search field:** local state, no URL (bounded catalog, not shareable view) — explicit deviation, documented here, since spec only specifies URL-driven for shareable list filters; catalog filters are UX.

---

## Data Flow

```
User opens /admin?tab=users
  → Server Component page.tsx resolves translations
  → Client AdminWorkspace reads ?tab=users (default allowed)
  → UsersTabPanel mounts
  → useAdminUsersInfinite(filters-as-URL-memoized-object)
    → apiClient.get('/v1/iam/users', { params: { ...filters, cursor, per_page } })
      with credentials + X-Tenant + X-Locale headers
    → Laravel Sanctum session → IamPolicy::check('iam.manage_users')
    → Returns { data: UserResource[], next_cursor, has_more }
  → useInfiniteQuery merges pages → component re-render
  → Loading skeleton / error Retry / empty Reset+Create / table rows
  → User clicks row → router.replace(`?userPublicId=<uuid>`) preserving filters
  → UserDetailSheet mounts (useAdminUserDetail prefetches on hover for capability-holders)
  → Tabs: Profile / Positions / Access — each fetches its bounded query
  → Admin selects Direct grant → GrantDirectCapabilityDialog submit
  → useGrantUserCapability.mutate → POST /v1/iam/users/{user}/capabilities
  → onSuccess invalidates users.capabilityGrants(publicId), users.detail(publicId), audit.systemLists
  → Next render shows updated direct grants list
  → toast.success shows in Sonner live region
```

Same flow recurses for Access / Priorities / Audit tabs. Audit Log fetches via `useInfiniteQuery`(`useSystemAuditInfinite`), narrows via `narrowAuditPage()`, and renders newest-first.

**No data ever enters Zustand.** URL = source of truth for tab + list/audit filters; local React state = dialogs/sheets/forms/disclosures; TanStack Query cache = all server state.

---

## Route Structure

```
app/(dashboard)/admin/
├── page.tsx                   # System Administration entry; URL-driven tab ?><?tab>
├── error.tsx                  # Existing — reuse; ensures 401 surfaces redirect to /login
├── external-entities/         # Exists (Spec 025) — untouched
└── confidential-governance/   # Exists (Spec 019) — untouched
```

**No new child routes.** All four tabs render inside `/admin` and only differ by URL `?tab` and secondary search-params. Locale is cookie-based — no `[locale]` segment. Route params only `public_id` forms (already enforced via `UserSearchCombobox` storing UUID).

---

## Execution Order

1. **Regenerate types** — `npm run generate:api` after confirming backend `openapi.json` includes the latest schema fixes. Commit `lib/generated/api-types.ts`.
2. **Extend query keys** — edit `lib/api/query-keys.ts`; export `AdminUserFilters`/`AuditFilters`. Add `iam`+`audit` namespaces.
3. **Add utils** — create `lib/utils/admin-utils.ts` and `lib/utils/audit-utils.ts` (incl. `narrowAuditEvent`).
4. **Hooks in dependency order:**
   1. `use-admin-users.ts` (depends on 2; users positions/detail).
   2. `use-admin-access.ts` (capabilities, grants, monitoring scopes, audit grants).
   3. `use-task-priorities.ts`.
   4. `use-audit-trail.ts` (uses narrowing adapter from 3).
5. **Server page** — replace `app/(dashboard)/admin/page.tsx` with `<PageHeader>` + `<AdminWorkspace/>`.
6. **Tab orchestrator** — build `admin-workspace.tsx`.
7. **Users tab** — filters → table row → card list → skeleton → user form dialog → detail sheet → profile tab → positions tab (assignment dialog) → access tab subcomponents.
8. **Access tab** — capability catalog + edit dialog → position picker + grant panel → grant dialog + revoke confirm.
9. **User Access within Sheet** — effective capabilities list → direct panel → monitoring-scopes panel → audit-grants panel (external_auditor only).
10. **Priorities tab** — filter → table row → form dialog → confirm dialogs.
11. **Audit tab** — filters (UserSearchCombobox + RtlSelect + DateRangePicker) → table row + payload disclosure → mobile card.
12. **i18n** — add `admin.*` to `messages/ar.json` + `messages/en.json` (~250 keys).
13. **Tests** — see below. Run `npm run lint`, `npm run typecheck`, `npm test`.
14. **Manual test pass** through the checklist.
15. **Spec review** — verify each `## Acceptance Criteria` checkbox against implementation.

---

## What to Test Manually

1. **Locale: AR RTL** — `/admin?tab=users` opens with right-side sidebar, breadcrumb correct (Main › Admin), TabsList aligned with logical start, table columns `text-start` (names) / `text-end` (numeric, actions), <kbd>↹ Tab</kbd> navigates filters → table → Load More in DOM order.
2. **Locale: EN LTR** — same as #1 but LTR; confirm no physical-direction classes; chevrons in breadcrumb flip (no chevrons here much, but Sheet close should mirror to logical end).
3. **Loading skeleton** in each tab — network throttled; skeleton shape matches real content (8 rows in Users/Audit; 6 rows in Priorities; catalog + grant in Access).
4. **Empty state** in Users (filter `?search=zzzz`) — `EmptyState` shows icon + headline + Reset Filters button; Create User button hidden for users without `iam.manage_users` (toggle capability store to verify).
5. **Error state** in Audit Log — MSW returns 500; `ErrorState` shows Retry; URL filters remain intact after retry.
6. **403 tab-level** — disable `audit.view_system` capability in store; Audit TabsTrigger hidden; direct URL `/admin?tab=audit` falls back to first allowed tab.
7. **Users tab search debounce** — type in search input; URL updates 300 ms after last keystroke; query submits only after debounce, not on every keystroke (watch network panel).
8. **Create user dialog** — invalid Arabic name → `toast.error` (no `FieldError`); valid submit → toast success → list refetch → row appears.
9. **Edit user no password** — clicking edit on existing user opens dialog with empty password input; submit succeeds with no `password` field sent.
10. **Deactivate user confirmation** — `AlertDialog` opens with localized confirmation text; cancel closes; confirm calls `/deactivate`; if backend returns 422 (self-deactivate or last-admin) `toast.error(error.message)` shows backend's localized message and data unchanged.
11. **Reactivation** — for an inactive user, reactivate button visible; confirm → on success the users list + positions list invalidate.
12. **User Detail Sheet** — clicking user opens Sheet on **end edge** (right in AR, left in EN); Profile tab shows localized name + effective capabilities; Positions tab shows active + ended assignments with `DualDateDisplay` (Gregorian + Hijri from API); Access tab shows catalog of direct grants + monitoring + audit (only for `external_auditor`).
13. **Position assignment** — assign active position; choose primary; reload the user's positions list — primary badge moves; conflict on second primary → `toast.error` localized.
14. **Position end / set-primary** — confirm dialogs; `Granted By` grantor name resolved through API (not from URL).
15. **Access tab — Capability Catalog edit** — edit `name_ar` + `name_en` + `description`; key field disabled; no delete/create controls; save invalidates `iam.capabilities()`.
16. **Access tab — Position capability grant** — pick active position → grants list renders; **department selector hidden for scope `tenant`/`own_department`/`own_tasks`**; **shown and required for `specific_department`/`department_tree`**. Submit invalidates `iam.positionCapabilities` + `users.detail` + `audit.systemLists`.
17. **Direct grant requires reason** — submitting without reason → `toast.error` with localized message; non-empty reason passes.
18. **Monitoring scope grant** — department conditional as above; `blueprint_category_id` optional; on revoke uses `ConfirmDeleteDialog` with revoke wording, never "delete".
19. **External-auditor audit grant** — pick `external_auditor` user in Sheet's Access tab; panel renders; date range via `DatePicker` with `calendar_system` in request body; on revoke uses revoke endpoint, preserves historical record.
20. **Priorities tab** — create with neighboring colors; default flag check; deactivate/reactivate via `AlertDialog`; new default invalidates `tasks.priorities()` + `taskBoard.lists()`.
21. **Audit Log filters** — pick user via `UserSearchCombobox` → URL stores only `userPublicId` UUID; verify URL does not include user's name/email. Filter by `entityType=User`, `eventType=updated`, date range; rows narrow. Switch calendar to Hijri → dates clear and re-picker shows Hijri calendar.
22. **Audit Log payload disclosure** — collapse/expand works; payload rendered as escaped key/value; IP/user-agent visible only when `audit.view_system` capability present and API returned them.
23. **Audit Log Load More** — button disabled while fetching next page; hidden when `has_more=false`.
24. **Responsive** — mobile (<640px): Users/Audit tables become cards; Filters move into a Sheet (or stack collapsible — match app precedent, prefer stack with horizontal scroll for chips); user Sheet is full height; touch targets ≥44px on all icon-only buttons.
25. **Keyboard** — Sheet close on <kbd>Esc</kbd>; dialog traps focus and returns to trigger; tabs reached via <kbd>←</kbd> <kbd>→</kbd>; action dropdowns navigate via arrow keys; `ConfirmDeleteDialog` confirm button is reachable by <kbd>Tab</kbd> and reachable via <kbd>Enter</kbd>.
26. **Reduced motion** — toggle OS reduced motion → skeletons lose `animate-pulse` motion (Tailwind `motion-reduce:animate-none` confirmed).
27. **Permission UI** — disable `iam.manage_capabilities` capability → Access tab's TabsTrigger hidden (only `users` tab remains if `iam.manage_users` is present). Direct URL `/admin?tab=access` falls back.
28. **PII leakage audit** — open browser DevTools network; verify URL after applying any filter contains no `email`, no `mobile`, no `employee_id`. Audit user-picker search input may contain `user_public_id` only; the search endpoint the combobox calls is the existing `user-search` endpoint, not exposed in URL.
29. **No `console.log`** — open browser console on all four tabs with throttled responses; assert no logged user identity, payloads, or stack traces.