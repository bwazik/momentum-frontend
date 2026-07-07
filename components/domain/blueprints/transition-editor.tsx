'use client';

import { useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Field, FieldLabel } from '@/components/ui/field';
import { Checkbox } from '@/components/ui/checkbox';
import { useCreateTransition, useDeleteTransition } from '@/lib/api/hooks/use-blueprints';
import type { components } from '@/lib/generated/api-types';

type StoreBlueprintTransitionRequest = components['schemas']['StoreBlueprintTransitionRequest'];
import { deriveAdvanceTargets, deriveReturnTargets, getStageTransitions } from '@/lib/utils/blueprint-utils';
import { localizeName } from '@/lib/utils/localize';
import type { BlueprintResource, BlueprintStageResource } from './blueprint-types';

interface TransitionEditorProps {
  blueprint: BlueprintResource;
  stage: BlueprintStageResource;
  readOnly: boolean;
}

export function TransitionEditor({ blueprint, stage, readOnly }: TransitionEditorProps) {
  const t = useTranslations('blueprints.builder.panel.transitions');
  const locale = useLocale();
  const createTransition = useCreateTransition(blueprint.public_id);
  const deleteTransition = useDeleteTransition(blueprint.public_id);
  const isPending = createTransition.isPending || deleteTransition.isPending;

  const advanceTargets = useMemo(() => deriveAdvanceTargets(blueprint.stages ?? [], stage.public_id), [blueprint.stages, stage.public_id]);
  const returnTargets = useMemo(() => deriveReturnTargets(blueprint.stages ?? [], stage.public_id), [blueprint.stages, stage.public_id]);
  const existing = useMemo(() => getStageTransitions(blueprint.transitions, stage.public_id), [blueprint.transitions, stage.public_id]);
  const existingAdvance = existing.filter((tr) => tr.transition_type === 'advance').map((tr) => tr.to_stage_id);
  const existingReturn = existing.filter((tr) => tr.transition_type === 'return');

  function toggleAdvance(toStageId: string, checked: boolean) {
    if (checked) {
      createTransition.mutate({ from_stage_id: stage.public_id, to_stage_id: toStageId, transition_type: 1 } as StoreBlueprintTransitionRequest);
    } else {
      const tr = existing.find((t) => t.to_stage_id === toStageId && t.transition_type === 'advance');
      if (tr) deleteTransition.mutate(tr.public_id);
    }
  }

  function toggleReturn(toStageId: string, checked: boolean) {
    if (checked) {
      createTransition.mutate({ from_stage_id: stage.public_id, to_stage_id: toStageId, transition_type: 2, return_reason_required: true } as StoreBlueprintTransitionRequest);
    } else {
      const tr = existingReturn.find((t) => t.to_stage_id === toStageId);
      if (tr) deleteTransition.mutate(tr.public_id);
    }
  }

  return (
    <div className="space-y-3">
      <Field>
        <FieldLabel>{t('advance')}</FieldLabel>
        <div className="space-y-2">
          {advanceTargets.length === 0 && <p className="text-xs text-muted-foreground">{t('no_advance_targets')}</p>}
          {advanceTargets.map((target) => (
            <label key={target.public_id} className="flex items-center gap-2">
              <Checkbox disabled={readOnly || isPending} checked={existingAdvance.includes(target.public_id)} onCheckedChange={(v) => toggleAdvance(target.public_id, Boolean(v))} />
              <span className="text-sm">{localizeName(locale, target.name_ar, target.name_en)}</span>
            </label>
          ))}
        </div>
      </Field>
      <Field>
        <FieldLabel>{t('return')}</FieldLabel>
        <div className="space-y-2">
          {returnTargets.length === 0 && <p className="text-xs text-muted-foreground">{t('no_return_targets')}</p>}
          {returnTargets.map((target) => (
            <label key={target.public_id} className="flex items-center gap-2">
              <Checkbox disabled={readOnly || isPending} checked={existingReturn.some((tr) => tr.to_stage_id === target.public_id)} onCheckedChange={(v) => toggleReturn(target.public_id, Boolean(v))} />
              <span className="text-sm">{localizeName(locale, target.name_ar, target.name_en)}</span>
            </label>
          ))}
        </div>
      </Field>
    </div>
  );
}
