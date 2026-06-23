'use client';

import { useLocale } from 'next-intl';
import { Table } from '@/components/ui/table';

export function RtlTable(props: React.ComponentProps<typeof Table>) {
  const locale = useLocale();
  return <Table dir={locale === 'ar' ? 'rtl' : 'ltr'} {...props} />;
}
