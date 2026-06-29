# Implementation Roadmap — Momentum Frontend

> Frontend execution plan. Spec IDs align with `../backend/docs/ai/roadmap.md` where paired.

---

## Current Focus

**Phase:** F5 — Dashboards & analytics
**Active spec:** `009-analytics-reporting`

---

## Milestone Overview

| # | Name | Status | Requires Backend |
|-------|------|--------|------------------|
| F0 | Scaffold & design system | ✅ Done | — |
| F1 | App shell, auth, i18n/RTL | ✅ Done | M2 backend (IAM) |
| F2 | Task board & task details | ✅ Done | M4 backend |
| F3 | Blueprint builder | ✅ Done | M3 backend |
| F4 | Follow-up & workflow viz | ✅ Done | M4–M5 backend |
| F5 | Dashboards & analytics | ⬜ Not Started | M6 backend |
| F6 | Admin, org, help, onboarding | 🔄 In Progress | M1–M2, M7 backend |

**Legend:** ✅ Done · 🔄 In Progress · ⬜ Not Started · 🚧 Blocked

---

## Frontend Spec Catalog

| Spec | Milestone | Domain | Requires backend specs | Status |
|------|-----------|--------|------------------------|--------|
| `001-core-shell` | F1 | Core | `003-iam-abac`, `008-notifications`, `011-search-discovery` | ✅ |
| `002-executive-dashboard` | F5 | Analytics | `009-analytics-reporting` | ⬜ |
| `003-task-board` | F2 | Tasks | `005-task-execution`, `014` | ✅ |
| `004-task-details` | F2 | Tasks | `005`, `006`, `012`, `013` | ✅ |
| `005-blueprint-builder` | F3 | Blueprints | `004-blueprint-engine` | ✅ |
| `006-workflow-visualization` | F4 | Workflow | `006-stage-lifecycle` | ✅ |
| `007-follow-up-center` | F4 | Follow-up | `007`, `010-follow-up-board` | ✅ |
| `008-organization-structure` | F6 | Organization | `002-organization-structure` | ✅ |
| `009-analytics-reporting` | F5 | Analytics | `009-analytics-reporting` | ⬜ |
| `010-system-administration` | F6 | Tenant Admin | `003`, `005` (priorities), `015` | ⬜ |
| `011-help-center` | F6 | Support | `020-help-center` | ⬜ |
| `012-department-manager-dashboard` | F5 | Analytics | `009-analytics-reporting` | ⬜ |
| `016-notifications-search` | F1 | Core | `008`, `011` | ✅ (merged into `001`) |
| `017-user-settings-delegation` | F6 | Settings | `016` | ⬜ |
| `016-task-creation-launch` | F2 | Tasks | `005-task-execution` | ✅ |
| `019-confidential-access` | F6 | Access | `017-confidentiality-access` | ⬜ |
| `020-localization-calendar` | F6 | Core | `018-localization-calendar` | ⬜ |
| `021-onboarding-training` | F6 | Onboarding | `019-onboarding-training` | ⬜ |
| `022-platform-administration` | F6 | Platform | `001-platform-tenancy`, `001-platform-admin` | ⬜ |

Note: Spec IDs are frontend-specific. Cross-reference backend roadmap for API dependencies. `015` and `016` were removed as orphaned specs with no backend counterpart.

---

## F0 — Scaffold & Design System

**Status:** ✅ Done

**Completed:**
- `create-next-app` with TypeScript, Tailwind v4, App Router ✅
- shadcn/ui init ✅
- shadcn preset applied (amber theme) ✅
- TanStack Query + Zustand installed ✅
- Dashboard + login pages scaffolded ✅
- Design tokens documented (amber theme) ✅
- Test skeleton (vitest, MSW, testing-library) ✅
- API client + query keys + hooks + stores ✅
- OpenAPI typegen script added ✅
- Cookie-based locale routing (`NEXT_LOCALE`) + RTL shell ✅
- IBM Plex Sans Arabic font loading ✅
- Middleware for route protection (proxy.ts security headers) ✅
- CSP headers for production (pending deployment config) ⬜

---

## F1 — App Shell, Auth, i18n/RTL

**Status:** ✅ Done

**Active spec:** `001-core-shell`

