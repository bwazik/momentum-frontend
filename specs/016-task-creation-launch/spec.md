# Spec: Task Creation & Launch

> **Number:** 016
> **Date:** 2026-06-28
> **Status:** `completed`
> **Milestone:** F2 — Task board & task details
> **Depends on:** `001-core-shell`, `003-task-board`, `004-task-details`
> **Backend spec:** `../backend/specs/005-task-execution/` — `Contract status: stable`; `../backend/specs/004-blueprint-engine/` — `Contract status: stable` (blueprint show consumed for stage/manual-assignment introspection); `../backend/specs/003-iam-abac/` — `Contract status: stable` (users search reused from spec 004 for manual-at-launch combobox)
> **Contract status:** `stable`
> **Author:** OpenCode
> **Branch:** `feat/016-task-creation-launch`
> **Base branch:** `main`

---

## Problem

The task board (spec 003) lets users *find* work, and the task details page (spec 004) lets them *act* on a task — but there is no way to *start* a task. Today the platform's workflow engine is fully built on the backend: `POST /v1/tasks` creates a draft, `PUT /v1/tasks/{task}` edits a draft, `POST /v1/tasks/{task}/launch` resolves Stage 1 assignees and locks the blueprint, and `DELETE /v1/tasks/{task}` removes an orphan draft. But none of these endpoints have a UI surface. The task board's open question (spec 003) explicitly deferred creation: *"Task creation, draft editing, launch, and manual assignment at launch remain out of scope until a create-task spec/plan."*

Without task creation, the platform's core loop never begins. A government user cannot:

- **Select an active blueprint** and instantiate a real piece of work from it.
- **Capture task context** — Arabic title, description, priority, classification level, and an optional overall due date — before the workflow goes live.
- **Assign people to manual-at-launch stages** — when a blueprint stage is configured as `Manual Assignment at Launch`, the creator must nominate one or more specific people before the task can go live; otherwise the launch is blocked with an `UnresolvableAssignmentException`.
- **Save work-in-progress as a draft** so they can gather context or approvals before officially launching — government work is rarely launched in one sitting.
- **Edit or discard an unfinished draft** — refine metadata before launch, or delete a mistaken draft before it pollutes task lists.
- **Launch** — finalize the draft, trigger Stage 1 instance creation, assignment resolution, blueprint lock (on first launch), and SLA timer start, then land on the task details page ready to act.

This spec closes the loop: it is the **creation entry point** that feeds the task board and the task details page.

---

## Goal

Deliver a **multi-step task creation & launch flow** accessible from the task board's "Create Task" action (and the shell's Quick Create button). The flow is a single page at `/tasks/new` with a stacked form (Form Page template from `docs/design-system/04-layout-patterns.md`):

1. **Step 1 — Blueprint & context:** pick an active blueprint, fill Arabic (required) + English (optional) title/description, select priority (default pre-selected), set classification (gated by `task.classify.confidential`), optional due date.
2. **Step 2 — Manual assignments (conditional):** if the selected blueprint has any Stage 1 stage or sub-stage whose `assignment_type = manual_at_launch`, render a user-search combobox per manual stage/sub-stage so the creator nominates assignees. If Stage 1 has no manual stages, this step is skipped.
3. **Review & save:** a summary card previews the task. Two actions: **Save Draft** (`POST /v1/tasks`, status `draft`) and **Launch** (`POST /v1/tasks` then `POST /v1/tasks/{task}/launch`).

Plus a **draft editing** surface at `/tasks/[publicId]/edit` (only for draft tasks, initiator or `task.manage`) that reuses the same form, and a **delete draft** confirmation dialog. On successful launch, the user is navigated to `/tasks/[publicId]` (task details page) and the task board list cache is invalidated.

All task lifecycle actions that already exist on the task details page (suspend/resume/cancel) remain in spec 004 — this spec only handles draft → launch.

---

## User Stories

### Internal User / Task Initiator

- As an **internal user**, I want to start a new task from the task board, so that I can kick off a piece of government work following a defined workflow.
- As an **internal user**, I want to pick from only the *active* blueprints available to my tenant, so that I cannot start a task from an inactive or non-existent workflow.
- As an **internal user**, I want to fill the task title (Arabic required, English optional), description, priority, classification, and an optional due date, so that all context is captured for Stage 1 assignees.
- As an **internal user**, I want to nominate specific people for any Stage 1 stage/sub-stage marked "Manual Assignment at Launch", so that the launch is not blocked by a missing assignee.
- As an **internal user**, I want to save the task as a draft and come back later, so that I can build context or seek approvals before the workflow goes live.
- As an **internal user**, I want to edit my draft task's metadata and manual assignments before launch, so that I can refine it.
- As an **internal user**, I want to delete a draft task I created by mistake, so that my task list stays clean.
- As an **internal user**, I want to launch the task after creating or editing it, so that Stage 1 assignees are resolved and notified, the blueprint locks, and SLA timers can begin.

