'use client';

import { Input } from '@/components/ui/input';
import { Field, FieldLabel, FieldError } from '@/components/ui/field';

interface BilingualNameFieldsProps<T extends Record<string, unknown>> {
  form: T;
  setForm?: React.Dispatch<React.SetStateAction<T>>;
  onFieldChange?: (key: string, value: string) => void;
  errors?: Record<string, string>;
  t: (key: string) => string;
  readOnly?: boolean;
  arRequired?: boolean;
  nameArKey?: string;
  nameEnKey?: string;
  placeholderArKey?: string;
  placeholderEnKey?: string;
}

export function BilingualNameFields<T extends Record<string, unknown>>({
  form,
  setForm,
  onFieldChange,
  errors = {},
  t,
  readOnly = false,
  arRequired = true,
  nameArKey = 'name_ar',
  nameEnKey = 'name_en',
  placeholderArKey = `${nameArKey}_placeholder`,
  placeholderEnKey = `${nameEnKey}_placeholder`,
}: BilingualNameFieldsProps<T>) {
  const handleChange = (key: string, value: string) => {
    if (onFieldChange) onFieldChange(key, value);
    else setForm?.((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <>
      <Field>
        <FieldLabel>{t(nameArKey)} {arRequired && <span className="text-destructive">*</span>}</FieldLabel>
        <Input
          dir="rtl"
          placeholder={t(placeholderArKey)}
          disabled={readOnly}
          value={String(form[nameArKey] ?? '')}
          onChange={(e) => handleChange(nameArKey, e.target.value)}
        />
        {errors[nameArKey] && <FieldError>{errors[nameArKey]}</FieldError>}
      </Field>
      <Field>
        <FieldLabel>{t(nameEnKey)}</FieldLabel>
        <Input
          dir="ltr"
          placeholder={t(placeholderEnKey)}
          disabled={readOnly}
          value={String(form[nameEnKey] ?? '')}
          onChange={(e) => handleChange(nameEnKey, e.target.value)}
        />
      </Field>
    </>
  );
}
