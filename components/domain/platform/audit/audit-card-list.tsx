'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DualDateDisplay } from '@/components/shared/dual-date-display';
import {
  formatPlatformAuditAction,
  formatPlatformAuditEntity,
  localizeName,
  type PlatformAuditEvent,
} from '@/lib/utils/platform-utils';
import { formatTime } from '@/lib/utils/date-utils';
import { Eye } from 'lucide-react';

interface AuditCardListProps {
  events: PlatformAuditEvent[];
  onView: (event: PlatformAuditEvent) => void;
}

export function AuditCardList({ events, onView }: AuditCardListProps) {
  const t = useTranslations('platform.audit');
  const locale = useLocale();

  return (
    <div className="grid gap-3 md:hidden">
      {events.map((event) => {
        const actorName =
          localizeName(locale, event.user_name_ar, event.user_name_en) ||
          event.user_id ||
          '-';

        return (
          <Card key={event.public_id}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {formatPlatformAuditAction(locale, event.action)}
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-muted-foreground"
                onClick={() => onView(event)}
                aria-label={t('view')}
              >
                <Eye className="size-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex flex-wrap items-center gap-x-2 text-muted-foreground">
                <DualDateDisplay
                  gregorian={event.created_at}
                  hijri={event.created_at_hijri}
                  variant="inline"
                />
                {event.created_at && (
                  <span dir="ltr">{formatTime(event.created_at, locale)}</span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className="font-mono text-muted-foreground" dir="ltr">
                  {event.action}
                </span>
                <span className="inline-flex items-center rounded bg-muted px-2 py-0.5 text-xs">
                  {formatPlatformAuditEntity(locale, event.entity_type)}
                </span>
              </div>

              {event.entity_id && (
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>{t('target')}:</span>
                  <span className="font-mono truncate max-w-[180px]" dir="ltr">
                    {event.entity_id}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between text-muted-foreground">
                <span>{t('actor')}:</span>
                <span className="font-medium text-foreground">{actorName}</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
