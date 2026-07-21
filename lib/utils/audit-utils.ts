import type { CursorPage } from '@/lib/api/types';

export interface AuditEvent {
  public_id: string;
  event_type: string;
  entity_type: string;
  entity_id: string | null;
  root_entity_type: string | null;
  root_entity_id: string | null;
  performed_by: { public_id: string; name_ar: string; name_en: string } | null;
  ip_address: string | null;
  user_agent: string | null;
  payload: Record<string, unknown> | null;
  impersonated_by_public_id: string | null;
  created_at: string;
  created_at_hijri: string | null;
}

export const AUDIT_ENTITY_TYPE_LABELS: Record<string, { ar: string; en: string }> = {
  task: { ar: 'مهمة', en: 'Task' },
  stage_instance: { ar: 'مرحلة', en: 'Stage Instance' },
  sub_stage_instance: { ar: 'مرحلة فرعية', en: 'Sub-stage Instance' },
  user: { ar: 'مستخدم', en: 'User' },
  position: { ar: 'منصب', en: 'Position' },
  department: { ar: 'إدارة', en: 'Department' },
  blueprint: { ar: 'مخطط', en: 'Blueprint' },
  document: { ar: 'مستند', en: 'Document' },
  escalation: { ar: 'تصعيد', en: 'Escalation' },
  sla_timer: { ar: 'مؤقت SLA', en: 'SLA Timer' },
  follow_up_action: { ar: 'إجراء متابعة', en: 'Follow-up Action' },
  comment: { ar: 'تعليق', en: 'Comment' },
  help_article: { ar: 'مقالة مساعدة', en: 'Help Article' },
  onboarding_journey: { ar: 'رحلة الانضمام', en: 'Onboarding Journey' },
  tenant: { ar: 'مستأجر', en: 'Tenant' },
  platform_admin: { ar: 'مدير منصة', en: 'Platform Admin' },
  impersonation: { ar: 'تمثيل', en: 'Impersonation' },
  working_calendar: { ar: 'تقويم عمل', en: 'Working Calendar' },
  public_holiday: { ar: 'عطلة رسمية', en: 'Public Holiday' },
  authority_grade: { ar: 'درجة سلطة', en: 'Authority Grade' },
  position_assignment: { ar: 'تكليف بمنصب', en: 'Position Assignment' },
  delegation: { ar: 'تفويض', en: 'Delegation' },
  monitoring_scope_grant: { ar: 'نطاق مراقبة', en: 'Monitoring Scope Grant' },
  audit_grant: { ar: 'صلاحية تدقيق', en: 'Audit Grant' },
  capability_grant: { ar: 'صلاحية', en: 'Capability Grant' },
  stage_type: { ar: 'نوع مرحلة', en: 'Stage Type' },
  sla_policy: { ar: 'سياسة SLA', en: 'SLA Policy' },
  blueprint_category: { ar: 'فئة مخطط', en: 'Blueprint Category' },
  blueprint_stage: { ar: 'مرحلة مخطط', en: 'Blueprint Stage' },
  blueprint_sub_stage: { ar: 'مرحلة فرعية مخطط', en: 'Blueprint Sub-stage' },
  blueprint_transition: { ar: 'انتقال مخطط', en: 'Blueprint Transition' },
  external_reference: { ar: 'مرجع خارجي', en: 'External Reference' },
  confidential_access: { ar: 'تصنيف سري', en: 'Confidential Access' },
  action: { ar: 'إجراء', en: 'Action' },
};

export const AUDIT_EVENT_TYPE_SUGGESTIONS = [
  'user.created', 'user.updated', 'user.deactivated', 'user.reactivated',
  'user.assigned', 'user.ended',
  'user.granted', 'user.revoked',
  'user.logged_in', 'user.logged_out',
  'task.created', 'task.updated', 'task.completed', 'task.submitted', 'task.returned',
  'position.assigned', 'position.ended',
  'capability.granted', 'capability.revoked',
  'monitoring_scope.granted', 'monitoring_scope.revoked',
  'audit_grant.granted', 'audit_grant.revoked',
];

export function narrowAuditEvent(input: unknown): AuditEvent | null {
  if (typeof input !== 'object' || input === null) return null;
  const r = input as Record<string, unknown>;
  if (typeof r.public_id !== 'string' || typeof r.event_type !== 'string' || typeof r.created_at !== 'string') return null;
  return {
    public_id: r.public_id,
    event_type: r.event_type,
    entity_type: typeof r.entity_type === 'string' ? r.entity_type : String(r.entity_type ?? ''),
    entity_id: typeof r.entity_id === 'string' ? r.entity_id : null,
    root_entity_type: typeof r.root_entity_type === 'string' ? r.root_entity_type : null,
    root_entity_id: typeof r.root_entity_id === 'string' ? r.root_entity_id : null,
    performed_by: typeof r.performed_by === 'object' && r.performed_by !== null ? (r.performed_by as AuditEvent['performed_by']) : null,
    ip_address: typeof r.ip_address === 'string' ? r.ip_address : null,
    user_agent: typeof r.user_agent === 'string' ? r.user_agent : null,
    payload: r.payload && typeof r.payload === 'object' ? (r.payload as Record<string, unknown>) : null,
    impersonated_by_public_id: typeof r.impersonated_by_public_id === 'string' ? r.impersonated_by_public_id : null,
    created_at: r.created_at,
    created_at_hijri: typeof r.created_at_hijri === 'string' ? r.created_at_hijri : null,
  };
}

export function narrowAuditPage(input: unknown): CursorPage<AuditEvent> {
  const r = (input ?? {}) as Record<string, unknown>;
  const data = Array.isArray(r.data) ? r.data.map(narrowAuditEvent).filter((x): x is AuditEvent => x !== null) : [];
  return {
    data,
    next_cursor: typeof r.next_cursor === 'string' ? r.next_cursor : null,
    has_more: Boolean(r.has_more),
  };
}
