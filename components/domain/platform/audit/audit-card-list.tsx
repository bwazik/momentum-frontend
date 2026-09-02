'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DualDateDisplay } from '@/components/shared/dual-date-display';
import type { PlatformAuditEvent } from '@/lib/utils/platform-utils';

export function AuditCardList({ events, onView }: { events: PlatformAuditEvent[]; onView: (event: PlatformAuditEvent) => void }) { const t = useTranslations('platform.audit'); return <div className="grid gap-3 md:hidden">{events.map((event) => <Card key={event.public_id}><CardHeader><CardTitle dir="ltr">{event.action}</CardTitle></CardHeader><CardContent className="space-y-2 text-sm"><DualDateDisplay gregorian={event.created_at} variant="stacked" /><p dir="ltr">{event.entity_type} / {event.entity_id ?? '-'}</p><button className="text-primary underline" onClick={() => onView(event)}>{t('view')}</button></CardContent></Card>)}</div>; }