**Completed:**
- Login page with Sanctum SPA cookie auth ✅
- Dashboard shell (sidebar + top bar + main content) ✅
- RTL-first layout with logical CSS properties ✅
- Global search (Cmd+K command palette) ✅
- Notifications center (bell + panel + mark-read) ✅
- Locale toggle (Arabic/English, cookie-based) ✅
- Theme toggle (Light/Dark/System) in user menu ✅
- Brand color picker (amber/blue/emerald/rose/slate) in user menu ✅
- OpenAPI type integration ✅
- TanStack Query + Zustand patterns established ✅
- i18n via next-intl v4 with `messages/{locale}.json` ✅

**Established by 001:**
- **Login:** Sanctum SPA cookies, CSRF-first, `getCsrfCookie()` before `POST /login`, flat `AuthTokenResource` response
- **Auth guard:** Server-side `prefetchAuthenticatedUser()` in dashboard layout — 401 redirects before shell HTML renders; client-side `QueryCache.onError` handles mid-session expiry
- **Tenant resolution:** `X-Tenant` header from hostname subdomain on every API request via `apiClient`
- **Locale:** `NEXT_LOCALE` cookie read server-side in root layout; `X-Locale` header on every API request; `next-intl` `useTranslations()` / `getTranslations()` for UI strings; bilingual entity fields (`name_ar`/`name_en`) picked by locale
- **RTL:** Logical properties (`ms-`/`me-`, `ps-`/`pe-`, `text-start`/`text-end`) mandatory; directional icons flip with `rtl:rotate-180`; shadcn `Sidebar` passes `side` based on locale
- **Sidebar:** shadcn `SidebarProvider` + `AppSidebar` + `SidebarInset`; nav items with `usePathname()` active highlighting + primary color accent; Quick Create + Inbox buttons; user footer with dropdown (preferences + logout)
- **Global search:** cmdk `CommandDialog` with debounced server-side search; `shouldFilter={false}` to avoid client-side filtering conflict; `next/dynamic` lazy-load
- **Notifications:** Cursor-paginated list; `NotificationResource` shape (`data.title_ar`/`data.title_en`, `data.body_ar`/`data.body_en`); unread dot indicator; mark-read on click
- **Brand color:** Zustand `persist` middleware saving to localStorage; `BrandColorProvider` injects `--color-primary` via inline style; palette: amber (default), blue, emerald, rose, slate
- **403 handling:** Capability-gated nav items (hide/disable); server is source of truth
- **Error states:** All data-fetching components handle loading (skeleton), error (retry button), empty (icon + message), success

---

---

## F2 — Task Board & Task Details

**Status:** 🔄 In Progress

**Completed (003):**
- `/tasks` route with breadcrumb + description inside dashboard shell ✅
- `useTaskBoardInfinite()` cursor-paginated board via `GET /v1/follow-up/board` ✅
- URL-driven filters (ToggleGroup quick filters, search with 300ms debounce, sort Select + direction toggle) ✅
- Hybrid enterprise table: SLA, rich Task cell, Stage+Department, stacked avatar assignees, Time In Stage+Due Date, Actions dropdown ✅
- Mobile card list with matching information hierarchy ✅
- SlaBadge, TaskStatusBadge, PriorityBadge (colored dot), ClassificationBadge (icon+text) ✅
- Visual hierarchy: SLA owns color, everything else neutral/outline ✅
- Row accent border derived from SLA health, not status ✅
- All 4 states: loading skeleton, empty, error (with retry), 403, success ✅
- RTL: logical properties, breadcrumb `rtl:rotate-180`, conditional dropdown alignment ✅
- Dark mode: `dark:` variants on all badge colors and row borders ✅
- Global `cursor-pointer` added to base components (button/toggle/select/dropdown-menu/command/sidebar) ✅
- OpenAPI type regeneration on backend contract changes ✅
- 69 tests across utils, badges, board states ✅

**Established by 003:**
- **Board layout:** 6-column hybrid enterprise table (SLA, Task, Stage+Dept, Assignees, Time In Stage, Actions) with SLA-derived row accents and stacked avatar assignees
- **Visual hierarchy principle:** One row = one dominant color signal. SLA owns color; status/priority/classification use neutral/outline styles
- **Cursor-pointer:** Handled globally in base UI components (`button.tsx`, `toggle.tsx`, `select.tsx`, `dropdown-menu.tsx`, `command.tsx`, `sidebar.tsx`) — no per-instance overrides needed
- **Row borders on `<td>`:** Side borders (`border-s-4`) on `<td>` not `<tr>` — `<tr>` doesn't render side borders in standard table layout
- **Select scroll lock:** Radix `Select.Content` with `position="popper"` applies `body[data-scroll-locked]` CSS — avoided by using default `item-aligned` positioning
- **Badge color system:** SLA (emerald/amber/red/slate) keeps full color; Status (blue/orange/teal/rose/zinc) uses neutral outline; Priority (fuchsia/yellow) uses neutral bg + colored dot; Classification (lime/purple) uses plain text + icon

