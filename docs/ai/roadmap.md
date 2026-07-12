# Implementation Roadmap — Momentum Frontend

> Frontend execution plan. Spec IDs align with `../backend/docs/ai/roadmap.md` where paired.

---

## Current Focus

**Phase:** F6 — Admin, Org, Help, Onboarding
**Active spec:** `010-system-administration`
**Branch:** `main`

---

## Milestone Overview

| # | Name | Status | Requires Backend |
|-------|------|--------|------------------|
| F0 | Scaffold & design system | ✅ Done | — |
| F1 | App shell, auth, i18n/RTL | ✅ Done | M2 backend (IAM) |
| F2 | Task board & task details | ✅ Done | M4 backend |
| F3 | Blueprint builder | ✅ Done | M3 backend |
| F4 | Follow-up & workflow viz | ✅ Done | M4–M6 backend |
| F5 | Dashboards & analytics | ✅ Done | M6 backend |
| F6 | Admin, org, help, onboarding | 🔄 In Progress | M1–M2, M7 backend |

**Legend:** ✅ Done · 🔄 In Progress · ⬜ Not Started · 🚧 Blocked

---

## Frontend Spec Catalog

| Spec | Milestone | Domain | Requires backend specs | Status |
|------|-----------|--------|------------------------|--------|
| `001-core-shell` | F1 | Core | `003-iam-abac`, `008-notifications`, `011-search-discovery` | ✅ |
| `002-executive-dashboard` | F5 | Analytics | `009-analytics-reporting` | ✅ |
| `003-task-board` | F2 | Tasks | `005-task-execution`, `014` | ✅ |
| `004-task-details` | F2 | Tasks | `005`, `006`, `012`, `013` | ✅ |
| `005-blueprint-builder` | F3 | Blueprints | `004-blueprint-engine` | ✅ |
| `006-workflow-visualization` | F4 | Workflow | `006-stage-lifecycle` | ✅ |
| `007-follow-up-center` | F4 | Follow-up | `007`, `010-follow-up-board` | ✅ |
| `008-organization-structure` | F6 | Organization | `002-organization-structure` | ✅ |
| `009-analytics-reporting` | F5 | Analytics | `009-analytics-reporting` | ✅ |
| `010-system-administration` | F6 | Tenant Admin | `003`, `005` (priorities), `015` | ⬜ |
| `011-help-center` | F6 | Support | `020-help-center` | ⬜ |
| `012-department-manager-dashboard` | F5 | Analytics | `009-analytics-reporting` | ✅ |
| `016-task-creation-launch` | F2 | Tasks | `005-task-execution` | ✅ |
| `017-user-settings-delegation` | F6 | Settings | `016` | ⬜ |
| `019-confidential-access` | F6 | Access | `017-confidentiality-access` | ⬜ |
| `020-localization-calendar` | F6 | Core | `018-localization-calendar` | ⬜ |
| `021-onboarding-training` | F6 | Onboarding | `019-onboarding-training` | ⬜ |
| `022-platform-administration` | F6 | Platform | `001-platform-tenancy`, `001-platform-admin` | ⬜ |
| `023-task-comments` | F2 | Tasks | `013-comments-collaboration` | ✅ |
| `024-task-documents` | F2 | Tasks | `012-documents-attachments` | ✅ |
| `025-external-references` | F2 | Tasks | `014-external-references` | ✅ |

Note: Spec IDs are frontend-specific. Cross-reference backend roadmap for API dependencies.

---

## F0 — Scaffold & Design System

**Status:** ✅ Done

**Specs:** *None (scaffold only)*

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

**Specs:** `001` ✅

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

## F2 — Task Board & Task Details

**Status:** ✅ Done

**Specs:** `003` ✅, `004` ✅, `016` ✅, `023` ✅, `024` ✅, `025` ✅

**Established by 003:**
- **Board layout:** 6-column hybrid enterprise table (SLA, Task, Stage+Dept, Assignees, Time In Stage, Actions) with SLA-derived row accents and stacked avatar assignees
- **Visual hierarchy principle:** One row = one dominant color signal. SLA owns color; status/priority/classification use neutral/outline styles
- **Cursor-pointer:** Handled globally in base UI components (`button.tsx`, `toggle.tsx`, `select.tsx`, `dropdown-menu.tsx`, `command.tsx`, `sidebar.tsx`) — no per-instance overrides needed
- **Row borders on `<td>`:** Side borders (`border-s-4`) on `<td>` not `<tr>` — `<tr>` doesn't render side borders in standard table layout
- **Select scroll lock:** Radix `Select.Content` with `position="popper"` applies `body[data-scroll-locked]` CSS — avoided by using default `item-aligned` positioning
- **Badge color system:** SLA (emerald/amber/red/slate) keeps full color; Status (blue/orange/teal/rose/zinc) uses neutral outline; Priority (fuchsia/yellow) uses neutral bg + colored dot; Classification (lime/purple) uses plain text + icon

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

