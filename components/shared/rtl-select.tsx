'use client';

import { useLocale } from 'next-intl';
import { Select } from '@/components/ui/select';

export function RtlSelect(props: React.ComponentProps<typeof Select>) {
  const locale = useLocale();
  return <Select dir={locale === 'ar' ? 'rtl' : 'ltr'} {...props} />;
}
