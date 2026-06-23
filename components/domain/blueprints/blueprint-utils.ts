import type {
  BlueprintStageResource,
  SlaPolicyResource,
  BlueprintTransitionResource,
} from './blueprint-types';

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

export const ASSIGNMENT_TYPE_LABELS: Record<string, { ar: string; en: string }> = {
  specific_position: { ar: 'منصب محدد', en: 'Specific Position' },
  department_head: { ar: 'رئيس الإدارة', en: 'Department Head' },
  manual_at_launch: { ar: 'يدوي عند الإطلاق', en: 'Manual at Launch' },
};

export const CARDINALITY_LABELS: Record<string, { ar: string; en: string }> = {
  single: { ar: 'مكلف واحد', en: 'Single' },
  multiple: { ar: 'عدة مكلفين', en: 'Multiple' },
};

export const COMPLETION_RULE_LABELS: Record<string, { ar: string; en: string }> = {
  any_assignee: { ar: 'أي مكلف', en: 'Any assignee' },
  all_assignees: { ar: 'جميع المكلفين', en: 'All assignees' },
  lead_assignee: { ar: 'المكلف الرئيسي', en: 'Lead assignee' },
};

export const SLA_UNIT_LABELS: Record<string, { ar: string; en: string }> = {
  hours: { ar: 'ساعات', en: 'Hours' },
  days: { ar: 'أيام', en: 'Days' },
};

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
