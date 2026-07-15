const HIJRI_MONTH_NAMES_AR = [
  'محرم', 'صفر', 'ربيع الأول', 'ربيع الثاني',
  'جمادى الأولى', 'جمادى الآخرة', 'رجب', 'شعبان',
  'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة',
];

const HIJRI_MONTH_NAMES_EN = [
  'Muh', 'Saf', 'Rab I', 'Rab II',
  'Jum I', 'Jum II', 'Raj', 'Sha',
  'Ram', 'Shaw', 'Dhu Q', 'Dhu H',
];

export function formatHijriIso(hijriIso: string, locale: string): string {
  const m = hijriIso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return hijriIso;
  const [, year, month, day] = m;
  const monthIndex = parseInt(month, 10) - 1;
  if (monthIndex < 0 || monthIndex > 11) return hijriIso;
  const monthName = locale === 'ar' ? HIJRI_MONTH_NAMES_AR[monthIndex] : HIJRI_MONTH_NAMES_EN[monthIndex];
  return `${parseInt(day, 10)} ${monthName} ${year}`;
}

export function formatGregorianDate(iso: string, locale: string): string {
  const date = iso.includes('T') ? new Date(iso) : new Date(iso + 'T00:00:00');
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function dateToLocalIso(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatHijriDate(isoDate: string, locale: string): string {
  try {
    const date = new Date(isoDate + 'T00:00:00');
    return new Intl.DateTimeFormat(`${locale}-u-ca-islamic`, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  } catch {
    return '';
  }
}

export function formatDualDate(isoDate: string, locale: string): string {
  const date = new Date(isoDate);
  const gregorian = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);

  const hijri = formatHijriDate(isoDate, locale);

  return `${hijri} — ${gregorian}`;
}
