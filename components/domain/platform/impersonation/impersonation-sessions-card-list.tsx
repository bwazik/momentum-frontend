'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { localizeName } from '@/lib/utils/platform-utils';
import { formatGregorianDate, formatTime } from '@/lib/utils/date-utils';
import type { ImpersonationSession } from '@/lib/utils/platform-utils';

export function ImpersonationSessionsCardList({
  sessions,
  onEnd,
}: {
  sessions: ImpersonationSession[];
  onEnd: (session: ImpersonationSession) => void;
}) {
  const t = useTranslations('platform.impersonation');
  const locale = useLocale();

  return (
    <div className="grid gap-3 md:hidden">
      {sessions.map((session) => {
        const actorName = localizeName(locale, session.actor_name_ar, session.actor_name_en) || session.user_id || '-';
        const targetName = localizeName(locale, session.target_name_ar, session.target_name_en);
        return (
          <Card key={session.public_id}>
            <CardHeader>
              <CardTitle>{session.tenant_slug ?? '-'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-muted-foreground">
                {t('actor')}: <span className="text-foreground">{actorName}</span>
              </p>
              <p className="text-muted-foreground">
                {t('user')}:{' '}
                {targetName ? (
                  <span className="text-foreground">
                    {targetName}
                    {session.target_email && (
                      <span dir="ltr"> ({session.target_email})</span>
                    )}
                  </span>
                ) : session.target_email ? (
                  <span className="text-foreground" dir="ltr">{session.target_email}</span>
                ) : (
                  <span>-</span>
                )}
              </p>
              <p className="text-muted-foreground">
                {t('started_at')}:{' '}
                <span>
                  {session.created_at ? formatGregorianDate(session.created_at, locale) : '-'}
                </span>
                {session.created_at && (
                  <> <span dir="ltr">{formatTime(session.created_at, locale)}</span></>
                )}
              </p>
              <p className="text-muted-foreground">
                {t('expires_at')}:{' '}
                <span>
                  {session.expires_at ? formatGregorianDate(session.expires_at, locale) : '-'}
                </span>
                {session.expires_at && (
                  <> <span dir="ltr">{formatTime(session.expires_at, locale)}</span></>
                )}
              </p>
              <button
                type="button"
                className="text-destructive underline cursor-pointer"
                onClick={() => onEnd(session)}
              >
                {t('end')}
              </button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
