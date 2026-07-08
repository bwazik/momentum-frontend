# Spec: External References

> **Number:** 025
> **Date:** 2026-07-08
> **Status:** `completed`
> **Milestone:** F2 — Task board & task details
> **Depends on:** `001-core-shell`, `003-task-board`, `004-task-details`
> **Backend spec:** `../backend/specs/014-external-references/` — `Contract status: stable`
> **Contract status:** `stable`
> **Author:** OpenCode
> **Branch:** `feat/025-external-references`
> **Base branch:** `main`

---

## Problem

Government tasks in Gov TMS almost always originate from an external trigger — an incoming correspondence number (`وارد-2026-00412`), a ministerial decision, a contract, a vendor invoice, or an authority reference. Today the task detail page shows the lifecycle, documents, and comments, but it has no structured way to display or manage the external identifiers that formally link a task to the outside world.

Without this screen:

- **Task creators** cannot record the correspondence, contract, or decision number that triggered the task.
- **Task viewers** cannot see the formal external context of a task in one place.
- **Follow-up specialists** cannot filter the task board by a reference number to find all related work.
- **Search** cannot surface tasks by external reference from the global search bar or board filters.

The backend External References subsystem (spec 014) is complete and stable. It provides a tenant-managed catalog of external entities, full CRUD for task-level references, and search/board integration via an `external_reference` filter. This spec delivers the frontend UI that surfaces those capabilities.

---

## Goal

Add an **External References** card to the task detail sidebar and wire the `external_reference` filter into the task board. Users can view, add, edit, and remove external references on any visible task, select a normalized issuing entity from the tenant catalog, create entities on the fly when needed, manage the full entity catalog (CRUD + activate/deactivate), and find tasks by reference number from the board filter bar and global search.

The feature consumes the stable backend API:

- `GET /v1/tasks/{task}/external-references` — cursor-paginated list of references on a task.
- `POST /v1/tasks/{task}/external-references` — attach a reference.
- `PUT /v1/tasks/{task}/external-references/{reference}` — update a reference.
- `DELETE /v1/tasks/{task}/external-references/{reference}` — remove a reference.
- `GET /v1/tasks/external-entities` — full list of external entities.
- `POST /v1/tasks/external-entities` — create an entity.
- `PUT /v1/tasks/external-entities/{entity}` — update an entity.
- `POST /v1/tasks/external-entities/{entity}/deactivate` — deactivate an entity.
- `POST /v1/tasks/external-entities/{entity}/reactivate` — reactivate an entity.
- `GET /v1/follow-up/board?external_reference={number}` — board filter by reference.
- `GET /v1/search/tasks?external_reference={number}` — search tasks by reference.

---

## User Stories

### Task Creator / Manager

- As a **task creator**, I want to attach one or more external references to a task, so that the task is linked to the formal correspondence, contract, decision, or record that triggered it.
- As a **task creator**, I want to categorize each reference by type (correspondence, contract, ministerial decision, authority decision, meeting minute, external organization request, vendor reference, other), so that references are semantically meaningful.
- As a **task creator**, I want to select the issuing external entity from a normalized catalog, so that reference sources are consistent and searchable.
- As a **task creator**, I want to add optional notes to a reference, so that I can record context such as a date or sub-number.
- As a **task manager** or **initiator**, I want to edit or remove an incorrect reference from a task, so that the task remains accurately linked.

### Task Viewer

- As a **task viewer**, I want to see all external references attached to a task, so that I understand the task's external context without opening another system.
- As a **task viewer**, I want to see the reference type, number, issuing entity, and notes at a glance, so that I can verify the formal source quickly.

### Follow-Up Specialist

- As a **follow-up specialist**, I want to filter the task board by external reference number, so that I can see every task tied to a specific correspondence or contract.
- As a **follow-up specialist**, I want to enter a reference number in global search and see matching tasks, so that I can track all work related to a specific external record.

### Tenant Admin

