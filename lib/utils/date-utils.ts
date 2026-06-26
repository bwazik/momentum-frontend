export function formatDualDate(isoDate: string, locale: string): string {
  const date = new Date(isoDate);
  const gregorian = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);

  const hijri = new Intl.DateTimeFormat(`${locale}-u-ca-islamic`, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);

  return `${hijri} — ${gregorian}`;
}