**Completed (004):**
- `/tasks/[publicId]` route with two-column stacked-card layout inside dashboard shell ✅
- `useTaskDetail()`, `useTaskSlaHealth()`, `useTaskTimeline()`, `useBlueprintTransitions()`, `useUsersSearch()` hooks with generated types ✅
- All 8 mutation hooks: `useCompleteStage`, `useCompleteSubStage`, `useReturnStage`, `useReturnSubStage`, `useOverrideAssignment`, `useSuspendTask`, `useResumeTask`, `useCancelTask` with cache invalidation + localized toast ✅
- Query key factory extended: `tasks.slaHealth`, `tasks.timeline`, `tasks.returns`, `blueprints.transitions`, `users` namespace ✅
- Title & Meta card with badge row (priority/classification/status/SLA), localized title, ref with `display_id`, description, copy button ✅
- Stage Timeline: vertical `<ol>` with completed (emerald check), active (blue pulse + SLA inline + action buttons), pending (grey), returned (undo arrow + reason) nodes ✅
- Sub-stage checklist with complete/override actions for active assignees ✅
- Sidebar Details card with dual Hijri+Gregorian dates, stage progress by status, initiator/blueprint/department ✅
- Sidebar Recent Activity card (last 5 events via `buildStageActivities`) + full audit trail Dialog ✅
- CompleteStageDialog, ReturnStageDialog (pre-filtered transitions + stage name resolution), OverrideAssignmentDialog (current assignee Select + debounced user combobox) ✅
- TaskLifecycleDialog (AlertDialog for suspend/cancel with required reason) ✅
- TaskTopBarActions in PageHeader (suspend/resume/cancel/advance, capability-gated) ✅
- Board row/card hover prefetch for task detail ✅
- Breadcrumb moved to SiteHeader with pathname-based auto-resolution + `rtl:rotate-180` chevrons ✅
- `PageHeader` shared component (title + description + actions) ✅
- i18n: ~100 keys in `tasks.detail` namespace including toast messages, activity types, time formatting ✅
- `TaskDetail` display store (Zustand) for sharing `display_id` between page and header breadcrumb ✅
- 86 tests across task-detail (5), stage-timeline (7), recent-activity-card (5), plus board + badge + utils tests ✅
- MSW handlers for task detail, SLA health, timeline, blueprint transitions, users search ✅
- Regenerated OpenAPI types for `display_id` field ✅

**Established by 004:**
- **Stage timeline pattern:** Vertical `<ol>` inside a Card, sorted by `entered_at`. Connecting line is an `::before` pseudo-element at `start-[17px]`. Node icon is a `size-9 rounded-full border-2` with status-driven classes (emerald/blue/slate + corresponding border)
- **Instance ID resolution:** Stage lifecycle endpoints expect `instance_id` (not `blueprint_stage.public_id`). Both `TaskStageInstanceResource` and `TaskSubStageInstanceResource` expose `instance_id`
- **Return target filtering:** `GET /v1/blueprints/{blueprintId}/transitions` returns all transitions; client-side `filterReturnTargets()` filters `transition_type === '2'` and `from_stage_id === current`. Stage names resolved from task's `stages[]` via `resolveStageName()`
- **SLA inline on active node:** Active stage node extracts its timer from `SlaTimerInstanceResource[]` by matching `stage_instance_id`; displayed via `formatSlaInline(timer, timeFmt)` with color coding (red=overdue, amber=at-risk, emerald=on-track)
- **i18n time formatting:** `TimeFmt` interface + `timeFmtFromT(t)` factory for locale-aware duration/SLA/relative-time formatting with Arabic dual-plural support (`time_day_two`, `time_hour_two`, `time_minute_two`)
- **Breadcrumb in shell header:** `SiteHeader` derives breadcrumb from pathname via `usePageBreadcrumb()` for task routes; falls back to static page title for other routes. Pages use `PageHeader` for title + description + actions
- **Toast localization:** All mutation success/error toasts use `useTranslations('tasks.detail')` — no hardcoded strings
- **Stage progress by task status:** Details card shows `status_label — current_stage of total` where label matches task status (Active/Completed/Cancelled/Suspended), not hardcoded to "Active"
- **`display_id` breadcrumb:** Task detail breadcrumb shows `display_id` (e.g. `T-2026-0001`) from API via Zustand store, falling back to URL segment UUID