- As a **tenant admin** with `task.manage_external_entities`, I want to view the catalog of external entities, so that I can see what reference sources are available.
- As a **tenant admin** with `task.manage_external_entities`, I want to create a new external entity with Arabic name, English name, and entity type, so that task creators can select normalized issuing entities.
- As a **tenant admin** with `task.manage_external_entities`, I want to edit an existing external entity, so that names or types can be corrected.
- As a **tenant admin** with `task.manage_external_entities`, I want to deactivate an obsolete external entity, so that it can no longer be selected for new references while keeping historical references intact.
- As a **tenant admin** with `task.manage_external_entities`, I want to reactivate a deactivated external entity, so that it becomes available for new references again.

### System

- As the **system**, I want external reference mutations to be gated by task visibility and the same initiator/`task.manage` rule used for task drafts, so that unauthorized users cannot modify references.
- As the **system**, I want mutations to invalidate the reference list, task detail, and board caches, so that the UI reflects the new state immediately.

---

## Acceptance Criteria

### Task Detail — External References Card

- [x] The External References card is rendered on the existing `/tasks/[publicId]` route, inside the task-detail sidebar, between the Details card and the Documents card.
- [x] The card fetches `GET /v1/tasks/{task}/external-references` using generated OpenAPI types (`TaskExternalReferenceResource`, cursor-paginated `data`, `next_cursor`, `has_more`).
- [x] Each reference displays: localized reference type label, reference number, issuing entity name (localized `name_ar`/`name_en`), optional notes, and relative creation timestamp.
- [x] References without an issuing entity still render cleanly (entity name omitted).
- [x] The card shows the first 3 references inline. If more exist, a "View all (N)" link opens a Dialog containing the full cursor-paginated list with a "Load more" button.
- [x] Users with permission (task initiator or `task.manage` capability) see an "Add Reference" button in the card header.
- [x] Each reference row shows Edit and Delete actions for authorized users.

### External Entity Catalog Management

This page mirrors the **Blueprint Catalog** pattern from spec 005 (`/blueprints/catalog`), but with a single entity type instead of three tabs.

- [x] A dedicated route `/admin/external-entities` renders a catalog page inside the authenticated dashboard shell.
- [x] The page uses the **List Page** template: `PageHeader` (title + "Create Entity" primary action) → data table → no pagination (full list expected < 200 rows).
- [x] The page fetches `GET /v1/tasks/external-entities` using `useExternalEntities()`. The list includes both active and inactive entities, ordered by `name_ar`.
- [x] The table uses `RtlTable` and the shared building blocks from `components/shared/catalog-table`: `ActionsDropdown`, `FormDialog`, `CatalogSkeleton`, `editAction`, `deactivateAction`, `reactivateAction`.
- [x] Table columns: name_ar (w-50), name_en (w-50), entity type label (w-32), status via shared `ActiveBadge` (w-20), actions (w-12).
- [x] Row actions (capability-gated by `task.manage_external_entities`, `Ellipsis` dropdown with `dir={locale === 'ar' ? 'rtl' : 'ltr'}` and `align="end"`):
  - **Edit** → opens `FormDialog` with bilingual name fields + entity type select.
  - **Deactivate** / **Reactivate** → calls `POST /v1/tasks/external-entities/{entity}/deactivate` or `/reactivate` directly (matching the catalog pattern; no extra confirmation dialog).
- [x] Users with `task.manage_external_entities` see a primary "Create Entity" button in the `PageHeader`. Clicking it triggers the same `FormDialog` in create mode.
- [x] The `FormDialog` uses `BilingualNameFields` shared component (`name_ar` required, `name_en` optional) and an `ExternalEntityTypeSelect` for entity type.
- [x] Submitting calls `POST` (create) or `PUT` (update). On success: toast, close dialog, invalidate `queryKeys.tasks.externalEntities()`.
- [x] Deactivated entities are visually distinct via `ActiveBadge` (`isActive={false}`) but remain visible in the catalog.
- [x] Inactive entities cannot be selected when adding/editing a task reference; the reference form entity select filters to active-only.
- [x] The page handles all 4 states: loading via `CatalogSkeleton`, empty via `EmptyState` with create CTA, error via `ErrorState` with retry, success via the full table.

### Inline Entity Creation (Reference Form)

