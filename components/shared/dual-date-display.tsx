'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatHijriIso, formatGregorianDate } from '@/lib/utils/date-utils';

interface DualDateDisplayProps {
  gregorian: string | null | undefined;
  hijri?: string | null;
  variant?: 'inline' | 'stacked';
  isLoading?: boolean;
  className?: string;
}

export function DualDateDisplay({
  gregorian,
  hijri,
  variant = 'inline',
  isLoading,
  className,
}: DualDateDisplayProps) {
  const locale = useLocale();
  const t = useTranslations('localization');

  if (isLoading) {
    return (
      <span className={cn('inline-flex flex-col gap-0.5', className)}>
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-20" />
      </span>
    );
  }

  if (!gregorian) return <span className="text-muted-foreground">-</span>;

  let primary = '';
  try {
    primary = formatGregorianDate(gregorian, locale);
  } catch {
    primary = gregorian;
  }

  const companion = hijri ? formatHijriIso(hijri, locale) : null;

  const separator = locale === 'ar' ? ' • ' : ' · ';

  return (
    <span
      className={cn(
        'inline-flex',
        variant === 'stacked' ? 'flex-col' : 'items-center gap-1',
        className,
      )}
    >
      <span>{primary}</span>
      {companion && (
        <span
          className="text-xs text-muted-foreground"
          aria-label={`${t('hijri_date_label')}: ${companion}`}
        >
          {variant === 'inline' && separator}
          {companion}{t('hijri_suffix')}
        </span>
      )}
    </span>
  );
}