**Completed (016):**
- `/tasks/new` route with `PageHeader`, `TaskCancelButton` (dirty-check dialog), and `TaskCreationForm` orchestrator ✅
- `/tasks/[publicId]/edit` route with `EditPageTitle` (display_id), `TaskEditActions` (Cancel + Delete Draft), and `TaskCreationForm` in edit mode ✅
- Two-step creation form: Step 1 (blueprint combobox + bilingual title/description + priority/classification/due date), Step 2 (manual assignment blocks, conditional) ✅
- `useTaskFormStore` (Zustand) for multi-step form state across create and edit routes ✅
- `useCreateTask`, `useUpdateTask`, `useLaunchTask`, `useDeleteTask` mutation hooks with cache invalidation ✅
- `BlueprintCombobox` with client-side filter, "Load more", fresh mount on each open ✅
- `MultiUserCombobox` with debounced user search, batch-resolve via `public_ids[]`, chips with remove ✅
- `ManualAssignmentBlock` for Stage 1 manual-at-launch stages and sub-stages ✅
- `PrioritySelect`, `ClassificationSelect` (capability-gated), `DueDateField` (Hijri display) ✅
- `TaskFormFooter` with summary grid, Save Draft, and Launch buttons ✅
- `TaskFormSkeleton` matching form layout for edit loading state ✅
- `TaskEditActions` in PageHeader with dirty-check Cancel and initiator-only Delete Draft ✅
- `TaskCancelButton` client component for dirty-state-aware cancel navigation ✅
- `DeleteDraftDialog` and `CancelDiscardDialog` wrappers around shared `ConfirmDeleteDialog` ✅
- `EditPageTitle` client component reading `useTaskDisplayStore` for display_id resolution ✅
- `useLaunchTask` supports backend fallback to saved `draft_manual_assignments` ✅
- Task board "Create Task" button in PageHeader actions, Quick Create link in sidebar → `/tasks/new` ✅
- Task detail page `TaskTopBarActions` shows Edit Draft + Launch for drafts, with backend fallback for manual assignments ✅
- "Drafts" filter chip on task board (`status=draft`) with backend support ✅
- i18n: `tasks.new` (~55 keys) and `tasks.create.toast` (3 keys) namespaces in both locales ✅
- All 4 states: loading skeleton, empty (no blueprints), error (toast + combobox errors), permission denied, success (toast + navigation) ✅
- `formatHijriDate` shared utility in `lib/utils/date-utils.ts`, `formatDualDate` delegates to it ✅
- `BilingualNameFields`/`BilingualDescriptionFields` updated with `onFieldChange` prop for Zustand store compatibility ✅
- 8 tests: render, launch, save draft, 422 error, edit prefill, non-draft redirect, 403, 404 ✅
- RTL: logical properties, bilingual field dir attributes, `rtl:rotate-180` on directional icons ✅

**Established by 016:**
- **Multi-step form with Zustand store:** Form state spanning two routes (create/edit) and two logical steps lives in a non-persisted Zustand store. Never API data in Zustand.
- **PageHeader action slot for form actions:** Cancel/Delete Draft buttons live in the PageHeader via client components (`TaskCancelButton`, `TaskEditActions`) rather than in the form footer. Footer only has primary actions (Save Draft, Launch).
- **Client-side blueprint filtering:** Backend lacks `search` param on blueprint list; frontend loads all pages via infinite query and filters client-side via `Command` input with `shouldFilter={false}`.
- **Batch user name resolution:** Pre-filled user IDs from `draft_manual_assignments` resolved via `GET /v1/iam/users?public_ids[]=...` batch endpoint. User names loaded before chips render — no UUID flash.
- **Draft manual assignments persistence:** Backend stores `manual_assignments` in `tasks.draft_manual_assignments` JSON column. `TaskDetailResource` exposes it. Launch endpoint falls back to saved data when body omits `manual_assignments`.
- **`assignment_type` string comparison:** Backend serializes `AssignmentType` enum via `apiValue()` → `Str::snake($this->name)`, producing `"manual_at_launch"` in responses. Frontend compares against the string name, not integer codes.
- **Cancel with dirty-state guard:** Cancel button is a client component that checks `useTaskFormStore.touched` before navigating. Shows `CancelDiscardDialog` ("Discard changes?") if the form has unsaved data.
- **Drafts on task board:** `GET /v1/follow-up/board?status=draft` returns draft tasks. The board's default behavior excludes drafts; explicit `status=draft` overrides the exclusion. Board task resource omits SLA/assignees for drafts.

