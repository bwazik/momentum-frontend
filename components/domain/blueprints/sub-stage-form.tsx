'use client';

import { useState } from 'react';
import { FieldGroup } from '@/components/ui/field';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { BilingualNameFields } from '@/components/shared/bilingual-name-fields';
import { BilingualDescriptionFields } from '@/components/shared/bilingual-description-fields';
import { useCreateSubStage, useUpdateSubStage } from '@/lib/api/hooks/use-blueprints';
import { buildAssignmentFields } from '@/lib/utils/blueprint-utils';
import { AssignmentFields } from './assignment-fields';
import type { BlueprintResource, BlueprintSubStageResource, SlaPolicyResource, PositionResource, DepartmentResource } from './blueprint-types';
import type { components } from '@/lib/generated/api-types';

type StoreBlueprintSubStageRequest = components['schemas']['StoreBlueprintSubStageRequest'];

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
  tPanel: (key: string) => string;
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

  function save() {
    if (!form.name_ar) return;

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
      createSubStage.mutate({ stageId, body: body as StoreBlueprintSubStageRequest }, { onSuccess: onSaved });
    }
  }

  const isPending = createSubStage.isPending || updateSubStage.isPending;

  return (
    <FieldGroup>
      <BilingualNameFields form={form} setForm={setForm} t={tPanel} readOnly={readOnly} />
      <BilingualDescriptionFields form={form} setForm={setForm} t={tPanel} readOnly={readOnly} />
      <AssignmentFields
        form={form}
        setForm={(u: unknown) => setForm(u as typeof form)}
        slaPolicies={slaPolicies}
        positions={positions}
        departments={departments}
        readOnly={readOnly}
        locale={locale}
        t={tPanel}
      />
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
