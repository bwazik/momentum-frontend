# Spec: Task Board

> **Number:** 003
> **Date:** 2026-06-19
> **Status:** `completed`
> **Milestone:** F2 - Task board & task details
> **Depends on:** `001-core-shell`
> **Backend spec:** `../backend/specs/005-task-execution/`, `../backend/specs/007-sla-escalation/`, `../backend/specs/010-follow-up-board/`, `../backend/specs/011-search-discovery/` - `Contract status: stable`; roadmap references backend `014`, but no matching backend spec folder exists and external-reference filtering currently returns a backend domain error
> **Contract status:** `stable`
> **Author:** Codex
> **Branch:** `feat/003-task-board`
> **Base branch:** `main`

---

## Problem

Users need a single operational view of the tasks they are responsible for, monitoring, or managing. Without a task board, they can only discover work through global search, notifications, or direct links. That makes daily triage slow and unreliable, especially for government workflows where overdue stages, at-risk SLAs, active assignees, department ownership, and priority need to be scanned together.

The task board is the main entry point into task execution. It lets users find work, narrow the list by operational filters, identify SLA risk, and open task details for action.

---

## Goal

Deliver `/tasks` as a filterable, cursor-paginated operational task board inside the authenticated dashboard shell. The screen uses the stable follow-up board API (`GET /v1/follow-up/board`) because it returns board-ready task rows with title, priority, status, classification, current stage, assignees, department, blueprint category, SLA health, due date, time at current stage, and created/launched timestamps. It supports URL-driven filters, search, backend sorting, manual "Load more" pagination, and row navigation to `/tasks/[publicId]`.

---

## User Stories

### Internal User / Stage Assignee

- As an **internal user**, I want to see tasks assigned to me or visible to me, so that I can decide what to work on next.
- As a **stage assignee**, I want SLA health and current stage to be visible in the list, so that urgent work is obvious before I open details.
- As an **internal user**, I want to search task titles, so that I can find a specific task quickly.

### Manager

- As a **manager**, I want to filter tasks by department, status, priority, and SLA health, so that I can identify bottlenecks in my area.
- As a **manager**, I want to see current assignees and owning department, so that accountability is clear without opening each task.

### Follow-Up Specialist

- As a **follow-up specialist**, I want quick filters for overdue, at-risk, suspended, and active tasks, so that I can triage follow-up work.
- As a **follow-up specialist**, I want a stable board URL with filters in search params, so that I can share or revisit the same work queue.

### System

- As the **system**, I want the task board to use backend ABAC-filtered results, so that users only see tasks they are authorized to view.
- As the **system**, I want cursor pagination and query-key based cache invalidation, so that large tenant task lists remain performant and fresh.

---

## Acceptance Criteria

### Route and Page Structure

- [x] Route `/tasks` renders inside the authenticated dashboard shell.
- [x] The page header shows a breadcrumb (Dashboard › Task Board) and localized description below it.
- [x] The board fetches `GET /v1/follow-up/board` using generated OpenAPI types for `BoardTaskResource`.
- [x] The board renders inside the standard list-page layout: page header, breadcrumb, filter bar, responsive data view, and manual "Load more" pagination.
- [x] Clicking a row or card navigates to `/tasks/[publicId]` using the task `public_id`.

### Task List Content

- [x] Desktop table columns include: SLA, Task (rich cell with public_id, title, classification, status, and priority badges), Current Stage (with department subtext), Assignees, Time In Stage (with due date subtext), Actions.
- [x] Task cell shows localized title, classification badge when not public, and public id/reference text when available from the API.
- [x] Status badge shows draft, active, suspended, completed, or cancelled in localized text.
- [x] Priority badge uses the task priority resource name and severity styling with colored dot for critical/urgent.
- [x] Current stage shows localized stage name and remains empty/neutral for completed/cancelled tasks.
- [x] Assignees display current active assignees from the backend response via stacked `AvatarGroup` with tooltips on hover; overflow shows `+N`.
- [x] SLA health uses text plus color for on track, at risk, overdue, suspended, and none.
- [x] Dates display at the presentation layer.

