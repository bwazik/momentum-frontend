'use client';

import { useTranslations } from 'next-intl';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { TaskExternalReferenceResource } from './task-external-reference-types';

interface TaskExternalReferenceDeleteDialogProps {
  reference: TaskExternalReferenceResource | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isPending: boolean;
}

export function TaskExternalReferenceDeleteDialog({
  reference, open, onOpenChange, onConfirm, isPending,
}: TaskExternalReferenceDeleteDialogProps) {
  const t = useTranslations('tasks.references');
  if (!reference) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('delete_title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('delete_description', { number: reference.reference_number })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isPending}>
            {isPending ? t('deleting') : t('delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