**Established by 016:**
- **Multi-step form with Zustand store:** Form state spanning two routes (create/edit) and two logical steps lives in a non-persisted Zustand store. Never API data in Zustand.
- **PageHeader action slot for form actions:** Cancel/Delete Draft buttons live in the PageHeader via client components (`TaskCancelButton`, `TaskEditActions`) rather than in the form footer. Footer only has primary actions (Save Draft, Launch).
- **Client-side blueprint filtering:** Backend lacks `search` param on blueprint list; frontend loads all pages via infinite query and filters client-side via `Command` input with `shouldFilter={false}`.
- **Batch user name resolution:** Pre-filled user IDs from `draft_manual_assignments` resolved via `GET /v1/iam/users?public_ids[]=...` batch endpoint. User names loaded before chips render — no UUID flash.
- **Draft manual assignments persistence:** Backend stores `manual_assignments` in `tasks.draft_manual_assignments` JSON column. `TaskDetailResource` exposes it. Launch endpoint falls back to saved data when body omits `manual_assignments`.
- **`assignment_type` string comparison:** Backend serializes `AssignmentType` enum via `apiValue()` → `Str::snake($this->name)`, producing `"manual_at_launch"` in responses. Frontend compares against the string name, not integer codes.
- **Cancel with dirty-state guard:** Cancel button is a client component that checks `useTaskFormStore.touched` before navigating. Shows `CancelDiscardDialog` ("Discard changes?") if the form has unsaved data.
- **Drafts on task board:** `GET /v1/follow-up/board?status=draft` returns draft tasks. The board's default behavior excludes drafts; explicit `status=draft` overrides the exclusion. Board task resource omits SLA/assignees for drafts.

**Established by 023:**
- **Comment card in task detail main column:** `TaskCommentsCard` renders after `StageTimeline` in the two-column task detail layout, following the existing stacked-card pattern.
- **Cursor-paginated top-level comments + inline replies:** `useInfiniteQuery` for top-level comments; `next_cursor`/`has_more` drives a manual "Load more" button. Replies are returned inline under each `CommentResource.replies` — no separate reply pagination in MVP.
- **Custom message rows (no shadcn Message/Bubble):** The shadcn registry has no `@shadcn/message` or `@shadcn/bubble` components. Built custom rows with `Avatar`, `Card`, `Button`, `Textarea` primitives matching existing task-detail styling.
- **Current-user chat-style alignment:** Own comments align to `end` (chat-style, `flex-row-reverse` + `bg-muted`); others align to `start` (`bg-background border`). Improves scanability.
- **Single-level replies only:** Reply button only on top-level comments. Reply rows have no Reply button — backend 013 enforces this.
- **Error display via sonner toasts:** All errors (422 validation, network, 500) show as sonner toasts, never inline. The `useCreateComment` hook calls `toast.error()` for all failures.
- **Mutation error scoping:** `errorSource` state tracks which composer (top-level or reply) triggered the last mutation, preventing cross-composer error display.
- **Flex max-height scroll limitation:** `ScrollArea` with `height: 100%` inside a flex item cannot resolve percentage height against the flex algorithm's assigned height in Chrome (CSS spec resolution uses *specified* `height`, not *used* height). Fixed by putting `overflow-y-auto` directly on the `max-h-[60vh]` constrained element.
- **`timeFmtFromT` uses `tasks.detail` namespace:** Time translation keys (`time_just_now`, `time_day_one`, etc.) live under `tasks.detail`, not `tasks.comments`. Components pass `useTranslations('tasks.detail')` to `timeFmtFromT`.