- [x] The entity select inside the Add/Edit Reference dialog includes an "Add new entity" option (or an adjacent "+" button) when the desired entity is not found.
- [x] Selecting it opens a compact nested/secondary dialog to create an entity. It reuses the same bilingual name fields + entity type select used by the catalog `FormDialog`.
- [x] On successful creation: the new entity is added to the catalog cache, the select options refresh, and the new entity is auto-selected in the reference form.

### Add / Edit Reference

- [x] Clicking "Add Reference" or the Edit action opens a Dialog with a form containing:
  - Reference type `Select` (required) — maps to `ExternalReferenceType` integer values.
  - Reference number `Input` (required, max 100 chars).
  - Issuing entity `Select` / combobox (optional) — populated from `GET /v1/tasks/external-entities` active list.
  - Notes `Textarea` (optional, max 2000 chars).
- [x] The entity catalog is a full active list (expected < 200 rows). Use `useQuery` with a stable query key; no pagination.
- [x] Submitting the form calls `POST` (add) or `PUT` (edit). On success: toast notification, close dialog, invalidate reference list and task detail/timeline.
- [x] On 422 (inactive entity selected, validation error): show backend message inline in the dialog and keep the dialog open.
- [x] On 403: error toast; dialog stays open so the user can retry if appropriate.

### Delete Reference

- [x] Clicking Delete opens an `AlertDialog` with a destructive confirmation and the reference number.
- [x] On confirm, `DELETE /v1/tasks/{task}/external-references/{reference}` is called.
- [x] On success: invalidate reference list, show success toast.
- [x] On 403/404: error toast with backend message.

### Task Board — External Reference Filter

- [x] The task board filter bar includes an external reference input field (search by reference number).
- [x] The input is debounced by 300ms and maps to the `external_reference` query param on `GET /v1/follow-up/board`.
- [x] The filter value is stored in URL search params so the view is bookmarkable and back-button friendly.
- [x] The "Reset filters" button clears the external reference filter along with other filters.
- [x] When a reference filter is active, the board shows matching tasks and the filter input reflects the current value.

### Global Search (Search by Reference)

- [x] Global search accepts a reference number and calls `GET /v1/search/tasks?external_reference={number}`.
- [x] Search results show the matched task with the matching reference metadata (type + number) surfaced in the result row.
- [x] Empty results show the existing search empty state.

### States

- [x] **Loading**: a references-specific skeleton matching the card shape — 3 reference-row skeletons (type + number + entity lines) inside the External References card.
- [x] **Empty**: when the task has no references, the card shows an `EmptyState` with a link/contract icon, localized headline ("No external references"), and an "Add Reference" CTA for authorized users.
- [x] **Error (500/network)**: an inline `ErrorState` inside the External References card with a retry button that refetches the reference list; the rest of the task detail page remains usable.
- [x] **Error (403)**: if the user cannot view the task, the entire task detail page shows the existing no-permission state; references are not rendered separately.
- [x] **Success**: the full External References card renders with the reference list, add button, and per-row actions.

### Responsive Behavior

- [x] **Desktop (≥1024px)**: External References card sits in the sidebar (1/3 width) between Details and Documents; reference rows are horizontal with actions aligned to the end.
- [x] **Tablet (640–1023px)**: External References card stacks full-width below the main column; same internal layout as desktop.
- [x] **Mobile (<640px)**: External References card stacks full-width; reference rows remain horizontal but action buttons collapse into an overflow menu or shrink to icon-only; add/edit dialog is full-screen or bottom sheet.

---

## Technical Requirements

> Reference: `docs/ai/coding-standards.md`

### Data Fetching

