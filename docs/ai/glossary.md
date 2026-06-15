# Glossary — Momentum Frontend

> Domain terms for code, specs, and UI naming.
> Aligns with backend `../backend/docs/ai/glossary.md` and `../_blueprints/`.

---

## Core Domain

| Term | Definition | In Backend | In Frontend |
|------|------------|------------|-------------|
| **Blueprint** | Reusable workflow template (stages, SLAs, assignments) | `Blueprint` model | Blueprint builder screen, read-only after lock |
| **Task** | Single work instance launched from a Blueprint | `Task` model | Task board row, task details page |
| **Stage** | Named phase in a task lifecycle | `TaskStageInstance` | Stage timeline node, active stage indicator |
| **Sub-stage** | Internal step within a stage | `TaskSubStageInstance` | Sub-stage checklist within stage detail |
| **SLA Policy** | Reusable timer definition (hours/days) | `SlaPolicy` | SLA badge, duration display in blueprint builder |
| **Escalation** | SLA breach or manual elevation to manager | `Escalation` | Escalation alert, follow-up center action |
| **External reference** | Link to correspondence/contract number | `TaskExternalReference` | Reference tag on task card, search filter |

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
| **Blueprint builder** | Visual workflow template editor |
| **Stage timeline** | Vertical history of stage progression on task details |
| **SLA badge** | Color-coded health indicator with text label |
| **RAG status** | Red-Amber-Green department health (executive dashboard) |
| **Stat card** | KPI card with number + trend on dashboards |
| **Empty state** | Illustration + headline + CTA when no data |
| **Skeleton** | Animated placeholder matching content shape during loading |

---

## Component Mapping

| UI Concept | shadcn Component | Domain Component |
|------------|-----------------|-----------------|
| Data table | `Table` | `DataTable` (with sorting, filtering) |
| Filter chips | `Badge` + `Button` | `FilterChipGroup` |
| SLA indicator | `Badge` | `SlaBadge` |
| Priority pill | `Badge` | `PriorityBadge` |
| Stage node | Custom | `StageTimelineNode` |
| Stat metric | `Card` | `StatCard` |
| Confirmation | `AlertDialog` | — (use shadcn directly) |
| Form fields | `Form` + `Input` + `Select` | — (use shadcn directly) |
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
| Dashboard | `/ar/` or `/en/` |
| Task board | `/ar/tasks` |
| Task details | `/ar/tasks/[publicId]` |
| Blueprint builder | `/ar/blueprints/[publicId]` |
| Follow-up center | `/ar/follow-up` |
| Analytics | `/ar/analytics` |
| Organization | `/ar/organization` |
| Admin | `/ar/admin` |

**Rule:** Route params always use `publicId`, never internal database IDs.

---

→ **Next:** [spec-creation-guide.md](spec-creation-guide.md)
