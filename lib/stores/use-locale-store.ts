'use client';

import { create } from 'zustand';

type Locale = 'ar' | 'en';

interface LocaleState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  syncLocale: (locale: Locale) => void;
}

function setCookie(name: string, value: string): void {
  document.cookie = `${name}=${value};path=/;max-age=${365 * 24 * 60 * 60};SameSite=Lax`;
}

// Always initialize as 'ar' for SSR consistency. The root layout sets <html lang>
// server-side from the cookie. After hydration, LocaleToggle calls syncLocale()
// to match the store with the actual <html lang> without reloading.
export const useLocaleStore = create<LocaleState>((set) => ({
  locale: 'ar',
  setLocale: (locale: Locale) => {
    setCookie('NEXT_LOCALE', locale);
    set({ locale });
    window.location.reload();
  },
  syncLocale: (locale: Locale) => {
    set({ locale });
  },
}));