- [x] `useTaskExternalReferences(taskPublicId, filters?)` uses `useInfiniteQuery`, `queryKeys.tasks.externalReferences(taskPublicId, filters)`, and `GET /v1/tasks/{task}/external-references`. `enabled: !!taskPublicId`. Cursor pagination (`next_cursor`, `has_more`) with manual "Load more" button inside the "View all" dialog.
- [x] `useExternalEntities()` uses `useQuery`, `queryKeys.tasks.externalEntities()`, and `GET /v1/tasks/external-entities`. Full list including inactive, no pagination.
- [x] `useActiveExternalEntities()` uses `useQuery` / `useMemo` over `useExternalEntities()` to filter `is_active` for the reference form select; keeps a single cache source.
- [x] `useCreateTaskExternalReference(taskPublicId)` uses `useMutation` and `POST /v1/tasks/{task}/external-references`.
- [x] `useUpdateTaskExternalReference(taskPublicId)` uses `useMutation` and `PUT /v1/tasks/{task}/external-references/{reference}`.
- [x] `useDeleteTaskExternalReference(taskPublicId)` uses `useMutation` and `DELETE /v1/tasks/{task}/external-references/{reference}`.
- [x] `useCreateExternalEntity()` uses `useMutation` and `POST /v1/tasks/external-entities`.
- [x] `useUpdateExternalEntity()` uses `useMutation` and `PUT /v1/tasks/external-entities/{entity}`.
- [x] `useDeactivateExternalEntity()` uses `useMutation` and `POST /v1/tasks/external-entities/{entity}/deactivate`.
- [x] `useReactivateExternalEntity()` uses `useMutation` and `POST /v1/tasks/external-entities/{entity}/reactivate`.
- [x] `useTaskBoardInfinite(filters)` is extended to accept `external_reference` in the filter object and pass it to `GET /v1/follow-up/board`.
- [x] Global search already supports `external_reference`; verify the search hook accepts it and surfaces matched reference metadata.
- [x] All response/request types come from `lib/generated/api-types.ts`; no hand-written API DTOs.
- [x] No `useEffect` + `fetch` for API data; all API calls go through TanStack Query hooks.

### Query Key Structure

> Extend `lib/api/query-keys.ts`:

```ts
tasks: {
  // existing keys...
  externalEntities: () =>
    [...queryKeys.tasks.all, 'external-entities'] as const,
  externalReferences: (taskPublicId: string, filters?: { per_page?: number }) =>
    [...queryKeys.tasks.detail(taskPublicId), 'external-references', filters] as const,
},
```

- [x] External reference keys are nested under `tasks.detail(taskPublicId)` so that invalidating the task detail also enables granular invalidation of references.
- [x] No hardcoded query key strings in any component.

### State Management

- [x] **TanStack Query**: all API-derived state (reference list, entity catalog).
- [x] **URL state**: external reference filter on the board lives in URL search params (shareable, bookmarkable). No additional URL params for the detail page.
- [x] **Zustand**: none required. No API data in Zustand.
- [x] **Local component state**:
  - Reference add/edit dialog open/close and active reference public ID (for edit mode).
  - Reference delete confirmation dialog open/close.
  - Reference "View all" dialog open/close.
  - Entity manager: `dialogOpen`, `editItem`, form state (`name_ar`, `name_en`, `entity_type`), form errors.
  - Entity manager accepts `openCreate` / `onOpenCreateChange` props from the page `PageHeader` (matching blueprint catalog managers); a `useEffect` watches `openCreate` to open the create dialog.
  - Inline entity creator open/close.
  - Form input values controlled via shadcn `Field`.

### Mutations

- [x] `useCreateTaskExternalReference()` invalidates `queryKeys.tasks.externalReferences(taskPublicId)` and `queryKeys.tasks.timeline(taskPublicId)` on success. Toast on success.
- [x] `useUpdateTaskExternalReference()` invalidates the same keys. Toast on success.
- [x] `useDeleteTaskExternalReference()` invalidates the same keys. Toast on success.
- [x] `useCreateExternalEntity()`, `useUpdateExternalEntity()`, `useDeactivateExternalEntity()`, and `useReactivateExternalEntity()` invalidate `queryKeys.tasks.externalEntities()` on success. Toast on success.
- [x] All mutations use `toast.success()` / `toast.error()` from sonner for feedback per `coding-standards.md`.
- [x] No optimistic updates in MVP — the server response determines the new state and the list refetches.

### Error Handling

- [x] 401 → redirect to login (handled globally by query client `QueryCache.onError`).
- [x] 403 → the existing task-detail `EmptyState` with lock icon is shown; task visibility is the authorization gate for references.
- [x] 404 → the existing task-detail "task not found" `EmptyState` is shown.
- [x] 422 (inactive entity, validation error) → inline error in the add/edit dialog; dialog stays open.
- [x] 500 / network error → inline `ErrorState` inside the External References card with retry; no stack traces or internal IDs exposed.
- [x] Mutation errors show `toast.error()` with the backend message (localized via `X-Locale` header).