## F3 — Blueprint Builder

**Status:** ✅ Done

**Completed (005):**
- `/blueprints` library with cursor-paginated table, URL filters, create/duplicate/activate/deactivate/delete ✅
- `/blueprints/[publicId]` builder with split view (canvas + properties panel), stage/sub-stage CRUD, transitions ✅
- `/blueprints/catalog` with tabs (Categories, Stage Types, SLA Policies) and CRUD dialogs ✅
- `useBlueprintsInfinite`, `useBlueprint`, `useBlueprintCategories`, `useBlueprintStageTypes`, `useBlueprintSlaPolicies` hooks ✅
- All mutation hooks: create/update/activate/deactivate/duplicate/delete blueprint; stage/sub-stage CRUD + reorder; transition CRUD; category/stage-type/sla-policy CRUD ✅
- Stage canvas with vertical stage list, flow connectors, expand/collapse sub-stage preview ✅
- Sub-stage preview on canvas with reorder + delete (hover-only actions) ✅
- Stage properties panel with 3 sections: StageForm, TransitionEditor, SubStageList ✅
- StageForm with 12 fields (name AR/EN, description AR/EN, stage type, assignment, SLA, cardinality, completion rule, escalation) ✅
- SubStageForm with 11 fields (name AR/EN, description AR/EN, SLA, assignment, cardinality, completion rule, required) ✅
- Panel mode: idle/add/edit with stateful StageForm (unsaved changes preserved across sub-stage edit) ✅
- Builder top bar: status badge, Settings, Activate/Deactivate, Duplicate (capability-gated) ✅
- Locked/read-only mode with lock banner and disabled editing ✅
- Blueprint settings dialog (edit metadata: name, category, scope, department, description) ✅
- Zustand store for builder UI state: selectedStageId, blueprintName, panelOpen, metadataDirty ✅
- Shell breadcrumb for blueprint routes with blueprint name via Zustand store ✅
- CompleteStageDialog with multi-target advance transition picker ✅
- DetailsCard stage progress uses blueprint total stage count ✅
- Sub-stage override button for non-assignees with capability ✅
- Dark mode on all blueprint badges ✅
- Shared components extracted: BilingualNameFields, BilingualDescriptionFields, RtlSelect, RtlTable, ConfirmDeleteDialog, CatalogTable ✅
- Utilities extracted: localizeName/localizeTitle to lib/utils/localize.ts, enum maps and getStagesCount/buildAssignmentFields to blueprint-utils.ts ✅
- i18n: ~120 keys in blueprints namespace + ~25 toast keys, both locales ✅
- MSW handlers for all blueprint endpoints ✅

**Established by 005:**
- **Granular mutations pattern:** Stage/sub-stage/transition CRUD is immediate API call + invalidate `detail(publicId)`; no batch save endpoint
- **Zustand for builder UI state only:** `selectedStageId`, `panelOpen`, `metadataDirty`, `blueprintName` — never API data in Zustand
- **Panel mode pattern:** `idle`/`add`/`edit` derived from `selectedStageId`; `subStageEditId` for sub-stage editing
- **Controlled form pattern:** StageForm state lifted to parent (`StagePropertiesPanel`) to preserve unsaved changes across content swaps
- **Sentinel values for nullable selects:** `'no-sla'` for SLA policy, `'none'` for escalation position — avoids Select placeholder/value conflict with empty strings
- **Inline sub-stage editing:** Sub-stage form renders in the properties panel (not a dialog), with "Back to stage" navigation
- **Canvas sub-stage preview:** Expandable ordered list with hover-only reorder/delete actions; visual hierarchy (no border/card, `group-hover:visible` actions)
- **Shared bilingual field components:** `BilingualNameFields` and `BilingualDescriptionFields` reused across 7 forms
- **RTL wrappers:** `RtlSelect` and `RtlTable` eliminate duplicate `dir={locale === 'ar' ? 'rtl' : 'ltr'}` in ~25 locations
- **Enum maps centralized:** `ASSIGNMENT_TYPE_MAP`, `CARDINALITY_MAP`, `COMPLETION_RULE_MAP`, `SLA_UNIT_MAP` in `blueprint-utils.ts`
- **`localizeName`/`localizeTitle` in shared lib:** Moved from domain utils to `lib/utils/localize.ts`
- **Mobile sheet:** Builder panel collapses to a Sheet on mobile, with `matchMedia` detection
- **SLA + escalation reset:** Selecting "No SLA" resets escalation position to "No escalation"

