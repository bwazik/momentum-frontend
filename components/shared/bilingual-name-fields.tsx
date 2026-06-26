'use client';

import { Input } from '@/components/ui/input';
import { Field, FieldLabel, FieldError } from '@/components/ui/field';

interface BilingualNameFieldsProps<T extends Record<string, unknown>> {
  form: T;
  setForm: React.Dispatch<React.SetStateAction<T>>;
  errors: Record<string, string>;
  t: (key: string) => string;
  readOnly?: boolean;
  arRequired?: boolean;
  nameArKey?: string;
  nameEnKey?: string;
}

export function BilingualNameFields<T extends Record<string, unknown>>({
  form,
  setForm,
  errors,
  t,
  readOnly = false,
  arRequired = true,
  nameArKey = 'name_ar',
  nameEnKey = 'name_en',
}: BilingualNameFieldsProps<T>) {
  return (
    <>
      <Field>
        <FieldLabel>{t(nameArKey)} {arRequired && <span className="text-destructive">*</span>}</FieldLabel>
        <Input
          dir="rtl"
          placeholder={t(`${nameArKey}_placeholder`)}
          disabled={readOnly}
          value={String(form[nameArKey] ?? '')}
          onChange={(e) => setForm((prev) => ({ ...prev, [nameArKey]: e.target.value }))}
        />
        {errors[nameArKey] && <FieldError>{errors[nameArKey]}</FieldError>}
      </Field>
      <Field>
        <FieldLabel>{t(nameEnKey)}</FieldLabel>
        <Input
          dir="ltr"
          placeholder={t(`${nameEnKey}_placeholder`)}
          disabled={readOnly}
          value={String(form[nameEnKey] ?? '')}
          onChange={(e) => setForm((prev) => ({ ...prev, [nameEnKey]: e.target.value }))}
        />
      </Field>
    </>
  );
}