**Established by 024:**
- **Inline upload with Attachment states:** Upload flow replaced the separate Dialog pattern. File selected → `Attachment state="idle"` with inline description input → click upload → `state="uploading"` (shimmer on title) → removed on success or `state="error"` (red border, retry button). Matches shadcn Attachment docs.
- **Client-side pre-validation:** File type and size validated before any network request. Invalid files show `state="error"` immediately — no wasted round trip.
- **Two-tier sidebar card pattern:** Card shows first 3 items inline. "View all (N)" link opens a Dialog containing all items with a "Load more" button. Same pattern as RecentActionsPanel and EscalationsPanel in follow-up center.
- **Blob fetch for authenticated downloads:** `download_url` and `preview_url` fetched via `fetch()` with `X-Tenant` + `X-Locale` headers and `credentials: 'include'`, then served as `URL.createObjectURL()`. Direct `window.open` / `<img src>` doesn't work because the backend requires the `X-Tenant` header.
- **Single content-area tooltip:** Combined filename + metadata tooltips into one tooltip wrapping the entire `AttachmentContent`, avoiding two separate tooltips on the same row.
- **ScrollArea avoidance in dialogs:** Replaced Radix `ScrollArea` with plain `overflow-y-auto` div to avoid the `display: table` wrapper that breaks percentage width resolution inside grid layouts.
- **Delete icon as outlined danger:** Delete action button uses `variant="outline"` with `text-destructive` for a red border style without background fill.

**Established by 025:**
- **External References sidebar card:** Two-tier card pattern (3 inline → "View all" dialog with cursor pagination), `Attachment` component for reference rows matching `TaskDocumentItem` visual style.
- **Dynamic icons per reference type:** `EXTERNAL_REFERENCE_TYPE_ICONS` map (Mail, FileSignature, ScrollText, Shield, ClipboardList, ExternalLink, Store, Link2) — each reference type has a distinct Lucide icon.
- **Catalog page at `/admin/external-entities`:** Full CRUD with create/edit/deactivate/reactivate, `BilingualNameFields` + `ExternalEntityTypeSelect`, `?all=true` param for inactive entity visibility.
- **Inline entity creation:** "Add new entity" option in reference form entity select opens a secondary dialog, auto-selects the created entity on success.
- **Board filter by reference:** Debounced `ExternalReferenceFilterInput` in `BoardFilters`, URL-driven (`?externalReference=`), shared between task board and follow-up pages.
- **Global search by reference:** `useSearch` passes input as both `q` and `external_reference` in a single `/v1/search` call — matched reference metadata rendered in result rows.
- **Query invalidation with prefix matching:** `[...queryKeys.tasks.detail(publicId), 'external-references']` to match any filter variant, avoiding the `undefined` filter mismatch bug.
- **Validation via `toast.error()` project-wide:** All `FieldError` usage replaced with `toast.error()` — consistent UX across all forms; documented in coding-standards.md.
- **Dialog form init via `useEffect` + `setTimeout`:** Pattern from `CategoryManager` — resets form state on dialog open, avoids `set-state-in-effect` lint rule.

---

## F3 — Blueprint Builder

**Status:** ✅ Done

**Specs:** `005` ✅

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

**Specs:** `006` ✅, `007` ✅

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

## F5 — Dashboards & Analytics

**Status:** ✅ Done

**Specs:** `002` ✅, `009` ✅, `012` ✅

**Established by 002:**
- **Shared `StatCard` component** — Extracted `components/shared/stat-card.tsx` used by both executive dashboard and Follow-Up center. Configurable `variant`, `iconVariant`, `valueSize`, `valueSuffix`, and `subtitle` (string or ReactNode).
- **Department health micro bar** — Pure CSS stacked bar (emerald/amber/red) per department row showing task-health proportion at a glance. No chart libraries.
- **Runtime narrowing adapters** — `narrowExecutiveSummary()`, `narrowDepartmentHealthItem()`, `narrowBottleneckItem()`, `narrowDrillDownTaskItem()` convert string-serialized OpenAPI numeric fields to typed numbers using `unknown` + validation.
- **Filter forwarding to drill-downs** — URL search params from dashboard filters are forwarded to drill-down routes, preserving filtered context.
- **Filter button in PageHeader** — Reuses `AdvancedFiltersSheet` from the aging report, placed in the page header `actions` slot (same pattern as `TaskTopBarActions`).
- **Executive dashboard as home page** — The executive dashboard replaced the placeholder at `/`, making it the default landing page after login.