## F4 — Follow-up & Workflow Viz

**Status:** ✅ Done

**Completed (006):**
- `/tasks/[publicId]/workflow` route inside dashboard shell ✅
- Workflow graph with nodes per blueprint stage, sorted by `sequence_order` ✅
- Node cards showing status badges, assignees, SLA summary, sub-stage mini-list ✅
- CSS border-triangle advance arrows + SVG dashed return edges ✅
- `WorkflowTerminalNode` checkmark circle at end of flow ✅
- Legend with stage status dots, SLA health indicators, path icons, stats ✅
- `WorkflowTimelineBar` day-view timeline with colored segments and deadline markers ✅
- SLA policy display on non-active stages via blueprint fallback ✅
- Sub-stage SLA on task details page (active timer + completed policy) ✅
- Auto-scroll to active stage on mount (replaces Fit to Screen) ✅
- Horizontal `ScrollArea` from shadcn for scrollable workflow ✅
- RTL support across all components (`ltr:block`/`rtl:block`, logical properties) ✅
- Breadcrumb for workflow route in `SiteHeader` ✅
- Workflow entry buttons in `task-top-bar-actions.tsx` and `task-board-table.tsx` ✅
- Loading skeleton (3 sections: graph + legend + timeline bar), empty, error, 403, 404 states ✅
- 5 tests (3 visualization, 2 node) ✅
- i18n: `tasks.workflow` namespace in both locales (~55 keys) ✅

**Completed (007):**
- `/follow-up` route with `PageHeader` + `FollowUpCenter` orchestrator ✅
- `useFollowUpBoardInfinite` with 60s polling, cursor-paginated board ✅
- `useFollowUpOverdueInfinite`, `useFollowUpAtRiskInfinite`, `useFollowUpBottlenecks` hooks ✅
- `useAllFollowUpActions`, `useFollowUpActions`, `useCreateFollowUpAction` hooks ✅
- `useEscalationsInfinite`, `useCreateEscalation`, `useResolveEscalation` hooks ✅
- Query key factory extended: `followUp` + `escalations` namespaces ✅
- 4 stat cards (Scope, At Risk, Overdue, Today) with page-local counts + tinted borders ✅
- Dismissible overdue alert banner with "View All" action ✅
- URL-driven filters (quick chips, debounced search, sort, advanced Sheet) ✅
- Desktop 6-column follow-up board with SLA accent + actions dropdown ✅
- Mobile card list with matching information hierarchy ✅
- Bottleneck panel (top 3 preview + "View All" Dialog, clickable items -> URL filters) ✅
- Recent actions panel (cross-task endpoint, 3-line ActionEntry, "View All" Dialog) ✅
- Escalations panel (timeline feed, Open/Resolved tab, resolve action) ✅
- LogFollowUpDialog, EscalateDialog, ResolveEscalationDialog ✅
- All 4 states per component (loading skeleton, empty, error, no-permission) ✅
- 8 mutation hooks with `ApiRequestError` handling showing backend error messages ✅
- Dark mode on all panels and cards ✅
- i18n: `followUp.*` namespace in both locales (~80 keys) ✅
- MSW handlers for all follow-up and escalation endpoints ✅

