# Spec: Confidential Access

> **Number:** 019
> **Date:** 2026-07-16
> **Status:** `completed`
> **Milestone:** F6 — Admin, Org, Help, Onboarding
> **Depends on:** `001-core-shell`, `003-task-board`, `004-task-details`, `016-task-creation-launch`, `008-organization-structure`
> **Backend spec:** `../backend/specs/017-confidentiality-access/` — `Contract status: stable`
> **Contract status:** `stable`
> **Author:** Antigravity (AI)
> **Branch:** `feat/019-confidential-access`
> **Base branch:** `main`

---

## Problem

The platform already enforces ABAC visibility for public and internal tasks, and the task board and task detail pages (specs 003 and 004) serve most users correctly. However, `confidential` tasks — those containing sensitive government, legal, HR, whistleblower, or investigation-level content — have no dedicated UI treatment. Without this spec:

- **The task board silently hides confidential tasks** without any indicator that such tasks exist. Users who are named participants or governance viewers have no visible indication they should check elsewhere.
- **There is no way to add or remove named confidential participants** on a task. The task initiator and managers must currently contact a system administrator.
- **Senior leaders with `task.confidential.view_metadata` cannot access task context.** When clicking a confidential task they monitor, they are blocked entirely rather than seeing a redacted summary (title, owning department, SLA health, status, due date) that maintains accountability without exposing sensitive content.
- **Governance officers with `task.confidential.view_override` cannot invoke the override path.** They need a UI surface to declare a mandatory reason before accessing full confidential content for investigations or emergencies.
- **The task creation form does not surface the `confidential` classification clearly.** Users launching tasks on confidential blueprints have no guidance about what confidential classification means or how to manage participants immediately after creation.
- **There is no admin screen for governance participant configuration.** Tenant admins cannot configure which positions automatically have oversight access on confidential tasks.

Confidential tasks are a core government requirement — sensitive workflows (HR investigations, ministerial briefs, legal opinions, whistleblower cases) must be protected while remaining auditable and accessible to authorized oversight roles.

---

## Goal

Deliver UI surfaces across five areas:

1. **Task board and task details** — visual treatment for confidential task rows and locked task detail views; classification badge promotes to primary visual signal when task is confidential.
2. **Confidential participant management** — sidebar card on task details (for authorized users) to view, add, and remove named confidential participants.
3. **Metadata-only view** — a locked task detail layout shown to users with `task.confidential.view_metadata` but without full access; shows redacted title, department, SLA health, status, and a prominent access context notice.
4. **Content override flow** — a modal that collects a mandatory reason before invoking `POST /v1/tasks/{task}/access-override`, then renders the full task detail in an "override session" banner.
5. **Admin: Governance participant configuration** — a screen under `/admin/confidential-governance` (capability-gated to `iam.manage_capabilities`) to CRUD governance participant rules that automatically include certain positions on confidential tasks.

---

## User Stories

### Task Initiator / Named Participant

- As a **task initiator**, I want to see a confidential lock icon on the task detail title so that I always know this task is restricted.
- As a **task initiator** (or manager with `task.confidential.manage_participants`), I want to view the current list of named confidential participants in a sidebar card, so that I know who has access.
- As a **task initiator**, I want to search for a user by name and add them as a named confidential participant with one click, so that they can access the task immediately.
- As a **task initiator**, I want to remove a named participant (with confirmation), so that access is revoked when no longer needed.
- As a **task initiator**, I want to see the participant management card hidden/disabled when I am not the initiator and lack the `task.confidential.manage_participants` capability, so that the UI matches what the server enforces.

### Senior Leader / Governance Viewer (Metadata Access)

- As a **senior leader** with `task.confidential.view_metadata` capability, I want to see confidential tasks I am permitted to monitor appear on my board normally, so that I know they exist.
- As a **senior leader**, when I click a confidential task I am not a direct participant of, I want to be taken to a metadata-only detail page that clearly states I am viewing a redacted summary, so that I understand my access level.
- As a **senior leader**, I want the metadata detail page to clearly state that I am viewing a redacted summary and provide a reason why, so that I understand my access level.

### Governance Officer (Override Access)