**Established by 009:**
- **Dedicated aging components** — `AgingReportTable` and `AgingReportCard` are purpose-built for the aging response shape, not wrappers around `BoardTable`/`BoardTaskCard`. Avoids coupling to `BoardTaskResource` which has different fields.
- **Unknown narrowing adapter** — `narrowAgingItems()` validates and types the API response at runtime, used because OpenAPI types the aging response `data` as `string[]`. Same pattern as `getBottleneckEntities()` in follow-up.
- **Reused `AdvancedFiltersSheet` with `hideFields`** — Extended the shared `advanced-filters-sheet.tsx` with an optional `hideFields` prop so the aging report can hide `stageTypeId` and `assigneeId` fields not supported by the aging endpoint. Backward-compatible — task board and follow-up don't pass it.
- **Sentinel value handling in filter selects** — All "all" placeholder sentinels in `AdvancedFiltersSheet` now treat `value === 'all'` as null/clear, preventing invalid `?departmentId=all` API params. Fixed at the source component, benefiting all consumers.
- **Working day seconds for time formatting** — `formatTimeInStage()` now accepts `workingDaySeconds` from the backend to correctly divide total working seconds by the tenant's actual working day length (e.g., 28,800s for 8h days). Falls back to calendar-day division when not provided.
- **Breadcrumb for analytics sub-routes** — `usePageBreadcrumb()` extended to handle `/analytics/*` sub-routes, showing Dashboard → Analytics → page title.
- **Aging time display** — `formatTimeSince()` computes calendar-time from `entered_at` timestamp, distinct from `formatTimeInStage()` which uses pre-computed working seconds from the follow-up board endpoint.

**Established by 012:**
- **StatCard `onClick` prop** — Extended shared `StatCard` to accept an `onClick` callback and `value: number | string` for clickable metric cards and duration display. When `value` is a string, `Intl.NumberFormat` is skipped.
- **Department auto-resolution via `/me`** — `useCurrentUser`'s `UserResource` regenerated to include `current_position`. When no `departmentId` is in the URL, the component resolves it from `user.current_position.position.department.public_id` and writes it via `router.replace`.
- **Runtime narrowing adapters for department endpoints** — `narrowDepartmentPerformance()`, `narrowTeamMember()`, and `sortTeamMembers()` convert string-serialized numeric fields and sort by overdue desc → active desc → name.
- **Capability-gated department selector** — `DepartmentSelector` is split into two code paths: org-wide users see a `RtlSelect` populated from `useDepartmentsInfinite()` (lazy-loaded in a separate sub-component); scoped users see a read-only label fetched via `useDepartment()`.
- **Skeleton retention during refetch** — The main loading check includes `isFetching` in addition to `isLoading`, keeping the skeleton visible during retries and preventing a 403 flash followed by success.
- **Breadcrumb matching sidebar groups** — `usePageBreadcrumb()` now shows the sidebar group label as the first breadcrumb segment (e.g., `Main > Tasks`, `Analytics > Department Dashboard`). Group labels are not clickable; only nav items are.
- **Department drill-down with internal skeleton** — `DepartmentDrillDownList` has its own skeleton component (`DepartmentDrillDownSkeleton`) reused in both the page-level skeleton and drill-down refetch loading states.
- **Team workload drill-down via `assignee_id`** — Each team row sets `assigneeId` URL param, which the backend passes as `assignee_id` to filter the drill-down. The param is correctly snake_case-converted in the query builder.
- **SLA health drill-down filters** — Stat cards for overdue/at-risk send `sla_health=red|amber` to the backend, which filters by SLA health value at the API level.

## F6 — Admin, Org, Help, Onboarding

**Status:** 🔄 In Progress

**Specs:** `008` ✅, `010` ⬜, `011` ⬜, `017` ⬜, `019` ⬜, `020` ⬜, `021` ⬜, `022` ⬜

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

**Remaining F6 specs:**
- `010-system-administration` — Tenant admin screens (requires `015-audit-trail` — ✅ Done on backend)
- `011-help-center` — Help center CMS screens (requires `020-help-center` — ✅ Done on backend)
- `017-user-settings-delegation` — User settings and delegation UI (requires `016-delegation-oof` — ✅ Done on backend)
- `019-confidential-access` — Confidential task access management (requires `017-confidentiality-access` — ✅ Done on backend)
- `020-localization-calendar` — Hijri calendar and localization settings (requires `018-localization-calendar` — ✅ Done on backend)
- `021-onboarding-training` — Onboarding and training module (requires `019-onboarding-training` — ✅ Done on backend)
- `022-platform-administration` — Platform-level tenant management (requires `001-platform-tenancy`/`admin` — ✅ Done on backend)

All F6 backend dependencies are now ✅ Done. No specs are blocked.

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
