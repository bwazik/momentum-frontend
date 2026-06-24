import type {
  TaskDetailResource,
  TaskStageInstanceResource,
  SlaTimerInstanceResource,
  BlueprintTransitionResource,
  BlueprintStageResource,
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
  return matches.sort(
    (a, b) => new Date(b.entered_at || 0).getTime() - new Date(a.entered_at || 0).getTime(),
  )[0];
}

export function buildWorkflowNodes(
  task: TaskDetailResource,
  slaTimers: SlaTimerInstanceResource[] | undefined,
  fullBlueprint?: { stages?: BlueprintStageResource[] },
): WorkflowNodeModel[] {
  const blueprintStages = [...(task.blueprint?.stages ?? [])].sort(
    (a, b) => Number(a.sequence_order) - Number(b.sequence_order),
  );
  const lastIndex = blueprintStages.length - 1;

  const fullStagesByPublicId = new Map(
    (fullBlueprint?.stages ?? []).map((s) => [s.public_id, s]),
  );

  return blueprintStages.map((stage, index) => {
    const instance = findLatestInstance(task.stages, stage.public_id);
    const status: WorkflowNodeStatus = (instance?.status as WorkflowNodeStatus) ?? 'pending';
    const isActive = status === 'active';
    const isTerminal = index === lastIndex && task.status === 'completed';
    const slaTimer =
      instance && slaTimers
        ? slaTimers.find(
            (t) =>
              t.stage_instance_id === instance.instance_id && !t.sub_stage_instance_id,
          )
        : undefined;

    const blueprintStageSlaPolicy = stage.sla_policy ?? fullStagesByPublicId.get(stage.public_id)?.sla_policy;

    return {
      blueprintStage: { ...stage, sla_policy: blueprintStageSlaPolicy },
      instance,
      status,
      sequenceOrder: Number(stage.sequence_order) || index + 1,
      isActive,
      isTerminal,
      slaTimer,
    };
  });
}

export function computeAvgCompletionTime(
  stages: TaskStageInstanceResource[] | undefined,
): number | null {
  if (!stages) return null;
  const completed = stages.filter((s) => s.status === 'completed' && s.entered_at && s.exited_at);
  if (completed.length === 0) return null;
  const total = completed.reduce((sum, s) => {
    return sum + (new Date(s.exited_at).getTime() - new Date(s.entered_at).getTime());
  }, 0);
  return total / completed.length / 86400000;
}

export function computeTotalSla(
  blueprintStages: BlueprintStageResource[] | undefined,
): { value: number; unit: string } | null {
  if (!blueprintStages) return null;
  const withSla = blueprintStages.filter((s) => s.sla_policy);
  if (withSla.length === 0) return null;
  let totalHours = 0;
  for (const s of withSla) {
    const val = Number(s.sla_policy!.sla_value);
    if (s.sla_policy!.sla_unit === 'days' || s.sla_policy!.sla_unit === '2') {
      totalHours += val * 24;
    } else {
      totalHours += val;
    }
  }
  if (totalHours % 24 === 0) return { value: totalHours / 24, unit: 'days' };
  return { value: totalHours, unit: 'hours' };
}

export function buildWorkflowEdges(
  nodes: WorkflowNodeModel[],
  transitions: BlueprintTransitionResource[] | undefined,
): WorkflowEdgeModel[] {
  const edges: WorkflowEdgeModel[] = [];
  const byStageId = new Map(nodes.map((n, i) => [n.blueprintStage.public_id, i]));

  (transitions ?? [])
    .filter((t) => t.transition_type === 'return')
    .forEach((t) => {
      const fromIndex = byStageId.get(t.from_stage_id);
      const toIndex = byStageId.get(t.to_stage_id);
      if (fromIndex != null && toIndex != null && fromIndex > toIndex) {
        edges.push({ id: `${t.public_id}`, fromIndex, toIndex, type: 'return' });
      }
    });

  return edges;
}
