'use client';

import { useTranslations, useLocale } from 'next-intl';
import { TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ActiveBadge } from '@/components/shared/active-badge';
import { localizeName } from '@/lib/utils/localize';
import { PrioritiesRowActions } from './priorities-row-actions';
import type { components } from '@/lib/generated/api-types';

type TaskPriorityResource = components['schemas']['TaskPriorityResource'];

interface PrioritiesTableRowProps {
  priority: TaskPriorityResource;
}

export function PrioritiesTableRow({ priority }: PrioritiesTableRowProps) {
  const t = useTranslations('admin.priorities');
  const locale = useLocale();
  const name = localizeName(locale, priority.name_ar, priority.name_en);

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-2">
          <span
            className="inline-block size-4 rounded-full border"
            style={{ backgroundColor: priority.color_code || '#ccc' }}
            aria-hidden="true"
          />
          <span>{name}</span>
        </div>
      </TableCell>
      <TableCell>{priority.severity_rank}</TableCell>
      <TableCell className="text-muted-foreground">{priority.color_code}</TableCell>
      <TableCell>{priority.display_order}</TableCell>
      <TableCell>
        {priority.is_default ? (
          <Badge variant="secondary" className="text-xs">{t('default')}</Badge>
        ) : '-'}
      </TableCell>
      <TableCell>
        <ActiveBadge
          isActive={String(priority.is_active) !== 'false'}
          activeLabel={t('active')}
          inactiveLabel={t('inactive')}
        />
      </TableCell>
      <TableCell className="text-end">
        <PrioritiesRowActions priority={priority} />
      </TableCell>
    </TableRow>
  );
}
