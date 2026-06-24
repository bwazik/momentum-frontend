# Plan: Workflow Visualization

> **Spec:** `specs/006-workflow-visualization/spec.md`
> **Date:** 2026-06-23
> **Status:** `completed`

---

## Open Questions Resolved

- [x] **Route path** -- `/tasks/[publicId]/workflow`. Clean breadcrumb with `display_id` as parent.
- [x] **Mobile interaction** -- Vertical stacked on mobile, horizontal on desktop. Pan/zoom deferred to V2.
- [x] **Action buttons on nodes** -- Read-only MVP. Lifecycle actions remain on task details.
- [x] **Graph rendering technology** -- CSS flex + CSS border-triangle arrows + SVG return edges. No third-party library.
- [x] **Skipped stages** -- Slate styling (same as pending/returned).
- [x] **Return path arrows** -- Dashed amber SVG paths + bidirectional ArrowLeftRight indicator. Returned nodes use slate, not amber.
- [x] **Fit to Screen** -- Replaced with auto-scroll to active stage on mount.
- [x] **Timeline bar** -- Implemented as `WorkflowTimelineBar`.
- [x] **Legend stats** -- Avg completion time and total SLA added.
- [x] **transition_type matching** -- Backend returns `'return'` string via `apiValue()`, not `'2'`.
- [x] **SLA timer status** -- Backend returns `'breached'`, `'warning'`, etc., not `'3'`, `'2'`.
- [x] **Extra blueprint fetch** -- `useBlueprint` for SLA policy fallback.
- [x] **Sub-stage SLA** -- On task details page for active and completed sub-stages.

---

## Technical Approach

**One-line summary:** Build a read-only `/tasks/[publicId]/workflow` page that derives a workflow graph from the existing `useTaskDetail` + `useTaskSlaHealth` data, renders blueprint stages as a horizontal (desktop) / vertical (mobile) node diagram with SVG return-path overlays, and reuses `AssigneeAvatarStack` and existing task-detail utilities.

**Key decisions:**

- **No new API hooks.** The page reads `TaskDetailResource` (which embeds `blueprint.stages` and `blueprint.transitions`) and `TaskSlaHealthResource`. Both endpoints are stable from backend spec 006. Additionally fetches `useBlueprint(blueprintPublicId)` for SLA policy fallback on completed stages.
- **Graph model is derived in a pure utility.** `buildWorkflowNodes()` maps each `BlueprintStageResource` to its latest `TaskStageInstanceResource`, producing a stable `WorkflowNodeModel[]` that is memoized with `useMemo`.
- **CSS border-triangle arrows.** Advance arrows use CSS `border-l-*`/`border-r-*` triangles with separate LTR/RTL elements swapped via `ltr:block`/`rtl:block` utilities. Return arrows are drawn by an SVG overlay whose coordinates are measured via `ResizeObserver`. A bidirectional `ArrowLeftRight` icon replaces the advance arrow when return transitions exist.
- **Read-first MVP.** No mutations, no new capabilities check, no forms. If action buttons are added later, they must use `useCapability()` and reuse existing mutations from `use-task-detail.ts`.
- **Breadcrumb integration.** The workflow page syncs `display_id` into `useTaskDisplayStore`; `site-header.tsx` gets a new crumb pattern for `/tasks/[publicId]/workflow`. Workflow entry buttons in `task-top-bar-actions.tsx` and `task-board-table.tsx`.

---

## Component Tree

```
TaskWorkflowPage (Server) — app/(dashboard)/tasks/[publicId]/workflow/page.tsx
├── PageHeader (Client) — title + description + back-to-details link
└── WorkflowVisualization (Client) — queries, 4 states, graph layout wrapper
    ├── [Loading] WorkflowSkeleton (3 sections: graph + legend + timeline bar)
    ├── [403/404] EmptyState
    ├── [Error] ErrorState
    └── [Success]
        ├── WorkflowGraph (Client) — ScrollArea, nodes, SVG return edges, auto-scroll
        │   ├── WorkflowNode[] (Client) — stage cards with tooltip + link to task details
        │   ├── WorkflowAdvanceArrow (Client) — CSS border-triangle between nodes
        │   ├── WorkflowTerminalNode (Client) — checkmark circle after final stage
        │   ├── WorkflowReturnEdges (Client) — SVG overlay for return transitions
        │   └── ArrowLeftRight (Client) — bidirectional icon when return exists
        ├── WorkflowLegend (Client) — status dots + SLA health + path icons + stats
        └── WorkflowTimelineBar (Client) — day-view horizontal bar with colored segments

Breadcrumb rendered by SiteHeader:
Dashboard › Tasks › {display_id} › Workflow

Entry points (other pages):
- task-top-bar-actions.tsx — "Workflow" button
- task-board-table.tsx — "Workflow" dropdown menu item
```

**Server vs Client:**
- **Server:** `page.tsx` only renders `PageHeader` + `WorkflowVisualization`.
- **Client:** All graph, node, legend, skeleton, and orchestrator components (they use TanStack Query and interactivity).

---

## Affected Files

### New Files

| File | Purpose |
|------|---------|
| `app/(dashboard)/tasks/[publicId]/workflow/page.tsx` | Server route page |
| `components/domain/tasks/workflow-visualization.tsx` | Orchestrator: queries, 4 states, sets breadcrumb `display_id` |
| `components/domain/tasks/workflow-graph.tsx` | Graph container, ScrollArea, auto-scroll to active stage, SVG return edges |
| `components/domain/tasks/workflow-node.tsx` | Single stage node card |
| `components/domain/tasks/workflow-edge.tsx` | Advance arrow + terminal node + return-edge SVG |
| `components/domain/tasks/workflow-legend.tsx` | Legend bar |
| `components/domain/tasks/workflow-skeleton.tsx` | Full-page skeleton matching diagram + legend + timeline bar |
| `components/domain/tasks/workflow-timeline-bar.tsx` | Day-view horizontal bar with colored stage segments |
| `components/domain/tasks/workflow-utils.ts` | Pure graph builder (`buildWorkflowNodes`, `buildWorkflowEdges`) |
| `components/domain/tasks/workflow-types.ts` | Colocated `WorkflowNodeModel` / `WorkflowEdgeModel` re-exports |
| `__tests__/components/domain/tasks/workflow-visualization.test.tsx` | Loading + success render tests |
| `__tests__/components/domain/tasks/workflow-node.test.tsx` | Completed + active node tests |

