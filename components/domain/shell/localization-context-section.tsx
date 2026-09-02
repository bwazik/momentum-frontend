'use client';

import { useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Skeleton } from '@/components/ui/skeleton';
import { useLocalizationContext } from '@/lib/api/hooks/use-localization';
import { useLocaleStore } from '@/lib/stores/use-locale-store';

export function LocalizationContextSection({ mode = 'tenant' }: { mode?: 'tenant' | 'platform' }) {
  const t = useTranslations('localization');
  const locale = useLocale();
  const { data, isLoading, isError } = useLocalizationContext(mode === 'tenant');

  useEffect(() => {
    if (!data) return;
    const cookie = document.cookie.match(/NEXT_LOCALE=([^;]+)/);
    if (cookie) return;
    const l = data.locale;
    if (l !== 'ar' && l !== 'en') return;
    useLocaleStore.getState().setLocale(l);
  }, [data]);

  if (isLoading) {
    return (
      <div className="space-y-2 px-2 py-1.5">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    );
  }

  const context = data ?? (mode === 'platform' ? {
    locale,
    text_direction: locale === 'ar' ? 'rtl' : 'ltr',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    hijri_calendar_variant: '-',
  } : null);

  if (isError || !context) return null;

  const items = [
    { label: t('context.locale'), value: context.locale },
    { label: t('context.direction'), value: context.text_direction.toUpperCase() },
    { label: t('context.timezone'), value: context.timezone },
    { label: t('context.variant'), value: context.hijri_calendar_variant },
  ];

  return (
    <div className="px-2 py-1.5">
      <p className="mb-1 text-xs font-medium text-muted-foreground">{t('context.title')}</p>
      <dl className="space-y-1">
        {items.map((item) => (
          <div key={item.label} className="flex justify-between gap-2 text-sm">
            <dt className="text-muted-foreground">{item.label}</dt>
            <dd className="font-medium">{item.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
