'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Plus } from 'lucide-react';
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useActiveExternalEntities } from '@/lib/api/hooks/use-external-references';
import { localizeName } from '@/lib/utils/localize';

interface ExternalEntitySelectProps {
  value: string | null;
  onValueChange: (value: string | null) => void;
}

export function ExternalEntitySelect({ value, onValueChange }: ExternalEntitySelectProps) {
  const locale = useLocale();
  const t = useTranslations('tasks.references');
  const { data: entities, isLoading } = useActiveExternalEntities();

  return (
    <Select dir={locale === 'ar' ? 'rtl' : 'ltr'} value={value ?? ''} onValueChange={(v) => onValueChange(v || null)}>
      <SelectTrigger aria-label={t('issuing_entity')}>
        <SelectValue placeholder={isLoading ? t('loading_entities') : t('select_entity')} />
      </SelectTrigger>
      <SelectContent position="popper">
        <SelectGroup>
          <SelectItem value="__create__" className="text-primary">
            <span className="flex items-center gap-1"><Plus className="size-3" /> {t('create_new_entity')}</span>
          </SelectItem>
          {entities?.map((entity) => (
            <SelectItem key={entity.public_id} value={entity.public_id}>
              {localizeName(locale, entity.name_ar, entity.name_en)}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
