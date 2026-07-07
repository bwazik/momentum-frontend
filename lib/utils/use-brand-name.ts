export { useBrandName } from '@/lib/api/hooks/use-brand-name';

export function getBrandDescription(locale: string): string {
  const descriptions: Record<string, string> = {
    ar: 'نصنع التقدم داخل المؤسسات',
    en: 'We create momentum inside organizations',
  };
  return descriptions[locale] ?? descriptions.en;
}
