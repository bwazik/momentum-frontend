'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Field, FieldLabel } from '@/components/ui/field';
import { MultiUserCombobox } from './multi-user-combobox';
import { localizeName } from '@/lib/utils/localize';
import { useTaskFormStore } from '@/lib/stores/use-task-form-store';
import type { ManualItem } from './task-form-fields';

export function ManualAssignmentBlock({ item }: { item: ManualItem }) {
  const t = useTranslations('tasks.new');
  const locale = useLocale();
  const manualAssignments = useTaskFormStore((s) => s.manualAssignments);
  const setManual = useTaskFormStore((s) => s.setManual);
  const key = item.kind === 'sub' ? `sub:${item.public_id}` : item.public_id;
  const value = manualAssignments[key] ?? [];
  const name = localizeName(locale, item.name_ar, item.name_en);

  return (
    <Field>
      <FieldLabel>{t('assign_for', { name })}</FieldLabel>
      <p className="text-xs text-muted-foreground">{t('manual_helper')}</p>
      <MultiUserCombobox
        ariaLabel={t('assign_for', { name })}
        value={value}
        onChange={(ids) => setManual(key, ids)}
        placeholder={t('select_users')}
      />
    </Field>
  );
}
