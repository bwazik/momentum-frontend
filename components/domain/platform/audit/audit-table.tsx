'use client';

import { useLocale, useTranslations } from 'next-intl';
import { RtlTable } from '@/components/shared/rtl-table';
import { DualDateDisplay } from '@/components/shared/dual-date-display';
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  formatPlatformAuditAction,
  formatPlatformAuditEntity,
  localizeName,
  type PlatformAuditEvent,
} from '@/lib/utils/platform-utils';
import { formatTime } from '@/lib/utils/date-utils';
import { Eye } from 'lucide-react';

interface AuditTableProps {
  events: PlatformAuditEvent[];
  onView: (event: PlatformAuditEvent) => void;
}

export function AuditTable({ events, onView }: AuditTableProps) {
  const t = useTranslations('platform.audit');
  const locale = useLocale();

  return (
    <RtlTable aria-label={t('table_aria_label')}>
      <TableHeader>
        <TableRow>
          <TableHead className="text-start">{t('timestamp')}</TableHead>
          <TableHead className="text-start">{t('action_label')}</TableHead>
          <TableHead className="text-start">{t('entity')}</TableHead>
          <TableHead className="text-start">{t('target')}</TableHead>
          <TableHead className="text-start">{t('actor')}</TableHead>
          <TableHead className="w-16 text-end">{t('details')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {events.map((event) => {
          const actorName =
            localizeName(locale, event.user_name_ar, event.user_name_en) ||
            event.user_id ||
            '-';

          return (
            <TableRow key={event.public_id}>
              {/* Stacked Gregorian + Hijri + Localized 12h Time */}
              <TableCell className="text-start text-xs whitespace-nowrap">
                <div className="flex flex-col gap-0.5">
                  <DualDateDisplay
                    gregorian={event.created_at}
                    hijri={event.created_at_hijri}
                    variant="stacked"
                  />
                  {event.created_at && (
                    <span className="text-muted-foreground text-xs" dir="ltr">
                      {formatTime(event.created_at, locale)}
                    </span>
                  )}
                </div>
              </TableCell>

              {/* Translated Action Badge / Label */}
              <TableCell className="text-start">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">
                    {formatPlatformAuditAction(locale, event.action)}
                  </span>
                  <span className="font-mono text-xs text-muted-foreground" dir="ltr">
                    {event.action}
                  </span>
                </div>
              </TableCell>

              {/* Translated Entity Type */}
              <TableCell className="text-start text-sm">
                <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium">
                  {formatPlatformAuditEntity(locale, event.entity_type)}
                </span>
              </TableCell>

              {/* Target Entity ID */}
              <TableCell className="text-start text-xs font-mono text-muted-foreground max-w-[160px] truncate" dir="ltr">
                {event.entity_id ?? t('no_target')}
              </TableCell>

              {/* Localized Actor Name */}
              <TableCell className="text-start text-sm">
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium">{actorName}</span>
                  {event.user_id && actorName !== event.user_id && (
                    <span className="font-mono text-xs text-muted-foreground" dir="ltr">
                      {event.user_id}
                    </span>
                  )}
                </div>
              </TableCell>

              {/* Details Action Button */}
              <TableCell className="text-end">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground hover:text-foreground"
                  onClick={() => onView(event)}
                  aria-label={t('view')}
                >
                  <Eye className="size-4" />
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </RtlTable>
  );
}