---

## UI Requirements

> Reference: `docs/design-system/01-tokens.md`, `02-glassmorphism.md`, `03-components.md`, `04-layout-patterns.md`, `05-accessibility.md`, `06-anti-patterns.md`

### Component Breakdown

| Component | Type | Source | Notes |
|-----------|------|--------|-------|
| `TaskExternalReferencesCard` | Client | Domain | Main references card rendered inside `TaskDetail` sidebar; owns queries, add button, inline list, and "View all" dialog |
| `TaskExternalReferencesList` | Client | Domain | Scrollable/infinite list of reference rows with "Load more" |
| `TaskExternalReferenceItem` | Client | Domain | Single reference row: type badge, number, entity, notes, actions |
| `TaskExternalReferenceDialog` | Client | Domain | Dialog with form for add/edit (type, number, entity select, notes) |
| `TaskExternalReferenceDeleteDialog` | Client | Domain | `AlertDialog` wrapper for destructive delete confirmation |
| `TaskExternalReferencesSkeleton` | Client | Domain | Skeleton rows matching reference shape |
| `ExternalEntitySelect` | Client | Domain | Select populated from active entity catalog; supports nullable option |
| `ReferenceTypeSelect` | Client | Domain | Select mapped to `ExternalReferenceType` enum values |
| `ExternalEntitiesPage` | Server | Page | `app/(dashboard)/tasks/external-entities/page.tsx` or `app/(dashboard)/admin/external-entities/page.tsx`; renders `PageHeader` + `ExternalEntityManager` |
| `ExternalEntityManager` | Client | Domain | Fetches entity catalog, owns table/form state and dialog open/close; handles all 4 states. Modeled after `CategoryManager` / `StageTypeManager` from `components/domain/blueprints/` |
| `ExternalEntityTypeSelect` | Client | Domain | Select mapped to `ExternalEntityType` enum values |
| `InlineExternalEntityCreator` | Client | Domain | Compact create-entity dialog invoked from the reference form entity select; reuses the same form fields as the catalog |
| `TaskBoardFilters` | Client | Domain | Extended to include external reference input in the filter bar |
| `ActionsDropdown`, `FormDialog`, `CatalogSkeleton`, `editAction`, `deactivateAction`, `reactivateAction`, `RtlTable` | Client | Shared | Reused from `components/shared/catalog-table` (established by spec 005 blueprint catalog) |
| `BilingualNameFields`, `ActiveBadge`, `EmptyState`, `ErrorState`, `PageHeader` | Client | Shared | Reused from `components/shared/` |
| `Button`, `Card`, `Dialog`, `Skeleton`, `Tooltip`, `Badge`, `Select`, `Input`, `Textarea`, `Table` | Client | shadcn | Existing primitives. Run `npx shadcn@latest docs <component>` before implementation if adding missing components |

### States

| State | Component | Pattern |
|-------|-----------|---------|
| Loading | `TaskExternalReferencesSkeleton` | 3 reference-row skeletons (type badge + number + entity lines) inside the External References card |
| Empty | `EmptyState` | Link/contract icon, "No external references" headline, add CTA for authorized users |
| Error | `ErrorState` | Safe message + retry button inside the External References card |
| Success | `TaskExternalReferencesCard` | Full card: reference list + add button + per-row actions |
| Loading (catalog) | `CatalogSkeleton` | Shared skeleton matching the entity table column widths (name w-50, name_en w-50, type w-32, status w-20, actions w-12) |
| Empty (catalog) | `EmptyState` | Building icon, "No external entities" headline, create CTA for authorized users |
| Error (catalog) | `ErrorState` | Safe message + retry button on the catalog page |
| Success (catalog) | `ExternalEntityManager` | Full `RtlTable` with create button and per-row `ActionsDropdown` |

### Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| Mobile (<640px) | External References card stacks full-width; reference rows stay horizontal but action buttons collapse to overflow menu or icon-only; add/edit dialog is full-screen or bottom sheet. Entity catalog table collapses to a card list. |
| Tablet (640–1023px) | External References card stacks full-width below main column; same internal layout as desktop. Entity catalog renders as a table. |
| Desktop (≥1024px) | External References card is in sidebar (1/3 width) between Details and Documents; horizontal reference rows with action buttons visible. Entity catalog renders as a dense `RtlTable`. |

### RTL Considerations

- [x] All layout uses logical properties (`ms-`, `me-`, `ps-`, `pe-`, `text-start`, `text-end`). No physical direction classes (`ml-`, `mr-`, `text-left`, etc.).
- [x] Reference row content aligns to start; actions align to end.
- [x] Directional icons (`ChevronRight`, `ArrowLeft`) use `rtl:rotate-180`.
- [x] Reference number and entity text align `text-start`.
- [x] Dialog content aligns `text-start`.
- [x] Select options render in the active locale with correct `dir` via `RtlSelect`.
- [x] Entity catalog table uses `RtlTable` with `text-start` alignment for name/type columns and `text-end` for actions column.
- [x] Active/inactive status badges use color + text label (never color-only).

### Accessibility

- [x] All interactive elements (Add Reference, Edit, Delete, Load more, entity select) have visible focus rings.
- [x] Icon-only buttons (Edit, Delete) have `aria-label` in the active locale describing the action and target reference number.
- [x] The reference list has an `aria-label` describing it as "External references" / "الإشارات الخارجية".
- [x] Reference type badge uses `role="status"` or `aria-label` to convey semantic meaning.
- [x] Add/edit dialog uses `Dialog` with focus trap and Escape-to-close.
- [x] Delete confirmation uses `AlertDialog` with explicit destructive button label.
- [x] Form fields have associated `FieldLabel` and `FieldError`; required fields marked `aria-required="true"`.
- [x] Error messages in the dialog are associated with fields via `aria-describedby`.
- [x] Touch targets meet minimum sizes on action buttons.
- [x] Catalog table uses `RtlTable` and column headers use `scope="col"`.
- [x] `ActionsDropdown` trigger has `aria-label={t('actions')}` (inherited from `catalog-table`).
- [x] Dropdown menu items include icons and labels for Edit, Deactivate, Reactivate.
- [x] `prefers-reduced-motion` disables skeleton pulse (inherited from shadcn Skeleton).

### Animation

- [x] Skeleton: `animate-pulse` on reference-row skeletons; disabled under `prefers-reduced-motion`.
- [x] Card hover: subtle background tint on reference rows (`transition-colors duration-200`), no lift/transform (dense list pattern).
- [x] Button press: `active:scale-[0.98] transition-transform` on submit buttons.
- [x] Dialog open/close: shadcn default `animate-in fade-in` overlay + `animate-in zoom-in-95` content.
- [x] Toast: sonner default slide-in animation.
- [x] No glass effects on the External References card (dense list; glass deferred per `02-glassmorphism.md`).

---

## Non-Functional Requirements

### Performance

- [x] Cursor pagination for reference lists; do not load the entire reference history at once.
- [x] Memoize the flattened reference list via `useMemo` to avoid unnecessary re-renders.
- [x] Entity catalog is cached with a 5-minute stale time to avoid refetching the small static list.
- [x] Board filter input debounced by 300ms.
- [x] No heavy third-party libraries; built with existing project primitives and shadcn.

### Security

- [x] Backend ABAC (`TaskVisibilityScope`) is the source of truth for reference visibility — client never reconstructs visibility rules.
- [x] Capability checks (`useCapability('task.manage')` for references, `useCapability('task.manage_external_entities')` for entity catalog) hide/disable actions for UX only; server returns 403 regardless.
- [x] No PII in URLs or console logs. Reference numbers and entity names are rendered from API only.
- [x] No `dangerouslySetInnerHTML` — reference notes are plain text rendered through React escaping.
- [x] No `console.log` of reference data in committed code.

### Testing

> Reference: `docs/ai/testing-policy.md`

