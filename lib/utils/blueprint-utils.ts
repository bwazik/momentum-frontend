import type {
  BlueprintStageResource,
  SlaPolicyResource,
  BlueprintTransitionResource,
} from '@/components/domain/blueprints/blueprint-types';

export function formatSlaSummary(policy: SlaPolicyResource | null | undefined, t: (key: string) => string): string {
  if (!policy) return t('no_sla');
  const isHours = policy.sla_unit === 'hours' || policy.sla_unit === '1';
  const unit = t(isHours ? 'sla_unit_hours' : 'sla_unit_days');
  return `${policy.sla_value} ${unit}`;
}

export function formatSlaThreshold(policy: SlaPolicyResource | null | undefined): string {
  if (!policy) return '';
  return `${policy.warning_threshold_percentage}%`;
}

export function normalizeSlaUnit(unit: string): string {
  if (unit === 'hours' || unit === 'days') return unit;
  return unit === '1' ? 'hours' : 'days';
}

export function deriveAdvanceTargets(stages: BlueprintStageResource[], currentStagePublicId: string): BlueprintStageResource[] {
  const current = stages.find((s) => s.public_id === currentStagePublicId);
  if (!current) return [];
  return stages.filter((s) => Number(s.sequence_order) > Number(current.sequence_order));
}

export function deriveReturnTargets(stages: BlueprintStageResource[], currentStagePublicId: string): BlueprintStageResource[] {
  const current = stages.find((s) => s.public_id === currentStagePublicId);
  if (!current) return [];
  return stages.filter((s) => Number(s.sequence_order) < Number(current.sequence_order));
}

export const ASSIGNMENT_TYPE_MAP: Record<string, 1 | 2 | 3> = { specific_position: 1, department_head: 2, manual_at_launch: 3 };

export const CARDINALITY_MAP: Record<string, 1 | 2> = { single: 1, multiple: 2 };

export const COMPLETION_RULE_MAP: Record<string, 1 | 2 | 3> = { any_assignee: 1, all_assignees: 2, lead_assignee: 3 };

export const SLA_UNIT_MAP: Record<string, 1 | 2> = { hours: 1, days: 2 };

export const SLA_UNIT_REVERSE_MAP: Record<string, 'hours' | 'days'> = { '1': 'hours', '2': 'days', hours: 'hours', days: 'days' };

export function getStagesCount(bp: { stages?: unknown[]; stages_count?: number | string }): number {
  return bp.stages?.length ?? (Number(bp.stages_count) || 0);
}

export function buildAssignmentFields(form: Record<string, unknown>) {
  return {
    sla_policy_id: form.sla_policy_id === 'no-sla' ? null : String(form.sla_policy_id),
    assignment_type: ASSIGNMENT_TYPE_MAP[String(form.assignment_type)],
    assigned_position_id: form.assignment_type === 'specific_position' ? String(form.assigned_position_id) : null,
    assigned_department_id: form.assignment_type === 'department_head' ? String(form.assigned_department_id) : null,
    assignment_cardinality: CARDINALITY_MAP[String(form.assignment_cardinality)],
    completion_rule: COMPLETION_RULE_MAP[String(form.completion_rule)],
  };
}

export function getStageTransitions(transitions: BlueprintTransitionResource[] | undefined, stagePublicId: string) {
  return (transitions ?? []).filter((t) => t.from_stage_id === stagePublicId);
}
