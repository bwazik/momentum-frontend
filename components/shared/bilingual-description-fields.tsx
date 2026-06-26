'use client';

import { Textarea } from '@/components/ui/textarea';
import { Field, FieldLabel } from '@/components/ui/field';

interface BilingualDescriptionFieldsProps<T extends Record<string, unknown>> {
  form: T;
  setForm: React.Dispatch<React.SetStateAction<T>>;
  t: (key: string) => string;
  readOnly?: boolean;
  descriptionArKey?: string;
  descriptionEnKey?: string;
}

export function BilingualDescriptionFields<T extends Record<string, unknown>>({
  form,
  setForm,
  t,
  readOnly = false,
  descriptionArKey = 'description_ar',
  descriptionEnKey = 'description_en',
}: BilingualDescriptionFieldsProps<T>) {
  return (
    <>
      <Field>
        <FieldLabel>{t(descriptionArKey)}</FieldLabel>
        <Textarea
          dir="rtl"
          placeholder={t(`${descriptionArKey}_placeholder`)}
          disabled={readOnly}
          value={String(form[descriptionArKey] ?? '')}
          onChange={(e) => setForm((prev) => ({ ...prev, [descriptionArKey]: e.target.value }))}
        />
      </Field>
      <Field>
        <FieldLabel>{t(descriptionEnKey)}</FieldLabel>
        <Textarea
          dir="ltr"
          placeholder={t(`${descriptionEnKey}_placeholder`)}
          disabled={readOnly}
          value={String(form[descriptionEnKey] ?? '')}
          onChange={(e) => setForm((prev) => ({ ...prev, [descriptionEnKey]: e.target.value }))}
        />
      </Field>
    </>
  );
}
