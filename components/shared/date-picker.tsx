'use client';

import { useId, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { format } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import type { Locale } from 'react-day-picker';
import { Field, FieldLabel, FieldDescription } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarSystemToggle } from './calendar-system-toggle';
import { cn } from '@/lib/utils';
import { formatHijriIso, dateToLocalIso } from '@/lib/utils/date-utils';

interface DatePickerProps {
  id?: string;
  label: string;
  value: string | null;
  calendarSystem: 'gregorian' | 'hijri';
  onChange: (value: string | null, calendarSystem: 'gregorian' | 'hijri') => void;
  required?: boolean;
  className?: string;
  hideToggle?: boolean;
  hideLabel?: boolean;
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

export function DatePicker({
  id,
  label,
  value,
  calendarSystem,
  onChange,
  required,
  className,
  hideToggle,
}: DatePickerProps) {
  const t = useTranslations('localization');
  const locale = useLocale();
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [popoverOpen, setPopoverOpen] = useState(false);

  function handleCalendarSystemChange(next: 'gregorian' | 'hijri') {
    if (next === calendarSystem) return;
    onChange(null, next);
  }

  const gregorianDate = value && calendarSystem === 'gregorian' ? new Date(value + 'T00:00:00') : undefined;

  const hijriFormatters = {
    formatCaption: (date: Date) => formatHijriCaption(date, locale),
    formatDay: (date: Date) => formatHijriDayNumber(date, locale),
    formatWeekdayName: (date: Date) => shortWeekday(date, locale),
  };

  const longMonth = (date: Date) =>
    date.toLocaleString(locale === 'ar' ? 'ar' : 'en', { month: 'long' });

  const commonFormatters = {
    formatMonthDropdown: (date: Date) => longMonth(date),
    formatYearDropdown: (date: Date) => String(date.getFullYear()),
    formatWeekdayName: (date: Date) => shortWeekday(date, locale),
  };

  const picker = (
    <>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-full justify-start text-start font-normal',
              !value && 'text-muted-foreground',
            )}
          >
            <CalendarIcon className="me-2 size-4" />
            {calendarSystem === 'gregorian'
              ? (value ? format(gregorianDate!, 'MMMM dd, y', { locale: locale === 'ar' ? arSA : undefined }) : t('gregorian_placeholder'))
              : (value ? formatHijriIso(value, locale) : t('hijri_placeholder'))}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          {calendarSystem === 'gregorian' ? (
            <Calendar
              mode="single"
              selected={gregorianDate}
              locale={locale === 'ar' ? arSA as unknown as Locale : undefined}
              captionLayout="dropdown"
              formatters={commonFormatters}
              onSelect={(date) => {
                if (date) {
                  const iso = dateToLocalIso(date);
                  onChange(iso, 'gregorian');
                }
                setPopoverOpen(false);
              }}
            />
          ) : (
            <Calendar
              mode="single"
              locale={locale === 'ar' ? arSA as unknown as Locale : undefined}
              formatters={hijriFormatters}
              onSelect={(date) => {
                if (date) {
                  onChange(toHijriIsoFromDate(date, locale), 'hijri');
                }
                setPopoverOpen(false);
              }}
            />
          )}
        </PopoverContent>
      </Popover>
      {!hideToggle && calendarSystem === 'hijri' && (
        <FieldDescription id={`${inputId}-hint`}>{t('hijri_hint')}</FieldDescription>
      )}
    </>
  );

  if (hideToggle) return picker;

  return (
    <Field className={cn('flex flex-col gap-2', className)}>
      <FieldLabel htmlFor={inputId}>
        {label}
        {required && <span className="text-destructive">*</span>}
      </FieldLabel>
      <CalendarSystemToggle
        value={calendarSystem}
        onChange={handleCalendarSystemChange}
        className="self-start"
      />
      {picker}
    </Field>
  );
}
