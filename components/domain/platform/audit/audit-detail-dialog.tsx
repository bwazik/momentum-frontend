'use client';

import { useTranslations } from 'next-intl';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { PlatformAuditEvent } from '@/lib/utils/platform-utils';

export function AuditDetailDialog({ event, open, onOpenChange }: { event: PlatformAuditEvent | null; open: boolean; onOpenChange: (open: boolean) => void }) { const t = useTranslations('platform.audit'); if (!event) return null; return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>{t('detail_title')}</DialogTitle></DialogHeader><dl className="grid gap-3 text-sm"><div><dt className="text-muted-foreground">{t('action_label')}</dt><dd dir="ltr">{event.action}</dd></div><div><dt className="text-muted-foreground">{t('entity')}</dt><dd dir="ltr">{event.entity_type} / {event.entity_id ?? '-'}</dd></div><div><dt className="text-muted-foreground">{t('ip_address')}</dt><dd dir="ltr">{event.ip_address ?? '-'}</dd></div><div><dt className="text-muted-foreground">{t('user_agent')}</dt><dd dir="ltr" className="break-all">{event.user_agent ?? '-'}</dd></div><div><dt className="text-muted-foreground">{t('payload')}</dt><dd><pre dir="ltr" className="max-h-64 overflow-auto rounded-md bg-muted p-3 text-xs">{JSON.stringify(event.payload ?? {}, null, 2)}</pre></dd></div></dl></DialogContent></Dialog>; }
