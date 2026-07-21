'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useCapability } from '@/lib/api/hooks/use-capabilities';
import { DualDateDisplay } from '@/components/shared/dual-date-display';
import { AUDIT_ENTITY_TYPE_LABELS } from '@/lib/utils/audit-utils';
import { localizeName } from '@/lib/utils/localize';
import { Eye } from 'lucide-react';
import type { AuditEvent } from '@/lib/utils/audit-utils';

interface AuditEventCardProps {
  event: AuditEvent;
}

export function AuditEventCard({ event }: AuditEventCardProps) {
  const t = useTranslations('admin.audit');
  const locale = useLocale();
  const canViewSystem = useCapability('audit.view_system');
  const [detailsOpen, setDetailsOpen] = useState(false);

  const actorName = event.performed_by
    ? localizeName(locale, event.performed_by.name_ar, event.performed_by.name_en)
    : '-';
  const entityLabel = AUDIT_ENTITY_TYPE_LABELS[event.entity_type];
  const entityTypeName = entityLabel ? (locale === 'ar' ? entityLabel.ar : entityLabel.en) : String(event.entity_type);
  const hasPayload = !!event.payload && Object.keys(event.payload).length > 0;
  const hasTechnical = canViewSystem && (!!event.ip_address || !!event.user_agent);

  return (
    <Card>
      <CardContent className="p-4 space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground"><DualDateDisplay gregorian={event.created_at} hijri={event.created_at_hijri} variant="inline" /> {new Date(event.created_at).toLocaleTimeString(locale === 'ar' ? 'ar-SA' : 'en-US', { hour: '2-digit', minute: '2-digit' })}</span>
          <span className="font-medium text-xs">{actorName}</span>
        </div>
        <div className="flex gap-2 text-xs">
          <span className="font-medium">{event.event_type}</span>
          <span className="text-muted-foreground">{entityTypeName}</span>
          {event.entity_id && (
            <span className="text-muted-foreground truncate max-w-[100px]">{event.entity_id}</span>
          )}
        </div>
        {(hasPayload || hasTechnical) && (
          <Button variant="ghost" size="icon" className="size-8" onClick={() => setDetailsOpen(true)} aria-label={t('details_toggle')}>
            <Eye className="size-4" />
          </Button>
        )}

        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base">{t('details')}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 text-sm">
              {hasPayload && (
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground mb-2">{t('payload')}</h4>
                  <div className="rounded-lg border divide-y">
                    {Object.entries(event.payload!).map(([k, v]) => (
                      <div key={k} className="flex px-3 py-2 gap-3">
                        <span className="font-medium text-muted-foreground text-xs min-w-24">{k}</span>
                        <span className="text-foreground break-all">{String(v ?? '')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {hasTechnical && (
                <div>
                  <Separator />
                  <h4 className="text-xs font-medium text-muted-foreground mt-4 mb-2">{t('technical_details')}</h4>
                  <div className="rounded-lg border divide-y">
                    {event.ip_address && (
                      <div className="flex px-3 py-2 gap-3">
                        <span className="font-medium text-muted-foreground text-xs min-w-24">IP</span>
                        <span className="text-foreground">{event.ip_address}</span>
                      </div>
                    )}
                    {event.user_agent && (
                      <div className="flex px-3 py-2 gap-3">
                        <span className="font-medium text-muted-foreground text-xs min-w-24">UA</span>
                        <span className="text-foreground break-all">{event.user_agent}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
