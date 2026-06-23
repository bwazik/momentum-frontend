'use client';

import { useLocale } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Field, FieldLabel, FieldError } from '@/components/ui/field';

interface BilingualNameFieldsProps {
  form: Record<string, any>;
  setForm: React.Dispatch<React.SetStateAction<any>>;
  errors: Record<string, string>;
  t: (key: string) => string;
  readOnly?: boolean;
  arRequired?: boolean;
  nameArKey?: string;
  nameEnKey?: string;
}

export function BilingualNameFields({
  form,
  setForm,
  errors,
  t,
  readOnly = false,
  arRequired = true,
  nameArKey = 'name_ar',
  nameEnKey = 'name_en',
}: BilingualNameFieldsProps) {
  const locale = useLocale();

  return (
    <>
      <Field>
        <FieldLabel>{t(nameArKey)} {arRequired && <span className="text-destructive">*</span>}</FieldLabel>
        <Input
          dir="rtl"
          placeholder={t(`${nameArKey}_placeholder`)}
          disabled={readOnly}
          value={form[nameArKey] ?? ''}
          onChange={(e) => setForm((prev: Record<string, string>) => ({ ...prev, [nameArKey]: e.target.value }))}
        />
        {errors[nameArKey] && <FieldError>{errors[nameArKey]}</FieldError>}
      </Field>
      <Field>
        <FieldLabel>{t(nameEnKey)}</FieldLabel>
        <Input
          dir="ltr"
          placeholder={t(`${nameEnKey}_placeholder`)}
          disabled={readOnly}
          value={form[nameEnKey] ?? ''}
          onChange={(e) => setForm((prev: Record<string, string>) => ({ ...prev, [nameEnKey]: e.target.value }))}
        />
      </Field>
    </>
  );
}
