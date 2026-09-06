'use client';

import { useLocale, useTranslations } from 'next-intl';
import { RtlTable } from '@/components/shared/rtl-table';
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { localizeName } from '@/lib/utils/platform-utils';
import { formatGregorianDate, formatTime } from '@/lib/utils/date-utils';
import type { ImpersonationSession } from '@/lib/utils/platform-utils';

interface ImpersonationSessionsTableProps {
  sessions: ImpersonationSession[];
  onEnd: (session: ImpersonationSession) => void;
}

export function ImpersonationSessionsTable({ sessions, onEnd }: ImpersonationSessionsTableProps) {
  const t = useTranslations('platform.impersonation');
  const locale = useLocale();

  return (
    <RtlTable aria-label={t('table_aria_label')}>
      <TableHeader>
        <TableRow>
          <TableHead className="text-start">{t('actor')}</TableHead>
          <TableHead className="text-start">{t('tenant')}</TableHead>
          <TableHead className="text-start">{t('user')}</TableHead>
          <TableHead className="text-start">{t('started_at')}</TableHead>
          <TableHead className="text-start">{t('expires_at')}</TableHead>
          <TableHead className="text-end">{t('end')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sessions.map((session) => {
          const actorName = localizeName(locale, session.actor_name_ar, session.actor_name_en) || session.user_id || '-';
          const targetName = localizeName(locale, session.target_name_ar, session.target_name_en);
          return (
            <TableRow key={session.public_id}>
              <TableCell className="text-start text-sm font-medium">{actorName}</TableCell>
              <TableCell className="text-start text-sm">{session.tenant_slug ?? '-'}</TableCell>
              <TableCell className="text-start text-sm">
                <span dir="ltr">
                  {session.target_email ?? '-'}
                  {targetName && ` (${targetName})`}
                </span>
              </TableCell>
              <TableCell className="text-start text-sm">
                {session.created_at ? (
                  <>
                    {formatGregorianDate(session.created_at, locale)}
                    {' '}
                    <span dir="ltr">{formatTime(session.created_at, locale)}</span>
                  </>
                ) : '-'}
              </TableCell>
              <TableCell className="text-start text-sm">
                {session.expires_at ? (
                  <>
                    {formatGregorianDate(session.expires_at, locale)}
                    {' '}
                    <span dir="ltr">{formatTime(session.expires_at, locale)}</span>
                  </>
                ) : '-'}
              </TableCell>
              <TableCell className="text-end">
                <Button variant="destructive" size="sm" onClick={() => onEnd(session)}>
                  {t('end')}
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </RtlTable>
  );
}