- As a **governance officer** with `task.confidential.view_override` capability, I want to see an "Open confidential content" button on the metadata detail page, so that I can initiate an override when I have a legitimate reason.
- As a **governance officer**, I want a mandatory reason dialog to appear before the override succeeds, so that every access is audited with a reason.
- As a **governance officer**, I want the override session to show a persistent amber banner on the task detail page stating that I am in an override session with the reason, so that the access context is always visible.
- As a **governance officer**, I want the override to be per-request only (no persistent elevation), so that the access resets when I navigate away.

### Tenant Admin (Governance Config)

- As a **tenant admin** with `iam.manage_capabilities`, I want to view the list of configured governance participant rules (position, scope, classification level, revoked status), so that I can verify which positions have automatic oversight.
- As a **tenant admin**, I want to create a new governance participant rule by selecting a position, scope type, optional department/blueprint category, and classification level, so that authorized positions are included automatically on matching confidential tasks.
- As a **tenant admin**, I want to edit an existing governance participant rule (scope or category), so that I can adjust oversight coverage.
- As a **tenant admin**, I want to revoke a governance participant rule with a confirmation, so that a position no longer has automatic oversight on future access evaluations.

### System

- As the **system**, I want confidential task rows on the board to render a `ClassificationBadge` with `confidential` variant as a prominent visual signal, so that the restricted nature is immediately visible.
- As the **system**, I want the task creation form to show a confidential classification explainer when the user selects `confidential`, so that the initiator understands the access implications before launching.
- As the **system**, I want all mutations (add/remove participant, access override, governance config CRUD) to invalidate the correct TanStack Query cache keys, so that the UI stays consistent after API changes.
- As the **system**, I want all confidential access UI to be capability-gated so that UI actions match what the server enforces (server is the sole authority).

---

## Acceptance Criteria

### Task Board — Confidential Row Treatment

- [x] A confidential task row on the task board displays a `ClassificationBadge` with the `confidential` variant (muted `LockKeyhole` icon + "سري" / "Confidential" text). Uses the same muted `<span>` style as public/internal — no colored badge.
- [x] Confidential rows the current user has no access to at all do not appear in the list (server-side enforcement; no frontend change needed).
- [x] The board row itself is not redacted. Users with `task.confidential.view_metadata` will see the actual title and normal board columns based on their base visibility (no frontend change needed here).
- [x] Clicking a confidential row navigates to `/tasks/[publicId]`. The detail page is responsible for determining if the user has full access or needs to fallback to the metadata-only view.

### Task Detail — Confidential Indicator

- [x] On a full-access confidential task, the `ClassificationBadge` in the Title & Meta card is the `confidential` variant (muted `LockKeyhole` icon) and appears before all other badges.
- [x] A `LockKeyhole` icon is displayed adjacent to the task title in the header area.
- [x] The `ClassificationBadge` includes accessible text: `aria-label="تصنيف: سري"`.

### Confidential Participant Management Card

- [x] The sidebar of a confidential task detail page includes a "Confidential Participants" card when the current user is the task initiator OR has `task.confidential.manage_participants`.
- [x] The card initially shows the current list of active named participants (avatar + name + position, cursor-paginated via `GET /v1/tasks/{task}/confidential-participants`).
- [x] The card shows a loading skeleton while the participant list loads.
- [x] The card shows an empty state with message "لا يوجد مشاركون مسمّون حتى الآن" / "No named participants yet" when the list is empty.
- [x] An "Add participant" button opens a user search combobox (matching the delegation user search pattern from `017-user-settings-delegation`) that debounce-searches `/v1/iam/users` and calls `POST /v1/tasks/{task}/confidential-participants` on selection.
- [x] Adding a participant shows a loading spinner and a success toast "تمت الإضافة" / "Participant added" on success.
- [x] Adding a participant who is already active (422 duplicate) shows `toast.error()` with the backend's error message.
- [x] Each participant row has a `Remove` action (trash icon button, outlined danger style) that opens a `ConfirmDeleteDialog`.
- [x] Confirming removal calls `DELETE /v1/tasks/{task}/confidential-participants/{user}` and shows success toast.
- [x] The card is read-only (no add/remove buttons) when the user has neither initiator status nor `task.confidential.manage_participants`.
- [x] The card is hidden entirely when the user lacks visibility to the confidential participants list (server returns 403 on the list endpoint). For other errors, shows `ErrorState` with retry.