### Modified Files

| File | Change |
|------|--------|
| `components/domain/shell/site-header.tsx` | Add `/tasks/[publicId]/workflow` breadcrumb before the generic task-detail regex |
| `components/domain/tasks/stage-timeline.tsx` | Add `id={`stage-${stage.instance_id}`}` to each timeline `<li>` so node clicks can deep-link |
| `messages/en.json` | Add `tasks.workflow` namespace (~35 keys) |
| `messages/ar.json` | Add Arabic `tasks.workflow` translations |
| `components/domain/tasks/task-top-bar-actions.tsx` | Add "Workflow" button that links to `/tasks/[publicId]/workflow` |
| `components/domain/tasks/task-board-table.tsx` | Add "Workflow" dropdown menu item in row actions |
| `components/domain/tasks/task-detail.tsx` | Pass `blueprintStages` to `StageTimeline` for SLA policy fallback |
| `components/domain/tasks/stage-timeline.tsx` | Pass `blueprintStages` through to `StageTimelineNode` |
| `components/domain/tasks/stage-timeline-node.tsx` | Add SLA policy display for completed stages via blueprint fallback; locale-aware SLA text coloring |
| `components/domain/tasks/sub-stage-list.tsx` | Pass `slaTimers` through to `SubStageItem` |
| `components/domain/tasks/sub-stage-item.tsx` | Add sub-stage SLA display for active (timer) and completed (policy) |
| `components/domain/tasks/workflow-utils.ts` | Add `computeAvgCompletionTime`, `computeTotalSla`; accept third `fullBlueprint` param for SLA fallback |
| `__tests__/mocks/handlers.ts` | Add `blueprint.stages` + `transitions` to task detail mock; add `public_id` to stage instances |
| `__tests__/mocks/handlers.ts` | Ensure `GET /v1/tasks/:publicId` returns a task with embedded `blueprint.stages` + `transitions`; ensure `GET /v1/tracking/sla/tasks/:publicId` handler exists (already present from spec 004) |

---

## Implementation Notes

### 1. Query Hooks — Reuse Existing Factory Hooks

**Summary:** No new query hooks. Reuse `useTaskDetail` and `useTaskSlaHealth` from `lib/api/hooks/use-task-detail.ts`.

**Rules applied:** `coding-standards.md` — Query key factory (no hardcoded strings), generated types only.

```ts
// lib/api/hooks/use-task-detail.ts (already exists)
export function useTaskDetail(publicId: string) {
  return useQuery({
    queryKey: queryKeys.tasks.detail(publicId),
    queryFn: () => apiClient.get<TaskDetailResource>(`/v1/tasks/${publicId}`),
    enabled: !!publicId,
    staleTime: 30 * 1000,
  });
}

export function useTaskSlaHealth(publicId: string) {
  return useQuery({
    queryKey: queryKeys.tasks.slaHealth(publicId),
    queryFn: () => apiClient.get<TaskSlaHealthResource>(`/v1/tracking/sla/tasks/${publicId}`),
    enabled: !!publicId,
    staleTime: 30 * 1000,
  });
}
```

### 2. Graph Model — `components/domain/tasks/workflow-utils.ts`

**Summary:** Pure functions that derive one node per blueprint stage and return edges from explicit blueprint transitions.

**Rules applied:** `coding-standards.md` — Utils are pure, generated types only; `coding-standards.md` — memoize expensive derivation.

```ts
import type {
  TaskDetailResource,
  TaskStageInstanceResource,
  SlaTimerInstanceResource,
  BlueprintTransitionResource,
  WorkflowNodeModel,
  WorkflowEdgeModel,
  WorkflowNodeStatus,
} from './workflow-types';

function findLatestInstance(
  stages: TaskStageInstanceResource[] | undefined,
  blueprintStagePublicId: string,
): TaskStageInstanceResource | undefined {
  if (!stages) return undefined;
  const matches = stages.filter((s) => s.blueprint_stage.public_id === blueprintStagePublicId);
  const active = matches.find((s) => s.status === 'active');
  if (active) return active;
  return matches.sort((a, b) =>
    new Date(b.entered_at || 0).getTime() - new Date(a.entered_at || 0).getTime(),
  )[0];
}

export function buildWorkflowNodes(
  task: TaskDetailResource,
  slaTimers: SlaTimerInstanceResource[] | undefined,
): WorkflowNodeModel[] {
  const blueprintStages = [...(task.blueprint?.stages ?? [])].sort(
    (a, b) => Number(a.sequence_order) - Number(b.sequence_order),
  );
  const lastIndex = blueprintStages.length - 1;

  return blueprintStages.map((stage, index) => {
    const instance = findLatestInstance(task.stages, stage.public_id);
    const status: WorkflowNodeStatus = (instance?.status as WorkflowNodeStatus) ?? 'pending';
    const isActive = status === 'active';
    const isTerminal = index === lastIndex && task.status === 'completed';
    const slaTimer = isActive && instance
      ? slaTimers?.find((t) => t.stage_instance_id === instance.instance_id && t.sub_stage_instance_id === '')
      : undefined;

    return {
      blueprintStage: stage,
      instance,
      status,
      sequenceOrder: Number(stage.sequence_order) || index + 1,
      isActive,
      isTerminal,
      slaTimer,
    };
  });
}

export function buildWorkflowEdges(
  nodes: WorkflowNodeModel[],
  transitions: BlueprintTransitionResource[] | undefined,
): WorkflowEdgeModel[] {
  const edges: WorkflowEdgeModel[] = [];
  const byStageId = new Map(nodes.map((n, i) => [n.blueprintStage.public_id, i]));

  (transitions ?? [])
    .filter((t) => t.transition_type === '2') // Backend TransitionType::Return = "2"
    .forEach((t) => {
      const fromIndex = byStageId.get(t.from_stage_id);
      const toIndex = byStageId.get(t.to_stage_id);
      if (fromIndex != null && toIndex != null && fromIndex > toIndex) {
        edges.push({ id: `${t.public_id}`, fromIndex, toIndex, type: 'return' });
      }
    });

  return edges;
}
```

