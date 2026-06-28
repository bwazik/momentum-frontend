'use client';

import { useTranslations } from 'next-intl';

interface VacantBadgeProps {
  count?: number;
}

export function VacantBadge({ count }: VacantBadgeProps) {
  const t = useTranslations('organization');
  return (
    <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
      {count != null ? `${count} ${t('positions.vacant')}` : t('positions.vacant')}
    </span>
  );
}
