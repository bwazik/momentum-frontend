'use client';

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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useDeleteDocument } from '@/lib/api/hooks/use-task-documents';
import type { DocumentResource } from './task-document-types';

interface TaskDocumentDeleteDialogProps {
  document: DocumentResource;
  taskPublicId: string;
  trigger: React.ReactNode;
}

export function TaskDocumentDeleteDialog({
  document,
  taskPublicId,
  trigger,
}: TaskDocumentDeleteDialogProps) {
  const t = useTranslations('tasks.documents');
  const deleteMutation = useDeleteDocument(taskPublicId);

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('delete_title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('delete_description', { name: document.original_filename })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={() => deleteMutation.mutate(document.public_id)}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? t('deleting') : t('delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