### 3. Colocated Types — `components/domain/tasks/workflow-types.ts`

**Summary:** Re-export generated types used by the graph and keep the workflow-specific model types in one place.

```ts
import type {
  TaskDetailResource,
  TaskStageInstanceResource,
  SlaTimerInstanceResource,
  BlueprintTransitionResource,
} from './task-detail-types';
import type { BlueprintStageResource } from '@/components/domain/blueprints/blueprint-types';

export type {
  TaskDetailResource,
  TaskStageInstanceResource,
  SlaTimerInstanceResource,
  BlueprintTransitionResource,
  BlueprintStageResource,
};

export type WorkflowNodeStatus = 'pending' | 'active' | 'completed' | 'returned' | 'skipped';

export interface WorkflowNodeModel {
  blueprintStage: BlueprintStageResource;
  instance?: TaskStageInstanceResource;
  status: WorkflowNodeStatus;
  sequenceOrder: number;
  isActive: boolean;
  isTerminal: boolean;
  slaTimer?: SlaTimerInstanceResource;
}

export interface WorkflowEdgeModel {
  id: string;
  fromIndex: number;
  toIndex: number;
  type: 'advance' | 'return';
}
```

> In `workflow-utils.ts`, import `WorkflowNodeModel`, `WorkflowEdgeModel`, and `WorkflowNodeStatus` from `./workflow-types` instead of defining them locally.

### 4. Orchestrator — `components/domain/tasks/workflow-visualization.tsx`

**Summary:** Mirrors `TaskDetail` state handling. Syncs `display_id` to `useTaskDisplayStore`. Renders skeleton, error, empty, or graph + legend.

**Rules applied:** `coding-standards.md` — All 4 states, logical Tailwind properties, generated types, Zustand only for UI state (`display_id`).

```tsx
'use client';

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { FileQuestion, Lock, GitBranch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { useTaskDisplayStore } from '@/lib/stores/use-task-display-store';
import { useTaskDetail, useTaskSlaHealth } from '@/lib/api/hooks/use-task-detail';
import { ApiRequestError } from '@/lib/api/client';
import { WorkflowSkeleton } from './workflow-skeleton';
import { WorkflowGraph } from './workflow-graph';
import { WorkflowLegend } from './workflow-legend';
import { buildWorkflowNodes, buildWorkflowEdges } from './workflow-utils';

interface WorkflowVisualizationProps {
  publicId: string;
}

export function WorkflowVisualization({ publicId }: WorkflowVisualizationProps) {
  const t = useTranslations('tasks.workflow');
  const setDisplayId = useTaskDisplayStore((s) => s.setDisplayId);
  const detailQuery = useTaskDetail(publicId);
  const slaQuery = useTaskSlaHealth(publicId);

  useEffect(() => {
    if (detailQuery.data?.display_id) {
      setDisplayId(detailQuery.data.display_id);
    }
  }, [detailQuery.data?.display_id, setDisplayId]);

  const nodes = useMemo(
    () => (detailQuery.data ? buildWorkflowNodes(detailQuery.data, slaQuery.data?.timers) : []),
    [detailQuery.data, slaQuery.data?.timers],
  );
  const edges = useMemo(
    () => (detailQuery.data ? buildWorkflowEdges(nodes, detailQuery.data.blueprint?.transitions) : []),
    [detailQuery.data, nodes],
  );

  if (detailQuery.isLoading) return <WorkflowSkeleton />;

  if (detailQuery.isError) {
    const error = detailQuery.error;
    if (error instanceof ApiRequestError && error.status === 403) {
      return <EmptyState icon={Lock} title={t('no_permission_title')} description={t('no_permission_description')} />;
    }
    if (error instanceof ApiRequestError && error.status === 404) {
      return <EmptyState icon={FileQuestion} title={t('not_found_title')} description={t('not_found_description')} />;
    }
    return <ErrorState message={t('error')} onRetry={() => detailQuery.refetch()} />;
  }

  const task = detailQuery.data;
  if (!task) return <WorkflowSkeleton />;

  if (!task.blueprint?.stages?.length) {
    return (
      <EmptyState
        icon={GitBranch}
        title={t('empty_title')}
        description={t('empty_description')}
        action={
          <Button variant="outline" size="sm" asChild>
            <Link href={`/tasks/${publicId}`}>{t('view_details')}</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <WorkflowGraph
        nodes={nodes}
        edges={edges}
        taskPublicId={publicId}
        isTaskCompleted={task.status === 'completed'}
      />
      <WorkflowLegend />
    </div>
  );
}
```

### 5. Graph Container — `components/domain/tasks/workflow-graph.tsx`

**Summary:** Scrollable container, fit-to-screen button, node list, and SVG return-edge overlay. On mobile, nodes stack vertically; on desktop they flow horizontally following reading direction.

**Rules applied:** `coding-standards.md` — Logical properties (`ms-`, `me-`, `border-s`, `text-start`); directional icons flip (`rtl:rotate-180`); `aria-label` on icon-only buttons.

