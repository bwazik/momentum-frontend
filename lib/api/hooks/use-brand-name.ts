import { useLocale } from 'next-intl';
import { useTenant } from './use-tenant';

const PRODUCT_NAME: Record<string, string> = {
  ar: 'مومنتوم',
  en: 'Momentum',
};

export function useBrandName(): string {
  const { data: tenant } = useTenant();
  const locale = useLocale();
  const product = PRODUCT_NAME[locale] ?? PRODUCT_NAME.en;
  const tenantName = locale === 'ar' ? tenant?.tenant?.name_ar : tenant?.tenant?.name_en;
  const fallback = `${product} - Gov TMS`;
  return tenantName ? `${product} - ${tenantName}` : fallback;
}
