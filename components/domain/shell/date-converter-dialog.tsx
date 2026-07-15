'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { CalendarSearch } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Field, FieldLabel } from '@/components/ui/field';
import { CalendarSystemToggle } from '@/components/shared/calendar-system-toggle';
import { DatePicker } from '@/components/shared/date-picker';
import { ErrorState } from '@/components/shared/error-state';
import { formatGregorianDate, formatHijriIso } from '@/lib/utils/date-utils';
import { useDateConversion } from '@/lib/api/hooks/use-localization';
import type { components } from '@/lib/generated/api-types';

type CalendarSystem = components['schemas']['CalendarSystem'];

interface DateConverterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DateConverterDialog({ open, onOpenChange }: DateConverterDialogProps) {
  const t = useTranslations('localization');
  const locale = useLocale();
  const [fromCalendar, setFromCalendar] = useState<CalendarSystem>('gregorian');
  const [date, setDate] = useState('');
  const [params, setParams] = useState<{ date: string; from_calendar: CalendarSystem } | null>(null);

  const { data, isLoading, isError, error, refetch } = useDateConversion(params);

  function handleConvert() {
    if (!date.trim()) return;
    setParams({ date: date.trim(), from_calendar: fromCalendar });
  }

  const timezoneFallback = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarSearch className="size-5" />
            {t('date_converter_title')}
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Field>
            <FieldLabel>{t('from_calendar')}</FieldLabel>
            <CalendarSystemToggle
              value={fromCalendar}
              onChange={(v) => setFromCalendar(v)}
              className="w-full"
            />
          </Field>

          <Field>
            <FieldLabel>{t('date_label')}</FieldLabel>
            <DatePicker
              label=""
              value={date || null}
              calendarSystem={fromCalendar}
              onChange={(v) => setDate(v || '')}
              hideToggle
            />
          </Field>

          <Button onClick={handleConvert} disabled={!date.trim()}>
            {t('convert')}
          </Button>

          <div className="min-h-[4rem] rounded-lg border p-3">
            {isLoading && (
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            )}
            {isError && <ErrorState message={error?.message} onRetry={() => refetch()} className="py-0" />}
            {!isLoading && !isError && data && (
              <div className="flex flex-col gap-1">
                <span className="text-base font-medium">{formatGregorianDate(data.gregorian_date, locale)}</span>
                <span className="text-sm text-muted-foreground">
                  {formatHijriIso(data.hijri_date, locale)}{t('hijri_suffix')}
                </span>
                <span className="text-xs text-muted-foreground">{data.timezone || timezoneFallback}</span>
              </div>
            )}
            {!isLoading && !isError && !data && (
              <span className="text-sm text-muted-foreground">{t('converter_empty')}</span>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
