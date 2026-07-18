'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { UserX, Trash2, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { ConfirmDeleteDialog } from '@/components/shared/confirm-delete-dialog';
import { UserSearchCombobox } from './user-search-combobox';
import { useCurrentUser } from '@/lib/api/hooks/use-auth';
import { useCapability } from '@/lib/api/hooks/use-capabilities';
import { ApiRequestError } from '@/lib/api/client';
import {
  useConfidentialParticipantsInfinite,
  useAddConfidentialParticipant,
  useRemoveConfidentialParticipant,
} from '@/lib/api/hooks/use-task-detail';
import { ConfidentialParticipantsSkeleton } from './confidential-participants-skeleton';
import { localizeName } from '@/lib/utils/localize';
import type { components } from '@/lib/generated/api-types';

type ConfidentialParticipantResource = components['schemas']['ConfidentialParticipantResource'];

interface Props {
  taskPublicId: string;
  initiatorId: string;
}

export function ConfidentialParticipantsCard({ taskPublicId, initiatorId }: Props) {
  const t = useTranslations('confidential.participants');
  const locale = useLocale();
  const { data: user } = useCurrentUser();
  const canManage = useCapability('task.confidential.manage_participants');
  const isInitiator = user?.public_id === initiatorId;
  const canManageHere = isInitiator || canManage;

  const query = useConfidentialParticipantsInfinite(taskPublicId);
  const add = useAddConfidentialParticipant(taskPublicId);
  const remove = useRemoveConfidentialParticipant(taskPublicId);
  const [removeTarget, setRemoveTarget] = useState<ConfidentialParticipantResource | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  if (query.isError) {
    if (query.error instanceof ApiRequestError && query.error.status === 403) return null;
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <ErrorState message={query.error.message} onRetry={() => query.refetch()} />
        </CardContent>
      </Card>
    );
  }

  const participants = query.data?.pages.flatMap((p) => p.data).filter((p) => !p.removed_at) ?? [];

  function handleAdd(userPublicId: string) {
    if (!userPublicId) return;
    add.mutate({ user_id: userPublicId });
    setShowAdd(false);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t('title')}
        </CardTitle>
        {canManageHere && !showAdd && (
          <Button size="sm" variant="outline" onClick={() => setShowAdd(true)}>
            <Plus className="me-1 size-4" /> {t('add_placeholder')}
          </Button>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        {query.isLoading ? (
          <ConfidentialParticipantsSkeleton />
        ) : showAdd ? (
          <UserSearchCombobox
            value=""
            onChange={handleAdd}
            placeholder={t('add_placeholder')}
          />
        ) : participants.length === 0 ? (
          <EmptyState
            icon={UserX}
            title={t('empty_title')}
            description={t('empty_description')}
          />
        ) : (
          <>
            <ul className="space-y-2" role="list">
              {participants.map((p) => {
                const name = localizeName(locale, p.user.name_ar, p.user.name_en);
                return (
                  <li key={p.user.public_id} className="flex items-center justify-between gap-2" role="listitem">
                    <div className="flex items-center gap-2">
                      <Avatar className="size-8">
                        <AvatarFallback className="text-xs">{name.slice(0, 2)}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{name}</span>
                    </div>
                    {canManageHere && (
                      <Button
                        variant="outline"
                        size="icon"
                        className="text-destructive"
                        aria-label={t('remove_aria', { name })}
                        onClick={() => setRemoveTarget(p)}
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
            {query.hasNextPage && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => query.fetchNextPage()}
                disabled={query.isFetchingNextPage}
              >
                {query.isFetchingNextPage ? t('loading') : t('load_more')}
              </Button>
            )}
          </>
        )}

        <ConfirmDeleteDialog
          open={!!removeTarget}
          onOpenChange={(open) => !open && setRemoveTarget(null)}
          title={t('remove_title')}
          description={t('remove_description', { name: removeTarget ? localizeName(locale, removeTarget.user.name_ar, removeTarget.user.name_en) : '' })}
          confirmLabel={t('remove_confirm')}
          cancelLabel={t('remove_cancel')}
          onConfirm={() => {
            if (removeTarget) remove.mutate(removeTarget.user.public_id);
            setRemoveTarget(null);
          }}
        />
      </CardContent>
    </Card>
  );
}
