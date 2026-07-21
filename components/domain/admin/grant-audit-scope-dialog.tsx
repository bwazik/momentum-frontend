'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { RtlSelect } from '@/components/shared/rtl-select';
import { SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/shared/date-picker';
import { Button } from '@/components/ui/button';
import { useGrantAuditScope } from '@/lib/api/hooks/use-admin-access';
import { useDepartmentTree } from '@/lib/api/hooks/use-organization';
import { localizeName } from '@/lib/utils/localize';

interface GrantAuditScopeDialogProps {
  userPublicId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GrantAuditScopeDialog({ userPublicId, open, onOpenChange }: GrantAuditScopeDialogProps) {
  const t = useTranslations('admin.users.detail.access.audit.grant');
  const locale = useLocale();
  const { data: departments } = useDepartmentTree();
  const grant = useGrantAuditScope(userPublicId);

  const [dateRangeStart, setDateRangeStart] = useState('');
  const [dateRangeEnd, setDateRangeEnd] = useState('');
  const [calendarSystem, setCalendarSystem] = useState<'gregorian' | 'hijri'>('gregorian');
  const [departmentId, setDepartmentId] = useState('');

  useEffect(() => {
    if (open) setTimeout(() => {
      setDateRangeStart(''); setDateRangeEnd(''); setDepartmentId(''); setCalendarSystem('gregorian');
    }, 0);
  }, [open]);

  function handleSubmit() {
    if (!dateRangeStart) return toast.error(t('start_date_required'));
    if (!dateRangeEnd) return toast.error(t('end_date_required'));
    grant.mutate({
      date_range_start: dateRangeStart,
      date_range_end: dateRangeEnd,
      department_id: departmentId || null,
      calendar_system: calendarSystem,
    }, { onSuccess: () => onOpenChange(false) });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{t('title')}</DialogTitle></DialogHeader>
        <FieldGroup className="flex flex-col gap-4">
          <DatePicker
            label={t('start_date')}
            value={dateRangeStart}
            calendarSystem={calendarSystem}
            onChange={(v, cs) => { setDateRangeStart(v ?? ''); setCalendarSystem(cs); }}
            required
          />
          <DatePicker
            label={t('end_date')}
            value={dateRangeEnd}
            calendarSystem={calendarSystem}
            onChange={(v, cs) => { setDateRangeEnd(v ?? ''); setCalendarSystem(cs); }}
            required
          />
          <Field>
            <FieldLabel>{t('department')}</FieldLabel>
            <RtlSelect value={departmentId} onValueChange={setDepartmentId}>
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
        </FieldGroup>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('cancel')}</Button>
          <Button onClick={handleSubmit} disabled={grant.isPending}>{t('grant')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
