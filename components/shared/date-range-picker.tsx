'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { format } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import type { Locale, DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { formatHijriIso, dateToLocalIso } from '@/lib/utils/date-utils';

interface DateRangePickerProps {
  from: string | null;
  to: string | null;
  onChange: (from: string | null, to: string | null) => void;
  calendarSystem: 'gregorian' | 'hijri';
}

function formatHijriCaption(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(`${locale}-u-ca-islamic-umalqura`, {
    year: 'numeric',
    month: 'long',
  }).format(date);
}

function formatHijriDayNumber(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(`${locale}-u-ca-islamic-umalqura`, {
    day: 'numeric',
  }).format(date);
}

function toHijriIsoFromDate(date: Date, locale: string): string {
  const parts = new Intl.DateTimeFormat(`${locale}-u-ca-islamic-umalqura`, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const year = parts.find((p) => p.type === 'year')?.value ?? '0';
  const month = parts.find((p) => p.type === 'month')?.value ?? '01';
  const day = parts.find((p) => p.type === 'day')?.value ?? '01';
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function shortWeekday(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, { weekday: locale === 'ar' ? 'narrow' : 'short' }).format(date);
}

export function DateRangePicker({ from, to, onChange, calendarSystem }: DateRangePickerProps) {
  const t = useTranslations('localization');
  const locale = useLocale();
  const [open, setOpen] = useState(false);

  const fromDate = from ? new Date(from + 'T00:00:00') : undefined;
  const toDate = to ? new Date(to + 'T00:00:00') : undefined;
  const committed: DateRange | undefined = fromDate
    ? { from: fromDate, to: toDate }
    : undefined;

  const [pending, setPending] = useState<DateRange | undefined>(committed);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) setPending(committed);
  }

  const isHijri = calendarSystem === 'hijri';

  const formatters = {
    formatWeekdayName: (date: Date) => shortWeekday(date, locale),
    ...(isHijri
      ? {
          formatCaption: (date: Date) => formatHijriCaption(date, locale),
          formatDay: (date: Date) => formatHijriDayNumber(date, locale),
        }
      : {
          formatMonthDropdown: (date: Date) =>
            date.toLocaleString(locale === 'ar' ? 'ar' : 'en', { month: 'long' }),
          formatYearDropdown: (date: Date) => String(date.getFullYear()),
        }),
  };

  const triggerLabel = (() => {
    if (isHijri) {
      return from || to
        ? `${from ? formatHijriIso(from, locale) : '…'} – ${to ? formatHijriIso(to, locale) : '…'}`
        : t('hijri_range_placeholder');
    }
    if (!committed?.from) return t('gregorian_range_placeholder');
    const fmt = (d: Date) => format(d, 'MMMM dd, y', { locale: locale === 'ar' ? arSA : undefined });
    return committed.to ? `${fmt(committed.from)} - ${fmt(committed.to)}` : fmt(committed.from);
  })();

  return (
    <Field>
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            id="date-picker-range"
            className={cn(
              'w-full justify-start text-start font-normal',
              !from && !to && 'text-muted-foreground',
            )}
          >
            <CalendarIcon data-icon="inline-start" />
            {triggerLabel}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            defaultMonth={pending?.from ? new Date(pending.from.getFullYear(), pending.from.getMonth(), 1) : undefined}
            selected={pending}
            locale={!isHijri && locale === 'ar' ? arSA as unknown as Locale : undefined}
            captionLayout={isHijri ? 'label' : 'dropdown'}
            formatters={formatters}
            numberOfMonths={2}
            onSelect={(nextDate) => {
              if (!nextDate || !nextDate.from) return;
              if (nextDate.to && nextDate.to.getTime() !== nextDate.from.getTime()) {
                const f = isHijri ? toHijriIsoFromDate(nextDate.from, locale) : dateToLocalIso(nextDate.from);
                const t = isHijri ? toHijriIsoFromDate(nextDate.to, locale) : dateToLocalIso(nextDate.to);
                onChange(f, t);
                setOpen(false);
              } else {
                setPending({ from: nextDate.from, to: undefined });
              }
            }}
          />
        </PopoverContent>
      </Popover>
    </Field>
  );
}
