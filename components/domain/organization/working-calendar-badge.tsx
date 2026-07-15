'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { localizeName } from '@/lib/utils/localize';
import type { components } from '@/lib/generated/api-types';

type WorkingCalendarResource = components['schemas']['WorkingCalendarResource'];

interface WorkingCalendarBadgeProps {
  calendar?: WorkingCalendarResource;
}

export function WorkingCalendarBadge({ calendar }: WorkingCalendarBadgeProps) {
  const t = useTranslations('organization');
  const locale = useLocale();

  if (!calendar) {
    return <span className="text-sm text-muted-foreground">{t('departments.default_calendar')}</span>;
  }

  return (
    <Badge variant="outline">
      {localizeName(locale, calendar.name_ar, calendar.name_en)}
    </Badge>
  );
}
