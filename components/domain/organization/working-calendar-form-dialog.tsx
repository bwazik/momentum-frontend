'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useCreateWorkingCalendar, useUpdateWorkingCalendar } from '@/lib/api/hooks/use-organization';
import { BilingualNameFields } from '@/components/shared/bilingual-name-fields';
import { RtlSelect } from '@/components/shared/rtl-select';
import { SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Field, FieldLabel } from '@/components/ui/field';
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
import { DAYS, WEEK_START_SAT, asBool } from './organization-utils';
import type { components } from '@/lib/generated/api-types';

type WorkingCalendarResource = components['schemas']['WorkingCalendarResource'];

const GCC_TIMEZONES = [
  'Asia/Riyadh',
  'Asia/Dubai',
  'Asia/Kuwait',
  'Asia/Qatar',
  'Asia/Bahrain',
  'Asia/Muscat',
  'UTC',
] as const;

interface WorkingCalendarFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  calendar?: WorkingCalendarResource;
}

interface CalendarFormState {
  name_ar: string;
  name_en: string;
  working_days: string[];
  working_hours_start: string;
  working_hours_end: string;
  timezone: string;
  is_default: boolean;
}

export function WorkingCalendarFormDialog({
  open,
  onOpenChange,
  calendar,
}: WorkingCalendarFormDialogProps) {
  const t = useTranslations('organization');
  const isEdit = !!calendar;

  const [form, setForm] = useState<CalendarFormState>(() => ({
    name_ar: calendar?.name_ar ?? '',
    name_en: calendar?.name_en ?? '',
    working_days: calendar?.working_days ? calendar.working_days.split(',') : [],
    working_hours_start: calendar?.working_hours_start ?? '08:00',
    working_hours_end: calendar?.working_hours_end ?? '16:00',
    timezone: calendar?.timezone ?? 'Asia/Riyadh',
    is_default: asBool(calendar?.is_default),
  }));
  const createMutation = useCreateWorkingCalendar();
  const updateMutation = useUpdateWorkingCalendar(calendar?.public_id ?? '');
  const isPending = createMutation.isPending || updateMutation.isPending;

  function validate(): boolean {
    if (!form.name_ar.trim()) { toast.error(t('dialogs.name_ar_required')); return false; }
    if (form.working_days.length === 0) { toast.error(t('dialogs.name_ar_required')); return false; }
    return true;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const sanitizeTime = (v: string) => v.replace(/:\d{2}$/, '').trim();
    const body = {
      name_ar: form.name_ar,
      name_en: form.name_en || undefined,
      working_days: form.working_days.join(','),
      working_hours_start: sanitizeTime(form.working_hours_start),
      working_hours_end: sanitizeTime(form.working_hours_end),
      timezone: form.timezone,
      is_default: form.is_default,
    };

    const mutation = isEdit ? updateMutation : createMutation;
    mutation.mutate(body as never, {
      onSuccess: () => onOpenChange(false),
      onError: () => {},
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t('dialogs.edit_calendar') : t('dialogs.add_calendar')}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? t('dialogs.edit_calendar') : t('dialogs.add_calendar')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <BilingualNameFields
            form={form as unknown as Record<string, unknown>}
            setForm={setForm as unknown as React.Dispatch<React.SetStateAction<Record<string, unknown>>>}
                  t={t}
          />

          <Field>
            <FieldLabel>{t('dialogs.working_days')} <span className="text-destructive">*</span></FieldLabel>
            <ToggleGroup
              type="multiple"
              variant="outline"
              size="sm"
              value={form.working_days}
              onValueChange={(v: string[]) => setForm((prev) => ({ ...prev, working_days: v }))}
            >
              {WEEK_START_SAT.map((idx) => {
                const day = DAYS[idx];
                return (
                  <ToggleGroupItem key={day} value={String(idx)} aria-label={t(`days.${day}`)}>
                    {t(`days.short.${day}`)}
                  </ToggleGroupItem>
                );
              })}
            </ToggleGroup>
            
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field>
              <FieldLabel>{t('dialogs.working_hours_start')}</FieldLabel>
              <Input
                type="time"
                step="60"
                value={form.working_hours_start}
                onChange={(e) => setForm((prev) => ({ ...prev, working_hours_start: e.target.value.slice(0, 5) }))}
              />
            </Field>
            <Field>
              <FieldLabel>{t('dialogs.working_hours_end')}</FieldLabel>
              <Input
                type="time"
                step="60"
                value={form.working_hours_end}
                onChange={(e) => setForm((prev) => ({ ...prev, working_hours_end: e.target.value.slice(0, 5) }))}
              />
            </Field>
          </div>

          <Field>
            <FieldLabel>{t('dialogs.timezone')}</FieldLabel>
            <RtlSelect
              value={form.timezone}
              onValueChange={(v: string) => setForm((prev) => ({ ...prev, timezone: v }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                {GCC_TIMEZONES.map((tz) => (
                  <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                ))}
              </SelectContent>
            </RtlSelect>
          </Field>

          <div className="flex items-center gap-2">
            <Checkbox
              id="is_default"
              checked={form.is_default}
              onCheckedChange={(checked) => setForm((prev) => ({ ...prev, is_default: checked === true }))}
            />
            <label htmlFor="is_default" className="text-sm font-medium">
              {t('dialogs.is_default')}
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