### Filters and Search

- [x] URL search params drive board filters so the view is bookmarkable and back-button friendly.
- [x] Quick filter chips include: Active, My Tasks, Overdue, At Risk, Suspended, All.
- [x] Default board view shows active operational work (`status=active`) unless the user chooses another quick filter or "All".
- [x] "All" clears the status filter and returns all backend-visible non-draft tasks, including active, suspended, completed, and cancelled tasks.
- [x] "My Tasks" maps to `assignee_id={currentUser.public_id}` on `GET /v1/follow-up/board`.
- [x] Sort dropdown with field select + ascending/descending toggle button.
- [x] Search input maps to the backend `search` filter supported by `GET /v1/follow-up/board`; debounce by 300ms via manual `setTimeout`.
- [x] Reset filters button clears all filter search params and reloads the unfiltered board.
- [x] External reference filter is omitted even though the OpenAPI query param exists, because backend `FollowUpBoardService` throws `InvalidBoardFilterException` until external references are implemented.

### Pagination

- [x] Task list uses `useInfiniteQuery` with cursor pagination.
- [x] The board shows a manual "Load more" button when `has_more` is true.
- [x] The button shows a loading state while fetching the next page and is disabled during the request.
- [x] The board does not use infinite scroll for the table.
- [x] Previously loaded rows remain visible while the next page loads.

### Responsive Behavior

- [x] Desktop (`>=768px`) renders a dense shadcn `Table`.
- [x] Mobile (`<768px`) renders task cards instead of a dense table.
- [x] Mobile cards show title, status, priority, current stage, SLA, assignees, and due date.
- [x] Filter controls wrap cleanly on small screens.

### Navigation and Actions

- [x] Row/card click opens task details at `/tasks/[publicId]`.
- [x] Keyboard users can focus a row/card and press Enter/Space to open details.
- [x] Row action menu includes "Open Details" and "Copy Link" with success toast.
- [x] The board preserves active filters when navigating to details via Next.js history.

### States

- [x] Loading state uses skeleton rows/cards matching the final layout.
- [x] Empty state appears when the API returns no tasks and includes a reset filters action.
- [x] Error state shows safe message and retry button via `ErrorState`.
- [x] 403 shows a no-permission state via `EmptyState` with title/description.
- [x] Success state renders all loaded tasks and Load More pagination.

---

## Technical Requirements

> Reference: `docs/ai/coding-standards.md`

### Data Fetching

- [x] `useTaskBoardInfinite(filters)` uses `useInfiniteQuery`, `queryKeys.taskBoard.list(filters)`, and `GET /v1/follow-up/board`.
- [x] `useTaskPriorities()` uses `useQuery`, `queryKeys.tasks.priorities()`, and `GET /v1/tasks/priorities` for the priority filter.
- [x] `useDepartments()` uses `GET /v1/organization/departments?is_active=true` for department filters.
- [x] `useBlueprintCategories()` uses `GET /v1/blueprints/categories` for blueprint category filters.
- [x] `useStageTypes()` uses `GET /v1/blueprints/stage-types` for stage type filters.
- [x] Search is represented in the same `GET /v1/follow-up/board` query filters rather than a separate client-side filtered list.
- [x] Prefetch strategy: not implemented (out of scope for this spec).
- [x] All response and filter request types come from `lib/generated/api-types.ts` (via `task-board-types.ts` re-exports); no hand-written API DTOs.

### Query Key Structure

- [x] Extend `lib/api/query-keys.ts` with:
  - `queryKeys.tasks.all`
  - `queryKeys.tasks.lists()`
  - `queryKeys.taskBoard.list(filters)`
  - `queryKeys.tasks.priorities()`
  - `queryKeys.organization.departments(filters)`
  - `queryKeys.blueprints.categories()`
  - `queryKeys.blueprints.stageTypes()`
  - `queryKeys.tasks.detail(publicId)` placeholder.
