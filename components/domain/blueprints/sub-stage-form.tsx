'use client';

import { useState } from 'react';
import { Field, FieldGroup, FieldLabel, FieldError } from '@/components/ui/field';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { RtlSelect } from '@/components/shared/rtl-select';
import { BilingualNameFields } from '@/components/shared/bilingual-name-fields';
import { BilingualDescriptionFields } from '@/components/shared/bilingual-description-fields';
import { useCreateSubStage, useUpdateSubStage } from '@/lib/api/hooks/use-blueprints';
import { localizeName, localizeTitle } from '@/lib/utils/localize';
import { ASSIGNMENT_TYPE_MAP, CARDINALITY_MAP, COMPLETION_RULE_MAP, buildAssignmentFields } from './blueprint-utils';
import type { BlueprintResource, BlueprintSubStageResource, SlaPolicyResource, PositionResource, DepartmentResource } from './blueprint-types';

interface SubStageFormProps {
  blueprint: BlueprintResource;
  stageId: string;
  subStage: BlueprintSubStageResource | null;
  readOnly: boolean;
  onSaved: () => void;
  onBack: () => void;
  slaPolicies: SlaPolicyResource[];
  positions: PositionResource[];
  departments: DepartmentResource[];
  locale: string;
  tPanel: any;
}