### Metadata-Only Detail Page

- [x] When a user navigates to `/tasks/[publicId]` for a confidential task, if the user lacks full access (e.g. `GET /v1/tasks/{task}` returns 403 or the user is known to not be a participant), the frontend fetches `GET /v1/tasks/{task}/metadata` and renders a "metadata-only" layout if successful.
- [x] The metadata layout shows: a `ClassificationBadge` (confidential), a `LockKeyhole` icon, redacted title (or actual title per tenant policy), owning department name, task status badge, SLA health badge with remaining time, due date (via `DualDateDisplay`), responsible position name.
- [x] A prominent amber `Alert` informs the user: "أنت تشاهد بيانات وصفية مقيّدة فقط" / "You are viewing restricted metadata only. Full content is not accessible with your current permissions."
- [x] When the user has `task.confidential.view_override` capability, an "Open confidential content" button is visible below the alert.
- [x] When the user does NOT have `task.confidential.view_override`, no override button is shown.
- [x] The metadata-only layout has no sidebar, no stage timeline, no participants card, and no stage lifecycle action buttons.
- [x] If the task API returns 404, the page shows a standard not-found state.

### Content Override Flow

- [x] Clicking "Open confidential content" opens an `AlertDialog` with title "فتح المحتوى السري" / "Open Confidential Content".
- [x] The dialog body includes an amber `Alert` explaining that this access is audited and logged.
- [x] A required `Textarea` field labeled "سبب الوصول" / "Reason for access" must have at least 10 characters (per OpenAPI); submitting with a shorter reason shows `toast.error()`.
- [x] The "Confirm" button calls `POST /v1/tasks/{task}/access-override` with `{ reason }`. While loading, the button shows a spinner and is disabled.
- [x] On success (200 with full `TaskDetailResource`), the dialog closes and the normal task detail layout renders, with a persistent amber `Alert` banner at the top: "جلسة وصول مراقبة — السبب: [reason]" / "Monitored access session — Reason: [reason]".
- [x] The override banner persists throughout the user's session on this page and does not disappear on scroll.
- [x] Navigating away from the page discards the override session (component state, not persisted).
- [x] On 422 (task not confidential) or 403 (capability denied), `toast.error()` shows the backend's localized message.

### Task Creation — Confidential Classification Explainer

- [x] On the task creation form (spec 016), when the user selects `confidential` from the classification select, an inline info `Alert` appears below the select: "المهام السرية لا تظهر إلا للمشاركين المسمّين ومناصب الرقابة المكوّنة." / "Confidential tasks are only visible to named participants and configured governance positions."
- [x] The explainer disappears when the user changes classification back to `public` or `internal`.

### Admin: Governance Participant Configuration

- [x] A new admin route at `/admin/confidential-governance` is accessible only to users with `iam.manage_capabilities` (sidebar item is hidden without this capability).
- [x] A sidebar nav item "Governance Participants" ("مشاركو الحوكمة") appears in the Admin sidebar group, capability-gated.
- [x] The page shows a `PageHeader` with title "مشاركو الحوكمة السرية" / "Confidential Governance Participants" and a primary "Add rule" button in the `actions` slot.
- [x] The table displays columns: Position (name + department), Scope type, Scope Target (department name or "Tenant-wide"), Blueprint Category, Classification Level, Status (`ActiveBadge`), Actions.
- [x] The table is cursor-paginated (`useInfiniteQuery`, "Load more" button) via `GET /v1/iam/confidential-governance-participants`. Filters use shadcn `<RtlSelect>` components in a grid layout.
- [x] All 4 states are handled: loading (`GovernanceTableSkeleton`), empty (`EmptyState` + CTA), error (`ErrorState` + retry), success.
- [x] Clicking "Add rule" opens a `FormDialog` with: Position picker, Scope type select (`tenant` | `specific_department` | `department_tree`), Department select (required for non-tenant scopes, hidden for `tenant`), Blueprint Category select (optional), Classification Level select (defaults to Confidential).
- [x] Submitting a valid form calls `POST /v1/iam/confidential-governance-participants`. On success, shows toast and closes dialog.
- [x] Editing a row calls `PUT /v1/iam/confidential-governance-participants/{participant}`.
- [x] Revoking a rule shows a `ConfirmDeleteDialog` (using "revoke" / "إلغاء" wording, not "delete") and calls `POST /v1/iam/confidential-governance-participants/{participant}/revoke`.
- [x] Revoked rules show `ActiveBadge` as inactive and remain in the table.
- [x] Field validation errors are shown via `toast.error()` (not inline `FieldError`).
- [x] Scope field combination validation: `specific_department` / `department_tree` requires department select; `tenant` hides department select.

