'use client';

import { useEffect, useRef } from 'react';
import { useLocaleStore } from '@/lib/stores/use-locale-store';

export function LocaleProvider({ initialLocale, children }: { initialLocale: string; children: React.ReactNode }) {
  const synced = useRef(false);

  useEffect(() => {
    if (!synced.current && (initialLocale === 'ar' || initialLocale === 'en')) {
      useLocaleStore.getState().syncLocale(initialLocale as 'ar' | 'en');
      synced.current = true;
    }
  }, [initialLocale]);

  return <>{children}</>;
}
