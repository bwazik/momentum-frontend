'use client';

import { useTranslations } from 'next-intl';
import { RtlTable } from '@/components/shared/rtl-table';
import { DualDateDisplay } from '@/components/shared/dual-date-display';
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { PlatformAuditEvent } from '@/lib/utils/platform-utils';

export function AuditTable({ events, onView }: { events: PlatformAuditEvent[]; onView: (event: PlatformAuditEvent) => void }) { const t = useTranslations('platform.audit'); return <RtlTable aria-label={t('table_aria_label')}><TableHeader><TableRow><TableHead className="text-start">{t('timestamp')}</TableHead><TableHead className="text-start">{t('action_label')}</TableHead><TableHead className="text-start">{t('entity')}</TableHead><TableHead className="text-start">{t('actor')}</TableHead><TableHead className="text-end">{t('details')}</TableHead></TableRow></TableHeader><TableBody>{events.map((event) => <TableRow key={event.public_id}><TableCell><DualDateDisplay gregorian={event.created_at} /></TableCell><TableCell dir="ltr">{event.action}</TableCell><TableCell dir="ltr">{event.entity_type} / {event.entity_id ?? '-'}</TableCell><TableCell dir="ltr">{event.user_id ?? '-'}</TableCell><TableCell className="text-end"><ButtonLike label={t('view')} onClick={() => onView(event)} /></TableCell></TableRow>)}</TableBody></RtlTable>; }
function ButtonLike({ label, onClick }: { label: string; onClick: () => void }) { return <button className="text-sm text-primary underline" onClick={onClick}>{label}</button>; }
