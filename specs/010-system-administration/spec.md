# Spec: System Administration

> **Number:** 010
> **Date:** 2026-07-19
> **Status:** `completed`
> **Milestone:** F6 — Admin, Org, Help, Onboarding
> **Depends on:** `001-core-shell`, `008-organization-structure`, `020-localization-calendar`
> **Backend spec:** `../backend/specs/003-iam-abac/`, `../backend/specs/005-task-execution/`, and `../backend/specs/015-audit-trail/` — all `Contract status: stable`
> **Contract status:** `stable`
> **Author:** Codex
> **Branch:** `feat/010-system-administration`
> **Base branch:** `main`

---

## Problem

Tenant administrators need a safe, understandable way to manage the people, access rules, configurable task priorities, and compliance evidence that keep their organization operating. The stable backend already supports user accounts, position assignments, ABAC capability grants, monitoring scopes, external-auditor grants, task priorities, and an immutable system activity log. Without a single frontend workspace, administrators cannot perform those responsibilities without direct API or database intervention.

That gap creates real operational risk: employees cannot be onboarded or taken out of service promptly; temporary, exception-only access is hard to review; priority definitions are not governed consistently; and compliance teams cannot independently inspect who changed what. Government organizations need those controls to be bilingual, auditable, accessible, and safe on both desktop and mobile.

## Goal

Deliver a capability-aware `/admin` workspace in the authenticated dashboard shell. It will provide four URL-addressable tabs: **Users**, **Access**, **Task Priorities**, and **Audit Log**. Administrators can manage users and their positions; manage position- and user-level access grants with their scope and reason; maintain tenant task priorities; and browse a filtered, cursor-paginated system audit log. The screen consumes only the stable backend APIs named above and respects the established organization and localization UI patterns.

## Contract Dependencies and Gaps

The backend resolves the users cursor parameter, position-assignment history endpoint, assignment/grant public IDs at the API and resource level, capability-key immutability, self-deactivation safeguards, priority-color validation, and audit-filter/documentation decisions. The new `GET /v1/iam/users/{user}/positions` endpoint supports the full assignment lifecycle by public ID.

The committed OpenAPI artifact now correctly types `AssignPositionRequest.position_id` and all grant request UUID fields as `string`. Regenerate `lib/generated/api-types.ts` before implementation; do not use hand-written DTOs or internal IDs.

## User Stories

### Tenant administration

- As a **tenant administrator**, I want to find users by name, employee ID, email, account type, department, and active state, so that I can quickly manage the right account.
- As a **tenant administrator**, I want to create, edit, deactivate, and reactivate users, so that tenant access stays current as staff join, change roles, or leave.
- As a **tenant administrator**, I want to assign, end, and designate a primary position for a user, so that workflow assignments resolve to the right person.
- As a **tenant administrator**, I want to view a user's effective access and separately manage their direct exception grants, monitoring scopes, and external-auditor grants, so that I can review access without mistaking inherited permissions for exceptions.

### Access governance

- As a **tenant administrator**, I want to review the capability catalog in Arabic and English, so that I understand the permission available before granting it.
- As a **tenant administrator**, I want to grant and revoke a capability for a position with an appropriate scope, so that access normally follows a staffing position rather than an individual.
- As a **tenant administrator**, I want direct user-level grants to require a written reason, so that exceptional access is deliberate and auditable.
- As a **tenant administrator**, I want to grant and revoke monitoring scopes, so that follow-up visibility is limited to the departments and blueprint categories the user is responsible for.
- As a **tenant administrator**, I want to grant an external auditor a time-bounded and optionally department-bounded audit scope, so that external review is constrained to its authorized remit.

### Task configuration and compliance

- As a **tenant administrator**, I want to maintain the active task-priority catalog and its default priority, so that task creators use a consistent urgency model.
- As a **compliance or internal-audit user**, I want to filter the immutable system activity log by user, event type, entity type, and date range, so that I can investigate relevant administrative activity without scanning unrelated events.

### System

