'use client';

import { useState, useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  useBlueprintTransitions,
  useReturnStage,
} from '@/lib/api/hooks/use-task-detail';
import { ApiRequestError } from '@/lib/api/client';
import { filterReturnTargets, localizeName } from './task-detail-utils';
import type { TaskStageInstanceResource } from './task-detail-types';

interface ReturnStageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskPublicId: string;
  stageInstancePublicId: string;
  currentStageBlueprintId?: string;
  blueprintId?: string;
  detailPublicId: string;
  stages?: TaskStageInstanceResource[];
}

export function ReturnStageDialog({
  open,
  onOpenChange,
  taskPublicId,
  stageInstancePublicId,
  currentStageBlueprintId,
  blueprintId,
  detailPublicId,
  stages,
}: ReturnStageDialogProps) {
  const t = useTranslations('tasks.detail');
  const locale = useLocale();
  const { data: transitions } = useBlueprintTransitions(blueprintId);
  const returnStage = useReturnStage(detailPublicId);

  const [targetStageId, setTargetStageId] = useState('');
  const [reason, setReason] = useState('');

  const validTargets = useMemo(
    () => filterReturnTargets(transitions, currentStageBlueprintId),
    [transitions, currentStageBlueprintId],
  );

  function resolveStageName(stageId: string): string {
    const found = stages?.find(
      (s) => s.blueprint_stage.public_id === stageId,
    );
    if (found) {
      return localizeName(
        locale,
        found.blueprint_stage.name_ar,
        found.blueprint_stage.name_en,
      );
    }
    return stageId;
  }

  function handleSubmit() {
    if (!targetStageId || !reason) return;
    returnStage.mutate(
      {
        taskPublicId,
        stageInstancePublicId,
        body: { target_stage_id: targetStageId, reason },
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setTargetStageId('');
          setReason('');
        },
      },
    );
  }

  const error422 =
    returnStage.error instanceof ApiRequestError &&
    returnStage.error.status === 422
      ? returnStage.error.error.message
      : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('return_stage_title')}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="return-target">{t('target_stage')}</Label>
            <Select
              value={targetStageId}
              onValueChange={setTargetStageId}
            >
              <SelectTrigger id="return-target">
                <SelectValue placeholder={t('select_target_stage')} />
              </SelectTrigger>
              <SelectContent>
                {validTargets.map((tr) => (
                  <SelectItem key={tr.to_stage_id} value={tr.to_stage_id}>
                    {resolveStageName(tr.to_stage_id)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="return-reason">{t('reason')}</Label>
            <Textarea
              id="return-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              aria-required="true"
              placeholder={t('reason_placeholder')}
            />
          </div>
          {error422 && (
            <p className="text-sm text-destructive" role="alert">
              {error422}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t('cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!targetStageId || !reason || returnStage.isPending}
          >
            {returnStage.isPending ? t('submitting') : t('return_stage')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
