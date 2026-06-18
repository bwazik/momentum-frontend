import { useLocale } from 'next-intl';
import { useTenant } from '@/lib/api/hooks/use-tenant';

const PRODUCT_NAME = {
  ar: 'مومنتوم',
  en: 'Momentum',
};

const BRAND_DESCRIPTIONS = {
  ar: 'نصنع التقدم داخل المؤسسات',
  en: 'We create momentum inside organizations',
};

export function useBrandName(): string {
  const { data: tenant } = useTenant();
  const locale = useLocale();
  const product = PRODUCT_NAME[locale as keyof typeof PRODUCT_NAME] ?? PRODUCT_NAME.en;
  const tenantName = locale === 'ar' ? tenant?.tenant?.name_ar : tenant?.tenant?.name_en;
  const fallback = `${product} - Gov TMS`;
  return tenantName ? `${product} - ${tenantName}` : fallback;
}

export function getBrandDescription(locale: string): string {
  return BRAND_DESCRIPTIONS[locale as keyof typeof BRAND_DESCRIPTIONS] ?? BRAND_DESCRIPTIONS.en;
}