**Established by 006:**
- **Graph model as pure utility:** `buildWorkflowNodes()` and `buildWorkflowEdges()` are pure functions with no React dependencies; memoized via `useMemo`.
- **Two-tier SLA policy fallback:** Live timer's `sla_policy` checked first; blueprint stage's `sla_policy` as fallback when no timer exists (completed stages).
- **Sub-stage SLA matching:** Look up `slaTimers` by `t.sub_stage_instance_id === subStage.instance_id` using auto-increment IDs (not UUID) after backend resource fix.
- **API value matching:** Enum fields from backend use `apiValue()` which returns lowercase strings (`'return'`, `'breached'`, `'warning'`) — frontend compares against these, not raw integer values.
- **CSS border-triangle arrows:** Replace Lucide icons with pure CSS `border-l-*`/`border-r-*` triangles for advance/return arrows, with separate LTR/RTL elements swapped via `ltr:block`/`rtl:block` utilities.
- **Bidirectional return indicator:** When return transitions exist, show `ArrowLeftRight` icon instead of advance arrow between affected node pairs.
- **ScrollArea for horizontal overflow:** Use shadcn `ScrollArea` with `dir` prop for RTL-aware horizontal scrolling instead of raw `overflow-x-auto`.
- **Auto-scroll to active stage:** `useEffect` with `scrollIntoView` on mount, replacing fit-to-screen button.
- **Skeleton as 3-section layout:** Graph card + legend card + timeline bar card, each matching the real component's shape and dimensions.
- **Legend documenting state model:** All 5 stage statuses + 3 SLA health states + path icons + optional stats, grouped by category with separators.
- **Timeline bar as client-side computation:** Day ranges, duration labels, deadline markers all computed from existing `task.stages`, `blueprint.stages`, and `slaTimers` — no new endpoints.
- **Entry points for workflow navigation:** Workflow button in task top-bar actions and dropdown menu in task board table row actions.

**Established by 007:**
- **Follow-up center as orchestrator pattern:** `FollowUpCenter` composes independent panels that each own their query lifecycle; no shared query state between panels.
- **Stats from loaded data only:** Stats derive from currently-loaded board rows (page-local counts), not a separate summary endpoint.
- **Cross-task actions endpoint:** `GET /v1/follow-up/actions` replaces per-task aggregation for the recent actions panel.
- **Escalation error handling:** Mutations check for `ApiRequestError` and display the backend's localized error message instead of a generic translation.
- **Board query key reuse:** Follow-up board reuses `taskBoard.list` query key (shared cache with `/tasks`) but adds its own 60s polling via `refetchInterval`.
- **Unknown narrowing adapters:** `getBottleneckEntities()` narrows `BottleneckResource.stage_type`/`.department` from `unknown` to typed entities where OpenAPI schemas are incorrect.
- **Action type normalization:** `actionTypeKey()` handles both integer (1-5) and string (`phonecall`, `message`, etc.) action type formats.

## F6 — Admin, Org, Help, Onboarding

**Status:** 🔄 In Progress