### RTL / i18n

- [x] All user-facing strings are in `messages/ar.json` and `messages/en.json` under `confidential.*` namespace.
- [x] Lock icons (`LockKeyhole`) do NOT flip in RTL (non-directional).
- [x] `ChevronRight` / navigation arrows flip with `rtl:rotate-180`.
- [x] All layout uses logical properties (`ms-`, `me-`, `ps-`, `pe-`, `text-start`, `text-end`, `border-s`, `border-e`).
- [x] Governance config table uses `RtlTable`.

### Accessibility

- [x] Override dialog respects focus trap: focus moves to `Textarea` on open; `Escape` closes without submitting.
- [x] `ClassificationBadge` confidential variant has `role="status"` and `aria-label` — removed per user preference (muted style has no `role="status"`, aria-label kept)
- [x] `LockKeyhole` icon (decorative) has `aria-hidden="true"`.
- [x] Participant list uses `role="list"` / `role="listitem"` structure.
- [x] Remove participant button has `aria-label` including participant name.
- [x] Override banner uses `role="alert"` for screen readers.
- [x] Governance table has `role="table"` and `scope="col"` on all column headers.
- [x] Touch targets ≥ 44px on all action buttons.
- [x] `prefers-reduced-motion` respected on entrance animations.

---

## Technical Requirements

> Reference: `docs/ai/coding-standards.md`

### Data Fetching

- [x] **Confidential participants list:** `useConfidentialParticipantsInfinite(taskPublicId)` using `useInfiniteQuery`, query key `queryKeys.tasks.confidentialParticipants(taskPublicId)`. Endpoint: `GET /v1/tasks/{task}/confidential-participants` (cursor-paginated).
- [x] **Metadata view:** `useTaskMetadata(taskPublicId)` using `useQuery`, query key `queryKeys.tasks.metadata(taskPublicId)`. Endpoint: `GET /v1/tasks/{task}/metadata`. `enabled: !!taskPublicId`.
- [x] **Governance participants list:** `useGovernanceParticipantsInfinite(filters)` using `useInfiniteQuery`, query key in `query-keys-extra.ts` as `['iam', 'governance-participants', filters]`. Endpoint: `GET /v1/iam/confidential-governance-participants`.
- [x] **Positions for governance form:** reuse existing position hooks from `use-organization.ts`.
- [x] **Departments for governance form:** reuse `useDepartmentsInfinite()` from `use-organization.ts`.
- [x] **User search for participant add:** reuse `UserSearchCombobox` from spec 017's delegation flow. Debounced `GET /v1/iam/users?search=…`.
- [x] No prefetch in MVP — all data loaded client-side on mount.
- [x] Stale time for governance list: 30s (matches organization hooks pattern from 008/017).

### Mutations

| Hook | Endpoint | On Success |
|------|----------|------------|
| `useAddConfidentialParticipant(taskPublicId)` | `POST /v1/tasks/{task}/confidential-participants` | Invalidate `queryKeys.tasks.confidentialParticipants(taskPublicId)` |
| `useRemoveConfidentialParticipant(taskPublicId)` | `DELETE /v1/tasks/{task}/confidential-participants/{user}` | Invalidate `queryKeys.tasks.confidentialParticipants(taskPublicId)` |
| `useAccessOverride(taskPublicId)` | `POST /v1/tasks/{task}/access-override` | No cache invalidation; store response in component `useState` |
| `useCreateGovernanceParticipant()` | `POST /v1/iam/confidential-governance-participants` | Invalidate `['iam', 'governance-participants']` prefix |
| `useUpdateGovernanceParticipant(publicId)` | `PUT /v1/iam/confidential-governance-participants/{participant}` | Invalidate same prefix |
| `useRevokeGovernanceParticipant(publicId)` *(removed)* | `POST /v1/iam/confidential-governance-participants/{participant}/revoke` | Inline `useMutation` in `GovernanceParticipantsManager` |

