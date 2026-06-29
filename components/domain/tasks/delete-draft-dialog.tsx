'use client';

import { useTranslations } from 'next-intl';
import { ConfirmDeleteDialog } from '@/components/shared/confirm-delete-dialog';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function DeleteDraftDialog({ open, onOpenChange, onConfirm }: Props) {
  const t = useTranslations('tasks.new');

  return (
    <ConfirmDeleteDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('delete_title')}
      description={t('delete_desc')}
      confirmLabel={t('delete_confirm')}
      cancelLabel={t('cancel')}
      onConfirm={onConfirm}
    />
  );
}
