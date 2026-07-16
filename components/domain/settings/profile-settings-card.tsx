'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel, FieldDescription } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { RtlSelect } from '@/components/shared/rtl-select';
import { SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BilingualNameFields } from '@/components/shared/bilingual-name-fields';
import { useCurrentUser, useUpdateProfile } from '@/lib/api/hooks/use-auth';
import { useLocaleStore } from '@/lib/stores/use-locale-store';
import { SettingsSkeleton } from './settings-skeleton';
import { ErrorState } from '@/components/shared/error-state';
import { localizeName } from '@/lib/utils/localize';
import { toast } from 'sonner';

interface ProfileFormState {
  name_ar: string;
  name_en: string;
  mobile: string;
  preferred_language: '1' | '2';
}

function languageValueFromApi(apiValue?: string): '1' | '2' {
  if (!apiValue) return '1';
  const v = apiValue.toLowerCase();
  if (v === 'english' || v === 'en') return '2';
  return '1';
}

export function ProfileSettingsCard() {
  const t = useTranslations('settings.profile');
  const locale = useLocale();
  const { data: user, isLoading, isError, refetch } = useCurrentUser();
  const update = useUpdateProfile();
  const setLocaleCookie = useLocaleStore((s) => s.setLocale);
  const [form, setForm] = useState<ProfileFormState>({
    name_ar: '',
    name_en: '',
    mobile: '',
    preferred_language: '1',
  });

  useEffect(() => {
    if (!user) return;
    const timer = setTimeout(() => {
      setForm({
        name_ar: user.name_ar ?? '',
        name_en: user.name_en ?? '',
        mobile: user.mobile ?? '',
        preferred_language: languageValueFromApi(user.preferred_language),
      });
    }, 0);
    return () => clearTimeout(timer);
  }, [user]);

  if (isLoading) return <SettingsSkeleton />;
  if (isError || !user) return <ErrorState message={t('error')} onRetry={() => refetch()} />;

  const currentUser = user;

  function handleFieldChange(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name_ar.trim()) {
      toast.error(t('name_ar_required'));
      return;
    }
    const body = {
      name_ar: form.name_ar,
      name_en: form.name_en || null,
      mobile: form.mobile || null,
      preferred_language: Number(form.preferred_language) as 1 | 2,
    };
    const currentLang = languageValueFromApi(currentUser.preferred_language);
    const nextLang = form.preferred_language;
    update.mutate(body, {
      onSuccess: () => {
        if (currentLang !== nextLang) {
          const nextLocale = nextLang === '1' ? 'ar' : 'en';
          setLocaleCookie(nextLocale);
        } else {
          toast.success(t('toast.profile_saved'));
        }
      },
    });
  }

  const positionName = user.current_position?.position?.title_ar
    ? localizeName(locale, user.current_position.position.title_ar, user.current_position.position.title_en)
    : '-';

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <BilingualNameFields
            form={form as unknown as Record<string, unknown>}
            setForm={setForm as unknown as React.Dispatch<React.SetStateAction<Record<string, unknown>>>}
            t={t}
            arRequired
          />
          <Field>
            <FieldLabel>{t('mobile')}</FieldLabel>
            <InputGroup>
              <InputGroupAddon>+</InputGroupAddon>
              <InputGroupInput
                type="tel"
                value={form.mobile?.replace(/^\+/, '') ?? ''}
                onChange={(e) => handleFieldChange('mobile', `+${e.target.value.replace(/[^0-9]/g, '')}`)}
                dir="ltr"
                placeholder="974XXXXXXXX"
              />
            </InputGroup>
            <FieldDescription>{t('mobile_hint')}</FieldDescription>
          </Field>
          <Field>
            <FieldLabel>{t('preferred_language')}</FieldLabel>
            <RtlSelect
              value={form.preferred_language}
              onValueChange={(v) => handleFieldChange('preferred_language', v as '1' | '2')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="1">{t('language_arabic')}</SelectItem>
                <SelectItem value="2">{t('language_english')}</SelectItem>
              </SelectContent>
            </RtlSelect>
          </Field>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field>
              <FieldLabel>{t('email')}</FieldLabel>
              <Input value={user.email} readOnly dir="ltr" />
            </Field>
            <Field>
              <FieldLabel>{t('employee_id')}</FieldLabel>
              <Input value={user.employee_id ?? '-'} readOnly dir="ltr" />
            </Field>
          </div>
          <Field>
            <FieldLabel>{t('position')}</FieldLabel>
            <Input value={positionName} readOnly />
          </Field>
          <div className="flex justify-end">
            <Button type="submit" disabled={update.isPending}>
              {update.isPending ? t('saving') : t('save')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
