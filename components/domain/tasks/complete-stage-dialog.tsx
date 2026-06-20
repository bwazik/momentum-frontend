'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
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

interface CompleteStageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskPublicId: string;
  stageInstancePublicId: string;
  detailPublicId: string;
  isSubStage?: boolean;
}

export function CompleteStageDialog({
  open,
  onOpenChange,
  taskPublicId,
  stageInstancePublicId,
  detailPublicId,
  isSubStage,
}: CompleteStageDialogProps) {
  const t = useTranslations('tasks.detail');
  const [note, setNote] = useState('');
  const completeStage = useCompleteStage(detailPublicId);
  const completeSubStage = useCompleteSubStage(detailPublicId);
  const mut = isSubStage ? completeSubStage : completeStage;

  function handleSubmit() {
    const body = { completion_note: note || undefined };
    if (isSubStage) {
      (mut as typeof completeSubStage).mutate(
        { taskPublicId, subStageInstancePublicId: stageInstancePublicId, body },
        {
          onSuccess: () => { onOpenChange(false); setNote(''); },
        },
      );
    } else {
      (mut as typeof completeStage).mutate(
        { taskPublicId, stageInstancePublicId, body },
        {
          onSuccess: () => { onOpenChange(false); setNote(''); },
        },
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('complete_stage_title')}</DialogTitle>
        </DialogHeader>
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
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t('cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={mut.isPending}
          >
            {mut.isPending ? t('submitting') : t('complete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
