'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useCreatePublicHoliday, useUpdatePublicHoliday } from '@/lib/api/hooks/use-organization';
import { BilingualNameFields } from '@/components/shared/bilingual-name-fields';
import { DatePicker } from '@/components/shared/date-picker';
import { asBool } from './organization-utils';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
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

type PublicHolidayResource = components['schemas']['PublicHolidayResource'];
type StorePublicHolidayRequest = components['schemas']['StorePublicHolidayRequest'];

interface PublicHolidayFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  calendarPublicId: string;
  holiday?: PublicHolidayResource;
}

interface HolidayFormState {
  name_ar: string;
  name_en: string;
  holiday_date: string;
  is_recurring: boolean;
  [key: string]: unknown;
}

export function PublicHolidayFormDialog({
  open,
  onOpenChange,
  calendarPublicId,
  holiday,
}: PublicHolidayFormDialogProps) {
  const t = useTranslations('organization');
  const isEdit = !!holiday;

  const [form, setForm] = useState<HolidayFormState>(() => ({
    name_ar: holiday?.name_ar ?? '',
    name_en: holiday?.name_en ?? '',
    holiday_date: holiday?.holiday_date ? holiday.holiday_date.split('T')[0] : '',
    is_recurring: asBool(holiday?.is_recurring),
  }));
  const [calendarSystem, setCalendarSystem] = useState<'gregorian' | 'hijri'>('gregorian');
  const createMutation = useCreatePublicHoliday(calendarPublicId);
  const updateMutation = useUpdatePublicHoliday(calendarPublicId, holiday?.public_id ?? '');
  const isPending = createMutation.isPending || updateMutation.isPending;

  function validate(): boolean {
    if (!form.name_ar.trim()) { toast.error(t('dialogs.name_ar_required')); return false; }
    return true;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const body = {
      name_ar: form.name_ar,
      name_en: form.name_en || undefined,
      holiday_date: form.holiday_date,
      is_recurring: form.is_recurring,
      calendar_system: calendarSystem === 'hijri' ? 'hijri' : undefined,
    } as unknown as StorePublicHolidayRequest;

    const mutation = isEdit ? updateMutation : createMutation;
    mutation.mutate(body, {
      onSuccess: () => onOpenChange(false),
      onError: () => {},
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t('dialogs.edit_holiday') : t('dialogs.add_holiday')}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? t('dialogs.edit_holiday') : t('dialogs.add_holiday')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <BilingualNameFields
            form={form as unknown as Record<string, unknown>}
            setForm={setForm as unknown as React.Dispatch<React.SetStateAction<Record<string, unknown>>>}
                  t={t}
            nameArKey="name_ar"
          />

          <DatePicker
            id="holiday-date"
            label={t('dialogs.date')}
            value={form.holiday_date}
            calendarSystem={calendarSystem}
            onChange={(value, nextCalendar) => {
              setForm((prev) => ({ ...prev, holiday_date: value ?? '' }));
              if (nextCalendar !== calendarSystem) setCalendarSystem(nextCalendar);
            }}
            required
          />

          <div className="flex items-center gap-2">
            <Checkbox
              id="is_recurring"
              checked={form.is_recurring}
              onCheckedChange={(checked) => setForm((prev) => ({ ...prev, is_recurring: checked === true }))}
            />
            <label htmlFor="is_recurring" className="text-sm font-medium">
              {t('dialogs.is_recurring')}
            </label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              {t('actions.cancel')}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? t('actions.saving') : isEdit ? t('actions.save') : t('actions.create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