All mutations: `toast.error(error.message)` on failure; `toast.success(t('...'))` on success.

### State Management

- [x] **Override session state** (reason, override task data, active flag): `useState` in `TaskOverrideSession` client component. NOT persisted to Zustand; discarded on navigation.
- [x] **Governance table filters** (scope type, classification level, active/revoked): URL search params (`?scopeType=…&status=…`) — shareable and bookmarkable.
- [x] **Participant "Add" UI state** (search query, selected user, loading): `useState` local to `ConfidentialParticipantsCard`.
- [x] **Dialog open/close state**: `useState` local to each dialog's parent component.

### Query Key Structure

New entries in `lib/api/query-keys.ts`:

```ts
tasks: {
  // ...existing...
  confidentialParticipants: (publicId: string) =>
    [...queryKeys.tasks.detail(publicId), 'confidential-participants'] as const,
  metadata: (publicId: string) =>
    [...queryKeys.tasks.detail(publicId), 'metadata'] as const,
}
```

New entries in `lib/api/query-keys-extra.ts`:

```ts
iam: {
  governanceParticipants: (filters?: GovernanceParticipantFilters) =>
    ['iam', 'governance-participants', filters] as const,
}
```

### Hook File Placement

- Confidential participant hooks + access override hook → extend `lib/api/hooks/use-task-detail.ts`
- Governance participant hooks → new `lib/api/hooks/use-confidential-governance.ts`

### Error Handling

- [x] 401 → global redirect via `QueryCache.onError`
- [x] 403 on task detail → fetch metadata fallback; 403 on metadata → `EmptyState`
- [x] 404 on task metadata endpoint → render standard not-found `EmptyState`
- [x] 422 on override endpoint → `toast.error()` with backend's localized message
- [x] 500 / network error → `ErrorState` with retry on list queries; `toast.error()` on mutations

---

## UI Requirements

> Reference: `docs/design-system/`

### Component Breakdown

| Component | Type | Source | Notes |
|-----------|------|--------|-------|
| `ClassificationBadge` (confidential variant) | Client | Domain/tasks | Extend existing badge with `confidential` variant: muted text, `LockKeyhole` icon |
| `ConfidentialParticipantsCard` | Client | Domain/tasks | Sidebar card: participant list + add/remove UI |
| `ConfidentialParticipantItem` | Client | Domain/tasks | Avatar + name + position + remove button |
| `ConfidentialMetadataPage` | Client | Domain/tasks | Full restricted/metadata-only layout |
| `TaskOverrideSession` | Client | Domain/tasks | Wraps task detail; manages override state and session banner |
| `AccessOverrideDialog` | Client | Domain/tasks | `AlertDialog` with reason `Textarea` + submit |
| `GovernanceParticipantsPage` | Client | Domain/admin | Admin list page with table |
| `GovernanceRuleFormDialog` | Client | Domain/admin | Create/edit governance rule `FormDialog` |
| `GovernanceParticipantRow` | Client | Domain/admin | Table row with actions `DropdownMenu` |
| `PageHeader` (reuse) | Server | Shared | Title + primary action slot |
| `EmptyState` (reuse) | Client | Shared | Empty list states |
| `ErrorState` (reuse) | Client | Shared | Error with retry |
| `ConfirmDeleteDialog` (reuse) | Client | Shared | Participant removal + governance rule revoke |
| `RtlTable` (reuse) | Client | Shared | Governance table |
| `ActiveBadge` (reuse) | Client | Shared | Active/revoked status |
| `DualDateDisplay` (reuse) | Client | Shared/tasks | Due date in metadata layout |

### Classification Badge — Confidential Variant

Extend `ClassificationBadge` in `components/domain/tasks/`:

