'use client';

import { Textarea } from '@/components/ui/textarea';
import { Field, FieldLabel } from '@/components/ui/field';

interface BilingualDescriptionFieldsProps<T extends Record<string, unknown>> {
  form: T;
  setForm?: React.Dispatch<React.SetStateAction<T>>;
  onFieldChange?: (key: string, value: string) => void;
  t: (key: string) => string;
  readOnly?: boolean;
  descriptionArKey?: string;
  descriptionEnKey?: string;
  placeholderArKey?: string;
  placeholderEnKey?: string;
}

export function BilingualDescriptionFields<T extends Record<string, unknown>>({
  form,
  setForm,
  onFieldChange,
  t,
  readOnly = false,
  descriptionArKey = 'description_ar',
  descriptionEnKey = 'description_en',
  placeholderArKey = `${descriptionArKey}_placeholder`,
  placeholderEnKey = `${descriptionEnKey}_placeholder`,
}: BilingualDescriptionFieldsProps<T>) {
  const handleChange = (key: string, value: string) => {
    if (onFieldChange) onFieldChange(key, value);
    else setForm?.((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <>
      <Field>
        <FieldLabel>{t(descriptionArKey)}</FieldLabel>
        <Textarea
          dir="rtl"
          placeholder={t(placeholderArKey)}
          disabled={readOnly}
          value={String(form[descriptionArKey] ?? '')}
          onChange={(e) => handleChange(descriptionArKey, e.target.value)}
        />
      </Field>
      <Field>
        <FieldLabel>{t(descriptionEnKey)}</FieldLabel>
        <Textarea
          dir="ltr"
          placeholder={t(placeholderEnKey)}
          disabled={readOnly}
          value={String(form[descriptionEnKey] ?? '')}
          onChange={(e) => handleChange(descriptionEnKey, e.target.value)}
        />
      </Field>
    </>
  );
}
