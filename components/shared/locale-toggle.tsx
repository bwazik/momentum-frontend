'use client';

import { Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocaleStore } from '@/lib/stores/use-locale-store';
import { useTranslations } from 'next-intl';

export function LocaleToggle() {
  const { locale, setLocale } = useLocaleStore();
  const t = useTranslations('locale');

  return (
    <Button
      variant="ghost"
      size="icon"
      className="cursor-pointer"
      onClick={() => setLocale(locale === 'ar' ? 'en' : 'ar')}
      aria-label={locale === 'ar' ? t('switch_to_english') : t('switch_to_arabic')}
    >
      <Languages data-slot="icon" />
    </Button>
  );
}
