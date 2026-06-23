'use client';

import { useMemo, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useCompleteStage, useCompleteSubStage } from '@/lib/api/hooks/use-task-detail';
import { useBlueprint } from '@/lib/api/hooks/use-blueprints';
import { localizeName } from '@/lib/utils/localize';
import type { BlueprintTransitionResource, BlueprintStageResource } from '@/components/domain/blueprints/blueprint-types';

interface CompleteStageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskPublicId: string;
  stageInstancePublicId: string;
  detailPublicId: string;
  isSubStage?: boolean;
  transitions?: BlueprintTransitionResource[];
  currentStageBlueprintId?: string;
  blueprintStages?: BlueprintStageResource[];
  blueprintId?: string;
}

export function CompleteStageDialog({
  open,
  onOpenChange,
  taskPublicId,
  stageInstancePublicId,
  detailPublicId,
  isSubStage,
  transitions: transitionsProp,
  currentStageBlueprintId,
  blueprintStages: blueprintStagesProp,
  blueprintId,
}: CompleteStageDialogProps) {
  const { data: blueprintData } = useBlueprint(blueprintId ?? '');
  const transitions = transitionsProp ?? blueprintData?.transitions;
  const blueprintStages = blueprintStagesProp ?? blueprintData?.stages;
  const t = useTranslations('tasks.detail');
  const locale = useLocale();
  const [note, setNote] = useState('');
  const [targetStageId, setTargetStageId] = useState<string | null>(null);
  const [step, setStep] = useState<'pick' | 'form'>('pick');
  const completeStage = useCompleteStage(detailPublicId);
  const completeSubStage = useCompleteSubStage(detailPublicId);
  const mut = isSubStage ? completeSubStage : completeStage;

  const advanceTargets = useMemo(() => {
    if (!transitions || !currentStageBlueprintId || isSubStage) return [];
    return transitions.filter(
      (tr) => tr.from_stage_id === currentStageBlueprintId && tr.transition_type === 'advance',
    );
  }, [transitions, currentStageBlueprintId, isSubStage]);

  function getStageName(stagePublicId: string): string {
    const stage = blueprintStages?.find((s) => s.public_id === stagePublicId);
    return stage ? localizeName(locale, stage.name_ar, stage.name_en) : stagePublicId;
  }

  const needsPicker = advanceTargets.length > 1;

  function handleSubmit() {
    const body: Record<string, unknown> = { completion_note: note || undefined };
    if (targetStageId) body.target_stage_id = targetStageId;

    if (isSubStage) {
      (mut as typeof completeSubStage).mutate(
        { taskPublicId, subStageInstancePublicId: stageInstancePublicId, body },
        {
          onSuccess: () => { onOpenChange(false); setNote(''); setTargetStageId(null); setStep('pick'); },
        },
      );
    } else {
      (mut as typeof completeStage).mutate(
        { taskPublicId, stageInstancePublicId, body },
        {
          onSuccess: () => { onOpenChange(false); setNote(''); setTargetStageId(null); setStep('pick'); },
        },
      );
    }
  }

  function handleBack() {
    setTargetStageId(null);
    setStep('pick');
  }

  function handlePickTarget(id: string) {
    setTargetStageId(id);
    setStep('form');
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{step === 'pick' && needsPicker ? t('choose_advance_target') : t('complete_stage_title')}</DialogTitle>
        </DialogHeader>

        {step === 'pick' && needsPicker ? (
          <div className="flex flex-col gap-2">
            {advanceTargets.map((tr) => {
              const target = tr.to_stage_id; // blueprint stage public_id
              return (
                <Button
                  key={tr.public_id}
                  variant="outline"
                  className="justify-start"
                  onClick={() => handlePickTarget(target)}
                >
                  {getStageName(target)}
                </Button>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="completion-note">{t('completion_note')}</Label>
              <Textarea
                id="completion-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t('completion_note_placeholder')}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          {step === 'form' && needsPicker && (
            <Button variant="ghost" onClick={handleBack}>
              {t('back')}
            </Button>
          )}
          {(!needsPicker || step === 'form') && (
            <Button onClick={handleSubmit} disabled={mut.isPending}>
              {mut.isPending ? t('submitting') : t('complete')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