| Classification | Icon | Style |
|---------------|------|-------|
| `public` | `Globe` | Muted text (`text-muted-foreground/50`) |
| `internal` | `Shield` | Muted text (`text-muted-foreground`) |
| `confidential` | `LockKeyhole` | Muted text (`text-muted-foreground`) — same `<span>` style as internal |

Confidential uses the same muted style as internal (not a colored `Badge`) to avoid visual competition with SLA/status/priority colors.

### States

| State | Component | Pattern |
|-------|-----------|---------|
| Loading (participants) | `ConfidentialParticipantsSkeleton` | 3 rows: avatar circle (40px) + name block + button placeholder |
| Empty (participants) | `EmptyState` icon=`UserX` | "لا يوجد مشاركون حتى الآن" + Add button CTA |
| Error (participants) | `ErrorState` | Message + retry button |
| Success (participants) | Participant list + Load More button | Cursor-paginated |
| Loading (governance table) | `GovernanceTableSkeleton` | 5 rows matching column widths |
| Empty (governance table) | `EmptyState` icon=`ShieldOff` | "لا توجد قواعد مهيّأة" + Add rule CTA |
| Error (governance table) | `ErrorState` | Message + retry |
| Success (governance table) | Table rows + Load More button | Cursor-paginated |
| Loading (metadata page) | `TaskMetadataSkeleton` | Title block + badge row + field pairs (dept, status, SLA, date) |
| Error (metadata page) | `ErrorState` inline | Message + retry |
| Success (metadata page) | `ConfidentialMetadataPage` | Full restricted layout |

### Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| Mobile (<640px) | Participants card stacks below main column. Override dialog is full-width sheet or centered modal. Governance table becomes a card list with fewer visible columns. |
| Tablet (640-1024px) | Task detail single-column layout; participants card moves below stage timeline. Governance table horizontally scrollable. |
| Desktop (≥1024px) | Task detail: 2/3 + 1/3 grid with participants card in sidebar column. Governance table: full-width with all columns. |

### RTL Considerations

- [x] All layout uses logical properties (`ms-`, `me-`, `ps-`, `pe-`, `text-start`, `text-end`).
- [x] `LockKeyhole` icon does NOT flip (non-directional icon — same lock shape in both directions).
- [x] `ChevronRight` in breadcrumbs and navigation flips with `rtl:rotate-180`.
- [x] Override session banner: icon (`ShieldAlert`) does NOT flip. Text is start-aligned.
- [x] Participant avatar in RTL: `flex-row` auto-reverses in RTL container — verify visual output.
- [x] Governance table: column headers use `text-start`; `RtlTable` handles `dir` prop automatically.
- [x] `UserSearchCombobox` / `Command` popover: aligns to `start` in both locales.

### Accessibility

- [x] `ClassificationBadge` confidential: `role="status"`, `aria-label={t('classification_confidential')}`.
- [x] `LockKeyhole` in title header area: `aria-hidden="true"` (decorative; badge text is the semantic indicator).
- [x] `AccessOverrideDialog` (`AlertDialog`): focus trap; focus moves to `Textarea` on open; `Escape` closes without submitting.
- [x] `Textarea` in override dialog: `aria-required="true"`, `aria-describedby` points to hint/count text.
- [x] Remove participant button: `aria-label={t('remove_participant_label', { name })}`.
- [x] Override session banner: `role="alert"` so screen readers announce it on appearance.
- [x] Governance table: `<table role="table">`, `<th scope="col">` on all headers.
- [x] Form dialogs: focus on first interactive field on open; return focus to trigger on close (shadcn `Dialog` handles this automatically).
- [x] All color distinctions (amber = warning/override) paired with text labels.
- [x] Touch targets ≥ 44px on all interactive elements (especially remove participant, revoke buttons).
- [x] `prefers-reduced-motion`: use `motion-reduce:animate-none` on entrance animations.

### Animation / Transition Specifications

- [x] Override session banner: `animate-in slide-in-from-top duration-300 motion-reduce:animate-none` on first render.
- [x] Loading skeletons: `animate-pulse motion-reduce:animate-none`.
- [x] Governance row revoke: `opacity-75` transition on revoked row + `ActiveBadge` switches to inactive.

---

## Non-Functional Requirements

### Performance

