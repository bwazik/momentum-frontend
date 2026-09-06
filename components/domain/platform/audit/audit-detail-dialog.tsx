'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DualDateDisplay } from '@/components/shared/dual-date-display';
import {
  formatPlatformAuditAction,
  formatPlatformAuditEntity,
  localizeName,
  type PlatformAuditEvent,
} from '@/lib/utils/platform-utils';
import { formatTime } from '@/lib/utils/date-utils';
import { Code } from 'lucide-react';

interface AuditDetailDialogProps {
  event: PlatformAuditEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuditDetailDialog({ event, open, onOpenChange }: AuditDetailDialogProps) {
  const t = useTranslations('platform.audit');
  const c = useTranslations('platform.common');
  const locale = useLocale();
  const [showRawJson, setShowRawJson] = useState(false);

  if (!event) return null;

  const actorName =
    localizeName(locale, event.user_name_ar, event.user_name_en) ||
    event.user_id ||
    '-';

  const hasPayload = Boolean(event.payload && Object.keys(event.payload).length > 0);
  const hasTechnical = Boolean(event.ip_address || event.user_agent);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base flex flex-col gap-1 text-start">
            <span>{formatPlatformAuditAction(locale, event.action)}</span>
            <div className="flex flex-wrap items-center gap-2 text-xs font-normal text-muted-foreground">
              <DualDateDisplay
                gregorian={event.created_at}
                hijri={event.created_at_hijri}
                variant="inline"
              />
              {event.created_at && (
                <span dir="ltr">{formatTime(event.created_at, locale)}</span>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 text-sm mt-2">
          {/* Action & Code */}
          <div className="rounded-lg border p-3 bg-muted/30">
            <dt className="text-xs font-medium text-muted-foreground mb-1">{t('action_label')}</dt>
            <dd className="flex items-center justify-between">
              <span className="font-medium text-foreground">
                {formatPlatformAuditAction(locale, event.action)}
              </span>
              <span className="font-mono text-xs text-muted-foreground" dir="ltr">
                {event.action}
              </span>
            </dd>
          </div>

          {/* Entity & Actor 2-col grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-lg border p-3">
              <dt className="text-xs font-medium text-muted-foreground mb-1">{t('entity')}</dt>
              <dd className="flex flex-col gap-0.5">
                <span className="font-medium text-foreground">
                  {formatPlatformAuditEntity(locale, event.entity_type)}
                </span>
                {event.entity_id && (
                  <span className="font-mono text-xs text-muted-foreground truncate" dir="ltr">
                    {t('target')}: {event.entity_id}
                  </span>
                )}
              </dd>
            </div>

            <div className="rounded-lg border p-3">
              <dt className="text-xs font-medium text-muted-foreground mb-1">{t('actor')}</dt>
              <dd className="flex flex-col gap-0.5">
                <span className="font-medium text-foreground">{actorName}</span>
                {event.user_id && actorName !== event.user_id && (
                  <span className="font-mono text-xs text-muted-foreground" dir="ltr">
                    {event.user_id}
                  </span>
                )}
              </dd>
            </div>
          </div>

          {/* Technical Details (IP & User Agent) */}
          {hasTechnical && (
            <div className="rounded-lg border p-3">
              <dt className="text-xs font-medium text-muted-foreground mb-2">
                {t('technical_details')}
              </dt>
              <dd className="space-y-1.5 text-xs">
                {event.ip_address && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground min-w-20">{t('ip_address')}:</span>
                    <span className="font-mono text-foreground" dir="ltr">
                      {event.ip_address}
                    </span>
                  </div>
                )}
                {event.user_agent && (
                  <div className="flex items-start gap-2">
                    <span className="text-muted-foreground min-w-20">{t('user_agent')}:</span>
                    <span className="font-mono text-foreground break-all" dir="ltr">
                      {event.user_agent}
                    </span>
                  </div>
                )}
              </dd>
            </div>
          )}

          {/* Structured Payload Display */}
          {hasPayload && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">{t('payload')}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1 text-muted-foreground"
                  onClick={() => setShowRawJson((prev) => !prev)}
                >
                  <Code className="size-3.5" />
                  {showRawJson ? 'Key-Value' : 'JSON'}
                </Button>
              </div>

              {showRawJson ? (
                <pre
                  dir="ltr"
                  className="max-h-60 overflow-auto rounded-md bg-muted p-3 font-mono text-xs text-foreground"
                >
                  {JSON.stringify(event.payload, null, 2)}
                </pre>
              ) : (
                <div className="rounded-lg border divide-y overflow-hidden">
                  {Object.entries(event.payload!).map(([k, v]) => (
                    <div key={k} className="flex px-3 py-2 gap-3 text-xs">
                      <span className="font-medium text-muted-foreground min-w-28">{k}</span>
                      <span className="text-foreground break-all" dir="ltr">
                        {typeof v === 'object' && v !== null
                          ? JSON.stringify(v)
                          : String(v ?? '')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {c('cancel')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