```tsx
'use client';

import { useRef, useState, useCallback } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Maximize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WorkflowNode } from './workflow-node';
import { WorkflowAdvanceArrow, WorkflowTerminalNode, WorkflowReturnEdges } from './workflow-edge';
import type { WorkflowNodeModel, WorkflowEdgeModel } from './workflow-types';

interface WorkflowGraphProps {
  nodes: WorkflowNodeModel[];
  edges: WorkflowEdgeModel[];
  taskPublicId: string;
  isTaskCompleted: boolean;
}

export function WorkflowGraph({ nodes, edges, taskPublicId, isTaskCompleted }: WorkflowGraphProps) {
  const locale = useLocale();
  const t = useTranslations('tasks.workflow');
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const handleFit = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const target = locale === 'ar' ? el.scrollWidth - el.clientWidth : 0;
    el.scrollTo({ left: target, behavior: 'smooth' });
  }, [locale]);

  return (
    <section className="relative rounded-xl border bg-card p-6" aria-label={t('diagram_title')}>
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-sm font-semibold">{t('diagram_title')}</h2>
        <Button variant="outline" size="sm" onClick={handleFit}>
          <Maximize data-icon="inline-start" className="size-4" />
          {t('fit_to_screen')}
        </Button>
      </div>

      <div ref={containerRef} className="overflow-x-auto overflow-y-hidden md:overflow-visible">
        <div className="relative flex min-w-max flex-col gap-6 md:flex-row md:items-start">
          {nodes.map((node, index) => (
            <div key={node.blueprintStage.public_id} className="flex flex-col items-center gap-4 md:flex-row md:items-start">
              <WorkflowNode
                node={node}
                taskPublicId={taskPublicId}
                isSelected={selectedNodeId === node.blueprintStage.public_id}
                onSelect={setSelectedNodeId}
              />
              {index < nodes.length - 1 && <WorkflowAdvanceArrow />}
              {index === nodes.length - 1 && (
                <WorkflowTerminalNode completed={isTaskCompleted || node.isTerminal} />
              )}
            </div>
          ))}

          <WorkflowReturnEdges edges={edges} containerRef={containerRef} />
        </div>
      </div>
    </section>
  );
}
```

### 6. Node Card — `components/domain/tasks/workflow-node.tsx`

**Summary:** Reusable stage card. Localizes name + stage type, shows status badge, assignee stack, SLA summary, and a deep-link to task details. Wraps the whole card in a `Tooltip` and a `Link`.

**Rules applied:** `coding-standards.md` — `localizeName` for bilingual data; color + text label for SLA/status; focus-visible ring; generated types.

```tsx
'use client';

import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { localizeName, getStageAssignees } from './task-detail-utils';
import { AssigneeAvatarStack } from './assignee-avatar-stack';
import type { WorkflowNodeModel } from './workflow-types';

interface WorkflowNodeProps {
  node: WorkflowNodeModel;
  taskPublicId: string;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
}

const NODE_STYLES: Record<string, { border: string; badge: string }> = {
  completed: { border: 'border-s-emerald-500', badge: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400' },
  pending: { border: 'border-s-slate-300', badge: 'bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-400' },
  returned: { border: 'border-s-amber-500', badge: 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400' },
  skipped: { border: 'border-s-slate-300', badge: 'bg-muted text-muted-foreground' },
};

function getActiveNodeClasses(timer?: WorkflowNodeModel['slaTimer']): { border: string; badge: string } {
  // status '3' = breached, '2' = warning, '4' = paused, otherwise on track
  if (timer?.status === '3') return { border: 'border-s-red-500', badge: 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400' };
  if (timer?.status === '2') return { border: 'border-s-amber-500', badge: 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400' };
  if (timer?.status === '4') return { border: 'border-s-slate-400', badge: 'bg-slate-50 text-slate-500 dark:bg-slate-900 dark:text-slate-400' };
  return { border: 'border-s-emerald-500', badge: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400' };
}

export function WorkflowNode({ node, taskPublicId, isSelected, onSelect }: WorkflowNodeProps) {
  const locale = useLocale();
  const t = useTranslations('tasks.workflow');
  const td = useTranslations('tasks.detail');
  const styles = node.status === 'active'
    ? getActiveNodeClasses(node.slaTimer)
    : (NODE_STYLES[node.status] ?? NODE_STYLES.pending);
  const name = localizeName(locale, node.blueprintStage.name_ar, node.blueprintStage.name_en);
  const stageType = node.blueprintStage.stage_type
    ? localizeName(locale, node.blueprintStage.stage_type.name_ar, node.blueprintStage.stage_type.name_en)
    : '';
  const assignees = node.instance ? getStageAssignees(node.instance.assignments) : [];
  const detailHref = node.instance
    ? `/tasks/${taskPublicId}#stage-${node.instance.instance_id}`
    : `/tasks/${taskPublicId}`;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          data-workflow-node
          href={detailHref}
          onClick={() => onSelect?.(node.blueprintStage.public_id)}
          className={cn(
            'group flex w-full md:w-56 shrink-0 flex-col gap-2 rounded-xl border-2 border-s-4 bg-card p-4 text-start shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20',
            styles.border,
            isSelected && 'ring-2 ring-primary/30',
          )}
          aria-label={t('stage_node_label', { name, status: t(`status_${node.status}`) })}
        >
          <div className="flex items-start justify-between gap-2">
            <Badge variant="outline" className={cn('gap-1.5 text-xs', styles.badge)}>
              {node.status === 'active' && (
                <span className="size-1.5 animate-pulse motion-reduce:animate-none rounded-full bg-current" aria-hidden="true" />
              )}
              {t(`status_${node.status}`)}
            </Badge>
            <span className="text-xs text-muted-foreground">{t('stage_n', { n: node.sequenceOrder })}</span>
          </div>

          <div>
            <p className="text-sm font-semibold">{name}</p>
            {stageType && <p className="text-xs text-muted-foreground">{stageType}</p>}
          </div>

          {assignees.length > 0 && (
            <div className="flex items-center gap-2">
              <AssigneeAvatarStack assignments={assignees} max={2} />
              <span className="truncate text-xs text-muted-foreground">
                {assignees.map((a) => localizeName(locale, a.user_name_ar, a.user_name_en)).join(', ')}
              </span>
            </div>
          )}

          <WorkflowNodeSla node={node} />

          {node.isActive && node.instance?.sub_stages && node.instance.sub_stages.length > 0 && (
            <div className="mt-1 space-y-1 border-t pt-2">
              {node.instance.sub_stages.slice(0, 3).map((sub) => (
                <div key={sub.instance_id} className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="truncate">
                    {localizeName(locale, sub.blueprint_sub_stage.name_ar, sub.blueprint_sub_stage.name_en)}
                  </span>
                  {sub.status === 'completed' ? (
                    <Check className="size-3 text-emerald-600" aria-hidden="true" />
                  ) : sub.status === 'active' ? (
                    <span className="size-1.5 rounded-full bg-blue-500" aria-hidden="true" />
                  ) : (
                    <span className="size-1.5 rounded-full bg-slate-300" aria-hidden="true" />
                  )}
                </div>
              ))}
            </div>
          )}
        </Link>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <WorkflowNodeTooltip node={node} />
      </TooltipContent>
    </Tooltip>
  );
}
```

### 7. SLA + Tooltip Helpers — Same File or `workflow-node.tsx`

**Summary:** `WorkflowNodeSla` picks the active timer SLA inline or the blueprint policy summary. `WorkflowNodeTooltip` formats entered/exited/duration/assignees for the hover card.

```tsx
import { formatSlaInline, formatDuration, timeFmtFromT } from './task-detail-utils';