- As the **system**, I want actions to be hidden or disabled based on the current user's capabilities while still relying on the API for authorization, so that the UI is helpful without duplicating ABAC enforcement.
- As the **system**, I want all resource navigation to use `public_id` values and generated OpenAPI types, so that internal identifiers and hand-written DTOs are never exposed by the UI.
- As the **system**, I want all administrative mutations to refresh the affected cached views, so that access and configuration displays do not become stale after a change.

## Acceptance Criteria

### Route, navigation, and permissions

- [x] Route `/admin` renders within the authenticated dashboard shell and has a capability-gated sidebar entry.
- [x] `PageHeader` displays the localized System Administration title, description, and the tab-specific primary action in its `actions` slot.
- [x] The active tab is URL-driven as `?tab=users|access|priorities|audit`; an invalid or omitted value resolves to `users` without breaking browser navigation.
- [x] The current user may deep-link to a selected user with `?tab=users&userPublicId={public_id}`; closing the user sheet removes only `userPublicId` while retaining the selected tab and filters.
- [x] User-management actions require `iam.manage_users`; position assignment actions require `iam.manage_positions`; access-grant actions require `iam.manage_capabilities`; priority actions require `task.manage_priorities`; and the Audit Log tab requires `audit.view_system`.
- [x] When the API returns 403 for a tab, the tab displays the shared no-permission state and does not expose sensitive records or action controls.

### Users tab

- [x] The Users tab presents a cursor-paginated desktop table and a mobile card list from `GET /v1/iam/users`, with manual Load More pagination.
- [x] User filters are URL-driven and include debounced (300 ms) search, active state, account type, and primary-position department. Filter values never contain email addresses, mobile numbers, employee IDs, or other PII.
- [x] The desktop table shows localized user name, employee ID, email, account type, primary position and department, preferred language, active state, and row actions. It uses `RtlTable`, semantic table headers, and a corresponding mobile card hierarchy.
- [x] The empty state explains that no users match the current filters and provides a reset-filters action; it exposes Create User only to users with `iam.manage_users`.
- [x] Create User uses a dialog with Arabic name, optional English name, email, temporary password, optional mobile number and employee ID, account type, and preferred language. Arabic name, email, password, and account type are visibly required.
- [x] Editing a user never displays an existing password. It permits only an optional replacement password and the mutable profile fields supported by the generated request type.
- [x] Deactivate and reactivate actions require a localized `AlertDialog` confirmation and refresh the users list, selected user detail, and affected position occupancy views. A 422 self-deactivation or last-active-tenant-admin guard is shown as the localized API toast and leaves the displayed data unchanged.
- [x] Selecting a user opens an accessible Sheet on desktop and a full-height Sheet on mobile. It loads `GET /v1/iam/users/{user}` and provides Profile, Positions, and Access tabs.
- [x] The Profile tab presents localized identity, account type, status, preferred language, employee ID, mobile number, email, current position, and effective capabilities without placing sensitive values in the URL.
- [x] The Positions tab lists active and ended assignments from `GET /v1/iam/users/{user}/positions`, including localized position and department, start/end dates with the established dual-date display, and a primary indicator.
- [x] An authorized administrator can assign an active position, choose whether it is primary, end an assignment, or mark an existing active assignment primary. Position selection reuses Organization queries and excludes inactive positions; all assignment route parameters use assignment `public_id` values.
- [x] If the API rejects a conflicting primary assignment, an invalid assignment request, or an invalid end request, the localized API message is shown with `toast.error()` and the displayed position data remains unchanged until a successful refetch.

### Access tab and user access panel

