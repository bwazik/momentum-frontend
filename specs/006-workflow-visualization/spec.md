# Spec: Workflow Visualization

> **Number:** 006
> **Date:** 2026-06-23
> **Status:** `completed`
> **Milestone:** F4 — Follow-up & Workflow Viz
> **Depends on:** `004-task-details`, `005-blueprint-builder`
> **Backend spec:** `../backend/specs/006-stage-lifecycle/` — `Contract status: stable`
> **Contract status:** `stable`
> **Author:** OpenCode
> **Branch:** `feat/006-workflow-visualization`
> **Base branch:** `main`

---

## Problem

Today, users understand a task's progress primarily through the vertical **Stage Timeline** on the task detail page (`/tasks/[publicId]`). While that timeline is excellent for showing chronological history, completion notes, and per-stage actions, it is not designed to answer higher-level workflow questions at a glance:

- *"How many stages are left before this task is done?"*
- *"Which stages have already been completed, and who completed them?"*
- *"Where can this task be returned to, based on the blueprint?"*
- *"What does the overall workflow shape look like for this blueprint?"*
- *"Which stage is currently active and is its SLA healthy?"*

For government and enterprise workflows, tasks often have 5–15 stages with return loops, parallel departments, and SLA-critical handoffs. A dedicated **workflow visualization** view gives directors, follow-up specialists, and assignees a map of the task's journey and remaining path, reducing the cognitive load of reading a chronological list.

This screen is **read-first**; it surfaces the blueprint's intended flow overlaid with the task's actual execution state.

---

## Goal

Deliver a **Workflow Visualization** page for a single task that renders the task's blueprint as a directed flow diagram: stages as cards, advance arrows showing the forward path, return-path arrows showing allowed backward transitions, and visual indicators for status, assignees, sub-stages, and SLA health. The view must work in Arabic RTL and English LTR, handle loading/error/empty states, and reuse established components from task details and the blueprint builder.

---

## User Stories

### Stage Assignee

- As a **stage assignee**, I want to see where my active stage sits in the overall workflow, so that I understand what has been completed and what comes next.
- As a **stage assignee**, I want to see which earlier stages a task can be returned to, so that I know the valid return path before I initiate a return.

### Task Initiator / Requester

- As a **task initiator**, I want a visual summary of my task's progress, so that I can report status without reading every stage detail.
- As a **task initiator**, I want to see who is currently responsible for the active stage, so that I know whom to follow up with.

### Follow-up Specialist / Manager

- As a **follow-up specialist**, I want to identify bottleneck stages and overdue SLAs in a workflow diagram, so that I can prioritize interventions.
- As a **manager**, I want to see the full executed path and remaining path of a task, so that I can verify compliance with the approved blueprint.

### System

- As the **system**, I want to render the workflow from existing stable endpoints only, so that no new backend contract is required for MVP.

---

## Acceptance Criteria

### Workflow Diagram

- [x] Navigating to `/tasks/[publicId]/workflow` renders the workflow visualization inside the dashboard shell.
- [x] The page header shows the task title (localized), `display_id`, and a link back to task details.
- [x] The diagram displays one node per **blueprint stage**, sorted by `sequence_order`.
- [x] Each node shows:
  - Localized stage name
  - Stage type label
  - Status badge: Completed (emerald), Active (blue + pulse), Pending (slate), Returned (slate), Skipped (slate)
  - Primary assignee name(s) or avatar stack
  - SLA summary (live timer on active, policy definition on others)
  - Sub-stage mini-list for the active stage
- [x] Completed and active stages use real instance data; pending use blueprint definition data.
- [x] Advance arrows connect consecutive stages (CSS border triangles, RTL-aware).
- [x] Return-path arrows drawn from stages with `return` transitions back to earlier stages.
- [x] Return arrows use dashed/amber style.
- [x] A terminal node is shown after the final stage when the task is completed.
- [x] Legend explains node colors, SLA health, return path, and terminal node, plus stats (avg completion time, total SLA).
- [x] Access via "Workflow" button in `task-top-bar-actions.tsx` and dropdown menu in `task-board-table.tsx`.

