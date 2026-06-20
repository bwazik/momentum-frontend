# Implementation Roadmap — Momentum Frontend

> Frontend execution plan. Spec IDs align with `../backend/docs/ai/roadmap.md` where paired.

---

## Current Focus

**Phase:** F3 — Blueprint builder
**Active spec:** `005-blueprint-builder`
**Next:** `006-workflow-visualization`

---

## Milestone Overview

| # | Name | Status | Requires Backend |
|-------|------|--------|------------------|
| F0 | Scaffold & design system | ✅ Done | — |
| F1 | App shell, auth, i18n/RTL | ✅ Done | M2 backend (IAM) |
| F2 | Task board & task details | ✅ Done | M4 backend |
| F3 | Blueprint builder | ⬜ Not Started | M3 backend |
| F4 | Follow-up & workflow viz | ⬜ Not Started | M4–M5 backend |
| F5 | Dashboards & analytics | ⬜ Not Started | M6 backend |
| F6 | Admin, org, help, onboarding | ⬜ Not Started | M1–M2, M7 backend |

**Legend:** ✅ Done · 🔄 In Progress · ⬜ Not Started · 🚧 Blocked

---

## Frontend Spec Catalog

| Spec | Milestone | Domain | Requires backend specs | Status |
|------|-----------|--------|------------------------|--------|
| `001-core-shell` | F1 | Core | `003-iam-abac`, `008-notifications`, `011-search-discovery` | ✅ |
| `002-executive-dashboard` | F5 | Analytics | `009-analytics-reporting` | ⬜ |
| `003-task-board` | F2 | Tasks | `005-task-execution`, `014` | ✅ |
| `004-task-details` | F2 | Tasks | `005`, `006`, `012`, `013` | ✅ |
| `005-blueprint-builder` | F3 | Blueprints | `004-blueprint-engine` | ⬜ |
| `006-workflow-visualization` | F4 | Workflow | `006-stage-lifecycle` | ⬜ |
| `007-follow-up-center` | F4 | Follow-up | `007`, `010-follow-up-board` | ⬜ |
| `008-organization-structure` | F6 | Organization | `002-organization-structure` | ⬜ |
| `009-analytics-reporting` | F5 | Analytics | `009-analytics-reporting` | ⬜ |
| `010-system-administration` | F6 | Platform | `001`, `003`, `015` | ⬜ |
| `011-help-center` | F6 | Support | `020-help-center` | ⬜ |
| `012-department-manager-dashboard` | F5 | Analytics | `009-analytics-reporting` | ⬜ |
| `013-pending-approvals` | F2 | Tasks | `006-stage-lifecycle` | ⬜ |
| `014-team-capacity-workload` | V2 | Analytics | `009` (V2 workload) | ⬜ Deferred V2 |
| `015-staff-performance-hub` | V2 | Analytics | `009` (V2) | ⬜ Deferred V2 |
| `016-notifications-search` | F1 | Core | `008`, `011` | ✅ (merged into `001`) |
| `017-user-settings-delegation` | F6 | Settings | `016` | ⬜ |

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

**Status:** ✅ Done

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
