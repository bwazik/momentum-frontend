'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useDeactivateDepartment } from '@/lib/api/hooks/use-organization';
import { localizeName } from './organization-utils';
import { useLocale } from 'next-intl';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import type { components } from '@/lib/generated/api-types';

type DepartmentResource = components['schemas']['DepartmentResource'];

interface DepartmentDeactivateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department: DepartmentResource;
}

export function DepartmentDeactivateDialog({
  open,
  onOpenChange,
  department,
}: DepartmentDeactivateDialogProps) {
  const t = useTranslations('organization');
  const locale = useLocale();
  const [cascade, setCascade] = useState(false);
  const mutation = useDeactivateDepartment(department.public_id);

  function handleConfirm() {
    mutation.mutate(cascade, {
      onSuccess: () => {
        onOpenChange(false);
        setCascade(false);
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('actions.deactivate')}</DialogTitle>
          <DialogDescription>
            {t('dialogs.confirm_deactivate_desc', {
              name: localizeName(department, locale),
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <Checkbox
            id="cascade-deactivate"
            checked={cascade}
            onCheckedChange={(checked) => setCascade(checked === true)}
          />
          <label
            htmlFor="cascade-deactivate"
            className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {t('departments.cascade_to_children')}
          </label>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={mutation.isPending}
          >
            {t('actions.cancel')}
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? t('actions.processing') : t('actions.deactivate')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
