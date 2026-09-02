'use client';

import { useTranslations } from 'next-intl';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { PlatformAuditEvent } from '@/lib/utils/platform-utils';

interface AuditDetailDialogProps {
  event: PlatformAuditEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuditDetailDialog({ event, open, onOpenChange }: AuditDetailDialogProps) {
  const t = useTranslations('platform.audit');
  const c = useTranslations('platform.common');

  if (!event) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t('detail_title')}</DialogTitle>
        </DialogHeader>
        <div className="flex max-h-[65vh] flex-col gap-4 overflow-y-auto px-1">
          <dl className="grid gap-3 text-sm">
            <div className="flex flex-col gap-1 rounded-md border p-3">
              <dt className="text-xs font-medium text-muted-foreground">{t('action_label')}</dt>
              <dd className="font-mono text-sm" dir="ltr">
                {event.action}
              </dd>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1 rounded-md border p-3">
                <dt className="text-xs font-medium text-muted-foreground">{t('entity')}</dt>
                <dd className="font-mono text-sm" dir="ltr">
                  {event.entity_type} / {event.entity_id ?? '-'}
                </dd>
              </div>
              <div className="flex flex-col gap-1 rounded-md border p-3">
                <dt className="text-xs font-medium text-muted-foreground">{t('actor')}</dt>
                <dd className="font-mono text-sm" dir="ltr">
                  {event.user_id ?? '-'}
                </dd>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1 rounded-md border p-3">
                <dt className="text-xs font-medium text-muted-foreground">{t('ip_address')}</dt>
                <dd className="font-mono text-sm" dir="ltr">
                  {event.ip_address ?? '-'}
                </dd>
              </div>
              <div className="flex flex-col gap-1 rounded-md border p-3">
                <dt className="text-xs font-medium text-muted-foreground">{t('user_agent')}</dt>
                <dd className="break-all font-mono text-xs" dir="ltr">
                  {event.user_agent ?? '-'}
                </dd>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-xs font-medium text-muted-foreground">{t('payload')}</dt>
              <dd>
                <pre
                  dir="ltr"
                  className="max-h-60 overflow-auto rounded-md bg-muted p-4 font-mono text-xs text-foreground"
                >
                  {JSON.stringify(event.payload ?? {}, null, 2)}
                </pre>
              </dd>
            </div>
          </dl>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {c('cancel')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