- [x] Participant list and governance config list use cursor pagination — no full list loads.
- [x] User search combobox debounces API calls by 300ms.
- [x] Override mutation is not retried (single-request semantic).
- [x] Governance participant admin page: evaluate lazy load via `next/dynamic` during plan. (Not implemented — page is lightweight enough.)

### Security

- [x] All capability checks (`task.confidential.manage_participants`, `task.confidential.view_override`, `iam.manage_capabilities`) use `useCapability()` for UX gating only — server enforces ABAC.
- [x] No PII (user email, mobile, employee_id) logged to console.
- [x] Override reason is sent in POST body, never in URL params.
- [x] `/admin/confidential-governance` is behind the dashboard layout auth guard (`prefetchAuthenticatedUser()`).
- [x] No confidential task content stored in Zustand or localStorage — override session data lives only in component state.

---

## Out of Scope

- **Document-level access restrictions** — deferred to V2. Documents on a visible confidential task remain accessible to all full-access viewers.
- **Comment-level confidentiality** — deferred to V2.
- **Notification UI for override events** — audit records the event; no toast/notification to task owner in MVP.
- **Governance participant audit log UI** — `GET /v1/tasks/{task}/confidential-access-events` view is deferred; belongs to `010-system-administration` (audit trail).
- **Override time window / expiry UI** — backend accepts but ignores `expires_at`; no UI in MVP.
- **Renaming classification labels** — tenant-configurable label overrides belong to `010-system-administration`.
- **External auditor grant management UI** — grant management belongs to `010-system-administration`.
- **Bulk participant management** — adding multiple participants at once is deferred.
- **Cross-tenant confidentiality views** — single-tenant only.

---

## Open Questions — All Resolved

- [x] **Metadata-only board row shape:** When a user has `task.confidential.view_metadata`, does the board endpoint (`GET /v1/follow-up/board` / `GET /v1/tasks`) return a special `metadata_only: true` flag in the `BoardTaskResource`, or does it completely exclude these tasks and expose them via a separate endpoint? — **Resolved.** No special flag. The board row looks the same regardless of access level because `TaskVisibilityScope` filters at the row level without field redaction. The restriction is enforced at the detail page.
- [x] **OpenAPI typegen status:** The confidential endpoints are present in `openapi.json`. — **Resolved.** All endpoints found. Metadata endpoint is `/v1/tasks/{task}/metadata` (confirmed by backend team; the OpenAPI initially showed `/v1/tasks/{task}/metadata` but has been corrected).
- [x] **`ClassificationBadge` existence:** Does `ClassificationBadge` already exist in `components/domain/tasks/` (from spec 003/004 implementation with `public` and `internal` variants)? If so, only the `confidential` variant addition is needed. — **Resolved.** Yes, it exists. The confidential variant uses muted text style (same as internal) with `LockKeyhole` icon — no purple Badge wrapper (per user preference).
- [x] **`UserSearchCombobox` reuse:** The delegation user search from spec 017 may be directly reusable for the participant add flow. Confirm exact component path and props interface during plan to avoid duplication. — **Resolved.** Yes, exists at `components/domain/tasks/user-search-combobox.tsx` and is directly reusable.
- [x] **Governance page sidebar placement:** Should `/admin/confidential-governance` appear as a sub-item under a "Security" or "Access Control" admin sidebar group, or as a standalone Admin item? Depends on what `010-system-administration` plans for the admin sidebar. Default assumption: top-level Admin sidebar group item for MVP. — **Resolved.** Top-level Admin group for MVP. Can be moved later if `010-system-administration` introduces a Security group.
- [x] **Scope type display labels (Arabic):** `tenant` → "على مستوى المؤسسة", `specific_department` → "قسم محدد", `department_tree` → "شجرة الأقسام". Confirm with UX/copywriting before implementation. — **Resolved.** The backend handles this by adding `apiValue()` to the `ScopeType` enum. The API returns strings (`"tenant"`, `"specific_department"`, `"department_tree"`) so the frontend can easily translate these string keys without a manual integer mapping.

---

→ **Next:** Read `docs/ai/coding-standards.md` and check existing code in `components/domain/tasks/` before creating `plan.md`.