function formatSlaUnit(unit: string, t: (key: string) => string): string {
  const isHours = unit === 'hours' || unit === '1';
  return t(isHours ? 'sla_unit_hours' : 'sla_unit_days');
}

function WorkflowNodeSla({ node }: { node: WorkflowNodeModel }) {
  const t = useTranslations('tasks.workflow');
  const td = useTranslations('tasks.detail');
  const tb = useTranslations('blueprints.builder.canvas');
  const fmt = timeFmtFromT(td);

  if (node.isActive && node.slaTimer) {
    const text = formatSlaInline(node.slaTimer, fmt);
    const isBreached = node.slaTimer.status === '3' || (text && text.includes(fmt.overduePrefix));
    return <p className={cn('text-xs', isBreached && 'text-red-600')}>{text ?? t('sla_no_policy')}</p>;
  }

  if (node.blueprintStage.sla_policy) {
    const policy = node.blueprintStage.sla_policy;
    return (
      <p className="text-xs text-muted-foreground">
        {t('sla')}: {policy.sla_value} {formatSlaUnit(policy.sla_unit, tb)}
      </p>
    );
  }

  return <p className="text-xs text-muted-foreground">{t('sla_no_policy')}</p>;
}

function WorkflowNodeTooltip({ node }: { node: WorkflowNodeModel }) {
  const locale = useLocale();
  const t = useTranslations('tasks.workflow');
  const td = useTranslations('tasks.detail');
  const fmt = timeFmtFromT(td);
  const entered = node.instance?.entered_at ? new Intl.DateTimeFormat(locale).format(new Date(node.instance.entered_at)) : null;
  const exited = node.instance?.exited_at ? new Intl.DateTimeFormat(locale).format(new Date(node.instance.exited_at)) : null;
  const duration = node.instance ? formatDuration(node.instance.entered_at, node.instance.exited_at, fmt) : null;
  const assignees = node.instance ? getStageAssignees(node.instance.assignments) : [];

  return (
    <div className="space-y-1 text-xs">
      {entered && <p>{t('tooltip_entered')}: {entered}</p>}
      {exited && <p>{t('tooltip_exited')}: {exited}</p>}
      {duration && <p>{t('tooltip_duration')}: {duration}</p>}
      {assignees.length > 0 && (
        <p>{t('tooltip_assignees')}: {assignees.map((a) => localizeName(locale, a.user_name_ar, a.user_name_en)).join(', ')}</p>
      )}
    </div>
  );
}
```

### 8. Edges — `components/domain/tasks/workflow-edge.tsx`

**Summary:** `WorkflowAdvanceArrow` uses `ChevronRight`/`ChevronDown` depending on mobile/desktop. `WorkflowTerminalNode` renders a checkmark circle when the task is completed. `WorkflowReturnEdges` draws SVG lines between node centers.

**Rules applied:** `coding-standards.md` — Directional icons flip in RTL (`rtl:rotate-180`); `aria-hidden` on decorative edges.

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WorkflowEdgeModel } from './workflow-types';

export function WorkflowAdvanceArrow() {
  return (
    <div className="flex shrink-0 items-center justify-center text-muted-foreground/50 md:rotate-0" aria-hidden="true">
      <ChevronRight className="hidden size-5 rtl:rotate-180 md:block" />
      <ChevronDown className="size-5 md:hidden" />
    </div>
  );
}

export function WorkflowTerminalNode({ completed }: { completed: boolean }) {
  const t = useTranslations('tasks.workflow');
  return (
    <div className="flex shrink-0 flex-col items-center gap-2" aria-hidden={!completed}>
      <div className={cn(
        'flex size-12 items-center justify-center rounded-full border-2',
        completed ? 'border-emerald-500 bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400' : 'border-slate-200 text-slate-300',
      )}>
        <Check className="size-6" />
      </div>
      <span className="text-xs text-muted-foreground">{t('legend_terminal')}</span>
    </div>
  );
}

export function WorkflowReturnEdges({
  edges,
  containerRef,
}: {
  edges: WorkflowEdgeModel[];
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [rects, setRects] = useState<DOMRect[]>([]);

  useEffect(() => {
    function measure() {
      const container = containerRef.current;
      const svg = svgRef.current;
      if (!container || !svg) return;
      const svgRect = svg.getBoundingClientRect();
      const nodeRects = Array.from(container.querySelectorAll('[data-workflow-node]'))
        .map((el) => el.getBoundingClientRect());
      // Convert viewport rects to SVG-local coordinates
      setRects(nodeRects.map((r) => new DOMRect(r.left - svgRect.left, r.top - svgRect.top, r.width, r.height)));
    }
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [containerRef, edges]);

  if (edges.length === 0 || rects.length === 0) return null;

  return (
    <svg
      ref={svgRef}
      className="pointer-events-none absolute inset-0 size-full overflow-visible"
      aria-hidden="true"
    >
      <defs>
        <marker id="return-arrowhead" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 L1,3 z" className="fill-amber-500/60" />
        </marker>
      </defs>
      {edges.map((edge) => {
        const from = rects[edge.fromIndex];
        const to = rects[edge.toIndex];
        if (!from || !to) return null;
        const y = from.top + 12; // near top-center
        const x1 = from.left + from.width / 2;
        const x2 = to.left + to.width / 2;
        return (
          <path
            key={edge.id}
            d={`M ${x1} ${y} C ${x1} ${y - 40}, ${x2} ${y - 40}, ${x2} ${y}`}
            fill="none"
            stroke="currentColor"
            className="text-amber-500/60"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            markerEnd="url(#return-arrowhead)"
          />
        );
      })}
    </svg>
  );
}
```