**Completed (008):**
- `/organization` route with URL-driven tabbed workspace (Overview/Departments/Positions/Grades/Calendars) ✅
- `useDepartmentTree()`, `useDepartmentsInfinite()`, `usePositionsInfinite()`, `useAuthorityGrades()`, `useWorkingCalendars()`, `usePublicHolidays()` hooks with generated types ✅
- All mutation hooks organized in `use-organization.ts` (create/update/deactivate/reactivate/delete for all 5 entities) ✅
- Query key factory extended with `organization` namespace (backward-compatible with existing task-board department picker) ✅
- **Overview tab:** visual org chart with gradient avatar cards, connector lines, stat cards (derived from positions list), zoom controls, two-column layout (chart left + selected department's positions right) ✅
- **Departments tab:** tree panel + flat cursor-paginated table + CRUD dialogs (form with bilingual name + parent select, deactivate-with-cascade dialog) ✅
- **Positions tab:** cursor-paginated table + mobile card list + CRUD dialogs (bilingual title, department/grade/reports-to selects, head checkbox, transfer dialog, detail drawer) ✅
- **Authority Grades tab:** bounded list + CRUD dialog (rank + bilingual name + description); delete disabled when grade has active positions ✅
- **Working Calendars tab:** calendar cards grid + CRUD dialog (working-days ToggleGroup starting Saturday, time inputs, GCC timezone select) + nested Public Holidays sub-view with year filter ✅
- **5 form dialogs** (Department, Position, Grade, Working Calendar, Public Holiday) with ApiRequestError validation display ✅
- **PositionDetailDrawer** (Sheet) for position details (status, grade, department, occupant, reports-to) ✅
- **Unified confirmation dialogs** with threatening descriptions (`dialogs.confirm_delete_desc`, `confirm_deactivate_desc`, `confirm_reactivate_desc`) across departments, positions, grades, and calendars ✅
- **Capability-gated actions** (`organization.manage`) on all mutating buttons and action menus ✅
- **All 4 states:** loading skeleton (per-tab variants), empty states, error with retry, 403 permission-denied, success ✅
- **i18n:** ~174 keys in `organization` namespace, both locales (AR + EN) ✅
- **RTL:** logical Tailwind properties, Sheet `end-3` close button fix, Select `position="popper"` on all selects, Arabic day names, Saturday-first week order ✅
- **MSW handlers:** `__tests__/mocks/organization-handlers.ts` (250 lines, all endpoints) ✅
- **5 test files:** overview, departments, positions, grades, calendars panel tests (11 tests) ✅
- **DRY refactors:** `PermissionDenied`, `VacantBadge`, `LoadMoreButton` shared components; `extractApiErrors`, `groupPositionsByDept` shared utils ✅

**Established by 008:**
- **Visual org chart pattern:** Gradient avatar cards with initials, tiered layout with CSS connector lines, progressive disclosure via click, zoom controls (`ZoomIn`/`ZoomOut`). Works for org chart browsing, not just list trees.
- **Two-column overview layout:** Chart on left (flex-1) for browsing, right panel (380px) for selected department's positions. Replaces toggle between list/chart views.
- **Collapsible positions per department:** Positions rendered as `Card size="sm"` sub-cards, collapsed by default, toggled per department card click.
- **Select `position="popper"` standardization:** Every `SelectContent` across all dialogs uses `position="popper"` for consistent popover behavior (avoids inline scroll-lock issues).
- **Sheet close button RTL fix:** `end-3` instead of `right-3` in base `sheet.tsx` — single source of truth for all sheets (3 domain sheets + sidebar).
- **Unified threatening confirmation pattern:** All delete/deactivate/reactivate dialogs share `dialogs.confirm_delete_desc` / `confirm_deactivate_desc` / `confirm_reactivate_desc` with `{name}` interpolation.
- **Boolean normalization with `asBool()`:** Backend serializes booleans natively but OpenAPI/mock may use strings — `asBool()` handles `true`, `'1'`, `1`, `'true'` consistently across all components.
- **Flattened tree for selects:** Department tree (roots only from API) recursively flattened via `flattenTree()` utility for department-picker selects.
- **Holiday query invalidation:** Prefix match without trailing `undefined` — invalidation key `['organization', 'working-calendars', calId, 'holidays']` matches all year-filtered query keys.
- **DRY shared components pattern:** Domain-local shared components (`PermissionDenied`, `VacantBadge`, `LoadMoreButton`) avoid coupling to shared/ while eliminating 15+ duplicated code blocks.

---

## Dependency Map

```
F0: Scaffold & Design System
  └── Design tokens, shell layout, API client ────────────────┐
                                                               ↓
F1: App Shell, Auth, i18n/RTL ──────────────────────────────────┐
  └── Login flow, route protection, locale routing             │
                                                               ↓
F2: Task Board & Task Details ─────────────────────────────────┤
  └── Data table, task card, stage timeline                    │
                                                               ↓
F3: Blueprint Builder ──────────────────────────────────────────┤
  └── Visual editor, stage nodes, transition arrows            │
                                                               ↓
F4: Follow-up & Workflow Viz ───────────────────────────────────┤
  └── Follow-up board, action log, workflow diagram            │
                                                               ↓
F5: Dashboards & Analytics ─────────────────────────────────────┤
  └── Stat cards, charts, department health                    │
                                                               ↓
F6: Admin, Org, Help, Onboarding ───────────────────────────────
```

---

## Rules for the AI Agent

- Never implement ⬜ specs without explicit instruction
- Do not implement F1+ until F0 complete
- Do not implement a frontend spec until all `Requires backend specs` are `Contract status: stable`
- Mocks allowed on feature branches with `// MOCK` comments
- Update this file when specs move to 🔄 or ✅
- When a milestone completes, extract **Established Patterns** from completed specs into the milestone section (mirrors backend's `Established by NNN` format)

---

→ **Next:** [architecture.md](architecture.md)
