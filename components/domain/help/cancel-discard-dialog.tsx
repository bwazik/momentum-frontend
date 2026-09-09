'use client';

import { useTranslations } from 'next-intl';
import { ConfirmDeleteDialog } from '@/components/shared/confirm-delete-dialog';

interface CancelDiscardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function CancelDiscardDialog({
  open,
  onOpenChange,
  onConfirm,
}: CancelDiscardDialogProps) {
  const t = useTranslations('help_center.editor');

  return (
    <ConfirmDeleteDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('discard_dialog_title')}
      description={t('discard_dialog_desc')}
      confirmLabel={t('discard_btn')}
      cancelLabel={t('keep_editing')}
      onConfirm={onConfirm}
    />
  );
}