> **Note:** The return-edge measurement uses `window.resize` + `getBoundingClientRect`. In vertical/mobile layouts the current cubic-bezier may overlap nodes; tune the control points or hide return edges on mobile if needed. Mark any tuning with `<!-- TODO: verify -->`.

### 9. Legend — `components/domain/tasks/workflow-legend.tsx`

**Summary:** Row of legend items matching node/edge styles.

**Rules applied:** `coding-standards.md` — Status indicators use color + text label; no color-only communication.

```tsx
'use client';

import { useTranslations } from 'next-intl';
import { Check, ChevronRight, Undo2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const LEGEND_ITEMS = [
  { key: 'completed', dot: 'bg-emerald-500' },
  { key: 'active', dot: 'bg-blue-500' },
  { key: 'pending', dot: 'bg-slate-300' },
  { key: 'returned', dot: 'bg-amber-500' },
  { key: 'skipped', dot: 'bg-slate-200' },
] as const;

export function WorkflowLegend() {
  const t = useTranslations('tasks.workflow');

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl border bg-card p-4 text-xs text-muted-foreground">
      {LEGEND_ITEMS.map((item) => (
        <div key={item.key} className="flex items-center gap-2">
          <span className={cn('size-2.5 rounded-full', item.dot)} aria-hidden="true" />
          <span>{t(`legend_${item.key}`)}</span>
        </div>
      ))}
      <div className="flex items-center gap-2">
        <ChevronRight className="size-4 rtl:rotate-180" aria-hidden="true" />
        <span>{t('legend_advance')}</span>
      </div>
      <div className="flex items-center gap-2">
        <Undo2 className="size-4 rtl:rotate-180" aria-hidden="true" />
        <span>{t('legend_return')}</span>
      </div>
      <div className="flex items-center gap-2">
        <Check className="size-4 text-emerald-500" aria-hidden="true" />
        <span>{t('legend_terminal')}</span>
      </div>
    </div>
  );
}
```

### 10. Skeleton — `components/domain/tasks/workflow-skeleton.tsx`

**Summary:** Matches the diagram + legend shape so the layout does not jump on load.

**Rules applied:** `coding-standards.md` — Loading skeleton must match the shape of real content.

```tsx
'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function WorkflowSkeleton() {
  return (
    <div className="flex flex-col gap-6" data-testid="workflow-skeleton">
      <div className="rounded-xl border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-28" />
        </div>
        <div className="flex flex-col gap-4 md:flex-row md:gap-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-xl md:w-56 shrink-0" />
          ))}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4 rounded-xl border bg-card p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-24" />
        ))}
      </div>
    </div>
  );
}
```

### 11. Route Page — `app/(dashboard)/tasks/[publicId]/workflow/page.tsx`

**Summary:** Server page that renders `PageHeader` with a back link and the workflow orchestrator.

**Rules applied:** `coding-standards.md` — Keep route pages as Server Components; interactivity lives in imported client components.

```tsx
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/page-header';
import { WorkflowVisualization } from '@/components/domain/tasks/workflow-visualization';

export default async function TaskWorkflowPage({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;
  const t = await getTranslations('tasks.workflow');

  return (
    <main className="flex flex-col gap-4 p-6">
      <PageHeader
        title={t('page_title')}
        description={t('page_description')}
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link href={`/tasks/${publicId}`}>
              <ArrowLeft data-icon="inline-start" className="size-4 rtl:rotate-180" />
              {t('back_to_details')}
            </Link>
          </Button>
        }
      />
      <WorkflowVisualization publicId={publicId} />
    </main>
  );
}
```

### 12. Shell Breadcrumb — `components/domain/shell/site-header.tsx`

**Summary:** Add a regex for `/tasks/[publicId]/workflow` before the generic `/tasks/[publicId]` regex.

**Rules applied:** `coding-standards.md` — Breadcrumb belongs in shell; chevrons flip with `rtl:rotate-180`; logical properties only.

```tsx
const taskWorkflow = pathname.match(/^\/tasks\/([^/]+)\/workflow$/);
if (taskWorkflow) {
  return [
    { label: nav('dashboard'), href: '/' },
    { label: nav('tasks'), href: '/tasks' },
    { label: displayId || '...', href: `/tasks/${taskWorkflow[1]}` },
    { label: nav('label_workflow') },
  ];
}
```

> `nav.label_workflow` already exists in `messages/en.json` and `messages/ar.json`.

### 13. Timeline Anchors — `components/domain/tasks/stage-timeline.tsx`

**Summary:** Add an `id` to each timeline `<li>` so the node link can optionally scroll to the stage.

