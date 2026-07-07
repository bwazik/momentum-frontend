'use client';

import { Field, FieldLabel } from '@/components/ui/field';
import { SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RtlSelect } from '@/components/shared/rtl-select';
import { localizeName, localizeTitle } from '@/lib/utils/localize';
import type { SlaPolicyResource, PositionResource, DepartmentResource } from './blueprint-types';

interface AssignmentFieldsProps {
  form: Record<string, unknown>;
  setForm: (updater: Record<string, unknown> | ((prev: Record<string, unknown>) => Record<string, unknown>)) => void;
  slaPolicies: SlaPolicyResource[];
  positions: PositionResource[];
  departments: DepartmentResource[];
  readOnly: boolean;
  locale: string;
  t: (key: string) => string;
  showEscalation?: boolean;
  slaThreshold?: string | null;
}

function v(val: unknown): string {
  return String(val ?? '');
}

export function AssignmentFields({
  form, setForm, slaPolicies, positions, departments,
  readOnly, locale, t, showEscalation = false, slaThreshold,
}: AssignmentFieldsProps) {
  function upd(key: string, val: string) {
    setForm((prev: Record<string, unknown>) => ({ ...prev, [key]: val }));
  }

  return (
    <>
      <Field>
        <FieldLabel>{t('assignment_type')}</FieldLabel>
        <RtlSelect value={v(form.assignment_type)} onValueChange={(val) => upd('assignment_type', val)} disabled={readOnly}>
          <SelectTrigger><SelectValue placeholder={t('assignment_type_placeholder')} /></SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="specific_position">{t('assignment_type_1')}</SelectItem>
            <SelectItem value="department_head">{t('assignment_type_2')}</SelectItem>
            <SelectItem value="manual_at_launch">{t('assignment_type_3')}</SelectItem>
          </SelectContent>
        </RtlSelect>
      </Field>
      {v(form.assignment_type) === 'specific_position' && (
        <Field>
          <FieldLabel>{t('assigned_position')}</FieldLabel>
          <RtlSelect value={v(form.assigned_position_id)} onValueChange={(val) => upd('assigned_position_id', val)} disabled={readOnly}>
            <SelectTrigger><SelectValue placeholder={t('assigned_position_placeholder')} /></SelectTrigger>
            <SelectContent position="popper">{positions.map((p) => <SelectItem key={p.public_id} value={p.public_id}>{localizeTitle(locale, p.title_ar, p.title_en)}</SelectItem>)}</SelectContent>
          </RtlSelect>
        </Field>
      )}
      {v(form.assignment_type) === 'department_head' && (
        <Field>
          <FieldLabel>{t('assigned_department')}</FieldLabel>
          <RtlSelect value={v(form.assigned_department_id)} onValueChange={(val) => upd('assigned_department_id', val)} disabled={readOnly}>
            <SelectTrigger><SelectValue placeholder={t('assigned_department_placeholder')} /></SelectTrigger>
            <SelectContent position="popper">{departments.map((d) => <SelectItem key={d.public_id} value={d.public_id}>{localizeName(locale, d.name_ar, d.name_en)}</SelectItem>)}</SelectContent>
          </RtlSelect>
        </Field>
      )}
      <Field>
        <FieldLabel>{t('sla_policy')}</FieldLabel>
        <RtlSelect value={v(form.sla_policy_id)} onValueChange={(val) => upd('sla_policy_id', val)} disabled={readOnly}>
          <SelectTrigger><SelectValue placeholder={t('sla_policy_placeholder')} /></SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="no-sla">{t('sla_policy_none')}</SelectItem>
            {slaPolicies.map((p) => <SelectItem key={p.public_id} value={p.public_id}>{localizeName(locale, p.name_ar, p.name_en)}</SelectItem>)}
          </SelectContent>
        </RtlSelect>
        {slaThreshold && <p className="mt-1 text-xs text-muted-foreground">{t('sla_threshold')}: {slaThreshold}</p>}
      </Field>
      <Field>
        <FieldLabel>{t('assignment_cardinality')}</FieldLabel>
        <RtlSelect value={v(form.assignment_cardinality)} onValueChange={(val) => upd('assignment_cardinality', val)} disabled={readOnly}>
          <SelectTrigger><SelectValue placeholder={t('assignment_cardinality_placeholder')} /></SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="single">{t('cardinality_single')}</SelectItem>
            <SelectItem value="multiple">{t('cardinality_multiple')}</SelectItem>
          </SelectContent>
        </RtlSelect>
      </Field>
      <Field>
        <FieldLabel>{t('completion_rule')}</FieldLabel>
        <RtlSelect value={v(form.completion_rule)} onValueChange={(val) => upd('completion_rule', val)} disabled={readOnly}>
          <SelectTrigger><SelectValue placeholder={t('completion_rule_placeholder')} /></SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="any_assignee">{t('completion_rule_any')}</SelectItem>
            <SelectItem value="all_assignees">{t('completion_rule_all')}</SelectItem>
            <SelectItem value="lead_assignee">{t('completion_rule_lead')}</SelectItem>
          </SelectContent>
        </RtlSelect>
      </Field>
      {showEscalation && (
        <Field>
          <FieldLabel>{t('escalation_position')}</FieldLabel>
          <RtlSelect value={v(form.escalation_position_id)} onValueChange={(val) => upd('escalation_position_id', val)} disabled={readOnly}>
            <SelectTrigger><SelectValue placeholder={t('escalation_position_placeholder')} /></SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value="none">{t('escalation_position_none')}</SelectItem>
              {positions.map((p) => <SelectItem key={p.public_id} value={p.public_id}>{localizeTitle(locale, p.title_ar, p.title_en)}</SelectItem>)}
            </SelectContent>
          </RtlSelect>
        </Field>
      )}
    </>
  );
}
