'use client';

import { useLocale, useTranslations } from 'next-intl';
import { RtlSelect } from '@/components/shared/rtl-select';
import { SelectTrigger, SelectValue, SelectContent, SelectItem, SelectGroup } from '@/components/ui/select';
import { useTaskFormStore } from '@/lib/stores/use-task-form-store';
import { Field, FieldLabel } from '@/components/ui/field';

interface Props {
  priorities: { public_id: string; name_ar: string; name_en: string; is_default: string }[];
}

export function PrioritySelect({ priorities }: Props) {
  const t = useTranslations('tasks.new');
  const locale = useLocale();
  const priorityId = useTaskFormStore((s) => s.priorityId);
  const set = useTaskFormStore((s) => s.set);

  return (
    <Field>
      <FieldLabel>{t('priority')}</FieldLabel>
      <RtlSelect
        value={priorityId ?? undefined}
        onValueChange={(v) => set('priorityId', v || null)}
      >
        <SelectTrigger>
          <SelectValue placeholder={t('priority')} />
        </SelectTrigger>
        <SelectContent position="popper">
          <SelectGroup>
            {priorities.map((p) => (
              <SelectItem key={p.public_id} value={p.public_id}>
                {locale === 'ar' ? (p.name_ar || p.name_en) : (p.name_en || p.name_ar)}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </RtlSelect>
    </Field>
  );
}