### SLA & Status

- [x] Active stage node extracts live SLA health from `useTaskSlaHealth`.
- [x] Active card always shows blue border/badge; SLA urgency shown via colored text (red/amber/emerald).
- [x] SLA text includes a text label (never color-only) with `aria-live="polite"`.
- [x] Non-active stages show SLA policy definition (e.g., "SLA: 7 days") from timer or blueprint fallback.
- [x] Hover tooltip shows entered_at, exited_at, duration, assignees, or "Not started yet" for pending stages.
- [x] Sub-stages on task details page show live SLA timer for active sub-stages and policy for completed ones.

### Interactions (MVP — Read-First)

- [x] Clicking a stage node navigates to the corresponding stage in the task detail timeline.
- [x] No action buttons on workflow nodes (read-first MVP).
- [x] Auto-scroll to active stage on mount instead of Fit to Screen button.

### Responsive & RTL

- [x] Desktop: horizontal flow diagram (LTR left-to-right, RTL right-to-left).
- [x] Tablet: horizontally scrollable via shadcn `ScrollArea` + `ScrollBar`.
- [x] Mobile: vertical stacked view.
- [x] Directional arrows flip via `ltr:block`/`rtl:block` CSS utility classes.
- [x] All layout uses logical Tailwind properties (`ms-`, `me-`, `ps-`, `pe-`, `text-start`, `border-s`).

### States

- [x] **Loading:** full-page skeleton matching diagram + legend + timeline bar shape.
- [x] **Empty:** icon + "No workflow defined" + CTA to task details.
- [x] **Error:** message + retry button.
- [x] **Success:** nodes, edges, legend, timeline bar, stats.
- [x] **403:** lock icon + no-permission message.
- [x] **404:** file-question icon + not-found message.

---

## Technical Requirements

> Reference: `docs/ai/coding-standards.md`

### Data Fetching

- [x] Primary query hook: reuse `useTaskDetail(publicId)` from `lib/api/hooks/use-task-detail.ts` — it returns the task with embedded `stages`, `blueprint.stages`, and `blueprint.transitions`.
- [x] Secondary query hook: `useTaskSlaHealth(publicId)` to overlay live SLA health on the active stage node.
- [x] **Extra:** The orchestrator also fetches `useBlueprint(blueprintPublicId)` to get the full blueprint (with complete SLA policies) when the task's embedded blueprint data is partial.
- [x] No cursor pagination: blueprint stages per task are bounded (<50).
- [x] Prefetch: none required in MVP; the page relies on client-side fetch.
- [x] Cache invalidation: mutations are not exposed on this page (read-only MVP).

### State Management

- [x] **URL search params:** not used — no view mode toggle implemented.
- [x] **Zustand:** minimal usage — `useTaskDisplayStore` for syncing `display_id` to the breadcrumb.
- [x] **Local state:** tooltip open/close (handled by shadcn `Tooltip`), selected node highlight via `useState`.

### Query Key Structure

Uses the centralized factory in `lib/api/query-keys.ts`:

```ts
queryKeys.tasks.detail(publicId)
queryKeys.tasks.slaHealth(publicId)
queryKeys.blueprints.detail(blueprintPublicId)
```

### Mutation Patterns

- [x] MVP is read-first — no mutations introduced in this spec.

### Error Handling

- [x] 401 → global redirect to `/login` (handled by `QueryCache.onError`).
- [x] 403 → inline no-permission empty state.
- [x] 404 → task not found empty state.
- [x] 500 / network → `ErrorState` with retry button that refetches the detail query.

---

## UI Requirements

> Reference: `docs/design-system/01-tokens.md`, `03-components.md`, `04-layout-patterns.md`, `05-accessibility.md`, `06-anti-patterns.md`

### Component Breakdown