- [x] The Access tab shows a bounded, searchable capability catalog from `GET /v1/iam/capabilities`, using localized name, key, description, and system-defined status. The capability key is displayed as immutable technical context.
- [x] An authorized administrator can edit only the localized label and description fields permitted by the stable contract; the UI does not offer capability creation, deletion, or key renaming.
- [x] The Access tab lets an administrator select an active position and view its active grants from `GET /v1/iam/positions/{position}/capabilities`.
- [x] Grant Capability to Position requires a capability and scope type. A department selector is shown and required only for `specific_department` and `department_tree`; it is hidden and cleared for tenant-wide, own-department, and own-tasks scopes.
- [x] Revoking a position grant uses a confirmation dialog, calls the revoke endpoint rather than deleting data, and refreshes the selected position grants plus affected user detail after success.
- [x] The selected user's Access tab clearly distinguishes effective capabilities from direct user-level grants. Direct grants display their scope, department when applicable, grant reason, grantor, and active/revoked status as returned by the API.
- [x] Grant Direct Capability requires a capability, scope, conditional department, and a non-empty justification. It never offers a direct-grant control to users lacking `iam.manage_capabilities`.
- [x] The selected user's Access tab lists active monitoring scopes and allows authorized administrators to add or revoke a department and optional blueprint-category scope according to the API's scope rules.
- [x] When the selected user is an external auditor, the Access tab additionally lists active audit grants and permits creating or revoking a date-bounded audit grant with an optional department. The grant UI is not rendered for other account types.
- [x] Direct capability, monitoring-scope, and audit-grant revocations preserve the historical record by calling the relevant revoke endpoint; the UI never presents them as hard deletes.

### Task Priorities tab

- [x] The Task Priorities tab loads the bounded priority catalog from `GET /v1/tasks/priorities` and shows localized name, severity rank, color preview with accessible text label, display order, default status, and active status.
- [x] Authorized administrators can create and edit priorities with the stable fields: Arabic name, optional English name, severity rank, an optional six-digit `#RRGGBB` color selected from a constrained accessible palette, default flag, and display order.
- [x] A priority color preview is supplemental only; the priority name and severity rank remain visible so that color is never the sole meaning.
- [x] Setting a new default or updating a priority refreshes task-priority consumers, including task board and task-creation queries, after the mutation succeeds.
- [x] Deactivate and reactivate actions use confirmation dialogs and show server validation errors as localized toasts. A priority is never hard-deleted from the UI.

### Audit Log tab

- [x] The Audit Log tab uses `GET /v1/audit-trail/system` with `useInfiniteQuery`, displaying newest activity first and a manual Load More button controlled by `next_cursor` and `has_more`.
- [x] Audit filters are URL-driven and include user public ID selected through a localized user picker, event type, entity type, date range, and calendar system. `entity_type` uses a static localized map of the stable `AuditEntityType` enum; `event_type` offers a curated static list with free-text fallback. The user picker never serializes a user's name or email into the URL.
- [x] The audit table presents timestamp with the shared dual-date display, actor, event type, entity type, target summary/public ID where available, and the API-provided event details. Technical fields are not shown in the table; the UI does not reconstruct hidden data.
- [x] On mobile, audit records render as cards with the same information hierarchy and an accessible Details control when an event contains additional metadata.
- [x] Event metadata is rendered as structured, escaped key/value content. The UI does not use `dangerouslySetInnerHTML`. For authorized system-log users, a collapsed, accessible Technical Details disclosure may show the API-provided IP address and user agent; the disclosure must not expose values omitted or nulled by the API.
- [x] The Audit Log tab has loading, empty, error, and success states. Its error state provides Retry and preserves the current filters.

## Technical Requirements

> Reference: `docs/ai/coding-standards.md`, `docs/ai/architecture.md`, `docs/ai/security-policy.md`, and the stable `../backend/openapi/openapi.json` contract.

### Data Fetching

- [x] Add domain-focused TanStack Query hooks under `lib/api/hooks/` (for example, `use-admin-users.ts`, `use-admin-access.ts`, `use-task-priorities.ts`, and `use-audit-trail.ts`) rather than `useEffect` plus `fetch`.
- [x] Use `useInfiniteQuery` for users and system audit logs because both API endpoints are cursor-paginated. Merge pages only through TanStack Query and show a manual Load More control; do not implement offset pagination, page numbers, or auto-scroll loading.
- [x] Use `useQuery` for bounded catalogs and selected-resource data: capabilities, task priorities, user detail, position-assignment history, position grants, user access grants, monitoring scopes, audit grants, positions, departments, and blueprint categories.
- [x] Reuse Organization and Blueprint lookup hooks for position, department, and blueprint-category selectors; do not duplicate their API data in new stores.
- [x] Prefetch a selected user's detail on desktop row hover/focus when `iam.manage_users` is available; do not prefetch every user or audit record. Prefetch must use the same `queryKeys.users.detail(publicId)` key as the Sheet.
- [x] API response and request types must come from `lib/generated/api-types.ts`. Regenerate types after the remaining public-ID schema correction lands in `openapi/openapi.json`; never hand-write backend DTO interfaces or cast public IDs to internal integers.

