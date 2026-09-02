'use client';

import { LogOut } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { AppBrand } from '@/components/shared/app-brand';
import { LocaleToggle } from '@/components/shared/locale-toggle';
import { Button } from '@/components/ui/button';
import { usePlatformAuth, usePlatformLogout } from '@/lib/api/hooks/use-platform';
import { localizeName } from '@/lib/utils/platform-utils';

export function PlatformTopBar() {
  const t = useTranslations('platform.common');
  const locale = useLocale();
  const auth = usePlatformAuth();
  const logout = usePlatformLogout();
  const admin = auth.data;
  return <header className="flex min-h-14 items-center justify-between border-b bg-card px-4 md:px-6">
    <AppBrand appName="Momentum" />
    <div className="flex items-center gap-2">
      {admin && <div className="hidden text-end text-sm sm:block"><p className="font-medium">{localizeName(locale, admin.name_ar, admin.name_en)}</p><p className="text-xs text-muted-foreground" dir="ltr">{admin.email}</p></div>}
      <LocaleToggle />
      <Button variant="ghost" size="icon" aria-label={t('logout')} onClick={() => logout.mutate(undefined)} disabled={logout.isPending}><LogOut /></Button>
    </div>
  </header>;
}