| Component | Type | Source | Notes |
|-----------|------|--------|-------|
| `WorkflowVisualization` | Client | Domain | Orchestrator: queries, 4 states, page shell; additionally fetches `useBlueprint` for SLA policy fallback |
| `WorkflowGraph` | Client | Domain | Renders nodes + edges, ScrollArea for horizontal scroll, auto-scroll to active stage on mount |
| `WorkflowNode` | Client | Domain | Single stage card reused across diagram; includes `WorkflowNodeSla` and `WorkflowNodeTooltip` sub-components |
| `WorkflowEdge` | Client | Domain | Exports `WorkflowAdvanceArrow` (CSS border triangles), `WorkflowTerminalNode` (checkmark circle), `WorkflowReturnEdges` (SVG dashed amber paths) |
| `WorkflowLegend` | Client | Domain | Explains node status colors, SLA health indicators (On Track / At Risk / Overdue), advance/return edges, terminal node, and optional stats (avg completion time, total SLA) |
| `WorkflowSkeleton` | Client | Domain | Full-page skeleton matching diagram + legend + timeline bar shape |
| `WorkflowTimelineBar` | Client | Domain | Day-view horizontal bar rendering stage durations with color-coded segments (emerald=completed, blue=active, amber=at-risk, red=overdue, slate=returned); includes deadline markers and duration labels |
| `PageHeader` | Shared | `components/shared/page-header.tsx` | Title + description + back-to-details link |
| `AssigneeAvatarStack` | Domain | `components/domain/tasks/assignee-avatar-stack.tsx` | Assignee display on nodes |
| `EmptyState` / `ErrorState` | Shared | `components/shared/` | Empty and error states |
| `ScrollArea` | UI | shadcn `scroll-area` | Horizontal scroll for the workflow graph |

### States

| State | Component | Pattern |
|-------|-----------|---------|
| Loading | `WorkflowSkeleton` | 3 sections: graph card (5 node blocks + terminal circle), legend card (status dots + SLA dots + path icons + stats), timeline bar card |
| Empty | `EmptyState` | `GitBranch` icon + "No workflow defined" headline + CTA to task details |
| Error | `ErrorState` | Message + retry button that refetches task detail |
| 403 | `EmptyState` | `Lock` icon + "No permission" title + description |
| 404 | `EmptyState` | `FileQuestion` icon + "Task not found" title + description |
| Success | `WorkflowGraph` + `WorkflowLegend` + `WorkflowTimelineBar` | Render nodes, edges, legend, timeline bar, and metadata |

### Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| Mobile (<640px) | Vertical stack (`flex-col`); chevrons point down; touch targets ≥44px; legend wraps to rows |
| Tablet (640–1024px) | Horizontally scrollable diagram with `ScrollArea` + `ScrollBar` |
| Desktop (≥1024px) | Full horizontal flow diagram (`flex-row`) with legend and timeline bar below |

### RTL Considerations

- [x] Advance flow follows reading direction: LTR left-to-right, RTL right-to-left.
- [x] Use CSS logical properties for all spacing, borders, and alignment (`ms-`, `me-`, `ps-`, `pe-`, `text-start`, `border-s`).
- [x] Directional icons (chevrons, arrows) flip with `rtl:rotate-180` or are rendered using `ltr:block`/`rtl:block` CSS utility classes.
- [x] SVG edge arrowheads must be mirrored for RTL; prefer CSS transforms or bidirectional SVG markers.
- [x] Node sequence numbers do not reverse; they remain ordered by `sequence_order`.
- [x] `ScrollArea` uses `dir={locale === 'ar' ? 'rtl' : 'ltr'}` to set scroll direction for RTL.

### Accessibility

- [x] The diagram container has `role="region"` and `aria-label` describing the workflow.
- [x] Each node is a focusable link with visible focus ring (`focus-visible:ring-2`).
- [x] SLA badges use color + text label (never color-only). Active SLA text has `aria-live="polite"`.
- [x] Decorative connectors/icons are `aria-hidden="true"`.
- [x] Respect `prefers-reduced-motion` for pulse animations (`motion-reduce:animate-none`).
- [x] Keyboard users can Tab through nodes in sequence order.
- [ ] Icon-only controls (fit-to-screen, zoom) — not implemented; no such controls exist.

### Animation

