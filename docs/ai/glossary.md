# Glossary — Momentum Frontend

> Domain terms for code, specs, and UI naming.
> Aligns with backend `../backend/docs/ai/glossary.md` and `../_blueprints/`.

---

## Core Domain

| Term | Definition | In Backend | In Frontend |
|------|------------|------------|-------------|
| **Blueprint** | Reusable workflow template (stages, SLAs, assignments) | `Blueprint` model | Blueprint builder screen (`/blueprints`), read-only after lock |
| **Blueprint Stage** | A named phase within a blueprint definition | `BlueprintStage` | Stage card on the builder canvas, editable in properties panel |
| **Blueprint Sub-stage** | An internal step within a blueprint stage | `BlueprintSubStage` | Sub-stage form in builder properties panel, ordered list |
| **Blueprint Transition** | Advance or return path between blueprint stages | `BlueprintTransition` | TransitionEditor component, integer codes (1=advance, 2=return) |
| **Task** | Single work instance launched from a Blueprint | `Task` model | Task board row, task details page |
| **Stage Instance** | A runtime instance of a blueprint stage on a task | `TaskStageInstance` | Stage timeline node (`instance_id` for API calls) |
| **Sub-stage Instance** | A runtime instance of a blueprint sub-stage on a task | `TaskSubStageInstance` | Sub-stage checklist item within stage detail |
| **SLA Policy** | Reusable timer definition (hours/days) | `SlaPolicy` | SLA badge, duration display in blueprint builder catalog |
| **SLA Health** | Status of an SLA timer (on track, at risk, overdue, suspended) | `SlaTimerInstance` | SlaBadge (color + text), inline on active stage node |
| **Escalation** | SLA breach or manual elevation to manager | `Escalation` | Escalation alert, follow-up center action |
| **External reference** | Link to correspondence/contract number | `TaskExternalReference` | Reference tag on task card, search filter |
| **Display ID** | Human-readable task identifier (e.g. `T-2026-0001`) | `Task.display_id` | Task detail breadcrumb, Title & Meta card; shared via `useTaskDisplayStore` |

---

## Organization & Access

| Term | Definition | In Backend | In Frontend |
|------|------------|------------|-------------|
| **Tenant** | Organization using the platform (isolated DB) | `tenants` (central) | Branding, logo, `--color-primary` CSS variable |
| **Position** | Configurable job slot, not a user | `positions` | Assignee display, org chart node |
| **Authority grade** | Seniority tier (rank 1 = highest) | `authority_grades` | Admin UI, position configuration |
| **Capability** | Named ABAC permission | `capabilities.key` | `useCapability()` hook, hide/disable UI actions |
| **Monitoring scope** | Follow-up visibility grant | `monitoring_scope_grants` | Board filter scope, visible task set |
| **Delegation** | Temporary authority transfer | `delegations` | Delegation badge on user, OOO indicator |

---

## Account Types

| Value | Meaning | Frontend Context |
|-------|---------|-----------------|
| `internal_user` | Normal employee | Default dashboard view |
| `tenant_admin` | Tenant system administrator | Admin panel access |
| `external_auditor` | Read-only via audit grants | Limited UI, read-only surfaces |
| `platform_admin` | Gov TMS operator (central) | Platform admin panel (separate layout) |

---

## Task Status

| Value | Meaning | Badge Variant | Color Token |
|-------|---------|---------------|-------------|
| `draft` | Created, not launched | `secondary` | `slate` |
| `active` | In progress | `default` | `blue` |
| `suspended` | Paused (SLA timers paused) | `outline` | `slate` |
| `completed` | All stages done | `success` | `emerald` |
| `cancelled` | Terminated with reason | `destructive` | `red` |

---

## SLA Health

| Value | Meaning | Text Label (AR) | Text Label (EN) | Color |
|-------|---------|-----------------|-----------------|-------|
| `green` | On track | في الموعد | On Track | `emerald-500/600` |
| `amber` | At risk (warning threshold) | قريب من الموعد | At Risk | `amber-500/600` |
| `red` | Overdue (SLA breached) | متأخر | Overdue | `red-500/600` |
| `grey` | Suspended (paused timer) | معلق | Suspended | `slate-400/500` |

**Rule:** SLA status is never color-only. Always show text label alongside color indicator.

---

## Classification

| Value | Meaning | UI Behavior |
|-------|---------|-------------|
| `public` | Normal visibility rules | Standard rendering |
| `internal` | Blocks lateral uninvolved visibility | "Internal" badge |
| `confidential` | Named access only | Lock icon, restricted detail view |

---

## Key Capabilities (Frontend Use)

| Capability | UI Effect |
|------------|-----------|
| `task.view.organization` | Org-wide task visibility on board |
| `task.view.department_touched` | Tasks that touched user's department |
| `task.view.follow_up_scope` | Follow-up board access |
| `task.manage` | Create/cancel/suspend task buttons visible |
| `task.override_assignment` | Reassign button visible on stage |
| `task.escalate` | Escalate button visible |
| `blueprint.manage` | Activate/deactivate/duplicate buttons visible |
| `analytics.view.organization` | Executive dashboard visible |
| `analytics.view.department` | Department dashboard visible |

