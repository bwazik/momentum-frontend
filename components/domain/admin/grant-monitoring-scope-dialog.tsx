'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { RtlSelect } from '@/components/shared/rtl-select';
import { SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useGrantMonitoringScope } from '@/lib/api/hooks/use-admin-access';
import { useDepartmentTree } from '@/lib/api/hooks/use-organization';
import { localizeName } from '@/lib/utils/localize';
import { needsDepartment } from '@/lib/utils/admin-utils';

interface GrantMonitoringScopeDialogProps {
  userPublicId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GrantMonitoringScopeDialog({ userPublicId, open, onOpenChange }: GrantMonitoringScopeDialogProps) {
  const t = useTranslations('admin.users.detail.access.monitoring.grant');
  const locale = useLocale();
  const { data: departments } = useDepartmentTree();
  const grant = useGrantMonitoringScope(userPublicId);

  const [scopeType, setScopeType] = useState<number>(1);
  const [scopeDepartmentId, setScopeDepartmentId] = useState('');

  useEffect(() => {
    if (open) setTimeout(() => {
      setScopeType(1); setScopeDepartmentId('');
    }, 0);
  }, [open]);

  const needsDept = needsDepartment(scopeType);

  function handleSubmit() {
    if (needsDept && !scopeDepartmentId) return toast.error(t('department_required'));
    grant.mutate({
      scope_type: scopeType as 1 | 2 | 3 | 4,
      scope_department_id: needsDept ? scopeDepartmentId : null,
    }, { onSuccess: () => onOpenChange(false) });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{t('title')}</DialogTitle></DialogHeader>
        <FieldGroup className="flex flex-col gap-4">
          <Field>
            <FieldLabel>{t('scope_type')}</FieldLabel>
            <RtlSelect value={String(scopeType)} onValueChange={(v) => setScopeType(Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="1">{t('scope_tenant')}</SelectItem>
                <SelectItem value="2">{t('scope_own_department')}</SelectItem>
                <SelectItem value="3">{t('scope_specific_department')}</SelectItem>
                <SelectItem value="4">{t('scope_department_tree')}</SelectItem>
              </SelectContent>
            </RtlSelect>
          </Field>
          {needsDept && (
            <Field>
              <FieldLabel>{t('department')}</FieldLabel>
              <RtlSelect value={scopeDepartmentId} onValueChange={setScopeDepartmentId}>
                <SelectTrigger><SelectValue placeholder={t('department_placeholder')} /></SelectTrigger>
                <SelectContent position="popper">
                  {(departments ?? []).map((d) => (
                    <SelectItem key={d.public_id} value={d.public_id}>
                      {localizeName(locale, d.name_ar, d.name_en)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </RtlSelect>
            </Field>
          )}
        </FieldGroup>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('cancel')}</Button>
          <Button onClick={handleSubmit} disabled={grant.isPending}>{t('grant')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