- [x] Node hover: `transition-all duration-200 hover:shadow-md hover:-translate-y-0.5`.
- [x] Active node pulse: `motion-reduce:animate-none` on the status dot.
- [x] Edge/path transitions: optional `transition-opacity` on hover; avoid animating `width`/`height`.

---

## Non-Functional Requirements

### Performance

- [x] No third-party graph library — pure CSS flex + SVG edges.
- [x] Memoize the derived graph model with `useMemo` to avoid recomputation on re-renders.

### Security

- [x] Visibility is enforced by the backend (`TaskVisibilityScope`); the frontend only needs to handle 403/404 responses gracefully.
- [x] No PII in URLs or console logs.
- [x] Capability-gated optional actions not implemented in MVP.

---

## Out of Scope

- Blueprint-level workflow editor (covered by `005-blueprint-builder`).
- Creating or editing stages/transitions from the workflow view.
- Task lifecycle mutations (suspend/cancel/complete task) — remain on task details.
- Pre-computed workflow analytics (average completion time, bottleneck scores) — belongs to analytics module (Spec 009). (Note: basic `computeAvgCompletionTime` and `computeTotalSla` were implemented as legend stats.)
- Adding a third-party graph layout library (e.g., `@xyflow/react`, `elkjs`) without team discussion.
- Drag-and-drop reordering of stages.
- Real-time updates via WebSocket.
- "Fit to Screen" button — replaced with auto-scroll to active stage on mount.

---

## Open Questions — Resolved

- [x] **Route path** — Approved: `/tasks/[publicId]/workflow`. Clean breadcrumb with `display_id` as parent crumb via `useTaskDisplayStore`.
- [x] **Mobile interaction** — Approved: vertical stacked on mobile (`flex-col`), horizontal on desktop (`flex-row`). Pan/zoom deferred to V2.
- [x] **Action buttons on nodes** — Approved: read-only MVP. Nodes link back to task detail timeline with stage hash anchor. All lifecycle actions remain on task details.
- [x] **Graph rendering technology** — Approved: pure CSS flex + CSS border-triangle advance arrows + SVG return edges. No third-party graph library.
- [x] **Skipped stages** — Approved: slate styling (same as pending/returned), not outline/dashed as initially specified.
- [x] **Return path arrows** — Approved: dashed amber SVG paths drawn from returning stage back to target. Additionally, a bidirectional `ArrowLeftRight` icon replaces the advance arrow between consecutive nodes that have a return transition pointing to them.
- [x] **Returned node color** — Approved: slate (same as pending/skipped), not amber. Visual distinction via status badge text only.
- [x] **Fit to Screen** — Approved: replaced with auto-scroll to active stage on mount via `scrollIntoView`. No fit-to-screen button.
- [x] **SLA day-view timeline bar** — Approved: implemented as `WorkflowTimelineBar` with day-range segment labels, deadline markers, and stage duration labels below. Removed from out-of-scope.
- [x] **Legend stats** — Approved: average completion time (`computeAvgCompletionTime`) and total SLA (`computeTotalSla`) shown in legend when available.
- [x] **`transition_type` matching** — Approved: backend serializes via `TransitionType.apiValue()` which returns `'return'` string, not integer `'2'`. Frontend compares against `'return'`.
- [x] **SLA timer status matching** — Approved: backend serializes `SlaTimerStatus` via `apiValue()` returning `'breached'`, `'warning'`, `'paused'`, `'completed'`, `'running'`. `formatSlaInline` compares against these strings.
- [x] **Extra blueprint fetch** — Approved: orchestrator fetches `useBlueprint(blueprintPublicId)` for SLA policy fallback when task detail's embedded blueprint stages lack `sla_policy`.
- [x] **Sub-stage SLA** — Approved: sub-stage SLA timers shown on task details page for active sub-stages (colored live timer) and completed sub-stages (policy label). Accessed via `slaTimers?.find(t => t.sub_stage_instance_id === subStage.instance_id)`.
- [x] **Node card overflow** — Approved: `overflow-x-hidden` on the workflow page's main element to prevent page-level horizontal scroll from `min-w-max` graph content.

---

→ **Next:** This spec is complete. See `plan.md` for implementation details.
