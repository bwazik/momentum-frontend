'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  useSuspendTask,
  useCancelTask,
} from '@/lib/api/hooks/use-task-detail';

interface TaskLifecycleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: 'suspend' | 'cancel';
  publicId: string;
}

export function TaskLifecycleDialog({
  open,
  onOpenChange,
  action,
  publicId,
}: TaskLifecycleDialogProps) {
  const t = useTranslations('tasks.detail');
  const [reason, setReason] = useState('');
  const suspendMut = useSuspendTask(publicId);
  const cancelMut = useCancelTask(publicId);
  const mut = action === 'suspend' ? suspendMut : cancelMut;

  function handleSubmit() {
    if (!reason) return;
    mut.mutate(
      { reason },
      {
        onSuccess: () => {
          onOpenChange(false);
          setReason('');
        },
      },
    );
  }

  const isCancel = action === 'cancel';

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isCancel
              ? t('cancel_task_title')
              : t('suspend_task_title')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isCancel
              ? t('cancel_task_description')
              : t('suspend_task_description')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-col gap-2 py-2">
          <Label htmlFor="lifecycle-reason">{t('reason')}</Label>
          <Textarea
            id="lifecycle-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            aria-required="true"
            placeholder={t('reason_placeholder')}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleSubmit}
            disabled={!reason || mut.isPending}
            className={cn(
              isCancel &&
                'bg-destructive text-destructive-foreground hover:bg-destructive/90',
            )}
          >
            {mut.isPending
              ? t('submitting')
              : isCancel
                ? t('cancel_task')
                : t('suspend')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
