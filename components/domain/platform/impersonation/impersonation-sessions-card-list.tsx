'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DualDateDisplay } from '@/components/shared/dual-date-display';
import type { ImpersonationSession } from '@/lib/utils/platform-utils';

export function ImpersonationSessionsCardList({ sessions, onEnd }: { sessions: ImpersonationSession[]; onEnd: (session: ImpersonationSession) => void }) { const t = useTranslations('platform.impersonation'); return <div className="grid gap-3 md:hidden">{sessions.map((session) => <Card key={session.public_id}><CardHeader><CardTitle>{session.tenant_slug ?? '-'}</CardTitle></CardHeader><CardContent className="space-y-2 text-sm"><p dir="ltr">{session.user_id ?? '-'}</p><DualDateDisplay gregorian={session.expires_at} variant="stacked" /><button className="text-destructive underline" onClick={() => onEnd(session)}>{t('end')}</button></CardContent></Card>)}</div>; }