### Tenant Admin

- As a **tenant admin** with `task.manage`, I want to edit or delete other users' orphan drafts, so that I can clean up stale work.
- As a **tenant admin** with `task.classify.confidential`, I want to set the classification level to **Confidential**, so that only named participants can see the task.

### System

- As the **system**, I want the creation form to read assignment rules from the blueprint's Stage 1 stages/sub-stages, so that the manual-assignment UI only appears when the blueprint actually requires it.
- As the **system**, I want the launch to be a single backend call (`POST /v1/tasks/{task}/launch`) after the draft is created, so that assignment resolution and blueprint locking happen atomically server-side.
- As the **system**, I want creators to be required to provide manual assignees before launching when Stage 1 has manual stages, so that no task launches with unresolvable assignees (backend returns 422 `MissingManualAssignmentException`).
- As the **system**, I want the task board and task detail cache invalidated after creation/launch, so that the new task appears immediately.
- As the **system**, I want capability checks (`task.classify.confidential`, `task.manage`) to only hide/disable UI for UX — the server remains the source of truth and returns 403/422 regardless.

---

## Acceptance Criteria

### Entry Points & Routing

- [x] The task board page (`/tasks`) shows a **"Create Task"** primary button in the `PageHeader` actions slot (replaces the disabled placeholder noted in spec 003's open questions). Clicking navigates to `/tasks/new`.
- [x] The shell Quick Create button (established by spec 001) includes a "New Task" entry that navigates to `/tasks/new`.
- [x] Route `/tasks/new` renders inside the authenticated dashboard shell using the **Form Page** template (`docs/design-system/04-layout-patterns.md`): `PageHeader` (title "Create Task" + `TaskCancelButton` client component with `CancelDiscardDialog` for dirty-state guard) → form card with sections → footer (Save Draft + Launch buttons).
- [x] Route `/tasks/[publicId]/edit` renders the same form in "edit draft" mode: only reachable when `GET /v1/tasks/{publicId}` returns `status = draft`; the page header shows an `EditPageTitle` client component (reads `displayId` from `useTaskDisplayStore`) and `TaskEditActions` (Cancel + Delete Draft) in the actions slot. Non-draft tasks redirect to `/tasks/[publicId]` (task details).
- [x] The `publicId` route param on the edit route is the task `public_id` (never internal `id`), per `glossary.md` URL rules.
- [x] Breadcrumb for `/tasks/new`: `Dashboard / Tasks / New Task`. Breadcrumb for edit: `Dashboard / Tasks / {display_id}` (display_id resolved from the task detail query, shared via the existing `useTaskDisplayStore`).

### Step 1 — Blueprint & Context

- [x] The **Blueprint** field is a combobox populated by `GET /v1/blueprints?is_active=true&per_page=50` (cursor-paginated via `useBlueprintsInfinite`). **Note:** the backend `BlueprintController::index` does NOT support a server-side `search` param, and the list `BlueprintResource` does NOT embed `stages` (only `stages_count` + `category`). Therefore a client-side filter is applied over the loaded pages by `name_ar`/`name_en` match inside the combobox dropdown (debounced 300ms via the `Command` input), and a "Load more" affordance (or infinite scroll inside the dropdown) fetches the next cursor when present. Only `is_active=true` blueprints are selectable. After the user selects a blueprint, the form calls `useBlueprint(publicId)` (`GET /v1/blueprints/{publicId}`) to fetch the full stage + sub-stage structure (`BlueprintResource.stages` with embedded `sub_stages`, `stage_type`, `sla_policy`, `transitions`) so the form can decide whether to show Step 2 — **a second fetch is required** (the list item does not include stages).
- [x] **Title (Arabic)** is required, max 255 chars, `dir="rtl"`.
- [x] **Title (English)** is optional, max 255 chars, `dir="ltr"`. Placeholder notes it falls back to the Arabic value if left blank (backend copies Arabic when empty — frontend mirrors by showing a muted hint, not by pre-filling).
- [x] **Description (Arabic)** is required, multiline, `dir="rtl"`, preserves line breaks.
- [x] **Description (English)** is optional, multiline, `dir="ltr"`.
- [x] **Priority** is a `RtlSelect` populated from `GET /v1/tasks/priorities` (`TaskPriorityResource[]`, full list). The `is_default = true` priority is pre-selected on a fresh form. Localized by `name_ar`/`name_en`.
- [x] **Classification level** is a `RtlSelect` with three options (Public / Internal / Confidential). **Confidential** is disabled with a tooltip ("You need `task.classify.confidential` capability") when the current user lacks the capability (checked via `useCapability('task.classify.confidential')`). Default = Public.
- [x] **Due date** is an optional date input. Hijri display at the presentation layer via `Intl.DateTimeFormat` with `islamic` calendar (display only; sends Gregorian ISO to the API). Cannot be a past date (`after_or_equal:today` enforced server-side; client-side min = today for UX).
- [x] The fields use shadcn `Field` + `FieldLabel` + `FieldError` (nova pattern) and the shared `BilingualNameFields` / `BilingualDescriptionFields` components where they fit.

### Step 2 — Manual Assignments (Conditional)

- [x] After a blueprint is **selected** and the full `BlueprintResource` is fetched, the form inspects Stage 1 (lowest `sequence_order` stage, plus that stage's sub-stages) — only Stage 1 is validated at launch per backend Decision #18 and `04_Visibility_Rules.md` rule "Only Stage 1 is validated at task launch", and `TaskService::launch()` resolves assignments only for the first stage and its sub-stages.
- [x] For each Stage 1 stage **or** Stage 1 sub-stage whose `assignment_type === 'manual_at_launch'` — i.e. the `AssignmentType` string enum — a **manual assignment block** renders: a label naming the stage/sub-stage (localized `name_ar`/`name_en`), a short helper text explaining the assignment rule, and a debounced multi-select user-search combobox (reusing the `useUsersSearch` hook from spec 004, querying `GET /v1/iam/users?search=...&is_active=true`, 300ms debounce). Multiple users can be selected (chips with remove). The existing single-select `UserSearchCombobox` from spec 004 must be extended or a new multi-select variant built — see open questions resolved.
- [x] If the user attempts to **Launch** while any manual stage/sub-stage has zero selected users, the Launch button shows an inline validation error ("Stage '{name}' requires at least one assignee") and does not submit. Backend confirms with 422 `MissingManualAssignmentException`.
- [x] If the selected blueprint has **no** Stage 1 manual stages/sub-stages, Step 2 is not shown and the form goes directly to the review footer.
- [x] **Payload shape** (confirmed against `StoreTaskRequest`/`LaunchTaskRequest` + `AssignmentResolutionService`): `manual_assignments` is an array of entries; a **stage** entry has `{ blueprint_stage_id, user_ids[] }` (omits `blueprint_sub_stage_id`); a **sub-stage** entry has `{ blueprint_sub_stage_id, user_ids[] }` (omits `blueprint_stage_id`). The validation rules accept both id fields as optional strings; only `user_ids` is required.

### Review Footer & Actions

- [x] The form footer shows a **summary** of the entered values (blueprint name, title, priority, classification, due date, manual assignee counts) before the action buttons.
- [x] **Cancel** (secondary outline with X icon) is rendered in the `PageHeader` actions slot: `TaskCancelButton` (create route) or the Cancel button inside `TaskEditActions` (edit route). Navigates back: to `/tasks` from the create route, or to `/tasks/[publicId]` from the edit route. Unsaved changes prompt a `CancelDiscardDialog` (controlled `AlertDialog` wrapping `ConfirmDeleteDialog`) — only when the form is dirty.
- [x] **Save Draft** (secondary outline) calls `POST /v1/tasks` (create) or `PUT /v1/tasks/{task}` (edit) with the form data **excluding** manual assignments for stages that are not manual. On success: toast "Draft saved", invalidate `queryKeys.taskBoard.lists()` and `queryKeys.tasks.lists()`, navigate to `/tasks/[publicId]` (draft state on the details page).
- [x] **Launch** (primary) does the two-step sequence: (1) `POST /v1/tasks` (or `PUT` if editing) to persist the draft with `manual_assignments`, then (2) `POST /v1/tasks/{task}/launch`. On success: toast "Task launched", invalidate task board + task detail caches, navigate to `/tasks/[publicId]` (now active). The button shows a loading spinner and is disabled during both requests.
- [x] On the **edit** route, the `PageHeader` actions slot includes `TaskEditActions` — a client component that renders **Delete Draft** (ghost/danger button) visible only when `task.initiator_id === currentUser.public_id` (backend `TaskService::delete` enforces initiator-only; `task.manage` allows edit but **not** delete). The button opens a `DeleteDraftDialog` wrapping `ConfirmDeleteDialog` ("Delete this draft task? This cannot be undone.") → `DELETE /v1/tasks/{task}` → toast "Draft deleted" → navigate to `/tasks`. The form footer no longer contains Delete Draft.

### Draft Loading (Edit Route)

- [x] The edit route fetches `GET /v1/tasks/{publicId}` (`TaskDetailResource`) and pre-fills the form: title AR/EN, description AR/EN, priority (`priority.public_id`), classification (`classification_level`), due date.
- [x] The blueprint is **read-only on edit** (displayed as a disabled field with the blueprint name) — a task's blueprint cannot change after creation.
- [x] Manual assignments are pre-filled from the existing draft's assignments if available in the detail resource; otherwise empty for the user to fill before launch.

### States

- [x] **Loading (blueprint combobox / priority select / users combobox)**: inline `Skeleton` or spinners inside the combobox dropdown; the form fields themselves render immediately.
- [x] **Loading (edit route prefetch)**: a form skeleton matching the stacked form shape (header + 4 sections × skeleton inputs) while `GET /v1/tasks/{publicId}` resolves.
- [x] **Empty (no active blueprints)**: when the blueprint combobox returns zero results, an inline empty hint inside the dropdown ("No active blueprints found") — the form cannot proceed; Save Draft/Launch disabled.
- [x] **Error (500 / network on form fetches)**: `ErrorState` with safe message + retry for the page-level fetches (priorities, edit-mode task). Inline `FieldError` for per-field submission errors.
- [x] **Error (403 no permission)**: `EmptyState` with lock icon + localized "no permission" message on the page if the user is not the initiator and lacks `task.manage` on the edit route.
- [x] **Error (404 on edit route)**: `EmptyState` "task not found" with link back to `/tasks`.
- [x] **Error (422 launch blocked)**: backend `MissingManualAssignmentException`, `UnresolvableAssignmentException`, `BlueprintHasNoStagesException`, `BlueprintNotActiveException`, `TaskNotDraftException` → display the backend's localized message inline above the footer or as a toast (do not navigate away); keep the form state so the user can fix and retry.
- [x] **Error (mutation)**: `toast.error()` with the backend message (localized via `X-Locale` header) — reuse the `ApiRequestError` pattern from spec 004/007.
- [x] **Success**: toast feedback + navigation as described above.

---

## Technical Requirements

> Reference: `docs/ai/coding-standards.md`

### Data Fetching

- [x] `useBlueprintsInfinite(filters)` (existing in `use-blueprints.ts`) reused with `is_active=true` and `search` for the blueprint combobox. Filter object memoized via `useMemo`.
- [x] `useBlueprint(publicId)` (existing) — fetch the selected `BlueprintResource` to read Stage 1 stages/sub-stages and their `assignment_type`. Actually the `BlueprintResource.stages` are already embedded in the list item — but to be safe, use `useBlueprint(publicId)` after selection for the full stage + sub_stage structure. Query key `queryKeys.blueprints.detail(publicId)`. Stale time 5 min (blueprints are immutable once locked).
- [x] `useTaskPriorities()` (existing in `use-task-board.ts` or `use-task-detail.ts`) — `GET /v1/tasks/priorities`, full list, query key `queryKeys.tasks.priorities()`.
- [x] `useUsersSearch(search, { is_active: true })` (reused from spec 004, `use-task-detail.ts`) for manual-at-launch comboboxes. Debounce 300ms. Query key `queryKeys.users.list({ search, is_active: ... })`.
- [x] `useTaskDetail(publicId)` (existing) on the edit route to prefill the form.
- [x] **Prefetch**: on the edit route, prefetch the task detail via `queryClient.prefetchQuery` is unnecessary — `useTaskDetail` already runs on mount. No prefetch strategy for create route in MVP.
- [x] All response/request types come from `lib/generated/api-types.ts` (`StoreTaskRequest`, `UpdateTaskRequest`, `LaunchTaskRequest`, `TaskResource`, `TaskDetailResource`, `BlueprintResource`, `TaskPriorityResource`, `UserResource`). No hand-written API DTOs.
- [x] No `useEffect` + `fetch`; all API calls go through TanStack Query hooks.

### State Management

- [x] **Local component state (Zustand store — recommended)**: a `useTaskFormStore` (Zustand, non-persisted) holds the multi-field form state (blueprintId, title_ar, title_en, description_ar, description_en, priorityId, classificationLevel, dueDate, manualAssignments map). Rationale: the form spans two steps + a review footer, and lives across navigation between create and edit routes; lifting it to Zustand avoids prop drilling and preserves data if the user briefly navigates. This matches the established builder-store pattern from spec 005 (`useBlueprintBuilderStore`) — UI/selection state only, never API data.
- [x] **Local `useState`**: dialog open/close (delete confirmation), combobox search inputs (transient, before debounced query), expand/collapse of summary.
- [x] **URL state**: none required for the create form in MVP. The edit route uses the `publicId` route param. (Manual assignment selections live in the Zustand form store, not the URL — they're not bookmarkable state.)
- [x] **TanStack Query**: all API-derived state (blueprints list, blueprint detail, priorities, users search, edit-mode task detail).
- [x] No API data duplicated into Zustand.

### Query Key Structure

> Extend `lib/api/query-keys.ts`. Existing keys reused: `queryKeys.blueprints.list(filters)`, `queryKeys.blueprints.detail(publicId)`, `queryKeys.tasks.priorities()`, `queryKeys.tasks.detail(publicId)`, `queryKeys.users.list(filters)`. No new keys required for reads.

- [x] No hardcoded query key strings in any component.

### Mutations

> Reference: `docs/ai/coding-standards.md` — Mutation patterns

- [x] `useCreateTask()` — `POST /v1/tasks` with `StoreTaskRequest`. On success: invalidate `queryKeys.taskBoard.lists()` and `queryKeys.tasks.lists()`. Returns `TaskResource` (with `public_id`). Toast optional (the launch flow uses it as an intermediate step).
- [x] `useUpdateTask()` — `PUT /v1/tasks/{task}` with `UpdateTaskRequest`. Only allowed when status = draft. On success: invalidate `queryKeys.tasks.detail(publicId)`, `queryKeys.taskBoard.lists()`, `queryKeys.tasks.lists()`. Toast "Draft saved".
- [x] `useLaunchTask()` — `POST /v1/tasks/{task}/launch` with `LaunchTaskRequest` (`manual_assignments` array). On success: invalidate `queryKeys.tasks.detail(publicId)`, `queryKeys.tasks.slaHealth(publicId)`, `queryKeys.taskBoard.lists()`, `queryKeys.tasks.lists()`. Toast "Task launched".
- [x] `useDeleteTask()` — `DELETE /v1/tasks/{task}`. On success: invalidate `queryKeys.taskBoard.lists()`, `queryKeys.tasks.lists()`, remove `queryKeys.tasks.detail(publicId)` (`queryClient.removeQueries`). Toast "Draft deleted".
- [x] Comboboxes (blueprint/user search) use read queries only — no mutations.
- [x] No optimistic updates for create/update/launch/delete — these are server-authoritative state writes; invalidation is correct and safe. Delete is a soft-delete; simple invalidation.
- [x] All mutations use `toast.success()` / `toast.error()` from sonner per `coding-standards.md`.

### Error Handling

- [x] 401 → redirect to login (handled globally by query client `QueryCache.onError`).
- [x] 403 → `EmptyState` with lock icon + localized "no permission" message (server ABAC is source of truth). On the edit route, a non-initiator/non-`task.manage` user sees this.
- [x] 404 → `EmptyState` "task not found" + link to `/tasks`.
- [x] 422 (mutation validation: missing manual assignment, unresolvable assignment, blueprint not active, blueprint has no stages, task not draft) → `toast.error()` with the backend's localized message + keep the form open (do not navigate). If the error maps to a specific field (e.g. a manual stage missing assignees), highlight that block via `aria-describedby` + `FieldError`.
- [x] 500 / network → `ErrorState` with safe message + retry. No stack traces, no internal IDs.
- [x] Abort in-flight combobox queries when the debounce resets (TanStack Query handles this via query key changes).
- [x] No PII (assignee email, mobile, employee ID) in URLs or console logs. User combobox displays `name_ar`/`name_en` only.

---

## UI Requirements

> Reference: `docs/design-system/01-tokens.md`, `03-components.md`, `04-layout-patterns.md`, `05-accessibility.md`, `06-anti-patterns.md`

### Component Breakdown

| Component | Type | Source | Notes |
|-----------|------|--------|-------|
| `TaskNewPage` | Server | Page | `app/(dashboard)/tasks/new/page.tsx`; renders `PageHeader` (with `TaskCancelButton`) + `TaskCreationForm` |
| `TaskEditPage` | Server | Page | `app/(dashboard)/tasks/[publicId]/edit/page.tsx`; renders `PageHeader` (with `EditPageTitle` + `TaskEditActions`) + `TaskCreationForm` in edit mode |
| `TaskCreationForm` | Client | Domain | Orchestrates the two-step form + footer; owns the Zustand form store; handles all 4 states |
| `BlueprintCombobox` | Client | Domain | Debounced combobox over active blueprints; uses `key={open ? 'open' : 'closed'}` to force fresh mount on open; search resets on open; filter is memoized; handles `isError` state; selects + loads stage structure |
| `ManualAssignmentBlock` | Client | Domain | Per manual Stage 1 stage/sub-stage: label + helper + multi-user `UserSearchCombobox` + chips |
| `UserSearchCombobox` | Client | Domain | **Reused from spec 004** (`components/domain/tasks/user-search-combobox.tsx`); debounced users search, single-select variant |
| `MultiUserCombobox` | Client | Domain | New multi-select variant; debounced `useUsersSearch`; batch-resolve `useQuery` with `public_ids[]` param for pre-filled IDs from `draft_manual_assignments`; handles `isError` state for dropdown |
| `TaskFormFooter` | Client | Domain | Summary + Save Draft + Launch (Cancel and Delete Draft have moved to PageHeader) |
| `TaskCancelButton` | Client | Domain | `PageHeader` actions slot; renders Cancel with X icon + `CancelDiscardDialog` for dirty-state guard |
| `TaskEditActions` | Client | Domain | `PageHeader` actions slot (edit route only); renders Delete Draft + Cancel + `DeleteDraftDialog` + `CancelDiscardDialog` |
| `EditPageTitle` | Client | Domain | `PageHeader` title (edit route only); reads `displayId` from `useTaskDisplayStore`; renders localized "Edit Draft — {id}" |
| `DeleteDraftDialog` | Client | Domain/shared | Wraps shared `ConfirmDeleteDialog` with localized task-specific copy |
| `PrioritySelect`, `ClassificationSelect`, `DueDateField` | Client | Domain | Thin wrappers over `RtlSelect` / native date input + `Field` |
| `TaskFormSkeleton` | Client | Domain | Form-shaped skeleton for the edit-route prefetch loading state |
| `BilingualNameFields`, `BilingualDescriptionFields` | Client | Shared | Reused shared components for AR/EN title/description |
| `PageHeader`, `EmptyState`, `ErrorState`, `RtlSelect`, `ConfirmDeleteDialog` | Client | Shared | Reused |
| `Button`, `Card`, `Field`, `FieldGroup`, `FieldLabel`, `FieldError`, `Input`, `Textarea`, `Badge`, `Skeleton`, `Tooltip`, `Separator` | Client | shadcn | Run `npx shadcn@latest docs <component>` before implementation if adding missing components |

### States

| State | Component | Pattern |
|-------|-----------|---------|
| Loading (edit prefetch) | `TaskFormSkeleton` | Header skeleton + form card with 4 sections of skeleton inputs (blueprint field, title pair, description pair, selects) + footer skeleton |
| Empty (no active blueprints) | Blueprint combobox inline hint | "No active blueprints" inside the dropdown; Save/Launch disabled |
| Error (page-level fetch) | `ErrorState` | Safe message + retry for priorities/edit-task fetches |
| Error (403 no permission, edit route) | `EmptyState` | Lock icon, localized message, link to `/tasks` |
| Error (404 edit route) | `EmptyState` | "task not found", link to `/tasks` |
| Error (422 launch blocked) | Inline `FieldError` / toast | Backend localized message; form kept open |
| Success | Toast + navigation | Save Draft → `/tasks/[publicId]` (draft); Launch → `/tasks/[publicId]` (active); Delete → `/tasks` |

### Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| Mobile (<640px) | Single column; form sections stack; bilingual fields stack (AR above EN); manual assignment blocks full width; footer buttons stack (Cancel above Save Draft above Launch) or use a sticky bottom action bar; dialogs become bottom sheets |
| Tablet (640–1023px) | Single column; bilingual fields side-by-side (`md:grid-cols-2`); footer buttons inline |
| Desktop (≥1024px) | Single column max-width form card centered or left-aligned in content area (Form Page template); bilingual fields side-by-side; footer inline with summary on the start side and actions on the end side |

### RTL Considerations

- [x] All layout uses logical properties (`ms-`, `me-`, `ps-`, `pe-`, `text-start`, `text-end`, `border-s`, `border-e`). No physical direction classes.
- [x] Bilingual fields: Arabic field `dir="rtl"`, English field `dir="ltr"` (handled by `BilingualNameFields` / `BilingualDescriptionFields` shared components).
- [x] Required marker (`*`) follows the label in reading direction (start side).
- [x] Directional icons (back arrow in Cancel, chevrons in combobox dropdowns) use `rtl:rotate-180`.
- [x] User chips in manual assignment blocks wrap in reading order; remove (`×`) icon sits on the end edge of each chip.
- [x] Due date Hijri display aligns `text-start`; numeric date values remain LTR even in RTL.
- [x] Footer action order: in RTL the primary action (Launch) is on the left end, secondary (Save Draft) center, Cancel on the right start — using `flex-row-reverse` is not needed if logical `gap` + `flex` with `ms-auto` on the action group is used.

### Accessibility

- [x] All form `Field`s have associated `FieldLabel` and the Arabic-required indicator is conveyed via `aria-required="true"` on the AR inputs.
- [x] Required classification gating (Confidential disabled) uses `aria-disabled="true"` + a `Tooltip` with `aria-describedby` linking to the reason.
- [x] Comboboxes (blueprint, user search) follow the combobox pattern: `role="combobox"`, `aria-expanded`, `aria-controls` pointing to the listbox, `aria-activedescendant` for the highlighted option, keyboard arrow navigation, `Enter` to select, `Escape` to close.
- [x] Manual assignment chip removal buttons have `aria-label` ("Remove {name}") in the active locale; touch target ≥ 44px.
- [x] Form validation errors are linked to fields via `aria-describedby`; the launch-blocked summary message lives in an `aria-live="polite"` region so screen readers announce it.
- [x] All interactive elements show visible focus rings (`focus-visible:ring-2`).
- [x] Touch targets ≥ 44px on mobile for all buttons and combobox options.
- [x] `prefers-reduced-motion` disables skeleton `animate-pulse` and any dialog slide animations (`motion-reduce:animate-none`).
- [x] The hijri due-date is conveyed alongside the Gregorian value (both visible to the user; the SR-only summary can read "due date {gregorian} ({hijri} Hijri)").
- [x] The delete-draft confirmation dialog traps focus, returns focus to the trigger, and closes on `Escape` (shadcn `AlertDialog` handles this).

### Animation

- [x] Skeleton: `animate-pulse`; disabled under `prefers-reduced-motion`.
- [x] Dialog open/close: shadcn defaults (`animate-in fade-in` overlay + `animate-in zoom-in-95` content).
- [x] Toast: sonner default slide-in.
- [x] Combobox dropdown: shadcn `Command` default fade/slide; no custom transform.
- [x] No hover lift on form sections (forms are not card grids per `02-glassmorphism.md` deferred glass rules). No glass effects.

---

## Non-Functional Requirements

### Performance

- [x] Combobox search debounced 300ms (both blueprint and user search); in-flight queries are cancelled by TanStack Query on key change.
- [x] Filter objects in query keys memoized via `useMemo`.
- [x] No heavy chart/canvas components — no `next/dynamic` needed for MVP.
- [x] The form store is non-persisted Zustand — no localStorage writes (auth rule: no localStorage beyond the established `useBrandColorStore`).

### Security

- [x] Backend ABAC is the source of truth for blueprint visibility (only active blueprints shown) and task creation permission (any authenticated `internal_user` / `tenant_admin` per backend open-question resolution).
- [x] Capability checks (`useCapability('task.classify.confidential')`, `useCapability('task.manage')`) hide/disable UI for UX only; server returns 403/422 regardless.
- [x] Delete-draft button hidden when the user is not the initiator and lacks `task.manage` (checked against `TaskDetailResource.initiator_id === currentUser.public_id`); server validates via `TaskNotDraftException`/403.
- [x] No PII (assignee email, mobile, employee ID) in URLs or console logs. The user combobox renders `name_ar`/`name_en` + optional department/position context only.
- [x] No `console.log` of form state in committed code.
- [x] No `dangerouslySetInnerHTML` — task description is plain textarea input.
- [x] `manual_assignments` payload uses public_ids (`blueprint_stage_id`, `blueprint_sub_stage_id`, `user_ids`) — never internal ids.

### Testing

> Reference: `docs/ai/testing-policy.md`

- [x] Component tests for `TaskCreationForm`: render (create mode), render (edit mode prefilled), launch success navigates to details, save-draft success navigates to details, 422 launch-blocked shows inline error and keeps form.
- [x] Component tests for `ManualAssignmentBlock`: renders only for `assignment_type === 'manual_at_launch'`, multi-select chips, required validation (zero users → launch blocked), sub-stage variant.
- [x] Component tests for `BlueprintCombobox`: debounce, only active blueprints, empty (no results) hint.
- [x] Interaction test: delete-draft dialog (open → confirm → success toast → navigate to `/tasks`); capability gating (`task.manage` shows delete button for non-initiator; hidden without).
- [x] Capability gating test: Confidential classification disabled without `task.classify.confidential` with tooltip text.
- [x] MSW handlers for: `POST /v1/tasks`, `PUT /v1/tasks/{task}`, `POST /v1/tasks/{task}/launch`, `DELETE /v1/tasks/{task}`, `GET /v1/tasks/priorities` (if not already mocked), `GET /v1/blueprints?is_active=true&search=...`, `GET /v1/blueprints/{publicId}` (if not already mocked), `GET /v1/iam/users?search=...&is_active=true` (already mocked from spec 004), and 422 error variants (`MissingManualAssignmentException`, `UnresolvableAssignmentException`, `BlueprintNotActiveException`, `TaskNotDraftException`).
- [x] Both locales tested (AR RTL + EN LTR) for the two-step form layout, bilingual fields, footer button order, and combobox dropdowns.
- [x] Tests use `renderWithProviders` wrapper with fresh `QueryClientProvider` per test.

---

## Out of Scope

- **Document attachments at task creation** (feature #66, backend 012 ⬜ Not Started) — no file upload UI. Per `AGENTS.md` critical rules: "No DMS UI". Deferred until backend 012 is stable.
- **External references at task creation** (feature #64, backend 014 ⬜ Not Started) — no external-reference input. Deferred (the board filter for external references is also deferred per spec 003).
- **Confidential participant management** (backend 017) — this spec only stores the `classification_level`; adding/removing named confidential participants is a future spec.
- **Task duplication** (feature #77, V2) — deferred.
- **Recurring tasks** (features #78–79, V2) — deferred.
- **Task-to-task linking** (feature #76, V2) — deferred.
- **Capacity warning / assignment recommendation for manual stages** (features #251, #253, V2) — deferred.
- **Saved form drafts / templates** — deferred to V2.
- **Stage forms / exit requirements** (V2) — deferred.
- **Inline create from the task board table** — the "Create Task" button navigates to `/tasks/new`; no modal-based inline creation in MVP.
- **Launch from a non-Stage-1 stage** — backend only validates Stage 1 at launch (Decision #18); this spec only surfaces Stage 1 manual assignment requirements.
- **Task edit after launch** — only draft tasks are editable; active/suspended/completed/cancelled tasks are managed via the task details page (spec 004) actions.

---

## Resolved Questions

- [x] **Unsaved-changes guard** — **Controlled `AlertDialog` ("Discard changes?").** Matches the existing `ConfirmDeleteDialog` pattern in the app (consistent focus management, RTL-safe, no native browser dialog masking custom styling). The dialog only appears when the form is dirty (any field touched). `beforeunload` is not used.
- [x] **Launch as one click or two-step** — **Single click does POST + POST sequentially.** On the create/edit form the **Launch** button calls `useCreateTask()` (or `useUpdateTask()`) and on success immediately calls `useLaunchTask()` in a single `await` chain with a shared loading state. Save Draft is a separate button that only persists the draft. The two-step "Save Draft then Launch from the details page" path also still works (spec 004 task details already has a Launch affordance for drafts), but the create-form's primary intent is one click.
- [x] **Manual assignments payload shape** — confirmed against `StoreTaskRequest`, `LaunchTaskRequest`, and `AssignmentResolutionService`: a **stage** entry is `{ blueprint_stage_id, user_ids[] }` (omit `blueprint_sub_stage_id`); a **sub-stage** entry is `{ blueprint_sub_stage_id, user_ids[] }` (omit `blueprint_stage_id`). The validation rules accept both id fields as optional strings; only `user_ids` is required. The backend `resolveManualUsers` looks up the entry by `blueprint_stage_id`, and `resolveManualUsersFromSubStage` by `blueprint_sub_stage_id`.
- [x] **OpenAPI schema `blueprint_id`/`priority_id` type mismatch** — confirmed. Backend validates `Rule::exists('blueprints', 'public_id')` (UUID string). The generated types now correctly use `string` for `blueprint_id`/`priority_id`, so the `StoreTaskBody` alias was not needed and was removed. `useCreateTask` directly uses `StoreTaskRequest` with no override.
- [x] **Blueprint list endpoint — search & stage embedding** — confirmed by reading `BlueprintController::index`: the list endpoint does NOT support a `search` query param (only `is_active`, `scope`, `category_id`, `per_page`), and the list `BlueprintResource` does NOT embed `stages[]` (only `stages_count` + `category`). **Decision:** the combobox uses `useBlueprintsInfinite({ is_active: true, per_page: 50 })` for options, applies a client-side `name_ar`/`name_en` filter over loaded pages via the `Command` input (debounced 300ms via TanStack Query + local state), and shows a "Load more" affordance when `has_more` is true. After selection, the form calls `useBlueprint(publicId)` (`GET /v1/blueprints/{publicId}`) to fetch the full stage + sub-stage structure — **a second fetch is required**. This was corrected in the acceptance criteria above.
- [x] **Edit-route deletion ownership** — confirmed by reading `TaskService::delete`: strictly initiator-only (`if ($task->initiator_user_id !== $user->id) abort(403, ...)`). `task.manage` allows **update** of others' drafts but NOT delete. **Decision:** the Delete Draft button is visible only when `TaskDetailResource.initiator_id === currentUser.public_id`. A tenant admin with `task.manage` who is not the initiator can edit but cannot delete; the Delete button is hidden for them.
- [x] **StoreTaskBody type alias** — removed because generated types correctly use `string` for `blueprint_id`/`priority_id`
- [x] **assignment_type comparison** — uses `'manual_at_launch'` (string name), not `'3'` (integer)
- [x] **Cancel button moved from footer to PageHeader** with dirty-check via `TaskCancelButton`/`CancelDiscardDialog`
- [x] **Delete Draft moved from footer to PageHeader** via `TaskEditActions`
- [x] **Edit page title shows `display_id`** via `EditPageTitle` client component reading `useTaskDisplayStore`
- [x] **`draft_manual_assignments` stored in backend JSON column**, returned in `TaskDetailResource`
- [x] **Drafts filter added to task board** (`status=draft`) with backend support

---

→ **Next:** Review this spec. Do not create `plan.md` until the draft is approved.