- [x] Filter objects included in query keys are memoized via `useMemo`.
- [x] No component uses hardcoded query key strings.

### State Management

- [x] Filters, search, and sort live in URL search params.
- [x] API data stays in TanStack Query only.
- [x] No task list data is stored in Zustand.
- [x] Local component state used for transient search input before debounced URL update.

### Mutations

- [x] No task mutations in the MVP task board.
- [x] Row-level actions deferred to future specs.
- [x] No optimistic updates.

### Error Handling

- [x] 401 is handled globally by the query client and redirects to `/login`.
- [x] 403 renders a no-permission `EmptyState` with title/description.
- [x] 422 filter validation errors handled by backend; frontend respects API responses.
- [x] 500/network errors render `ErrorState` with retry and do not expose stack traces.

---

## UI Requirements

> Reference: `docs/design-system/01-tokens.md`, `02-glassmorphism.md`, `03-components.md`, `04-layout-patterns.md`, `05-accessibility.md`, `06-anti-patterns.md`

### Component Breakdown

| Component | Type | Source | Notes |
|-----------|------|--------|-------|
| `TasksPage` | Server | Page | `app/(dashboard)/tasks/page.tsx`; renders page shell and translated title |
| `TaskBoard` | Client | Domain | Fetches and renders task board data |
| `TaskBoardFilters` | Client | Domain | URL-driven chips, selects, search, reset |
| `TaskBoardTable` | Client | Domain | Desktop/tablet table view |
| `TaskBoardMobileList` | Client | Domain | Mobile card list |
| `TaskBoardRow` | Client | Domain | Single desktop row with navigation |
| `TaskCard` | Client | Domain | Single mobile card with navigation |
| `SlaBadge` | Client | Domain/shared | Color + text SLA health |
| `TaskStatusBadge` | Client | Domain | Localized task status |
| `PriorityBadge` | Client | Domain | Severity-based priority display |
| `ClassificationBadge` | Client | Domain | Public/internal/confidential display |
| `TaskBoardSkeleton` | Client | Domain | Skeleton rows/cards |
| `EmptyState`, `ErrorState`, `NoPermission` | Client | Shared/domain | Reuse existing shared components if present |
| `Button`, `Badge`, `Table`, `Input`, `Select`, `DropdownMenu`, `Skeleton`, `Tooltip`, `Sheet` | Client | shadcn | Run `npx shadcn@latest docs <component>` before implementation if adding missing components |

### States

| State | Component | Pattern |
|-------|-----------|---------|
| Loading | `TaskBoardSkeleton` | 8 table skeleton rows on desktop, 5 card skeletons on mobile |
| Empty | `EmptyState` | Icon, headline, short copy, reset filters button when filtered |
| Error | `ErrorState` | Safe message and retry button |
| No Permission | `NoPermission` | Lock icon, localized message, no task data |
| Success | `TaskBoardTable` / `TaskBoardMobileList` | Loaded tasks, filters, load more button |

### Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| Mobile (<640px) | Cards; search full width; filter chips horizontally scroll or wrap; optional filter Sheet for advanced filters |
| Tablet (640-1023px) | Table with reduced secondary columns; filters wrap into two rows |
| Desktop (>=1024px) | Dense table with all columns and inline filter bar |

### RTL Considerations

- [x] All new components use only logical properties (`ms-`, `me-`, `ps-`, `pe-`, `text-start`, `text-end`, `border-s`, `border-e`).
- [x] Breadcrumb `ChevronRightIcon` uses `rtl:rotate-180`.
- [x] Table text columns align `text-start`; actions column aligns `text-end`.
- [x] Mobile cards preserve the same information hierarchy in RTL and LTR.

### Accessibility

