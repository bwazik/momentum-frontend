'use client';

import { useLocale, useTranslations } from 'next-intl';
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { EXTERNAL_ENTITY_TYPE_VALUES } from './task-external-reference-utils';

interface ExternalEntityTypeSelectProps {
  value: string;
  onValueChange: (value: string) => void;
}

export function ExternalEntityTypeSelect({ value, onValueChange }: ExternalEntityTypeSelectProps) {
  const locale = useLocale();
  const t = useTranslations('tasks.entities');
  return (
    <Select dir={locale === 'ar' ? 'rtl' : 'ltr'} value={value} onValueChange={(v) => onValueChange(v)}>
      <SelectTrigger aria-label={t('entity_type')}>
        <SelectValue placeholder={t('select_entity_type')} />
      </SelectTrigger>
      <SelectContent position="popper">
        <SelectGroup>
          {EXTERNAL_ENTITY_TYPE_VALUES.map((type) => (
            <SelectItem key={type} value={type}>{t(`entity_type_${type}`)}</SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
