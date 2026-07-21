'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { RtlSelect } from '@/components/shared/rtl-select';
import { SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/shared/date-picker';
import { usePositions } from '@/lib/api/hooks/use-organization';
import { useAssignPosition } from '@/lib/api/hooks/use-admin-users';
import { localizeName } from '@/lib/utils/localize';
import type { components } from '@/lib/generated/api-types';

type AssignPositionRequest = components['schemas']['AssignPositionRequest'];

interface PositionAssignmentDialogProps {
  userPublicId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PositionAssignmentDialog({ userPublicId, open, onOpenChange }: PositionAssignmentDialogProps) {
  const t = useTranslations('admin.users.detail.positions');
  const locale = useLocale();
  const { data: positionsPage } = usePositions({ is_active: true });
  const assign = useAssignPosition(userPublicId);

  const allPositions = positionsPage?.pages.flatMap((p) => p.data) ?? [];

  const [positionId, setPositionId] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [startedAt, setStartedAt] = useState('');
  const [calendarSystem, setCalendarSystem] = useState<'gregorian' | 'hijri'>('gregorian');

  useEffect(() => {
    if (open) setTimeout(() => {
      setPositionId(''); setIsPrimary(false); setStartedAt(''); setCalendarSystem('gregorian');
    }, 0);
  }, [open]);

  function handleSubmit() {
    if (!positionId) return toast.error(t('position_required'));
    const body: AssignPositionRequest = {
      position_id: positionId,
      is_primary: isPrimary,
      started_at: startedAt || null,
      calendar_system: calendarSystem,
    };
    assign.mutate(body, { onSuccess: () => onOpenChange(false) });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{t('assign_title')}</DialogTitle></DialogHeader>
        <FieldGroup className="flex flex-col gap-4">
          <Field>
            <FieldLabel>{t('position')} <span className="text-destructive">*</span></FieldLabel>
            <RtlSelect value={positionId} onValueChange={setPositionId}>
              <SelectTrigger><SelectValue placeholder={t('position_placeholder')} /></SelectTrigger>
              <SelectContent position="popper">
                {allPositions.filter((p) => String(p.is_active) !== 'false').map((p) => (
                  <SelectItem key={p.public_id} value={p.public_id}>
                    {localizeName(locale, p.title_ar, p.title_en)}
                  </SelectItem>
                ))}
              </SelectContent>
            </RtlSelect>
          </Field>
          <DatePicker
            label={t('started_at')}
            value={startedAt}
            calendarSystem={calendarSystem}
            onChange={(v, cs) => { setStartedAt(v ?? ''); setCalendarSystem(cs); }}
          />
          <div className="flex items-center gap-2">
            <Checkbox
              id="is-primary"
              checked={isPrimary}
              onCheckedChange={(v) => setIsPrimary(v === true)}
            />
            <label htmlFor="is-primary" className="text-sm">{t('set_as_primary')}</label>
          </div>
        </FieldGroup>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('cancel')}</Button>
          <Button onClick={handleSubmit} disabled={assign.isPending}>{t('assign')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
