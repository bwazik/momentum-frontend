'use client';

import { Field, FieldGroup, FieldLabel, FieldError } from '@/components/ui/field';
import { SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { RtlSelect } from '@/components/shared/rtl-select';
import { BilingualNameFields } from '@/components/shared/bilingual-name-fields';
import { BilingualDescriptionFields } from '@/components/shared/bilingual-description-fields';
import { localizeName } from '@/lib/utils/localize';
import { formatSlaThreshold } from '@/lib/utils/blueprint-utils';
import { AssignmentFields } from './assignment-fields';
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
      <AssignmentFields
        form={form}
        setForm={(u: unknown) => setForm(u as Record<string, string>)}
        slaPolicies={slaPolicies}
        positions={positions}
        departments={departments}
        readOnly={readOnly}
        locale={locale}
        t={t}
        showEscalation
        slaThreshold={selectedSla ? formatSlaThreshold(selectedSla) : null}
      />
      {!readOnly && (
        <Button onClick={onSave} disabled={isPending}>
          {isPending ? t('saving') : t('save_stage')}
        </Button>
      )}
    </FieldGroup>
  );
}