- [x] Table uses semantic `<table>`, `<thead>`, `<th scope="col">`, and accessible row action labels.
- [x] Filter controls have labels via `sr-only` `FieldLabel` and `aria-label`.
- [x] Icon-only buttons (`...` actions, sort direction) include `aria-label`.
- [x] SLA badges include text labels with colored dot — never color-only.
- [x] Focus rings visible on interactive elements.
- [x] Keyboard users can operate filters (`Enter`), open row action menus (`Enter`/`Space`), load more, and navigate to details.
- [x] Loading states use `Skeleton` with `animate-pulse`.

### Animation

- [x] `Skeleton` uses `animate-pulse` (shadcn default).
- [x] No glass effects used on table rows or list items.
- [x] No hover lift on dense table rows.

---

## Non-Functional Requirements

### Performance

- [x] Cursor pagination with manual "Load more"; does not load all tasks at once.
- [x] Search debounced by 300ms.
- [x] Filters memoized via `useMemo` in query key dependencies.
- [x] Task deduplication via `Set` on page flattening.
- [x] No client-side filtering of server results (display-only transformations only).

### Security

- [x] Backend ABAC is the source of truth for visible tasks.
- [x] Client does not reconstruct visibility rules.
- [x] No PII written to URLs.
- [x] No `console.log` of task data.
- [x] Confidential tasks render only metadata with text classification badge.

### Testing

- [x] 6 component tests cover loading skeleton, success, empty, error, 403, and load-more states.
- [x] 20 badge tests cover SLA, status, priority, and classification variants.
- [x] 36 utility tests cover filter parsing, API mapping, assignee adapter, locale selection, time formatting, and due date formatting.
- [x] Tests cover row/card navigation via keyboard Enter.
- [x] Tests use MSW handlers for board, priorities, categories, stage types, and departments.
- [x] SLA badge tests assert text appears with correct labels.

---

## Out of Scope

- Task details page content and stage actions; covered by future `004-task-details`.
- Create task form, draft editing, launch flow, and manual assignment at launch.
- Row-level suspend/resume/cancel actions.
- External reference filtering and search until a backend `014` spec or equivalent OpenAPI endpoint exists.
- Saved views, saved searches, and user-specific board presets.
- Export to CSV/PDF.
- Realtime updates/websocket refresh.
- Analytics summaries and charts.

---

## Open Questions - Resolved

- [x] **Which exact board filter params are available?** Use `GET /v1/follow-up/board`, not basic `GET /v1/tasks`, for the operational board. Stable params are: `status` (`active`, `suspended`, `overdue`, `at_risk`, `completed`, `cancelled`), `stage_type_id`, `assignee_id`, `department_id`, `priority_id[]`, `blueprint_category_id`, `date_from`, `date_to`, `date_field` (`created_at`, `due_date`, `completed_at`), `search`, `sort_by` (`priority`, `due_date`, `created_at`, `time_at_stage`, `department`, `stage_type`), `sort_direction` (`asc`, `desc`), and `per_page`. Omit `external_reference` until backend `014` exists because backend currently rejects it.
- [x] **Should "My Tasks" map to an explicit backend filter?** Yes. Use `assignee_id={currentUser.public_id}`. ABAC still limits visibility, but the explicit filter gives users a predictable personal queue.
- [x] **Should department and blueprint category dropdowns be shown?** Yes. Use stable lookup endpoints: `GET /v1/organization/departments?is_active=true`, `GET /v1/blueprints/categories`, and `GET /v1/blueprints/stage-types`.
- [x] **Should completed and cancelled tasks be included in the default board?** No. Default the URL-less board to active operational work (`status=active`). The "All" quick filter clears `status` and shows every backend-visible non-draft task, including completed/cancelled.
- [x] **Does the board need a primary "Create Task" button?** Show a disabled/non-navigating placeholder only if product wants visual affordance; do not implement create flow here. Task creation, draft editing, launch, and manual assignment at launch remain out of scope until a create-task spec/plan.

---

-> **Next:** Review this spec. Do not create `plan.md` until the draft is approved.
