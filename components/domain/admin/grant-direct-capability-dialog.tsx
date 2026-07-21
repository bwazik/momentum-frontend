'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Field, FieldGroup, FieldLabel, FieldDescription } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { RtlSelect } from '@/components/shared/rtl-select';
import { SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useCapabilities, useGrantUserCapability } from '@/lib/api/hooks/use-admin-access';
import { useDepartmentTree } from '@/lib/api/hooks/use-organization';
import { localizeName } from '@/lib/utils/localize';
import { needsDepartment } from '@/lib/utils/admin-utils';

interface GrantDirectCapabilityDialogProps {
  userPublicId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GrantDirectCapabilityDialog({ userPublicId, open, onOpenChange }: GrantDirectCapabilityDialogProps) {
  const t = useTranslations('admin.users.detail.access.direct.grant');
  const locale = useLocale();
  const { data: caps } = useCapabilities();
  const { data: departments } = useDepartmentTree();
  const grant = useGrantUserCapability(userPublicId);

  const [capabilityId, setCapabilityId] = useState('');
  const [scopeType, setScopeType] = useState<number>(1);
  const [scopeDepartmentId, setScopeDepartmentId] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (open) setTimeout(() => {
      setCapabilityId(''); setScopeType(1); setScopeDepartmentId(''); setReason('');
    }, 0);
  }, [open]);

  const needsDept = needsDepartment(scopeType);

  function handleSubmit() {
    if (!capabilityId) return toast.error(t('capability_required'));
    if (needsDept && !scopeDepartmentId) return toast.error(t('department_required'));
    if (!reason.trim()) return toast.error(t('reason_required'));
    grant.mutate({
      capability_id: capabilityId,
      scope_type: scopeType as 1 | 2 | 3 | 4 | 5,
      scope_department_id: needsDept ? scopeDepartmentId : null,
      reason,
    }, { onSuccess: () => onOpenChange(false) });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>{t('title')}</DialogTitle></DialogHeader>
        <FieldGroup className="flex flex-col gap-4">
          <Field>
            <FieldLabel>{t('capability')}</FieldLabel>
            <RtlSelect value={capabilityId} onValueChange={setCapabilityId}>
              <SelectTrigger><SelectValue placeholder={t('capability_placeholder')} /></SelectTrigger>
              <SelectContent position="popper">
                {(caps ?? []).map((c) => (
                  <SelectItem key={c.public_id} value={c.public_id}>
                    {localizeName(locale, c.name_ar, c.name_en)}
                  </SelectItem>
                ))}
              </SelectContent>
            </RtlSelect>
          </Field>
          <Field>
            <FieldLabel>{t('scope')}</FieldLabel>
            <RtlSelect value={String(scopeType)} onValueChange={(v) => setScopeType(Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="1">{t('scope_tenant')}</SelectItem>
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
          <Field>
            <FieldLabel>{t('reason')}</FieldLabel>
            <FieldDescription>{t('reason_help')}</FieldDescription>
            <Input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={1000} />
          </Field>
        </FieldGroup>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('cancel')}</Button>
          <Button onClick={handleSubmit} disabled={grant.isPending}>{t('grant')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
