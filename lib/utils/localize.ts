export function localizeName(locale: string, nameAr?: string | null, nameEn?: string | null): string {
  if (locale === 'ar') return nameAr || nameEn || '';
  return nameEn || nameAr || '';
}

export function localizeTitle(locale: string, titleAr?: string | null, titleEn?: string | null): string {
  if (locale === 'ar') return titleAr || titleEn || '';
  return titleEn || titleAr || '';
}
