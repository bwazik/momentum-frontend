'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { StageForm } from './stage-form';
import { SubStageForm } from './sub-stage-form';
import { TransitionEditor } from './transition-editor';
import { SubStageList } from './sub-stage-list';
import {
  useBlueprintStageTypes, useBlueprintSlaPolicies,
  useCreateStage, useUpdateStage,
} from '@/lib/api/hooks/use-blueprints';
import { usePositions } from '@/lib/api/hooks/use-organization';
import { useDepartmentsInfinite } from '@/lib/api/hooks/use-organization';
import { useBlueprintBuilderStore } from '@/lib/stores/use-blueprint-builder-store';
import { buildAssignmentFields } from '@/lib/utils/blueprint-utils';
import type { BlueprintResource, BlueprintStageResource } from './blueprint-types';
import type { components } from '@/lib/generated/api-types';

type StoreBlueprintStageRequest = components['schemas']['StoreBlueprintStageRequest'];

interface StagePropertiesPanelProps {
  blueprint: BlueprintResource;
  stage: BlueprintStageResource | null;
  mode: 'idle' | 'add' | 'edit';
  readOnly: boolean;
  subStageEditId?: string | null;
  onEditSubStage?: (id: string | 'new') => void;
  onSubStageBack?: () => void;
}

function getInitialForm(stage: BlueprintStageResource | null) {
  return {
    name_ar: stage?.name_ar ?? '',
    name_en: stage?.name_en ?? '',
    description_ar: stage?.description_ar ?? '',
    description_en: stage?.description_en ?? '',
    stage_type_id: stage?.stage_type?.public_id ?? '',
    assignment_type: stage?.assignment_type ?? 'specific_position',
    assigned_position_id: stage?.assigned_position_id ?? '',
    assigned_department_id: stage?.assigned_department_id ?? '',
    sla_policy_id: stage?.sla_policy?.public_id ?? 'no-sla',
    assignment_cardinality: stage?.assignment_cardinality ?? 'single',
    completion_rule: stage?.completion_rule ?? 'any_assignee',
    escalation_position_id: stage?.escalation_position_id || 'none',
  };
}

export function StagePropertiesPanel({ blueprint, stage, mode, readOnly, subStageEditId: subStageEditIdProp, onEditSubStage, onSubStageBack }: StagePropertiesPanelProps) {
  const t = useTranslations('blueprints.builder.panel');
  const locale = useLocale();
  const { data: stageTypes } = useBlueprintStageTypes();
  const { data: slaPolicies } = useBlueprintSlaPolicies();
  const { data: positionPages } = usePositions();
  const positions = positionPages?.pages.flatMap((p) => p.data) ?? [];
  const { data: deptPages } = useDepartmentsInfinite();
  const departments = deptPages?.pages.flatMap((p) => p.data) ?? [];
  const createStage = useCreateStage(blueprint.public_id);
  const updateStage = useUpdateStage(blueprint.public_id);
  const { setSelectedStage, setMetadataDirty } = useBlueprintBuilderStore();

  const [form, setForm] = useState<Record<string, string>>(() => getInitialForm(mode === 'add' ? null : stage));
  const subStageEditId = subStageEditIdProp ?? null;

  const selectedSla = slaPolicies?.find((p) => p.public_id === form.sla_policy_id) ?? null;

  function saveStage() {
    if (!form.name_ar) {
      toast.error(t('name_ar_required'));
      return;
    }
    if (!form.stage_type_id) {
      toast.error(t('stage_type_required'));
      return;
    }

    const body = {
      name_ar: form.name_ar,
      name_en: form.name_en || undefined,
      description_ar: form.description_ar || undefined,
      description_en: form.description_en || undefined,
      stage_type_id: form.stage_type_id,
      ...buildAssignmentFields(form),
      escalation_position_id: form.escalation_position_id === 'none' ? null : form.escalation_position_id,
    };

    if (mode === 'edit' && stage) {
      updateStage.mutate({ stageId: stage.public_id, body }, { onSuccess: () => setMetadataDirty(false) });
    } else {
      createStage.mutate(body as StoreBlueprintStageRequest, { onSuccess: (data) => setSelectedStage((data as { public_id: string }).public_id) });
    }
  }

  if (subStageEditId) {
    const isNew = subStageEditId === 'new';
    const subStageData = isNew ? null
      : (stage?.sub_stages?.find((s) => s.public_id === subStageEditId)
        ?? blueprint.stages?.flatMap((st) => st.sub_stages ?? []).find((s) => s.public_id === subStageEditId)
        ?? null);
    return (
      <div className="space-y-4" aria-labelledby="stage-panel-title">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="size-6" onClick={() => onSubStageBack?.()} aria-label={t('back_to_stage')}>
            <ArrowLeft className="size-4 rtl:rotate-180" />
          </Button>
          <h2 id="stage-panel-title" className="text-sm font-semibold">{isNew ? t('add_sub_stage') : t('edit_sub_stage')}</h2>
        </div>
        <SubStageForm
          key={subStageData?.public_id ?? 'new'}
          blueprint={blueprint}
          stageId={stage?.public_id ?? ''}
          subStage={subStageData}
          readOnly={readOnly}
          onSaved={() => {
            onSubStageBack?.();
            setMetadataDirty(false);
          }}
          onBack={() => onSubStageBack?.()}
          slaPolicies={slaPolicies ?? []}
          positions={positions}
          departments={departments}
          locale={locale}
          tPanel={t}
        />
      </div>
    );
  }

  if (mode === 'idle') {
    return (
      <div className="space-y-4" aria-labelledby="stage-panel-title">
        <h2 id="stage-panel-title" className="text-sm font-semibold">{t('stage_properties')}</h2>
        <p className="text-sm text-muted-foreground">{t('select_stage_hint')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4" aria-labelledby="stage-panel-title">
      <h2 id="stage-panel-title" className="text-sm font-semibold">{mode === 'add' ? t('add_stage') : t('stage_properties')}</h2>
      <StageForm
        form={form}
        setForm={setForm}
        selectedSla={selectedSla}
        onSave={saveStage}
        isPending={createStage.isPending || updateStage.isPending}
        stageTypes={stageTypes ?? []}
        slaPolicies={slaPolicies ?? []}
        positions={positions}
        departments={departments}
        stage={mode === 'add' ? null : stage}
        readOnly={readOnly}
        locale={locale}
        t={t}
      />
      {mode === 'edit' && stage && (
        <>
          <Separator />
          <TransitionEditor blueprint={blueprint} stage={stage} readOnly={readOnly} />
          <Separator />
          <SubStageList
            blueprint={blueprint}
            stage={stage}
            readOnly={readOnly}
            onEditSubStage={(id) => onEditSubStage?.(id)}
          />
        </>
      )}
    </div>
  );
}
