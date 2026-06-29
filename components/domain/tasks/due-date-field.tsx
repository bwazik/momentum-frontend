'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useTaskFormStore } from '@/lib/stores/use-task-form-store';
import { formatHijriDate } from '@/lib/utils/date-utils';

export function DueDateField() {
  const t = useTranslations('tasks.new');
  const locale = useLocale();
  const dueDate = useTaskFormStore((s) => s.dueDate);
  const set = useTaskFormStore((s) => s.set);

  const today = new Date().toISOString().split('T')[0];

  const hijriLabel = dueDate ? formatHijriDate(dueDate, locale) : '';

  return (
    <Field>
      <FieldLabel>{t('due_date')}</FieldLabel>
      <Input
        type="date"
        min={today}
        value={dueDate ?? ''}
        onChange={(e) => set('dueDate', e.target.value || null)}
      />
      {hijriLabel && (
        <p className="text-xs text-muted-foreground">{hijriLabel}</p>
      )}
    </Field>
  );
}
