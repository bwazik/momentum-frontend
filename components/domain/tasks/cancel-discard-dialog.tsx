'use client';

import { useTranslations } from 'next-intl';
import { ConfirmDeleteDialog } from '@/components/shared/confirm-delete-dialog';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function CancelDiscardDialog({ open, onOpenChange, onConfirm }: Props) {
  const t = useTranslations('tasks.new');

  return (
    <ConfirmDeleteDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('discard_title')}
      description={t('discard_desc')}
      confirmLabel={t('discard_confirm')}
      cancelLabel={t('cancel')}
      onConfirm={onConfirm}
    />
  );
}