export function SubStageForm({
  blueprint, stageId, subStage, readOnly, onSaved, onBack,
  slaPolicies, positions, departments, locale, tPanel,
}: SubStageFormProps) {
  const createSubStage = useCreateSubStage(blueprint.public_id);
  const updateSubStage = useUpdateSubStage(blueprint.public_id);

  const [form, setForm] = useState({
    name_ar: subStage?.name_ar ?? '',
    name_en: subStage?.name_en ?? '',
    description_ar: subStage?.description_ar ?? '',
    description_en: subStage?.description_en ?? '',
    sla_policy_id: subStage?.sla_policy?.public_id ?? 'no-sla',
    is_required: !!subStage?.is_required,
    assignment_type: subStage?.assignment_type ?? 'specific_position',
    assigned_position_id: subStage?.assigned_position_id ?? '',
    assigned_department_id: subStage?.assigned_department_id ?? '',
    assignment_cardinality: subStage?.assignment_cardinality ?? 'single',
    completion_rule: subStage?.completion_rule ?? 'any_assignee',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function save() {
    const newErrors: Record<string, string> = {};
    if (!form.name_ar) newErrors.name_ar = tPanel('name_ar_required');
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const body = {
      name_ar: form.name_ar,
      name_en: form.name_en || undefined,
      description_ar: form.description_ar || undefined,
      description_en: form.description_en || undefined,
      is_required: form.is_required,
      ...buildAssignmentFields(form),
    };

    if (subStage) {
      updateSubStage.mutate({ stageId, subStageId: subStage.public_id, body }, { onSuccess: onSaved });
    } else {
      createSubStage.mutate({ stageId, body: body as never }, { onSuccess: onSaved });
    }
  }

  const isPending = createSubStage.isPending || updateSubStage.isPending;

  return (
    <FieldGroup>
      <BilingualNameFields form={form} setForm={setForm} errors={errors} t={tPanel} readOnly={readOnly} />
      <BilingualDescriptionFields form={form} setForm={setForm} t={tPanel} readOnly={readOnly} />
      <Field>
        <FieldLabel>{tPanel('sla_policy')}</FieldLabel>
        <RtlSelect value={form.sla_policy_id} onValueChange={(v) => setForm({ ...form, sla_policy_id: v })} disabled={readOnly}>
          <SelectTrigger><SelectValue placeholder={tPanel('sla_policy_placeholder')} /></SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="no-sla">{tPanel('sla_policy_none')}</SelectItem>
            {slaPolicies.map((p) => <SelectItem key={p.public_id} value={p.public_id}>{localizeName(locale, p.name_ar, p.name_en)}</SelectItem>)}
          </SelectContent>
        </RtlSelect>
      </Field>
      <Field>
        <FieldLabel>{tPanel('assignment_type')}</FieldLabel>
        <RtlSelect value={form.assignment_type} onValueChange={(v) => setForm({ ...form, assignment_type: v })} disabled={readOnly}>
          <SelectTrigger><SelectValue placeholder={tPanel('assignment_type_placeholder')} /></SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="specific_position">{tPanel('assignment_type_1')}</SelectItem>
            <SelectItem value="department_head">{tPanel('assignment_type_2')}</SelectItem>
            <SelectItem value="manual_at_launch">{tPanel('assignment_type_3')}</SelectItem>
          </SelectContent>
        </RtlSelect>
      </Field>
      {form.assignment_type === 'specific_position' && (
        <Field>
          <FieldLabel>{tPanel('assigned_position')}</FieldLabel>
          <RtlSelect value={form.assigned_position_id} onValueChange={(v) => setForm({ ...form, assigned_position_id: v })} disabled={readOnly}>
            <SelectTrigger><SelectValue placeholder={tPanel('assigned_position_placeholder')} /></SelectTrigger>
            <SelectContent position="popper">{positions.map((p) => <SelectItem key={p.public_id} value={p.public_id}>{localizeTitle(locale, p.title_ar, p.title_en)}</SelectItem>)}</SelectContent>
          </RtlSelect>
        </Field>
      )}
      {form.assignment_type === 'department_head' && (
        <Field>
          <FieldLabel>{tPanel('assigned_department')}</FieldLabel>
          <RtlSelect value={form.assigned_department_id} onValueChange={(v) => setForm({ ...form, assigned_department_id: v })} disabled={readOnly}>
            <SelectTrigger><SelectValue placeholder={tPanel('assigned_department_placeholder')} /></SelectTrigger>
            <SelectContent position="popper">{departments.map((d) => <SelectItem key={d.public_id} value={d.public_id}>{localizeName(locale, d.name_ar, d.name_en)}</SelectItem>)}</SelectContent>
          </RtlSelect>
        </Field>
      )}
      <Field>
        <FieldLabel>{tPanel('completion_rule')}</FieldLabel>
        <RtlSelect value={form.completion_rule} onValueChange={(v) => setForm({ ...form, completion_rule: v })} disabled={readOnly}>
          <SelectTrigger><SelectValue placeholder={tPanel('completion_rule_placeholder')} /></SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="any_assignee">{tPanel('completion_rule_any')}</SelectItem>
            <SelectItem value="all_assignees">{tPanel('completion_rule_all')}</SelectItem>
            <SelectItem value="lead_assignee">{tPanel('completion_rule_lead')}</SelectItem>
          </SelectContent>
        </RtlSelect>
      </Field>
      <Field>
        <FieldLabel>{tPanel('assignment_cardinality')}</FieldLabel>
        <RtlSelect value={form.assignment_cardinality} onValueChange={(v) => setForm({ ...form, assignment_cardinality: v })} disabled={readOnly}>
          <SelectTrigger><SelectValue placeholder={tPanel('assignment_cardinality_placeholder')} /></SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="single">{tPanel('cardinality_single')}</SelectItem>
            <SelectItem value="multiple">{tPanel('cardinality_multiple')}</SelectItem>
          </SelectContent>
        </RtlSelect>
      </Field>
      <label className="flex items-center gap-2">
        <Checkbox checked={form.is_required} onCheckedChange={(v) => setForm({ ...form, is_required: Boolean(v) })} disabled={readOnly} />
        <span className="text-sm">{tPanel('is_required')}</span>
      </label>
      {!readOnly && (
        <div className="flex items-center gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onBack}>{tPanel('cancel')}</Button>
          <Button size="sm" onClick={save} disabled={isPending}>{isPending ? tPanel('saving') : tPanel('save_stage')}</Button>
        </div>
      )}
    </FieldGroup>
  );
}
