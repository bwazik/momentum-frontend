'use client';

import { useTranslations } from 'next-intl';
import { RtlTable } from '@/components/shared/rtl-table';
import { DualDateDisplay } from '@/components/shared/dual-date-display';
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import type { PlatformAuditEvent } from '@/lib/utils/platform-utils';

interface AuditTableProps {
  events: PlatformAuditEvent[];
  onView: (event: PlatformAuditEvent) => void;
}

export function AuditTable({ events, onView }: AuditTableProps) {
  const t = useTranslations('platform.audit');

  return (
    <RtlTable aria-label={t('table_aria_label')}>
      <TableHeader>
        <TableRow>
          <TableHead className="text-start">{t('timestamp')}</TableHead>
          <TableHead className="text-start">{t('action_label')}</TableHead>
          <TableHead className="text-start">{t('entity')}</TableHead>
          <TableHead className="text-start">{t('actor')}</TableHead>
          <TableHead className="w-20 text-end">{t('details')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {events.map((event) => (
          <TableRow key={event.public_id}>
            <TableCell>
              <DualDateDisplay gregorian={event.created_at} />
            </TableCell>
            <TableCell className="font-mono text-sm">
              {event.action}
            </TableCell>
            <TableCell className="font-mono text-sm">
              {event.entity_type} / {event.entity_id ?? '-'}
            </TableCell>
            <TableCell className="font-mono text-sm">
              {event.user_id ?? '-'}
            </TableCell>
            <TableCell className="text-end">
              <Button
                variant="ghost"
                size="sm"
                className="text-primary hover:underline"
                onClick={() => onView(event)}
              >
                {t('view')}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </RtlTable>
  );
}
