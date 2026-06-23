'use client';

import { useLocale } from 'next-intl';
import { Textarea } from '@/components/ui/textarea';
import { Field, FieldLabel } from '@/components/ui/field';

interface BilingualDescriptionFieldsProps {
  form: Record<string, any>;
  setForm: React.Dispatch<React.SetStateAction<any>>;
  t: (key: string) => string;
  readOnly?: boolean;
  descriptionArKey?: string;
  descriptionEnKey?: string;
}

export function BilingualDescriptionFields({
  form,
  setForm,
  t,
  readOnly = false,
  descriptionArKey = 'description_ar',
  descriptionEnKey = 'description_en',
}: BilingualDescriptionFieldsProps) {
  const locale = useLocale();

  return (
    <>
      <Field>
        <FieldLabel>{t(descriptionArKey)}</FieldLabel>
        <Textarea
          dir="rtl"
          placeholder={t(`${descriptionArKey}_placeholder`)}
          disabled={readOnly}
          value={form[descriptionArKey] ?? ''}
          onChange={(e) => setForm((prev: Record<string, string>) => ({ ...prev, [descriptionArKey]: e.target.value }))}
        />
      </Field>
      <Field>
        <FieldLabel>{t(descriptionEnKey)}</FieldLabel>
        <Textarea
          dir="ltr"
          placeholder={t(`${descriptionEnKey}_placeholder`)}
          disabled={readOnly}
          value={form[descriptionEnKey] ?? ''}
          onChange={(e) => setForm((prev: Record<string, string>) => ({ ...prev, [descriptionEnKey]: e.target.value }))}
        />
      </Field>
    </>
  );
}
