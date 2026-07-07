import Link from 'next/link';
import { headers } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import { cookies } from 'next/headers';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AppBrand } from '@/components/shared/app-brand';
import { LocaleToggle } from '@/components/shared/locale-toggle';
import { ModeToggle } from '@/components/theme-toggle';

const PRODUCT_NAME: Record<string, string> = {
  ar: 'مومنتوم',
  en: 'Momentum',
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.momentum.test';

export default async function NotFound() {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const locale = cookieStore.get('NEXT_LOCALE')?.value ?? 'ar';
  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  const host = headerStore.get('host') ?? '';
  const tenantSlug = host.split('.')[0] || 'moh';
  const t = await getTranslations({ locale, namespace: 'not_found' });

  let tenantName: string | null = null;
  try {
    const res = await fetch(`${API_URL}/v1`, {
      headers: { 'X-Tenant': tenantSlug, Accept: 'application/json' },
      signal: AbortSignal.timeout(3000),
    });
    if (res.ok) {
      const data = await res.json();
      tenantName = locale === 'ar' ? data?.tenant?.name_ar : data?.tenant?.name_en;
    }
  } catch {}

  const product = PRODUCT_NAME[locale] ?? PRODUCT_NAME.en;
  const appName = tenantName ? `${product} - ${tenantName}` : product;

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <AppBrand appName={appName} />

        <Card>
          <CardContent className="flex flex-col items-center gap-4 pt-6 text-center">
            <span
              className="text-3xl font-bold text-primary"
              aria-hidden="true"
            >
              404
            </span>
            <h1 className="text-xl font-semibold text-foreground">
              {t('title')}
            </h1>
            <p className="max-w-md text-sm text-muted-foreground">
              {t('description')}
            </p>
            <Button
              asChild
              className="active:scale-[0.98]"
            >
              <Link href="/">{t('back_home')}</Link>
            </Button>
          </CardContent>
        </Card>

        <div className="flex items-center justify-center gap-2" dir={dir}>
          <LocaleToggle />
          <ModeToggle />
        </div>
      </div>
    </main>
  );
}