**Rules applied:** `coding-standards.md` — Reuse existing components; minimal, safe change to support deep-linking.

```tsx
<li
  id={`stage-${stage.instance_id}`}
  key={`${stage.blueprint_stage.public_id}-${index}`}
  className="flex gap-4"
>
```

### 14. i18n Keys

**Summary:** Add a `tasks.workflow` namespace to both locale files.

**Rules applied:** `coding-standards.md` — No hardcoded user-facing strings; use `next-intl` dot-namespaced keys; both locales required.

Example `messages/en.json`:

```json
"workflow": {
  "page_title": "Workflow Visualization",
  "page_description": "Visual map of the task's blueprint stages and execution state.",
  "back_to_details": "Back to Details",
  "diagram_title": "Workflow Diagram",
  "fit_to_screen": "Fit to Screen",
  "empty_title": "No workflow defined",
  "empty_description": "This task does not have any blueprint stages.",
  "view_details": "View Details",
  "stage_node_label": "Stage {name} — {status}",
  "stage_n": "Stage {n}",
  "status_completed": "Completed",
  "status_active": "Active",
  "status_pending": "Pending",
  "status_returned": "Returned",
  "status_skipped": "Skipped",
  "legend_completed": "Completed",
  "legend_active": "Active",
  "legend_pending": "Pending",
  "legend_returned": "Returned",
  "legend_skipped": "Skipped",
  "legend_advance": "Advance",
  "legend_return": "Return",
  "legend_terminal": "Task Complete",
  "tooltip_entered": "Started",
  "tooltip_exited": "Finished",
  "tooltip_duration": "Duration",
  "tooltip_assignees": "Assignees",
  "sla": "SLA",
  "sla_no_policy": "No SLA policy",
  "no_permission_title": "No permission",
  "no_permission_description": "You do not have permission to view this task workflow.",
  "not_found_title": "Task not found",
  "not_found_description": "This task may have been deleted or you may not have access.",
  "error": "Unable to load workflow."
}
```

Arabic equivalent (`messages/ar.json`):

```json
"workflow": {
  "page_title": "رسم مسار العمل",
  "page_description": "خريطة مرئية لمراحل المهمة وحالة التنفيذ.",
  "back_to_details": "العودة إلى التفاصيل",
  "diagram_title": "رسم مسار العمل",
  "fit_to_screen": "ملء الشاشة",
  "empty_title": "لا يوجد مسار عمل",
  "empty_description": "لم يتم تعريف مراحل لهذه المهمة.",
  "view_details": "عرض التفاصيل",
  "stage_node_label": "مرحلة {name} — {status}",
  "stage_n": "المرحلة {n}",
  "status_completed": "مكتملة",
  "status_active": "نشطة",
  "status_pending": "معلقة",
  "status_returned": "مرتجعة",
  "status_skipped": "متجاوزة",
  "legend_completed": "مكتملة",
  "legend_active": "نشطة",
  "legend_pending": "معلقة",
  "legend_returned": "مرتجعة",
  "legend_skipped": "متجاوزة",
  "legend_advance": "تقدم",
  "legend_return": "إرجاع",
  "legend_terminal": "اكتمال المهمة",
  "tooltip_entered": "بدأت",
  "tooltip_exited": "انتهت",
  "tooltip_duration": "المدة",
  "tooltip_assignees": "المكلفون",
  "sla": "SLA",
  "sla_no_policy": "لا يوجد سياسة SLA",
  "no_permission_title": "لا يوجد صلاحية",
  "no_permission_description": "ليس لديك صلاحية لعرض مسار العمل لهذه المهمة.",
  "not_found_title": "المهمة غير موجودة",
  "not_found_description": "قد تكون المهمة محذوفة أو أنه ليس لديك وصول إليها.",
  "error": "تعذر تحميل مسار العمل."
}
```

### 15. Tests

**Summary:** Component-level tests for the orchestrator and the node card.

**Rules applied:** `testing-policy.md` — Test user-visible behavior, use MSW, verify loading + success states; `coding-standards.md` — generated types only.

**Test file:** `__tests__/components/domain/tasks/workflow-visualization.test.tsx`

```tsx
import { screen } from '@testing-library/react';
import { WorkflowVisualization } from '@/components/domain/tasks/workflow-visualization';
import { renderWithProviders } from '@/__tests__/utils/test-utils';

test('renders skeleton while loading', () => {
  renderWithProviders(<WorkflowVisualization publicId="test-task" />);
  expect(screen.getByTestId('workflow-skeleton')).toBeInTheDocument();
});

test('renders workflow nodes when task loads', async () => {
  renderWithProviders(<WorkflowVisualization publicId="test-task" />);
  expect(await screen.findByText('Director Assignment')).toBeInTheDocument();
  expect(screen.getByText('Legal Review')).toBeInTheDocument();
});
```

**Test file:** `__tests__/components/domain/tasks/workflow-node.test.tsx`

```tsx
import { screen } from '@testing-library/react';
import { WorkflowNode } from '@/components/domain/tasks/workflow-node';
import { renderWithProviders } from '@/__tests__/utils/test-utils';

test('completed node shows localized name and status', () => {
  const node = buildCompletedNodeMock(); // helper returns WorkflowNodeModel
  renderWithProviders(<WorkflowNode node={node} taskPublicId="task-1" />);
  expect(screen.getByText('Director Assignment')).toBeInTheDocument();
  expect(screen.getByText('Completed')).toBeInTheDocument();
});

test('active node shows pulse indicator', () => {
  const node = buildActiveNodeMock();
  renderWithProviders(<WorkflowNode node={node} taskPublicId="task-1" />);
  expect(screen.getByText('Active')).toBeInTheDocument();
  expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
});
```

> Use the existing MSW handlers from spec 004. Add mock builders for `WorkflowNodeModel` in the test file or in `__tests__/mocks/factories.ts` if one exists.

**Sample mock builder:**

