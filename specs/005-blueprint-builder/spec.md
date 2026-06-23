# Spec: Blueprint Builder

> **Number:** 005
> **Date:** 2026-06-20
> **Status:** `completed`
> **Milestone:** F3 — Blueprint builder
> **Depends on:** `001-core-shell`
> **Backend spec:** `../backend/specs/004-blueprint-engine/` — `Contract status: stable`
> **Contract status:** `stable`
> **Author:** OpenCode
> **Branch:** `feat/005-blueprint-builder`
> **Base branch:** `main`

---

## Problem

The Blueprint is the platform's central concept — a reusable, formal definition of how a type of work flows through an organization (features #19–#47 in `_blueprints/02_Feature_Inventory.md`). The backend Blueprint Engine (spec 004) is complete and stable: it exposes full CRUD for blueprints, stages, sub-stages, transitions, blueprint categories, stage types, and SLA policies, with blueprint locking the moment the first task is launched. But there is no UI to use any of it.

Today a tenant admin who needs to design a workflow has nowhere to go. They cannot browse existing blueprints, cannot create a new one, cannot add or order stages, cannot attach SLA policies or assignment rules, cannot define which stages advance where or return to where, and cannot activate a blueprint so task creators can launch work from it. The entire backend capability is invisible.

Meanwhile, downstream screens already depend on blueprints: the task board filters by blueprint, task details show the blueprint name and use `GET /v1/blueprints/{blueprint}/transitions` to filter return targets (established in spec 004-task-details). Without a builder, the only way to create blueprints is via API — which is not an option for government administrators.

Government workflows also demand governance: a blueprint must be editable while it is a draft, then locked (read-only) the moment a task is launched under it, so a task's rules can never be changed underneath it mid-lifecycle. The UI must make this lock state obvious and must block editing of locked blueprints, deferring changes to the duplicate-and-edit path (MVP) or versioning (V2).

---

## Goal

Deliver the full Blueprint management UI inside the authenticated dashboard shell, across three surfaces:

