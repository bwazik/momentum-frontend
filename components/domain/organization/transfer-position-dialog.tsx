'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { RtlSelect } from '@/components/shared/rtl-select';
import { SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTransferPosition } from '@/lib/api/hooks/use-organization';
import { localizeName, localizeTitle } from './organization-utils';
import type { components } from '@/lib/generated/api-types';

type PositionResource = components['schemas']['PositionResource'];
type DepartmentTreeResource = components['schemas']['DepartmentTreeResource'];

interface TransferPositionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  position: PositionResource;
  departments: DepartmentTreeResource[];
}

export function TransferPositionDialog({
  open,
  onOpenChange,
  position,
  departments,
}: TransferPositionDialogProps) {
  const t = useTranslations('organization');
  const locale = useLocale();
  const [targetDeptId, setTargetDeptId] = useState('');

  const transferMutation = useTransferPosition(position.public_id);

  function handleConfirm() {
    if (!targetDeptId) return;
    transferMutation.mutate(targetDeptId, {
      onSuccess: () => {
        onOpenChange(false);
        setTargetDeptId('');
      },
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('dialogs.transfer_title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('dialogs.transfer_desc')}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">{localizeTitle(position, locale)}</p>
          <RtlSelect value={targetDeptId} onValueChange={setTargetDeptId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t('dialogs.target_department_placeholder')} />
            </SelectTrigger>
            <SelectContent position="popper">
              {departments.map((dept) => (
                <SelectItem key={dept.public_id} value={dept.public_id}>
                  {localizeName(dept, locale)}
                </SelectItem>
              ))}
            </SelectContent>
          </RtlSelect>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>{t('actions.cancel')}</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={!targetDeptId || transferMutation.isPending}>
            {transferMutation.isPending ? t('actions.saving') : t('dialogs.confirm_transfer')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
