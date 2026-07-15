'use client';

import { useTranslations, useLocale } from 'next-intl';
import { RtlSelect } from '@/components/shared/rtl-select';
import { SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWorkingCalendars } from '@/lib/api/hooks/use-organization';
import { localizeName } from '@/lib/utils/localize';

const DEFAULT_SENTINEL = 'default';

interface DepartmentCalendarSelectProps {
  value: string | null;
  onChange: (value: string | null) => void;
}

export function DepartmentCalendarSelect({ value, onChange }: DepartmentCalendarSelectProps) {
  const t = useTranslations('organization');
  const locale = useLocale();
  const { data: calendars, isLoading } = useWorkingCalendars();

  const selectValue = value ?? DEFAULT_SENTINEL;

  return (
    <RtlSelect
      value={selectValue}
      onValueChange={(v) => onChange(v === DEFAULT_SENTINEL ? null : v)}
      disabled={isLoading}
    >
      <SelectTrigger>
        <SelectValue placeholder={t('departments.calendar_placeholder')} />
      </SelectTrigger>
      <SelectContent position="popper">
        <SelectItem value={DEFAULT_SENTINEL}>{t('departments.default_calendar')}</SelectItem>
        {(calendars ?? []).map((c) => (
            <SelectItem key={c.public_id} value={c.public_id}>
              {localizeName(locale, c.name_ar, c.name_en)}
            </SelectItem>
          ))}
      </SelectContent>
    </RtlSelect>
  );
}
