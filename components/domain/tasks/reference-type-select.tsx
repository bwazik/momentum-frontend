'use client';

import { useLocale, useTranslations } from 'next-intl';
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { EXTERNAL_REFERENCE_TYPE_VALUES } from './task-external-reference-utils';

interface ReferenceTypeSelectProps {
  value: string;
  onValueChange: (value: string) => void;
}

export function ReferenceTypeSelect({ value, onValueChange }: ReferenceTypeSelectProps) {
  const locale = useLocale();
  const t = useTranslations('tasks.references');
  return (
    <Select dir={locale === 'ar' ? 'rtl' : 'ltr'} value={value} onValueChange={(v) => onValueChange(v)}>
      <SelectTrigger aria-label={t('reference_type')}>
        <SelectValue placeholder={t('select_reference_type')} />
      </SelectTrigger>
      <SelectContent position="popper">
        <SelectGroup>
          {EXTERNAL_REFERENCE_TYPE_VALUES.map((type) => (
            <SelectItem key={type} value={type}>{t(`reference_type_${type}`)}</SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