1. **Blueprint Library** — `/blueprints`: a filterable, cursor-paginated list of all blueprints with create, duplicate, activate/deactivate, and open-builder actions. This is the entry point for administrators and the browse surface for task creators selecting a blueprint (feature #27).
2. **Blueprint Builder** — `/blueprints/[publicId]`: a split-view visual editor matching `_blueprints/ui-concepts/04-blueprint-builder.html` — a stage canvas (left) and a stage properties panel (right), with a top bar carrying breadcrumb, lock/status badge, and save/activate actions. This is where an admin assembles the workflow: stages, sub-stages, assignment rules, SLA policies, escalation, completion rules, and advance/return transitions (features #19–#26, #33–#47).
3. **Blueprint Catalog** — `/blueprints/catalog`: admin management for the shared reference data the builder depends on — blueprint categories, stage types, and SLA policies (features #20, #35, #42–#43, and the category/stage-type/SLA CRUD from backend spec 004).

All data is consumed from the stable backend 004 contract via generated OpenAPI types. Route params use `public_id`. Editing is gated by `blueprint.manage` (and `blueprint.create.organization` / `blueprint.create.department` for creation); locked blueprints are read-only in the UI with a clear lock indicator and the server enforcing 422 regardless.

**Layout reference:** `_blueprints/ui-concepts/04-blueprint-builder.html` — split view: left canvas with stage cards in sequence and flow arrows, right properties panel with the selected stage's editable fields, top bar with back arrow + breadcrumb + status + Save. The concept's layout and visual language are the reference; the canvas is implemented as an editable vertical stage list with flow indicators (a full interactive graph preview is V2 feature #31, out of scope). Concept details not backed by the stable 004 contract (exit-requirement checkboxes, active-task count, version number) are explicitly excluded — see Out of Scope and Open Questions.

---

## User Stories

### Tenant Admin (Blueprint Author)

- As a **tenant admin** with `blueprint.manage`, I want to browse the blueprint library filtered by category, scope, and active status, so that I can find existing workflows before creating a new one.
- As a **tenant admin** with `blueprint.create.organization` or `blueprint.create.department`, I want to create a new blueprint with a name, category, scope, and description, so that I can start defining a reusable workflow template.
- As a **tenant admin** with `blueprint.manage`, I want to open a blueprint in a visual builder and see all its stages in sequence, so that I understand and edit the workflow at a glance.
- As a **tenant admin** with `blueprint.manage`, I want to add, edit, and remove stages in a draft blueprint, so that I can assemble the lifecycle phases in the right order.
- As a **tenant admin** with `blueprint.manage`, I want to configure a stage's type, assignment method, SLA policy, escalation target, cardinality, and completion rule in a properties panel, so that the stage's accountability and deadlines are defined.
- As a **tenant admin** with `blueprint.manage`, I want to add, edit, and remove sub-stages within a stage, so that internal steps are visible and tracked.
- As a **tenant admin** with `blueprint.manage`, I want to define advance and return transitions for a stage, so that the workflow knows its forward and backward paths.
- As a **tenant admin** with `blueprint.manage`, I want to reorder stages in a draft blueprint, so that I can correct the workflow sequence before activation.
- As a **tenant admin** with `blueprint.manage`, I want to activate a blueprint that has at least one stage, so that task creators can launch work from it.
- As a **tenant admin** with `blueprint.manage`, I want to deactivate a blueprint, so that no new tasks launch from it while in-flight tasks continue unaffected.
- As a **tenant admin** with `blueprint.manage`, I want to duplicate a blueprint, so that I can create a variant without rebuilding from scratch — especially when the original is locked.
- As a **tenant admin** with `blueprint.manage`, I want to manage blueprint categories, stage types, and SLA policies in a catalog surface, so that the builder has the reference data it needs.

### Authorized User / Task Creator

- As an **authorized user** with `blueprint.view_library`, I want to browse active blueprints, so that I can see which workflows exist (and, in a future task-creation spec, select one to launch from).
- As an **authorized user** with `blueprint.view_library`, I want to open a blueprint and view its full structure read-only, so that I understand a workflow before launching a task from it.

### System

- As the **system**, I want the builder to enforce ABAC on every fetch and mutation, so that only users with `blueprint.view_library` / `blueprint.manage` / `blueprint.create.*` can view or edit blueprints.
- As the **system**, I want all editing disabled for locked blueprints, so that the UI never presents an action the server will reject with 422 — the lock indicator makes the read-only state obvious, and the duplicate path is offered for changes.
- As the **system**, I want mutation success to invalidate the blueprint detail and library caches, so that the canvas and list reflect the new state immediately.
- As the **system**, I want route params to use `public_id` only, so that internal ids are never exposed in URLs.

---

## Acceptance Criteria

### Route and Page Structure

- [x] Route `/blueprints` renders the Blueprint Library inside the authenticated dashboard shell.
- [x] Route `/blueprints/[publicId]` renders the Blueprint Builder inside the authenticated dashboard shell. The route param `publicId` is the blueprint `public_id` (never internal `id`), per `glossary.md` URL rules.
- [x] Route `/blueprints/catalog` renders the Blueprint Catalog (reference-data management) inside the authenticated dashboard shell. The static `catalog` segment takes precedence over the dynamic `[publicId]` segment in the App Router.
- [x] All three routes are added to the sidebar navigation. The sidebar uses `VersionSwitcher` in the header (app name + `1.0.0-beta`), `SidebarGroupLabel` grouping (Main, Blueprints, Workflow, Administration), `NavMain` for the Blueprints group (two flat items: Blueprints + Catalog with `blueprint.manage` gate — no submenu, no collapsible), `NavUser` in footer, and `SidebarRail`. i18n keys: `nav.label_main`, `nav.label_blueprints`, `nav.label_workflow`, `nav.label_admin`, `nav.blueprint_catalog`.
- [x] All response types come from `lib/generated/api-types.ts`; no hand-written API DTOs.
- [x] A 404 on the builder route (blueprint not found) renders a "blueprint not found" empty state with a link back to `/blueprints`.

### Blueprint Library (`/blueprints`)

- [x] The page uses the **List Page** template from `docs/design-system/04-layout-patterns.md`: `PageHeader` (title + "New Blueprint" primary action) → `FilterBar` → data list → "Load More" button (manual cursor pagination, no infinite scroll on the table).
- [x] The list fetches `GET /v1/blueprints` (cursor-paginated `BlueprintResource[]`) via `useBlueprintsInfinite(filters)`; filters are URL search params (shareable/bookmarkable): `search` (name, 300ms debounce), `category_id` (Select from `useBlueprintCategories()`), `scope` (Select: organization/department), `is_active` (ToggleGroup: active/inactive/all). A "Reset" button clears all filters.
- [x] The list renders as a responsive data table on desktop (5-column `Table` with columns: Name w-50 (localized `name_ar`/`name_en` + category + lock badge), Scope badge w-32, Status `ActiveBadge` w-28, Stages count w-20 (uses `getStagesCount(bp)` from `blueprint-utils.ts` which falls back from embedded `stages` to `stages_count`), Actions `Ellipsis` dropdown w-12) and as a card list on mobile, matching the spec 003 board responsive pattern. Status column header uses `t('status')`. Status uses the shared `ActiveBadge` component (`@/components/shared/active-badge`).
- [x] The **Lock indicator** shows a lock icon + "Locked" tooltip when `is_locked === true`; locked blueprints show a read-only badge and the row actions disable edit/activate/duplicate-edit paths (deactivate remains available since the backend allows it on locked blueprints).
- [x] **"New Blueprint"** primary action is visible only when the user has `blueprint.create.organization` or `blueprint.create.department` (checked via `useCapability`). Clicking opens a `Dialog` with the create form: `name_ar` (required), `name_en` (optional), `category_id` (required Select), `scope` (required Select: Organization/Department with scope labels from `blueprints.badges` i18n keys `scope_organization`/`scope_department`), `department_id` (required Select of departments when `scope = department`, hidden otherwise), `description_ar` / `description_en` (optional Textarea). Uses `BilingualNameFields` and `BilingualDescriptionFields` shared components. On submit, `POST /v1/blueprints` creates the draft and the user is navigated to `/blueprints/[publicId]` to build it out.
- [x] **Row actions** (capability-gated by `blueprint.manage`, in `DropdownMenu` with `dir={locale === 'ar' ? 'rtl' : 'ltr'}` on root and `align="end"` on content): **Open** (always available for `blueprint.view_library`+) → navigates to builder; **Duplicate** → `POST /v1/blueprints/{blueprint}/duplicate` (confirm dialog, on success toast + invalidate list); **Activate** / **Deactivate** toggle → `POST .../activate` or `.../deactivate` (activate disabled when `is_locked = false` but zero stages, per backend rule; show tooltip explaining "Add at least one stage first"); **Delete** → `DELETE /v1/blueprints/{blueprint}` (confirm dialog via `ConfirmDeleteDialog`, on success toast + invalidate list). Uses `Ellipsis` icon for trigger, `ExternalLink`/`Copy`/`CheckCircle`/`XCircle`/`Trash2` icons for menu items.
- [x] All 4 states: loading (skeleton rows matching column widths), empty (no blueprints → `EmptyState` with "Create your first blueprint" CTA), error (retry button), success (populated list).
- [x] "Load More" button appends the next cursor page; disabled while fetching next page; hidden when `has_more = false`.

### Blueprint Builder (`/blueprints/[publicId]`)

- [x] The page uses the **Blueprint Builder (Split View)** layout from `docs/design-system/04-layout-patterns.md` and `_blueprints/ui-concepts/04-blueprint-builder.html`: a top bar (breadcrumb + lock/status badge + actions) over a two-pane editor — **Stage Canvas** (left, flexible) and **Stage Properties Panel** (right, fixed width). No tabs.
- [x] The page fetches `GET /v1/blueprints/{publicId}` (returns `BlueprintResource` with embedded `stages` (each with `sub_stages`) and `transitions`) via `useBlueprint(publicId)`. This single query is the source of truth for the whole canvas.
- [x] **Top bar**: back arrow (link to `/blueprints`, `rtl:rotate-180`) + breadcrumb "Blueprints / [localized blueprint name]"; lock/status badge (Draft / Active / Inactive + Locked indicator); "Save" button (saves blueprint metadata — see below); "Activate" or "Deactivate" action (capability-gated, status-aware); a non-functional "Preview Flow" affordance is omitted in MVP (V2 feature #31 — see Out of Scope).
- [x] **Stage Canvas** (left pane): a header showing the blueprint title (localized), description (localized), and badges for scope (Organization-wide / Department: [name]) and category. Below, a dashed-border canvas area containing the **vertical stage list** in `sequence_order`: each stage is a fixed-width card showing sequence badge ("Stage N"), localized stage name, type + SLA summary ("Type: Review · SLA: 3 days"), assignee summary, a sub-stage count badge when sub-stages exist ("Sub-stages: 2"), and a return-path badge when return transitions exist from that stage ("Return path → Stage 2"). Flow chevrons/arrows render between consecutive stages (advance direction in reading order); the final stage shows a completion checkmark node. An "**Add Stage**" button sits at the end of the list.
- [x] **Selecting a stage** clicks its card → it becomes the selected stage (focus ring + accent border, matching the concept's `ring-2 ring-blue-200` for the selected node) and its fields load into the Properties Panel. Only one stage is selected at a time.
- [x] **Add Stage** opens the stage form in the Properties Panel for a new stage: `name_ar` (required), `name_en` (optional), `stage_type_id` (Select from `useBlueprintStageTypes()`), `assignment_type` (Select: Specific Position / Department Head / Manual at Launch), conditional assignee fields (position/department Select based on assignment_type), `sla_policy_id` (Select from `useBlueprintSlaPolicies()`, with a "Manage SLA policies" link → `/blueprints/catalog`), `assignment_cardinality` (Single/Multiple), `completion_rule` (Any assignee / All assignees / Lead assignee), `escalation_position_id` (Select of positions, optional). On "Save Stage", `POST /v1/blueprints/{blueprint}/stages` creates it; the canvas updates (invalidate `useBlueprint(publicId)`) and the new stage is selected.
- [x] **Edit Stage**: selecting an existing stage loads its fields into the Properties Panel (local form state, hydrated from the query data). "Save Stage" sends `PUT /v1/blueprints/{blueprint}/stages/{stage}`. A "Delete Stage" action (with `AlertDialog` confirmation) sends `DELETE` and removes it. Both are disabled when `is_locked = true`.
- [x] **Reorder stages**: each stage card has up/down controls (or a drag handle in a future enhancement) that call `POST /v1/blueprints/{blueprint}/stages/reorder` with the new `{public_id, sequence_order}` pairs. Disabled when locked. (Drag-and-drop is V2 feature #57; MVP uses up/down controls — see Open Questions.)
- [x] **Stage Properties Panel** (right pane) with three visual sections separated by `Separator`:
  - **StageForm** (flat form, no section headings): `name_en`, `name_ar` (bilingual inputs, Arabic required); stage type Select; assignment method Select with conditional position/department Select(s) based on assignment_type; SLA policy Select (with "Manage" link to catalog + read-only SLA warning threshold from the policy); cardinality Select; completion rule Select; escalation position Select (optional). Save Stage button.
  - **Transitions** (via `TransitionEditor`): **Advance Transition** multi-select of later stages (creates `transition_type` = `'advance'` records); **Return Transition** multi-select of earlier stages with `return_reason_required` (creates `transition_type` = `'return'` records). Removing a target deletes the corresponding transition. The available targets are derived from the blueprint's stages (to_stage must have higher sequence_order for advance, lower for return). Disabled when locked.
  - **Sub-stages** (via `SubStageList`): an ordered list of the stage's sub-stages (name, SLA, required badge) with edit/delete/reorder actions and an "Add Sub-stage" button. Add/edit opens a `SubStageForm` dialog (name AR/EN, `is_required` toggle) saved via `POST/PUT .../sub-stages`; reorder via up/down (`.../sub-stages/reorder`); delete via `DELETE`. Disabled when locked.
- [x] **Blueprint metadata editing**: the canvas header title/description are editable via a "Blueprint Settings" `Dialog` (opened from an edit button in the top bar or canvas header) containing `name_ar` (required), `name_en`, `description_ar`, `description_en`, `category_id`, `scope`, `department_id` (conditional). The top-bar "Save" button is enabled when metadata is dirty and submits `PUT /v1/blueprints/{blueprint}`. Disabled when locked.
- [x] **Locked blueprint behavior**: when `is_locked = true`, the entire Properties Panel is read-only (fields disabled, action buttons hidden), the canvas shows a prominent lock banner ("This blueprint is locked because a task has been launched from it. Duplicate it to make changes."), "Add Stage" is hidden, reorder/delete are hidden, and the top-bar "Activate/Deactivate" still works (deactivate is allowed on locked). The server returns 422 for any rejected mutation (defensive — the UI should never offer the action).
- [x] **Read-only mode for `blueprint.view_library`** (without `blueprint.manage`): the builder renders the full canvas and properties panel in a read-only state (all fields disabled, no add/edit/delete/save actions), so authorized viewers can inspect a workflow without editing.
- [x] **Activate** action: visible with `blueprint.manage` when `is_active = false` and `is_locked = false`; calls `POST /v1/blueprints/{blueprint}/activate`. Disabled with tooltip "Add at least one stage first" when there are zero stages. **Deactivate**: visible when `is_active = true`; calls `POST .../deactivate` (allowed even when locked). Toast on success; invalidate `useBlueprint(publicId)` + library list.
- [x] **Duplicate** from the builder: a top-bar/overflow action (`blueprint.manage`) calls `POST /v1/blueprints/{blueprint}/duplicate` and navigates to the new blueprint's builder route. Particularly useful for locked blueprints.

### Blueprint Catalog (`/blueprints/catalog`)

- [x] The page uses the List Page template. `BlueprintCatalog` renders its own `PageHeader` with Create button (action changes based on active tab). Three sections switchable via a shadcn `Tabs`: **Categories**, **Stage Types**, **SLA Policies**. The active tab is URL state (`?tab=categories|stage-types|sla-policies`) so it is shareable. `Tabs` have `className={locale === 'ar' ? 'w-full justify-end' : 'w-full justify-start'}`. `cursor-pointer` is added to shadcn `TabsTrigger` globally.
- [x] **Categories tab**: lists `GET /v1/blueprints/categories` (`BlueprintCategoryResource[]`) in a table (localized name w-50, name_en w-50, display_order w-20, status via shared `ActiveBadge`, actions w-12 with `Ellipsis` + `Pencil`/`XCircle`/`CheckCircle`/`Trash2`). Create/edit via `Dialog` (`name_ar` required, `name_en` optional, `display_order` number input). Deactivate/reactivate via row actions. **Delete** via `DELETE /v1/blueprints/categories/:id` with `ConfirmDeleteDialog`. Mutations capability-gated by `blueprint.manage`. Table uses `RtlTable` for RTL support. Status column header uses `t('status')`. Uses shared `ActionsDropdown`, `FormDialog`, `CatalogSkeleton`, `BilingualNameFields` from `components/shared/`.
- [x] **Stage Types tab**: lists `GET /v1/blueprints/stage-types` (`StageTypeResource[]`) in a table (localized name w-50, name_en w-50, display_order w-20, Source column w-24 with `source_system`/`source_custom` badges, actions w-12). System defaults (`is_system_default = true`) show `Badge variant="secondary"` label "System" and disable delete (backend rejects). Edit is always enabled — name fields are `disabled` in the dialog for system defaults with a read-only notice, `display_order` remains editable per backend. Custom types support create/update/delete via `Dialog`. Capability-gated by `blueprint.manage`.
- [x] **SLA Policies tab**: lists `GET /v1/blueprints/sla-policies` (`SlaPolicyResource[]`) in a table (localized name w-50, name_en w-50, sla_value w-20, sla_unit w-20 displayed as `'hours'`/`'days'`, warning_threshold w-20 as percentage, actions w-12). Create/update/delete via `Dialog` (`name_ar` required, `name_en` optional, `sla_value` (integer), `sla_unit` Select with `value="hours"`/`"days"` and `dir={locale === 'ar' ? 'rtl' : 'ltr'}`, `warning_threshold_percentage` (integer 0–100, default 75)). Delete is rejected by the backend when in use — show 422 error inline/toast. Capability-gated by `blueprint.manage`.
- [x] All three managers (`CategoryManager`, `StageTypeManager`, `SlaPolicyManager`) accept `openCreate`/`onOpenCreateChange` props from the parent catalog (for the page-header Create button). The internal Add button is removed — creation is triggered via props. Each uses a `useEffect` to watch `openCreate`. All three tabs handle all 4 states (loading via `CatalogSkeleton`, empty with per-tab `EmptyState`, error with retry, success).
- [x] The catalog is reachable from the library page ("Manage Catalog" link in the `PageHeader` actions) and from the builder's properties panel ("Manage SLA policies" / "Manage categories" links inside Selects), so admins can add missing reference data without leaving the flow.

### States

- [x] **Loading — Library**: `BlueprintLibrarySkeleton` — skeleton filter bar + skeleton rows matching the 5-column table (name w-50, scope w-32, status w-28, stages w-20, actions w-12).
- [x] **Loading — Builder**: skeleton split view: top bar skeleton (breadcrumb + badge + buttons), canvas skeleton (header + 3–4 stage card skeletons with connecting chevrons), properties panel skeleton (6–8 field skeletons + sub-stage row skeletons).
- [x] **Loading — Catalog**: `CatalogSkeleton` — only the table part (no duplicate page header/tabs), matching column widths (name w-50, name_en w-50, data columns w-20, actions w-12).
- [x] **Empty — Library**: `EmptyState` with a blueprint/layer icon, "No blueprints yet" headline, and a "Create your first blueprint" CTA (gated by create capability).
- [x] **Empty — Builder canvas**: when a draft blueprint has zero stages, the canvas shows an empty state inside the dashed area ("No stages yet — add your first stage to define the workflow") with a prominent "Add Stage" button.
- [x] **Empty — Catalog tabs**: per-tab empty states ("No categories", "No custom stage types", "No SLA policies") with create CTAs.
- [x] **Error (500 / network)**: `ErrorState` with safe message + retry button (refetch). No stack traces, no internal IDs.
- [x] **Error (403 / no permission)**: `EmptyState` with lock icon + localized "no permission" message; no data shown.
- [x] **Error (404 / builder)**: `EmptyState` "blueprint not found" + link back to `/blueprints`.
- [x] **Success**: full content rendered for all three surfaces.

### Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| Mobile (<640px) | **Library**: single-column card list. **Builder**: single column — canvas stacks on top, properties panel collapses into a `Sheet` (bottom/side drawer) opened by selecting a stage or by an "Edit Stage" button; top-bar actions collapse to an overflow menu. **Catalog**: single-column tables become card lists. |
| Tablet (640–1023px) | **Library**: 2-column where useful; table visible. **Builder**: canvas and panel may stack or panel narrows; flow chevrons remain. **Catalog**: tables visible. |
| Desktop (≥1024px) | **Library**: full data table. **Builder**: split view — flexible canvas (left) + fixed-width (≈320px) properties panel (right), matching the concept. **Catalog**: full tables with side-by-side where helpful. |

- [x] Builder properties panel is sticky on desktop and scrolls independently when content overflows.
- [x] Dialogs (create blueprint, blueprint settings, stage/sub-stage forms, confirmations) become full-screen or bottom sheets on small viewports.

### Navigation and Cross-Linking

- [x] Breadcrumb in the shell header: "Blueprints" (link to `/blueprints`) + localized blueprint name (builder route), per the `001-core-shell` `SiteHeader` breadcrumb pattern with `rtl:rotate-180` chevrons.
- [x] Builder back arrow links to `/blueprints` and preserves library filter state via browser history.
- [x] "Manage Catalog" links from the library and builder navigate to `/blueprints/catalog?tab=...` with the relevant tab preselected.
- [x] After create-blueprint and duplicate, navigation lands on the builder route for the new blueprint.

---

## Technical Requirements

> Reference: `docs/ai/coding-standards.md`

### Data Fetching

- [x] `useBlueprintsInfinite(filters)` — `GET /v1/blueprints`, query key `queryKeys.blueprints.list(filters)`, cursor-paginated `BlueprintResource[]` via `useInfiniteQuery` (`getNextPageParam` from `has_more`/`next_cursor`). `filters`: `{ search?, category_id?, scope?, is_active?, per_page? }`. Manual "Load More" (no infinite scroll on tables, per `coding-standards.md`).
- [x] `useBlueprint(publicId)` — `GET /v1/blueprints/{publicId}`, query key `queryKeys.blueprints.detail(publicId)`, returns `BlueprintResource` (embeds `stages` (with `sub_stages`) + `transitions`). `enabled: !!publicId`. Stale time: 30s. This is the single source of truth for the builder canvas.
- [x] `useBlueprintCategories()` — `GET /v1/blueprints/categories`, query key `queryKeys.blueprints.categories()`, full list (`BlueprintCategoryResource[]`, < 100). Stale time: 5min (catalog reference data).
- [x] `useBlueprintStageTypes()` — `GET /v1/blueprints/stage-types`, query key `queryKeys.blueprints.stageTypes()`, full list (`StageTypeResource[]`). Stale time: 5min.
- [x] `useBlueprintSlaPolicies()` — `GET /v1/blueprints/sla-policies`, query key `queryKeys.blueprints.slaPolicies()`, full list (`SlaPolicyResource[]`). Stale time: 5min.
- [x] `useBlueprintTransitions(blueprintId)` — already established by spec 004-task-details (`queryKeys.blueprints.transitions(blueprintId)`); not re-created. The builder derives transitions from `useBlueprint(publicId).transitions` instead, so this hook is used only by the task-details return dialog.
- [x] Prefetch: prefetch `useBlueprint(publicId)` on library row hover (`queryClient.prefetchQuery`) so opening the builder feels instant.
- [x] Departments for the scope/assignment Selects come from the existing `useDepartments()` hook / `queryKeys.organization.departments()` (established in spec 003 filters). Positions for assignment/escalation Selects use the organization positions endpoint (from backend 002; reuse existing hook if present, otherwise add a minimal `usePositions()` — confirm in plan).
- [x] All response types from `lib/generated/api-types.ts`; no hand-written API DTOs. No `useEffect` + `fetch`.

### Query Key Structure

> Extend `lib/api/query-keys.ts` (the `blueprints` namespace already has `all`, `lists`, `list`, `detail`, `transitions`, `categories`, `stageTypes` from prior specs):

```ts
blueprints: {
  all: ['blueprints'] as const,
  lists: () => [...queryKeys.blueprints.all, 'list'] as const,
  list: (filters?: Record<string, unknown>) => [...queryKeys.blueprints.lists(), filters] as const,
  detail: (publicId: string) => [...queryKeys.blueprints.all, 'detail', publicId] as const,
  // existing:
  transitions: (blueprintId: string) => [...queryKeys.blueprints.detail(blueprintId), 'transitions'] as const,
  categories: () => [...queryKeys.blueprints.all, 'categories'] as const,
  stageTypes: () => [...queryKeys.blueprints.all, 'stage-types'] as const,
  // NEW for 005:
  slaPolicies: () => [...queryKeys.blueprints.all, 'sla-policies'] as const,
  stages: (blueprintId: string) => [...queryKeys.blueprints.detail(blueprintId), 'stages'] as const,
  subStages: (blueprintId: string, stageId: string) =>
    [...queryKeys.blueprints.stages(blueprintId), stageId, 'sub-stages'] as const,
},
```

- [x] `stages` / `subStages` keys are nested under `detail(publicId)` so invalidating the detail also enables granular invalidation. In practice the builder mostly invalidates `detail(publicId)` (the show embeds stages + sub_stages + transitions) after any stage/sub-stage/transition mutation.
- [x] No hardcoded query key strings in any component.

### State Management

> Reference: `architecture.md` Data Layer Decision Matrix and Known Risk Areas ("Blueprint builder state complexity").

- [x] **TanStack Query**: all API-derived state — blueprint list, blueprint detail (with stages/sub-stages/transitions), catalog reference data. Never duplicated in Zustand.
- [x] **URL state**: library filters (`search`, `category_id`, `scope`, `is_active`); catalog active tab (`tab`); builder route param `publicId`. All shareable/bookmarkable.
- [x] **Zustand** — `useBlueprintBuilderStore`: **UI/selection state only**, never API data. Holds: `selectedStageId`, `panelOpen` (mobile), `metadataDirty` flag. This follows `architecture.md` ("Wizard/builder local state → Zustand") for the cross-component selection state shared between the canvas and the properties panel, without duplicating API data (per the anti-pattern "API data in Zustand").
- [x] **Local component state**: form field values in the properties panel (hydrated from the query data for the selected stage, edited locally, saved on "Save Stage"), dialog open/close states, create-blueprint form, blueprint-settings form, transition multi-select selections.
- [x] **Key decision — Granular mutations, not a single batch save** (see Open Questions): the stable backend 004 contract is granular (per-entity CRUD with the lock enforced per mutation). Therefore stage/sub-stage/transition mutations are immediate API calls (optimistic where safe + invalidate `detail(publicId)`), and blueprint metadata is saved via a separate `PUT`. This keeps the canvas as server truth, enforces the lock per action, and avoids complex client-side diffing. `architecture.md`'s "save in one API call" note anticipated a batch endpoint that the backend did not build; granular is the correct adaptation against the stable contract.

### Mutations

> Reference: `docs/ai/coding-standards.md` — Mutation patterns

- [x] `useCreateBlueprint()` — `POST /v1/blueprints`. On success: invalidate `queryKeys.blueprints.lists()`; navigate to `/blueprints/[publicId]`. Toast.
- [x] `useUpdateBlueprint()` — `PUT /v1/blueprints/{blueprint}` (metadata). On success: invalidate `queryKeys.blueprints.detail(publicId)` + `lists()`. Toast.
- [x] `useActivateBlueprint()` / `useDeactivateBlueprint()` — `POST .../activate` | `.../deactivate`. On success: invalidate `detail(publicId)` + `lists()`. Toast. (Deactivate is allowed on locked blueprints; activate is not and the UI disables it.)
- [x] `useDuplicateBlueprint()` — `POST .../duplicate`. On success: invalidate `lists()`; navigate to the new blueprint's builder route. Toast.
- [x] `useCreateStage(blueprintId)` / `useUpdateStage(blueprintId)` / `useDeleteStage(blueprintId)` — `POST/PUT/DELETE /v1/blueprints/{blueprint}/stages[/{stage}]`. On success: invalidate `queryKeys.blueprints.detail(blueprintId)` (which refreshes the embedded stages + transitions). Toast.
- [x] `useReorderStages(blueprintId)` — `POST /v1/blueprints/{blueprint}/stages/reorder` with `{ stages: [{ public_id, sequence_order }] }`. Optimistic reorder (update the cached stage `sequence_order` values) + invalidate `detail(blueprintId)` to reconcile. Toast.
- [x] `useCreateSubStage` / `useUpdateSubStage` / `useDeleteSubStage` / `useReorderSubStages` — sub-stage endpoints under `/stages/{stage}/sub-stages`. Same invalidation (`detail(blueprintId)`). Toast.
- [x] `useCreateTransition` / `useUpdateTransition` / `useDeleteTransition` — `/transitions[/{transition}]`. On success: invalidate `detail(blueprintId)` (refreshes embedded transitions) and `queryKeys.blueprints.transitions(blueprintId)` (consumed by task-details). Toast.
- [x] Catalog mutations: `useCreateCategory` / `useUpdateCategory` / `useDeactivateCategory` / `useReactivateCategory`; `useCreateStageType` / `useUpdateStageType` / `useDeleteStageType`; `useCreateSlaPolicy` / `useUpdateSlaPolicy` / `useDeleteSlaPolicy`. Each invalidates its catalog list key (`categories()`, `stageTypes()`, `slaPolicies()`). Toast on success; 422 (in-use) shown inline/toast.
- [x] No optimistic updates for create/delete (the server assigns `public_id` and `sequence_order`); optimistic only for reorder (pure ordering change). Simple invalidation is correct and safe for the rest.
- [x] All mutations use `toast.success()` / `toast.error()` from sonner; all user-facing strings via `useTranslations('blueprints.*')`.

### Error Handling

- [x] 401 → redirect to login (handled globally by query client `QueryCache.onError`).
- [x] 403 → `EmptyState` with lock icon + localized "no permission" message (server ABAC is source of truth).
- [x] 404 (builder) → `EmptyState` "blueprint not found" + link back to `/blueprints`.
- [x] 422 (validation: locked blueprint mutation, invalid transition, missing required field, SLA/stage-type/category in-use delete, activate with zero stages, department_id missing for department scope) → show backend error message inline in the active dialog/panel (do not close the dialog); toast for non-dialog contexts. The localized message comes via the `X-Locale` header.
- [x] 500 / network error → `ErrorState` with safe message + retry (no stack traces, no internal IDs).
- [x] Mutation errors show `toast.error()` with the backend message.

---

## UI Requirements

> Reference: `docs/design-system/01-tokens.md`, `02-glassmorphism.md`, `03-components.md`, `04-layout-patterns.md`, `05-accessibility.md`, `06-anti-patterns.md`

### Component Breakdown

| Component | Type | Source | Notes |
|-----------|------|--------|-------|
| `BlueprintLibraryPage` | Server | Page | `app/(dashboard)/blueprints/page.tsx`; renders `PageHeader` + `BlueprintLibrary` |
| `BlueprintLibrary` | Client | Domain | Orchestrates `useBlueprintsInfinite`, filter bar, table/card list, all 4 states |
| `BlueprintFilters` | Client | Domain | URL-driven filter bar (search, category, scope, active ToggleGroup) |
| `CreateBlueprintDialog` | Client | Domain | Create form (name AR/EN, category, scope, department conditional, description) |
| `BlueprintRowActions` | Client | Domain | Open / Duplicate / Activate / Deactivate dropdown, capability-gated |
| `BlueprintBuilderPage` | Server | Page | `app/(dashboard)/blueprints/[publicId]/page.tsx`; renders `BlueprintBuilder` |
| `BlueprintBuilder` | Client | Domain | Orchestrates `useBlueprint`, top bar + split view, all 4 states, lock/read-only handling |
| `BuilderTopBar` | Client | Domain | Breadcrumb + lock/status badge + Save + Activate/Deactivate + Duplicate |
| `StageCanvas` | Client | Domain | Blueprint header (title/desc/badges) + vertical stage list + flow chevrons + Add Stage |
| `StageCard` | Client | Domain | Single stage card: sequence badge, name, type/SLA, assignee, sub-stage count, return-path badge, select state, up/down + more actions |
| `StagePropertiesPanel` | Client | Domain | Right pane: the selected stage's editable form (identity, type/SLA, assignment, escalation, transitions, sub-stages); read-only when locked or view-only |
| `StageForm` | Client | Domain | Stage field form (shared by add + edit); local state + Save Stage |
| `SubStageList` | Client | Domain | Ordered sub-stages with add/edit/delete/reorder |
| `SubStageForm` | Client | Domain | Sub-stage fields (name AR/EN, description AR/EN, SLA, assignment, position/department, completion, cardinality, is_required) — rendered inline in `StagePropertiesPanel`, not a dialog. |
| `TransitionEditor` | Client | Domain | Advance/Return target checkboxes derived from stages. Creates/deletes transitions on toggle. Uses integer codes: `transition_type: 1` for advance, `2` for return with `return_reason_required: true`. |
| `BlueprintSettingsDialog` | Client | Domain | Edit blueprint metadata (name, description, category, scope, department) |
| `CatalogPage` | Server | Page | `app/(dashboard)/blueprints/catalog/page.tsx`; renders `BlueprintCatalog` |
| `BlueprintCatalog` | Client | Domain | Tabs (Categories / Stage Types / SLA Policies) + per-tab list + create/edit dialogs |
| `CategoryManager`, `StageTypeManager`, `SlaPolicyManager` | Client | Domain | Per-tab list + `Dialog`/`Sheet` forms + activate/deactivate/delete |
| `BlueprintBuilderSkeleton`, `BlueprintLibrarySkeleton` | Client | Domain | Skeletons matching each layout |
| `LockBadge`, `ScopeBadge` | Client | Domain | Lock (amber lock + tooltip with dark mode support), Scope (Globe/Building2 icon + `scope_organization`/`scope_department` i18n). No `SCOPE_LABELS` constant — scope display uses `useTranslations('blueprints.badges')` directly. |
| `ActiveBadge` | Client | Shared | `@/components/shared/active-badge.tsx` — green/grey colored text span for active/inactive status with dark mode support (`dark:text-emerald-400` / `dark:text-muted-foreground`). |
| `RtlSelect` | Client | Shared | `@/components/shared/rtl-select.tsx` — wraps shadcn `Select` with automatic `dir={locale === 'ar' ? 'rtl' : 'ltr'}`. Used in all form Selects for RTL compliance. |
| `RtlTable` | Client | Shared | `@/components/shared/rtl-table.tsx` — wraps shadcn `Table` with automatic `dir` for RTL. Used in catalog tables. |
| `BilingualNameFields` | Client | Shared | `@/components/shared/bilingual-name-fields.tsx` — reusable pair of Arabic (required, `dir="rtl"`) and English (optional, `dir="ltr"`) name inputs with error display. |
| `BilingualDescriptionFields` | Client | Shared | `@/components/shared/bilingual-description-fields.tsx` — reusable pair of Arabic and English description textareas with `dir` per locale. |
| `ConfirmDeleteDialog` | Client | Shared | `@/components/shared/confirm-delete-dialog.tsx` — reusable `AlertDialog` wrapper with configurable title, description, and confirm/cancel labels. Used by sub-stage list, canvas sub-stages, catalog managers. |
| `CatalogTable` (`ActionsDropdown`, `FormDialog`, `CatalogSkeleton`, `RtlTable`) | Client | Shared | `@/components/shared/catalog-table.tsx` — shared building blocks: `ActionsDropdown` (dropdown with icon actions), `FormDialog` (shadcn `Dialog` wrapper with footer buttons), `CatalogSkeleton` (skeleton table rows), `RtlTable` re-export. Factory helpers: `editAction()`, `deleteAction()`, `deactivateAction()`, `reactivateAction()`. |
| `EmptyState`, `ErrorState` | Client | Shared | Reused from `components/shared/` |
| `Button`, `Badge`, `Card`, `Dialog`, `AlertDialog`, `Sheet`, `Select`, `Input`, `Textarea`, `Checkbox`, `ToggleGroup`, `Table`, `Tabs`, `Separator`, `ScrollArea`, `Skeleton`, `Tooltip`, `DropdownMenu` | Client | shadcn | Run `npx shadcn@latest docs <component>` before implementation if adding missing components (`Sheet`, `ToggleGroup`, `Tabs` likely needed). |

### States

| State | Component | Pattern |
|-------|-----------|---------|
| Loading — Library | `BlueprintLibrarySkeleton` | Skeleton filter bar + skeleton rows matching column widths |
| Loading — Builder | `BlueprintBuilderSkeleton` | Skeleton top bar + canvas (header + 3–4 stage card skeletons + chevrons) + properties panel (6–8 field skeletons + sub-stage skeletons) |
| Loading — Catalog | `CatalogSkeleton` (from `components/shared/catalog-table.tsx`) | Skeleton rows for the active tab |
| Empty — Library | `EmptyState` | Layer icon, "No blueprints yet", "Create your first blueprint" CTA (gated) |
| Empty — Builder canvas | canvas empty state | "No stages yet — add your first stage" + prominent Add Stage (draft only) |
| Empty — Catalog | per-tab `EmptyState` | "No categories" / "No custom stage types" / "No SLA policies" + create CTA |
| Error (500/net) | `ErrorState` | Safe message + retry |
| No Permission (403) | `EmptyState` | Lock icon, localized "no permission" |
| Not Found (404) | `EmptyState` | "Blueprint not found" + link to `/blueprints` |
| Success | real content | Full library / builder / catalog rendered |

### Responsive Behavior

- [x] **Mobile (<640px)**: Library → card list. Builder → single column; canvas on top; properties panel becomes a `Sheet` opened by selecting a stage / "Edit Stage"; top-bar actions → overflow menu. Catalog → card lists.
- [x] **Tablet (640–1023px)**: Library → table. Builder → canvas + narrower panel or stacked. Catalog → tables.
- [x] **Desktop (≥1024px)**: Library → full table. Builder → split view (flexible canvas + ≈320px panel, panel sticky + independent scroll). Catalog → full tables.
- [x] Dialogs full-screen / bottom sheet on small viewports.

### RTL Considerations

- [x] All layout uses logical properties (`ms-`, `me-`, `ps-`, `pe-`, `text-start`, `text-end`, `border-s`, `border-e`). No physical direction classes (`ml-`, `mr-`, `text-left`, etc.).
- [x] Flow chevrons/arrows between stage cards are directional icons and use `rtl:rotate-180` so the advance direction follows the reading direction (start→end).
- [x] Back arrow in the builder top bar uses `rtl:rotate-180`.
- [x] Breadcrumb chevrons use `rtl:rotate-180` (reused `001-core-shell` pattern).
- [x] Properties panel sits on the end edge (right in LTR, left in RTL) — implemented via logical ordering (e.g., flex row with canvas first; panel uses `border-s`), so it flips automatically.
- [x] The "Return path → Stage 2" badge arrow is a directional indicator and flips in RTL.
- [x] Stage sequence badges ("Stage N") and numbers remain LTR (numbers are not direction-sensitive); labels align `text-start`.
- [x] Bilingual stage/category/SLA names picked by locale (`name_ar` / `name_en`); the Arabic input has `dir="rtl"`, English input `dir="ltr"`, per the concept.
- [x] Select components: `dir={locale === 'ar' ? 'rtl' : 'ltr'}` on the `Select` root (NOT on `SelectContent`). All `SelectContent` use `position="popper"` with no `align` prop.
- [x] DropdownMenu components: `dir={locale === 'ar' ? 'rtl' : 'ltr'}` on the `DropdownMenu` root (the `dir` on root handles RTL positioning). All `DropdownMenuContent` use `align="end"`.
- [x] Tables in catalog use `dir={locale === 'ar' ? 'rtl' : 'ltr'}` for proper RTL column rendering.

### Accessibility

- [x] All interactive elements (stage cards, panel fields, actions, reorder controls) have visible focus rings (`focus-visible:ring-2`).
- [x] Stage cards are operable via keyboard: `Tab` moves between cards, `Enter`/`Space` selects a card (loads it into the panel); the selected card has `aria-current="true"`.
- [x] Icon-only buttons (up/down reorder, more-actions, delete, close) have `aria-label` in the active locale.
- [x] The canvas stage list uses semantic structure (`<ol>` with `<li>` per stage, since order is meaningful); the properties panel uses `aria-labelledby` to associate it with the selected stage.
- [x] Bilingual form fields have explicit `FieldLabel`s; Arabic required marker (`*`) follows the label in reading direction; required fields are `aria-required="true"`; validation errors linked via `aria-describedby` (per `05-accessibility.md`).
- [x] Dialogs/Sheets (create blueprint, settings, stage/sub-stage forms, confirmations) trap focus on open, return focus to trigger on close, close on `Escape` (shadcn handles this).
- [x] Confirmation `AlertDialog`s for destructive actions (delete stage/sub-stage/transition/SLA policy/stage type) use specific button labels ("Delete Stage" not "Confirm") with a cancel always available.
- [x] SLA summary and status/lock badges use color + text label — never color-only.
- [x] Touch targets ≥ 44px on mobile for all action buttons and reorder controls.
- [x] `prefers-reduced-motion` disables skeleton `animate-pulse` and any card hover transitions (`motion-reduce:animate-none`).
- [x] Screen reader: the canvas announces "Stage N of M: [name], [type], [SLA summary]" via `aria-live="polite"` or `sr-only` summary when the selection changes.

### Animation

- [x] Skeleton: `animate-pulse` on all skeleton elements; disabled under `prefers-reduced-motion`.
- [x] Selected stage card: accent border transition (`transition-colors duration-200`); no lift/transform (cards are not a card grid).
- [x] Dialog/Sheet open/close: shadcn defaults (`animate-in fade-in` overlay, `animate-in zoom-in-95` / slide-in content).
- [x] Flow chevrons: static (no animation).
- [x] Toast: sonner default slide-in.
- [x] No glass effects on the canvas, table, or dense panel (per `02-glassmorphism.md` — glass is deferred and not for dense data).
- [x] No hover lift on stage cards (per spec 003 established pattern — no hover lift on dense rows).

---

## Non-Functional Requirements

### Performance

- [x] Blueprint detail prefetch on library row hover (`queryClient.prefetchQuery` with `queryKeys.blueprints.detail(publicId)`) so opening the builder feels instant.
- [x] Catalog reference data (categories, stage types, SLA policies) are small full-list queries with 5min stale time — fetched once and reused across library, builder, and catalog.
- [x] No heavy chart or canvas libraries in MVP — the stage canvas is a styled list with CSS/SVG chevrons, not a graph rendering engine (full visual flow preview is V2 #31).
- [x] Memoize derived transition-target lists (advance = stages with higher `sequence_order`, return = lower) via `useMemo` from the stages array.
- [x] The builder properties panel form state is local; only "Save" triggers a mutation, avoiding a PUT per keystroke.

### Security

- [x] Backend ABAC is the source of truth for blueprint visibility/editability — client never reconstructs capability rules.
- [x] Capability checks (`useCapability('blueprint.manage')`, `useCapability('blueprint.create.organization')`, `useCapability('blueprint.create.department')`, `useCapability('blueprint.view_library')`) hide/disable actions for UX only; server returns 403 regardless.
- [x] Locked blueprints (`is_locked = true`) disable all editing UI; the server returns 422 for any mutation regardless — defensive handling kept but the UI never offers the action.
- [x] No PII in URLs or console logs. Department/position Selects display localized names only.
- [x] No `console.log` of blueprint data in committed code.
- [x] No `dangerouslySetInnerHTML` — descriptions are plain text with line-break preservation (React escapes by default).

### Testing

> Reference: `docs/ai/testing-policy.md`

- [x] Component tests for `BlueprintLibrary`: loading skeleton, success (populated table + filters), empty, 403, 500; "Load More" appends next page; filter changes update URL params.
- [x] Component tests for `BlueprintBuilder`: loading skeleton, success (canvas + panel), 404, 403, locked read-only mode (editing disabled, lock banner visible), view-only mode (no edit actions).
- [x] Interaction tests: create blueprint dialog (fill → submit → navigate), add stage (fill panel → save → canvas updates), edit stage (select → modify → save), delete stage (confirm → canvas updates), reorder (up/down → order changes), activate/deactivate (status badge updates), duplicate (navigates to new builder).
- [x] Interaction test: transition editor — add advance/return targets creates transitions; removing a target deletes; reason-required toggle persists.
- [x] Interaction test: sub-stage add/edit/delete/reorder.
- [x] Capability gating tests: "New Blueprint" hidden without create capability; row actions hidden without `blueprint.manage`; catalog mutations hidden without `blueprint.manage`.
- [x] Catalog tests: each tab renders its list, create/edit/delete flows, system-default stage-type protection (edit/delete disabled), SLA in-use delete shows 422.
- [x] MSW handlers for: `GET /blueprints` (cursor paginated), `GET /blueprints/{id}` (full `BlueprintResource` with stages/sub_stages/transitions), `GET /blueprints/categories`, `GET /blueprints/stage-types`, `GET /blueprints/sla-policies`, and all mutation endpoints (create/update/activate/deactivate/duplicate; stage CRUD + reorder; sub-stage CRUD + reorder; transition CRUD; category/stage-type/sla-policy CRUD).
- [x] Both locales tested (AR RTL + EN LTR) for the builder split view (panel on the end edge, chevrons flipping), library table, and catalog.
- [x] Tests use `renderWithProviders` wrapper with fresh `QueryClientProvider` per test.

---

## Out of Scope

- **Task creation / launch form** (feature #59, #65) — selecting a blueprint and launching a task (with manual-assignment nomination) is a separate future frontend spec. The library lets task creators *browse* blueprints but not launch from here.
- **Blueprint versioning** (V2 #28, #29) — no version field, no version history; the concept's "v2.1" badge is not implemented. MVP uses duplicate-and-edit as the versioning mechanism.
- **Visual flow diagram preview** (V2 #31) — the "Preview Flow" button in the concept is not implemented. The editable canvas is the visual representation; a full rendered graph diagram is V2.
- **Active task count per blueprint** (V2 #30, concept's "12 active tasks") — the backend 004 `BlueprintResource` does not return task counts; this belongs to analytics (backend 009) and is V2.
- **Stage exit-requirement checkboxes** (concept's "Attach document", "Record decision outcome") — these are not backed by the stable 004 contract. "Attach document" depends on documents/attachments (backend 012, deferred); "Record decision" depends on Stage Forms (V2 #48). The builder exposes only contract-backed fields: `completion_rule`, `assignment_cardinality`, and required sub-stages (`is_required`). See Open Questions.
- **Stage Forms** (V2 #48–#50) — structured output forms on stages/sub-stages are V2.
- **Drag-and-drop stage reorder** (V2 #57) — MVP uses up/down controls against the existing reorder endpoint; drag-and-drop is a V2 enhancement.
- **Conditional/branching stage logic** (V2 #53), **parallel stages** (V2 #54–#55), **optional stages** (V2 #51–#52), **sub-task triggers** (V2 #56) — all V2.
- **Least Workload / Round Robin assignment resolution** (V2 #40, #41) — only the three MVP assignment types (Specific Position, Department Head, Manual at Launch) are exposed.
- **Blueprint hard-delete UI** — now implemented via `DELETE /v1/blueprints/{blueprint}` in row actions, gated by `blueprint.manage`. The delete action is destructive and uses a confirm dialog. Soft-delete is handled server-side; the UI calls the standard delete endpoint.
- **Blueprint usage analytics** — read-only reports belong to analytics (backend 009, frontend `009-analytics-reporting`).
- **Real-time co-editing** — no websocket/SSE; data is fetched on mount and invalidated after mutations.
- **Comments on blueprints** (V2) — deferred.
- **Blueprint approval workflow** — tenant admin creates and activates directly; no multi-step approval.

---

## Open Questions — Resolved

- [x] **Granular mutations vs "save in one API call"** — Approved: granular immediate mutations. Each stage/sub-stage/transition CRUD is an immediate API call + invalidate `detail(publicId)`. Blueprint metadata uses a separate `PUT`. Zustand holds only selection/UI state. The "save in one API call" note anticipated a batch endpoint that was not built.
- [x] **Stage reorder interaction** — Approved: up/down controls for MVP. Drag-and-drop reorder is V2 #57.
- [x] **Stage delete** — Approved: include delete for draft (unlocked) blueprints with `AlertDialog` confirm. Locked blueprints hide the delete action.
- [x] **Exit requirements not in contract** — Approved: omit the exit-requirements checkbox section. Expose only `completion_rule`, `assignment_cardinality`, and required sub-stages (`is_required`).
- [x] **SLA warning threshold location** — Approved: stage panel shows the selected SLA policy's warning threshold as read-only text with a "Manage" link to the SLA Policies catalog tab. Threshold is edited in the catalog.
- [x] **Positions endpoint for assignment/escalation Selects** — Added a minimal `usePositions()` hook in `use-blueprints.ts` querying `GET /v1/organization/positions` (cursor-paginated).
- [x] **Catalog as a separate route vs inline dialogs** — Approved: dedicated `/blueprints/catalog` route with URL tab param. "Manage" links from the builder/library Selects navigate to the relevant catalog tab.

---

→ **Next:** Review this spec. Do not create `plan.md` until the draft is approved.
