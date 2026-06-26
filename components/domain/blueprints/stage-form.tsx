'use client';

import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

import { Field, FieldGroup, FieldLabel, FieldError } from '@/components/ui/field';
import { SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { RtlSelect } from '@/components/shared/rtl-select';
import { BilingualNameFields } from '@/components/shared/bilingual-name-fields';
import { BilingualDescriptionFields } from '@/components/shared/bilingual-description-fields';
import { localizeName, localizeTitle } from '@/lib/utils/localize';
import { formatSlaThreshold } from './blueprint-utils';
import type { BlueprintStageResource, StageTypeResource, SlaPolicyResource, PositionResource, DepartmentResource } from './blueprint-types';

interface StageFormProps {
  form: Record<string, string>;
  setForm: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  errors: Record<string, string>;
  selectedSla: SlaPolicyResource | null;
  onSave: () => void;
  isPending: boolean;
  stageTypes: StageTypeResource[];
  slaPolicies: SlaPolicyResource[];
  positions: PositionResource[];
  departments: DepartmentResource[];
  stage: BlueprintStageResource | null | undefined;
  readOnly: boolean;
  locale: string;
  t: (key: string) => string;
}

export function StageForm({
  form, setForm, errors, selectedSla, onSave, isPending,
  stageTypes, slaPolicies, positions, departments,
  readOnly, locale, t,
}: StageFormProps) {
  return (
    <FieldGroup>
      <BilingualNameFields form={form} setForm={setForm} errors={errors} t={t} readOnly={readOnly} />
      <BilingualDescriptionFields form={form} setForm={setForm} t={t} readOnly={readOnly} />
      <Field>
        <FieldLabel>{t('stage_type')} <span className="text-destructive">*</span></FieldLabel>
        <RtlSelect value={form.stage_type_id} onValueChange={(v) => setForm((p: Record<string, string>) => ({ ...p, stage_type_id: v }))} disabled={readOnly}>
          <SelectTrigger><SelectValue placeholder={t('stage_type_placeholder')} /></SelectTrigger>
          <SelectContent position="popper">{stageTypes.map((st) => <SelectItem key={st.public_id} value={st.public_id}>{localizeName(locale, st.name_ar, st.name_en)}</SelectItem>)}</SelectContent>
        </RtlSelect>
        {errors.stage_type_id && <FieldError>{errors.stage_type_id}</FieldError>}
      </Field>
      <Field>
        <FieldLabel>{t('assignment_type')}</FieldLabel>
        <RtlSelect value={form.assignment_type} onValueChange={(v) => setForm((p: Record<string, string>) => ({ ...p, assignment_type: v }))} disabled={readOnly}>
          <SelectTrigger><SelectValue placeholder={t('assignment_type_placeholder')} /></SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="specific_position">{t('assignment_type_1')}</SelectItem>
            <SelectItem value="department_head">{t('assignment_type_2')}</SelectItem>
            <SelectItem value="manual_at_launch">{t('assignment_type_3')}</SelectItem>
          </SelectContent>
        </RtlSelect>
      </Field>
      {form.assignment_type === 'specific_position' && (
        <Field>
          <FieldLabel>{t('assigned_position')}</FieldLabel>
          <RtlSelect value={form.assigned_position_id} onValueChange={(v) => setForm((p: Record<string, string>) => ({ ...p, assigned_position_id: v }))} disabled={readOnly}>
            <SelectTrigger><SelectValue placeholder={t('assigned_position_placeholder')} /></SelectTrigger>
            <SelectContent position="popper">{positions.map((p) => <SelectItem key={p.public_id} value={p.public_id}>{localizeTitle(locale, p.title_ar, p.title_en)}</SelectItem>)}</SelectContent>
          </RtlSelect>
        </Field>
      )}
      {form.assignment_type === 'department_head' && (
        <Field>
          <FieldLabel>{t('assigned_department')}</FieldLabel>
          <RtlSelect value={form.assigned_department_id} onValueChange={(v) => setForm((p: Record<string, string>) => ({ ...p, assigned_department_id: v }))} disabled={readOnly}>
            <SelectTrigger><SelectValue placeholder={t('assigned_department_placeholder')} /></SelectTrigger>
            <SelectContent position="popper">{departments.map((d) => <SelectItem key={d.public_id} value={d.public_id}>{localizeName(locale, d.name_ar, d.name_en)}</SelectItem>)}</SelectContent>
          </RtlSelect>
        </Field>
      )}
      <Field>
        <FieldLabel>{t('sla_policy')}</FieldLabel>
        <RtlSelect value={form.sla_policy_id} onValueChange={(v) => setForm((p: Record<string, string>) => ({ ...p, sla_policy_id: v, escalation_position_id: v === 'no-sla' ? 'none' : p.escalation_position_id }))} disabled={readOnly}>
          <SelectTrigger><SelectValue placeholder={t('sla_policy_placeholder')} /></SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="no-sla">{t('sla_policy_none')}</SelectItem>
            {slaPolicies.map((p) => <SelectItem key={p.public_id} value={p.public_id}>{localizeName(locale, p.name_ar, p.name_en)}</SelectItem>)}
          </SelectContent>
        </RtlSelect>
        {selectedSla && (
          <p className="mt-1 text-xs text-muted-foreground">{t('sla_threshold')}: {formatSlaThreshold(selectedSla)}</p>
        )}
        {!readOnly && (
          <Link href="/blueprints/catalog?tab=sla-policies" target="_blank" className="mt-1 inline-flex items-center gap-1 text-xs text-primary underline">{t('manage_sla_policies')}<ExternalLink className="size-3" /></Link>
        )}
      </Field>
      <Field>
        <FieldLabel>{t('assignment_cardinality')}</FieldLabel>
        <RtlSelect value={form.assignment_cardinality} onValueChange={(v) => setForm((p: Record<string, string>) => ({ ...p, assignment_cardinality: v }))} disabled={readOnly}>
          <SelectTrigger><SelectValue placeholder={t('assignment_cardinality_placeholder')} /></SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="single">{t('cardinality_single')}</SelectItem>
            <SelectItem value="multiple">{t('cardinality_multiple')}</SelectItem>
          </SelectContent>
        </RtlSelect>
      </Field>
      <Field>
        <FieldLabel>{t('completion_rule')}</FieldLabel>
        <RtlSelect value={form.completion_rule} onValueChange={(v) => setForm((p: Record<string, string>) => ({ ...p, completion_rule: v }))} disabled={readOnly}>
          <SelectTrigger><SelectValue placeholder={t('completion_rule_placeholder')} /></SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="any_assignee">{t('completion_rule_any')}</SelectItem>
            <SelectItem value="all_assignees">{t('completion_rule_all')}</SelectItem>
            <SelectItem value="lead_assignee">{t('completion_rule_lead')}</SelectItem>
          </SelectContent>
        </RtlSelect>
      </Field>
      <Field>
        <FieldLabel>{t('escalation_position')}</FieldLabel>
        <RtlSelect value={form.escalation_position_id} onValueChange={(v) => setForm((p: Record<string, string>) => ({ ...p, escalation_position_id: v }))} disabled={readOnly}>
          <SelectTrigger><SelectValue placeholder={t('escalation_position_placeholder')} /></SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="none">{t('escalation_position_none')}</SelectItem>
            {positions.map((p) => <SelectItem key={p.public_id} value={p.public_id}>{localizeTitle(locale, p.title_ar, p.title_en)}</SelectItem>)}
          </SelectContent>
        </RtlSelect>
      </Field>
      {!readOnly && (
        <Button onClick={onSave} disabled={isPending}>
          {isPending ? t('saving') : t('save_stage')}
        </Button>
      )}
    </FieldGroup>
  );
}
