'use client';

import { useTranslations } from 'next-intl';
import { RtlTable } from '@/components/shared/rtl-table';
import { DualDateDisplay } from '@/components/shared/dual-date-display';
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import type { ImpersonationSession } from '@/lib/utils/platform-utils';

interface ImpersonationSessionsTableProps {
  sessions: ImpersonationSession[];
  onEnd: (session: ImpersonationSession) => void;
}

export function ImpersonationSessionsTable({ sessions, onEnd }: ImpersonationSessionsTableProps) {
  const t = useTranslations('platform.impersonation');

  return (
    <RtlTable aria-label={t('table_aria_label')}>
      <TableHeader>
        <TableRow>
          <TableHead className="text-start">{t('actor')}</TableHead>
          <TableHead className="text-start">{t('tenant')}</TableHead>
          <TableHead className="text-start">{t('started_at')}</TableHead>
          <TableHead className="text-start">{t('expires_at')}</TableHead>
          <TableHead className="text-end">{t('end')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sessions.map((session) => (
          <TableRow key={session.public_id}>
            <TableCell className="font-mono text-sm">
              {session.user_id ?? '-'}
            </TableCell>
            <TableCell className="font-mono text-sm">
              {session.tenant_slug ?? '-'}
            </TableCell>
            <TableCell>
              <DualDateDisplay gregorian={session.created_at} />
            </TableCell>
            <TableCell>
              <DualDateDisplay gregorian={session.expires_at} />
            </TableCell>
            <TableCell className="text-end">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onEnd(session)}
              >
                {t('end')}
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </RtlTable>
  );
}
