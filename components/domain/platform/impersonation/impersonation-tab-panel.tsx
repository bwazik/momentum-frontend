'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { ConfirmDeleteDialog } from '@/components/shared/confirm-delete-dialog';
import { useEndImpersonation, useImpersonationSessions } from '@/lib/api/hooks/use-platform';
import { ImpersonationSessionsSkeleton } from './impersonation-sessions-skeleton';
import { ImpersonationSessionsTable } from './impersonation-sessions-table';
import { ImpersonationSessionsCardList } from './impersonation-sessions-card-list';
import type { ImpersonationSession } from '@/lib/utils/platform-utils';
import { UserCheck } from 'lucide-react';

export function ImpersonationTabPanel() {
  const t = useTranslations('platform.impersonation');
  const [selected, setSelected] = useState<ImpersonationSession | null>(null);

  const query = useImpersonationSessions();
  const sessions = query.data?.data ?? [];
  const end = useEndImpersonation();

  if (query.isLoading) return <ImpersonationSessionsSkeleton />;
  if (query.isError) return <ErrorState message={t('error')} onRetry={() => query.refetch()} />;

  return (
    <>
      {sessions.length === 0 ? (
        <EmptyState
          icon={UserCheck}
          title={t('empty_title')}
          description={t('empty_description')}
        />
      ) : (
        <>
          <div className="hidden md:block">
            <ImpersonationSessionsTable sessions={sessions} onEnd={setSelected} />
          </div>
          <ImpersonationSessionsCardList sessions={sessions} onEnd={setSelected} />
        </>
      )}

      {selected && (
        <ConfirmDeleteDialog
          open={!!selected}
          onOpenChange={(open) => !open && setSelected(null)}
          title={t('confirm_end_title')}
          description={t('confirm_end_description')}
          confirmLabel={t('end')}
          onConfirm={() => {
            if (selected.tenant_public_id) {
              end.mutate(selected.tenant_public_id, { onSuccess: () => setSelected(null) });
            }
          }}
          isPending={end.isPending}
        />
      )}
    </>
  );
}
