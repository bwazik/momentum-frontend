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