### State Management

- [x] Store shareable tab, user selection, list filters, sort order where supported, and audit filters in `useSearchParams()` using camelCase names. Debounced search keeps temporary input in local state before updating the URL.
- [x] Keep dialog and Sheet visibility, selected position in the Access tab, form input values, confirmation state, and metadata expansion in local component state.
- [x] Do not add a Zustand store for users, grants, priorities, or audit events. These are server state owned by TanStack Query.
- [x] No new persistent Zustand state is required for this feature.

### Query Key Structure

- [x] Extend the existing `queryKeys.users` namespace rather than adding hard-coded keys:

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
  }
  ```

- [x] Add IAM, priority, and audit keys to the central factory with the same hierarchy:

  ```ts
  iam: {
    all: ['iam'] as const,
    capabilities: () => [...queryKeys.iam.all, 'capabilities'] as const,
    positionCapabilities: (positionPublicId: string) =>
      [...queryKeys.iam.all, 'position-capabilities', positionPublicId] as const,
  },
  tasks: {
    // retain queryKeys.tasks.priorities()
  },
  audit: {
    all: ['audit'] as const,
    systemLists: () => [...queryKeys.audit.all, 'system', 'list'] as const,
    systemList: (filters: AuditFilters) => [...queryKeys.audit.systemLists(), filters] as const,
  }
  ```

### Mutation Patterns

- [x] Use `useMutation` for every write. Mutations show localized Sonner success/error toasts and invalidate, rather than optimistically changing, administrative access and audit-sensitive records.
- [x] User create, update, deactivate, reactivate, assign-position, end-position, and set-primary mutations invalidate `queryKeys.users.lists()`, `queryKeys.users.detail(publicId)` where applicable, `queryKeys.users.positions(publicId)`, `queryKeys.organization.positions()`, and the organization department tree when current-occupant data could change.
- [x] Capability catalog updates invalidate `queryKeys.iam.capabilities()` and the capability data used by the current session. Position grant changes invalidate `queryKeys.iam.positionCapabilities(positionPublicId)`, `queryKeys.users.details()`, and the current user's capability query when relevant.
- [x] Direct capability, monitoring-scope, and audit-grant changes invalidate their selected-user key, `queryKeys.users.detail(userPublicId)`, and the related list or detail keys. Do not optimistically grant or revoke permission in the UI.
- [x] Priority create/update/deactivate/reactivate invalidates `queryKeys.tasks.priorities()`, `queryKeys.taskBoard.lists()`, and task-creation data that consumes priorities.
- [x] The Audit Log is never mutated from this workspace. After any local administration mutation, invalidate the current `queryKeys.audit.systemLists()` so a compliance user sees the newly recorded event on refetch.

### Error Handling

- [x] Global 401 handling clears the query cache and redirects to login; individual hooks must not retry a 401.
- [x] Render 403 as the shared no-permission state for tab-level queries and hide/disable unauthorized controls using `useCapability()` only as a UX enhancement.
- [x] Render query 5xx/network failures with `ErrorState` and Retry. Preserve URL filters and selected-user state so retry does not discard context.
- [x] Show client validation failures and API 422 responses using localized `toast.error(error.message)` as prescribed by `coding-standards.md`; do not introduce `FieldError` or raw backend diagnostics.
- [x] Do not log user identity, access-grant reasons, audit metadata, or API stack traces to the browser console or error UI.

## UI Requirements

> Reference: `docs/design-system/01-tokens.md`, `03-components.md`, `04-layout-patterns.md`, `05-accessibility.md`, and `06-anti-patterns.md`. Glassmorphism is deferred by `02-glassmorphism.md` and must not be introduced by this feature.

### Component Breakdown

| Component | Type | Source | Notes |
|---|---|---|---|
| `AdminWorkspace` | Client | Domain: admin | Reads URL tab/filter state; coordinates page header actions and tab content. |
| `UsersTable` / `UsersCardList` | Client | Domain: admin | Cursor-paginated desktop table / mobile cards. |
| `UserFormDialog` | Client | Domain: admin + shadcn `Dialog`, `Field`, `InputGroup` | Create and edit user profile, with bilingual names and no existing-password display. |
| `UserDetailSheet` | Client | Domain: admin + shadcn `Sheet`, `Tabs` | Profile, Positions, and Access detail views; mobile becomes full height. |
| `UserPositionAssignments` | Client | Domain: admin | Assignment list plus assign/end/set-primary actions. |
| `CapabilityCatalog` | Client | Domain: admin + `RtlTable` | Bounded, searchable capability list and label/description editor. |
| `PositionCapabilityPanel` | Client | Domain: admin | Active position picker and scoped position-grant list. |
| `DirectAccessPanel` | Client | Domain: admin | Direct grants, monitoring scopes, and conditional external-auditor grants. |
| `GrantCapabilityDialog` / `GrantMonitoringScopeDialog` / `GrantAuditScopeDialog` | Client | Domain: admin + shadcn `Dialog`, `RtlSelect`, `Field` | Conditional-scope forms with required reason/date handling. |
| `PrioritiesTable` / `PriorityFormDialog` | Client | Domain: admin + `CatalogTable` | Bounded configuration list and create/edit flow. |
| `SystemAuditTable` / `SystemAuditCardList` | Client | Domain: admin + `RtlTable` | Cursor-paginated compliance log with structured event metadata. |
| `AdminUsersSkeleton`, `AccessSkeleton`, `PrioritiesSkeleton`, `AuditLogSkeleton` | Client | Domain: admin + shadcn `Skeleton` | Match the real table, form, or panel shape. |
| `PageHeader`, `EmptyState`, `ErrorState`, `RtlSelect`, `RtlTable`, `ConfirmDeleteDialog` | Shared | `components/shared/` | Reuse existing patterns; do not recreate primitives. |
| `Button`, `Card`, `Badge`, `Tabs`, `Sheet`, `Dialog`, `AlertDialog`, `Tooltip`, `Skeleton` | Client | shadcn/ui | Use existing primitives and their keyboard/focus behavior. |

### States

| State | Component | Pattern |
|---|---|---|
| Loading | Users | Eight table-row skeletons matching the table columns; mobile renders stacked user-card skeletons. |
| Empty | Users | `EmptyState` with Users icon, localized headline, reset filters, and capability-gated Create User CTA. |
| Error | Users | `ErrorState` with safe localized message and Retry; filters remain in the URL. |
| Success | Users | Table/cards, selected-user Sheet, and manual Load More control. |
| Loading | Access | Catalog row skeleton plus detail-panel lines and grant-button placeholder. |
| Empty | Position/user access | Scoped message explaining no active grants; capability-gated Add Grant CTA. |
| Error | Access | `ErrorState` for tab-level data; dialog mutation errors as toasts. |
| Success | Access | Capability catalog, scoped grant panels, monitoring scopes, and audit-grant panel where appropriate. |
| Loading | Priorities | Six catalog table rows matching name, severity, default, status, and actions. |
| Empty | Priorities | `EmptyState` with capability-gated Create Priority CTA. |
| Error | Priorities | `ErrorState` with Retry. |
| Success | Priorities | Full bounded catalog with dialogs and confirmation actions. |
| Loading | Audit Log | Eight audit rows/cards matching timestamp, actor, event/entity, and summary. |
| Empty | Audit Log | `EmptyState` that explains no events match the filters and offers Reset Filters. |
| Error | Audit Log | `ErrorState` plus Retry without clearing filters. |
| Success | Audit Log | Newest-first table/cards and manual Load More control. |

### Responsive Behavior

| Breakpoint | Behavior |
|---|---|
| Mobile (<640px) | One-column workspace; tab list scrolls horizontally with accessible labels; dense user and audit tables switch to cards; filters open in a Sheet; all primary controls meet 44×44 px targets; user details use full-height Sheet. |
| Tablet (640–1024px) | Filters may wrap into two rows; users and audit logs remain in a compact table where space permits, otherwise use cards; access panels stack below capability catalog; user Sheet uses a constrained width. |
| Desktop (≥1024px) | Full page padding and `PageHeader`; six-to-eight-column user/audit tables; Access tab uses a two-column catalog-and-grant layout; selected-user Sheet uses a readable side-panel width; PageHeader keeps the tab action visible. |

### RTL Considerations

- [x] Use logical properties exclusively: `ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`, `text-start`, `text-end`, `border-s`, and `border-e`.
- [x] Keep data-table column order stable between Arabic and English; align text columns to `text-start`, numeric ranks to `text-end`, and actions to `text-end`.
- [x] Use `RtlSelect` and `RtlTable` for selectors and tabular data. Bilingual Arabic fields use `dir="rtl"`; English inputs use `dir="ltr"`.
- [x] All directional icons—breadcrumb chevrons, Sheet close/back affordances, Load More arrows, and metadata disclosure arrows—include `rtl:rotate-180`. Non-directional icons do not flip.
- [x] The user Sheet opens from the logical end edge, so it opens on the right in Arabic and left in English. Dates use the established Gregorian + Hijri display and calendar-system controls from Spec 020.

### Accessibility

- [x] Meet WCAG 2.1 AA requirements in `docs/design-system/05-accessibility.md`, including contrast, visible focus, semantic headings, tables, and form labels.
- [x] Tabs use the shadcn/Radix tab pattern with accessible tab names, `aria-selected`, keyboard arrow navigation, and logical focus order.
- [x] Tables use semantic `<table>`, `<th scope="col">`, a localized `aria-label`, and visible text for all status meaning. The mobile card view preserves labels through visible text or `sr-only` content.
- [x] Every icon-only action—including filters, Sheet close, more actions, and metadata disclosure—has a localized `aria-label`; decorative icons are `aria-hidden="true"`.
- [x] Dialogs and Sheets trap focus, close on Escape where safe, return focus to their trigger, and surface destructive actions through `AlertDialog` with specific confirmation labels.
- [x] Forms use associated visible labels, required indicators, and `aria-describedby` for explanatory scope/reason guidance. Dynamic successful mutations and toast feedback use polite live regions supplied by Sonner.
- [x] Status and priority indicators always combine color with a localized text label or icon; no access, status, or priority state is conveyed through color alone.
- [x] Desktop and mobile interactions are fully keyboard operable; touch targets are at least 44×44 px on mobile.

### Animation and Transition

- [x] Use `transition-colors duration-150` for tab, filter, and row-action feedback; use shadcn's default Dialog/Sheet transitions.
- [x] Custom cards may use `transition-all duration-200 hover:shadow-md` only when they are interactive; tables and long audit lists remain solid and do not use per-row blur or heavy animation.
- [x] Skeletons use `animate-pulse`; all animated elements include the applicable `motion-reduce:` variant and avoid animating layout-affecting properties.

## Non-Functional Requirements

### Performance

- [x] Use solid `Card` and table surfaces; do not introduce deferred glass effects or backdrop blur into dense lists, forms, or audit records.
- [x] Memoize filter objects used as query-key dependencies and debounce only the user-entered search input.
- [x] Load audit pages only on demand and never fetch an unbounded event history. Capability and priority catalogs use bounded `useQuery` requests.
- [x] Do not add a chart library or new package. Reuse existing shadcn and shared components.

### Security and privacy

- [x] Auth continues to use Sanctum HttpOnly cookies through `apiClient` with credentials; no tokens or access data are written to localStorage.
- [x] Client-side `useCapability()` checks only improve discoverability. The server remains the authorization authority for every read and mutation.
- [x] Do not include PII, access-grant reasons, audit metadata, or credentials in URLs, console logs, client error messages, or analytics payloads.
- [x] Render API content through React text nodes and structured fields only; do not use `dangerouslySetInnerHTML` for audit metadata, descriptions, or localization content.

## Out of Scope

- Organization hierarchy, positions catalog, working calendars, and public holidays; these are delivered by Spec 008 and Spec 020 and are reused only as lookup data.
- Personal profile editing, out-of-office controls, and delegation management; these are delivered by Spec 017.
- Confidential-task participant, metadata override, and governance-participant management; these are delivered by Spec 019.
- Task-level audit trail presentation in task details; this screen covers only the system activity-log endpoint.
- Blueprint library management, SLA policy configuration, escalation rules, notification-template administration, document retention policies, exports, and bulk user import/export.
- Tenant branding, platform-wide language defaults, logo upload, and configurable security-classification labels. The current stable backend OpenAPI contract does not provide the required endpoints.
- Creating, deleting, or renaming a capability key; the capability catalog is system-defined and this UI manages only permitted labels/descriptions and grants.
- Hard-deleting users, assignments, capability grants, monitoring scopes, audit grants, or priorities.

## Open Questions — All Resolved

- [x] **Public-ID generated-schema mismatch:** Backend validation and route binding now use public IDs, and resources expose grant/assignment `public_id` values. The committed OpenAPI artifact now correctly types `AssignPositionRequest.position_id` and `GrantPositionCapabilityRequest.capability_id` as `string`. Regenerate `lib/generated/api-types.ts` before implementation; do not use an internal-ID workaround.
- [x] **Users cursor pagination:** The backend standards require cursor pagination for this potentially large list, but the committed `GET /v1/iam/users` OpenAPI parameters omitted `cursor`. — **Resolved.** `GET /v1/iam/users` now documents the `cursor` query parameter and returns `{ data, next_cursor, has_more }`; use `useInfiniteQuery`.
- [x] **Position-assignment read contract:** The existing API has create/end/set-primary mutations, but no endpoint or `UserDetailResource` field exposed assignment history or the assignment `public_id` required by the latter two mutations. — **Resolved.** `GET /v1/iam/users/{user}/positions` now returns cursor-paginated, active and ended `PositionAssignmentResource` records. Assignment public IDs support the end and set-primary routes.
- [x] **Capability catalog edit contract:** `UpdateCapabilityRequest` currently contained `key`, but the business model describes system-defined capability keys as stable. — **Resolved.** `UpdateCapabilityRequest` no longer accepts `key`. The UI displays the key as read-only and edits only `name_ar`, `name_en`, and `description`.
- [x] **Audit filter values:** `GET /v1/audit-trail/system` accepted `event_type` and `entity_type` but no stable enumeration/catalog endpoint was documented. — **Resolved.** `entity_type` is the stable 34-case integer-backed `AuditEntityType` enum and uses a static localized TypeScript map. `event_type` is free text, with a curated common-event list and free-text fallback.
- [x] **User self-protection:** Backend behavior when an administrator attempts to deactivate or demote their own account, including the last tenant administrator, needed confirmation. — **Resolved.** The API rejects self-deactivation and deactivation of the last active tenant administrator with localized 422 messages. The UI surfaces those messages and does not preempt the server rule.
- [x] **Priority color constraints:** Backend validation and approved palette for `color_code` needed confirmation, including whether arbitrary hex values were allowed or the UI should offer a constrained accessible palette. — **Resolved.** `color_code` accepts only `#RRGGBB` six-digit hex values. The UI uses a constrained accessible palette and always pairs color with a text label.
- [x] **Audit metadata detail:** The stable `AuditEventResource` metadata shape and redaction rules needed confirmation so the audit-details presentation could be specified without leaking sensitive fields. — **Resolved.** System audit responses include raw `payload`, IP address, and user agent; `/audit-trail/me` nulls IP/user-agent. The system-log UI keeps technical data behind an accessible disclosure and renders all payload content as escaped structured data.

→ **Next:** Resolve the Open Questions and obtain review approval before creating `plan.md`.