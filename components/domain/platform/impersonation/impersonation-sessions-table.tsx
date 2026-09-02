'use client';

import { useTranslations } from 'next-intl';
import { RtlTable } from '@/components/shared/rtl-table';
import { DualDateDisplay } from '@/components/shared/dual-date-display';
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { ImpersonationSession } from '@/lib/utils/platform-utils';

export function ImpersonationSessionsTable({ sessions, onEnd }: { sessions: ImpersonationSession[]; onEnd: (session: ImpersonationSession) => void }) {
  const t = useTranslations('platform.impersonation');
  return <RtlTable aria-label={t('table_aria_label')}><TableHeader><TableRow><TableHead className="text-start">{t('actor')}</TableHead><TableHead className="text-start">{t('tenant')}</TableHead><TableHead className="text-start">{t('started_at')}</TableHead><TableHead className="text-start">{t('expires_at')}</TableHead><TableHead className="text-end">{t('end')}</TableHead></TableRow></TableHeader><TableBody>{sessions.map((session) => <TableRow key={session.public_id}><TableCell dir="ltr">{session.user_id ?? '-'}</TableCell><TableCell dir="ltr">{session.tenant_slug ?? '-'}</TableCell><TableCell><DualDateDisplay gregorian={session.created_at} /></TableCell><TableCell><DualDateDisplay gregorian={session.expires_at} /></TableCell><TableCell className="text-end"><button className="text-sm text-destructive underline" onClick={() => onEnd(session)}>{t('end')}</button></TableCell></TableRow>)}</TableBody></RtlTable>;
}