```ts
import type { WorkflowNodeModel } from '@/components/domain/tasks/workflow-types';

export function buildNodeMock(status: WorkflowNodeModel['status'], nameEn = 'Director Assignment'): WorkflowNodeModel {
  return {
    blueprintStage: {
      public_id: 'stage-1',
      name_ar: 'تعيين المدير',
      name_en: nameEn,
      sequence_order: '1',
      stage_type: { public_id: 'type-1', name_ar: 'مراجعة', name_en: 'Review' },
      sla_policy: null,
    } as unknown as WorkflowNodeModel['blueprintStage'],
    instance: status === 'pending' ? undefined : {
      instance_id: 'inst-1',
      blueprint_stage: { public_id: 'stage-1', name_ar: 'تعيين المدير', name_en: nameEn, stage_type: null },
      status,
      entered_at: '2026-06-20T08:00:00Z',
      exited_at: status === 'completed' ? '2026-06-20T11:00:00Z' : null,
      assignments: [],
      sub_stages: [],
    } as unknown as NonNullable<WorkflowNodeModel['instance']>,
    status,
    sequenceOrder: 1,
    isActive: status === 'active',
    isTerminal: status === 'completed',
  };
}
```

---

## Data Flow

```
GET /v1/tasks/{publicId}
  → useTaskDetail(publicId)
  → TaskDetailResource (task.blueprint.stages + task.blueprint.transitions + task.stages)

GET /v1/tracking/sla/tasks/{publicId}
  → useTaskSlaHealth(publicId)
  → TaskSlaHealthResource (timers[])

WorkflowVisualization
  → buildWorkflowNodes(task, timers) → WorkflowNodeModel[]
  → buildWorkflowEdges(nodes, transitions) → WorkflowEdgeModel[]
  → WorkflowGraph → WorkflowNode[] + WorkflowReturnEdges
  → WorkflowLegend
```

---

## Route Structure

```
app/(dashboard)/
├── tasks/
│   └── [publicId]/
│       ├── page.tsx                 # existing task details
│       └── workflow/
│           └── page.tsx             # new workflow visualization
```

Locale is cookie-based (`NEXT_LOCALE`). No `[locale]` segment.

---

## Execution Order (as implemented)

1. Add i18n keys (`tasks.workflow`) to both locales.
2. Create `workflow-types.ts`, `workflow-utils.ts` (buildWorkflowNodes, buildWorkflowEdges, computeAvgCompletionTime, computeTotalSla).
3. Create presentational components: `workflow-skeleton`, `workflow-node`, `workflow-edge` (CSS border triangles), `workflow-legend`, `workflow-graph` (ScrollArea, auto-scroll), `workflow-timeline-bar`.
4. Create orchestrator `workflow-visualization.tsx` with `useBlueprint` for SLA fallback.
5. Create route page at `app/(dashboard)/tasks/[publicId]/workflow/page.tsx`.
6. Add breadcrumb for workflow route in `site-header.tsx`.
7. Add stage anchors (`id="stage-{instance_id}"`) in `stage-timeline-node.tsx`.
8. Add "Workflow" button in `task-top-bar-actions.tsx` and dropdown item in `task-board-table.tsx`.
9. Add SLA policy fallback for completed stages: pass `blueprintStages` through `task-detail.tsx` → `StageTimeline` → `StageTimelineNode`.
10. Add sub-stage SLA on task details: pass `slaTimers` through `SubStageList` → `SubStageItem`.
11. Fix SLA status matching: update `formatSlaInline` to compare against `'breached'`, `'warning'`, `'paused'`, `'completed'` strings.
12. Fix `transition_type` matching: use `'return'` instead of `'2'`.
13. Add `scrollIntoView` mock for tests.
14. Run checks: `npm run lint`, `npm run typecheck`, `npm run test`.
15. Manual QA: both locales, all states, RTL layout, responsive, keyboard navigation.

---

## What to Test Manually

1. **Happy path (AR RTL)** — Arabic workflow: nodes flow right-to-left, advance arrow points left, legend respects RTL.
2. **Happy path (EN LTR)** — English workflow: nodes flow left-to-right, advance arrow points right.
3. **Completed task** — All nodes show "Completed", terminal node is colored emerald, no active pulse.
4. **Active task with overdue SLA** — SLA text reads "Overdue by N days" in red, deadline marker visible on timeline bar.
5. **Active task with at-risk SLA** — SLA text reads "At risk — N days remaining" in amber.
6. **Active task with on-track SLA** — SLA text reads "N days remaining" in emerald.
7. **Return transitions** — Dashed amber SVG return arrows visible between stages with return transitions; bidirectional `ArrowLeftRight` icon replaces advance arrow for affected pairs.
8. **Loading state** — 3-section skeleton (graph + legend + timeline bar), no layout shift on transition to real content.
9. **Empty state** — Task with no blueprint stages: `GitBranch` icon + "No workflow defined" + "View Details" button.
10. **Error state** — 500/network error: message + retry button.
11. **403 state** — No-permission empty state with `Lock` icon.
12. **404 state** — Task not found empty state with `FileQuestion` icon.
13. **Responsive** — Desktop: horizontal flow with ScrollArea. Tablet: horizontal scroll. Mobile: vertical stack.
14. **Hover tooltip** — Shows entered_at, exited_at, duration, assignees. Pending stages show "Not started yet".
15. **Breadcrumb** — `Dashboard › Tasks › T-2026-0001 › Workflow`.
16. **Timeline bar** — Colored segments match stage statuses, day-range labels, deadline markers, stage names with durations below.
17. **Legend** — Stage status dots (5), SLA health dots (3), path icons (advance/return/terminal), stats when available.
18. **Auto-scroll** — Active stage scrolls into view on page load.
19. **Sub-stage SLA** — Task details page shows SLA for active (colored timer) and completed (policy label) sub-stages.
20. **Entry points** — "Workflow" button in task top-bar actions; "Workflow" dropdown item in task board row actions.