- [x] Component test for `TaskExternalReferencesCard`: loading skeleton, empty state, success with references, error state with retry.
- [x] Component test for `TaskExternalReferenceItem`: renders type, number, entity, notes; hides edit/delete without permission.
- [x] Interaction test: open add dialog → fill form → submit → MSW returns created reference → list refreshes → dialog closes.
- [x] Interaction test: click Edit → change number → submit → list refreshes.
- [x] Interaction test: click Delete → confirm → MSW returns 204 → list refreshes.
- [x] Interaction test: 422 (inactive entity) → error shown in dialog, dialog stays open.
- [x] Board filter test: type reference number → URL param updates → MSW returns filtered board.
- [x] Search test: enter reference number in global search → MSW returns matching tasks with reference metadata.
- [x] Component test for `ExternalEntityManager`: loading `CatalogSkeleton`, empty state, success with active/inactive entities, error state with retry.
- [x] Interaction test: create entity → fill bilingual name + type → submit → `FormDialog` closes → catalog refreshes.
- [x] Interaction test: edit entity → change name → submit → row updates.
- [x] Interaction test: click Deactivate row action → entity shows inactive state via `ActiveBadge`; reactivate reverses it.
- [x] Inline entity creation test: open reference form → click “Add new entity” → create entity → new entity appears selected.
- [x] Both locales tested (AR RTL + EN LTR) for reference row layout, entity catalog layout, action alignment, and dialog text alignment.
- [x] MSW handlers for `GET /tasks/{task}/external-references`, `POST /tasks/{task}/external-references`, `PUT /tasks/{task}/external-references/{reference}`, `DELETE /tasks/{task}/external-references/{reference}`, `GET /tasks/external-entities`, `POST /tasks/external-entities`, `PUT /tasks/external-entities/{entity}`, `POST /tasks/external-entities/{entity}/deactivate`, `POST /tasks/external-entities/{entity}/reactivate`, and board/search with `external_reference`.
- [x] Tests use `renderWithProviders` wrapper with fresh `QueryClientProvider` per test.

---

## Out of Scope

- **Reference number format validation by type** — backend enforces max length; type-specific regex patterns are V2.
- **Cross-reference summary views** showing all tasks grouped under a single reference number — V2.
- **Reference-level attachments or document uploads** — documents attach to tasks via spec 024, not to references.
- **Bulk add/edit/delete of references** — one reference at a time in MVP.
- **Inline editing** in the card — all edits happen in a dialog.
- **Real-time updates** — no websocket/SSE; data is fetched on mount and invalidated after mutations.
- **Standalone task references page or route** — per-task reference lists live only inside task details in MVP. The external entity catalog page is in scope.
- **Advanced search features** such as partial/fuzzy reference number matching — exact match only, per backend spec 014.

---

## Open Questions — All Resolved

- [x] **OpenAPI path param types for external entities and references show `integer` instead of UUID string.** — **Resolved.** Path params treated as `string` in implementation. `apiClient` paths are string templates; no typegen patch needed.
- [x] **Reference type and entity type enum labels** — **Resolved.** Backend returns lowercase snake-case strings (`correspondence`, `governmentministry`). Frontend stores and compares these strings directly. Label maps (`EXTERNAL_REFERENCE_TYPE_KEYS`, `EXTERNAL_ENTITY_TYPE_KEYS`) keyed by API string value. Request bodies map to integer codes via `EXTERNAL_REFERENCE_TYPE_MAP` / `EXTERNAL_ENTITY_TYPE_MAP`.
- [x] **Entity catalog route location** — **Resolved.** `/admin/external-entities`. Sidebar link under admin group, gated by `task.manage_external_entities`.
- [x] **Deactivate/reactivate confirmation** — **Resolved.** No extra confirmation dialog. Follows blueprint catalog pattern.
- [x] **Board filter placement** — **Resolved.** Compact external-reference input in the main filter bar (next to search), debounced 300ms, URL-driven. Shared between task board and follow-up pages via `BoardFilters`.
- [x] **Global search result reference metadata display** — **Resolved.** Search passes input as both `q` and `external_reference` in a single `/v1/search` call. Matched reference numbers rendered inline in result rows.
- [x] **Reference card order in sidebar** — **Resolved.** Between `DetailsCard` and `TaskDocumentsCard`.

---

→ **Next:** Review this spec. Do not create `plan.md` until the draft is approved.