---

## UI-Specific Terms

| Term | Meaning |
|------|---------|
| **Task board** | Filterable table of tasks (SLA, assignee, stage) |
| **Follow-up center** | Monitoring hub for follow-up specialists |
| **Blueprint builder** | Visual workflow template editor (split view: canvas + properties panel) |
| **Blueprint canvas** | Left pane of builder showing stage cards in sequence with flow connectors |
| **Properties panel** | Right pane of builder showing the selected stage's editable fields |
| **Stage timeline** | Vertical history of stage progression on task details |
| **SLA badge** | Color-coded health indicator with text label |
| **RAG status** | Red-Amber-Green department health (executive dashboard) |
| **Stat card** | KPI card with number + trend on dashboards |
| **Empty state** | Illustration + headline + CTA when no data |
| **Skeleton** | Animated placeholder matching content shape during loading |
| **PageHeader** | Reusable shared component: title + description + optional actions |
| **BilingualNameFields** | Reusable pair of Arabic (required, `dir="rtl"`) and English (optional, `dir="ltr"`) name inputs |
| **RtlSelect** | Wrapper around shadcn `Select` with automatic `dir` per locale |
| **RtlTable** | Wrapper around shadcn `Table` with automatic `dir` for RTL columns |
| **ConfirmDeleteDialog** | Reusable `AlertDialog` wrapper for destructive confirmations |
| **CatalogTable** | Shared building blocks: `ActionsDropdown`, `FormDialog`, `CatalogSkeleton` |
| **ActiveBadge** | Green/grey colored text span for active/inactive status |

---

## Component Mapping

| UI Concept | shadcn Component | Domain Component |
|------------|-----------------|-----------------|
| Data table | `Table` | `TaskBoardTable`, `BlueprintTable` |
| Filter chips | `ToggleGroup` + `Button` | `TaskBoardFilters`, `BlueprintFilters` |
| SLA indicator | `Badge` | `SlaBadge` |
| Priority pill | `Badge` | `PriorityBadge` |
| Classification badge | `Badge` | `ClassificationBadge` |
| Task status badge | `Badge` | `TaskStatusBadge` |
| Active/inactive badge | `span` | `ActiveBadge` (shared) |
| Stage node | Custom | `StageTimelineNode`, `StageCard` |
| Stage/sub-stage form | `Field` + `Select` | `StageForm`, `SubStageForm` |
| Bilingual inputs | `Field` + `Input` | `BilingualNameFields`, `BilingualDescriptionFields` (shared) |
| Stat metric | `Card` | `StatCard` |
| Confirmation | `AlertDialog` | `ConfirmDeleteDialog` (shared) |
| Form fields | `Field` + `InputGroup` + `Select` | — (use shadcn directly) |
| RTL-aware Select | `Select` | `RtlSelect` (shared, auto-dir) |
| RTL-aware Table | `Table` | `RtlTable` (shared, auto-dir) |
| Catalog CRUD | `Dialog` + `DropdownMenu` | `CatalogTable`, `ActionsDropdown`, `FormDialog` (shared) |
| Page header | Custom | `PageHeader` (shared: title + description + actions) |
| Empty state | Custom | `EmptyState` (shared: icon + headline + CTA) |
| Error state | Custom | `ErrorState` (shared: message + retry) |
| Toast | `Sonner` | — (use sonner directly) |

---

## Naming Preferences

| Use | Do not use |
|-----|------------|
| Tenant | Client, Account (in code) |
| Position | Role (for business titles) |
| Capability | Permission (in DB table names) |
| Stage | Step, Phase (in API — prefer `stage`) |
| `publicId` | `id`, `uuid` (in URLs and route params) |
| `public_id` | `id` (in API response references) |

---

## Locale

| Code | Direction | Document Attribute |
|------|-----------|-------------------|
| `ar` | RTL (default) | `<html dir="rtl" lang="ar">` |
| `en` | LTR | `<html dir="ltr" lang="en">` |

---

## URL Structure

| Route | Example |
|-------|---------|
| Dashboard | `/` |
| Login | `/login` |
| Task board | `/tasks` |
| Task details | `/tasks/[publicId]` |
| Blueprint library | `/blueprints` |
| Blueprint builder | `/blueprints/[publicId]` |
| Blueprint catalog | `/blueprints/catalog?tab=categories` |
| Follow-up center | `/follow-up` |
| Analytics | `/analytics` |
| Organization | `/organization` |
| Admin | `/admin` |

**Rule:** Locale is cookie-based (`NEXT_LOCALE`), not URL-based. Route params always use `publicId`, never internal database IDs.

---

→ **Next:** [spec-creation-guide.md](spec-creation-guide.md)
