'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfirmDeleteDialog } from '@/components/shared/confirm-delete-dialog';
import { DualDateDisplay } from '@/components/shared/dual-date-display';
import { useUserPositionsInfinite, useEndPositionAssignment, useSetPrimaryAssignment } from '@/lib/api/hooks/use-admin-users';
import { localizeName } from '@/lib/utils/localize';
import { Plus } from 'lucide-react';
import { PositionAssignmentDialog } from './position-assignment-dialog';

interface UserPositionsTabProps {
  userPublicId: string;
}

export function UserPositionAssignments({ userPublicId }: UserPositionsTabProps) {
  const t = useTranslations('admin.users.detail.positions');
  const locale = useLocale();
  const [assignOpen, setAssignOpen] = useState(false);
  const [endConfirm, setEndConfirm] = useState<string | null>(null);
  const [primaryConfirm, setPrimaryConfirm] = useState<string | null>(null);

  const positions = useUserPositionsInfinite(userPublicId);
  const endAssignment = useEndPositionAssignment(userPublicId, endConfirm ?? '');
  const setPrimary = useSetPrimaryAssignment(userPublicId, primaryConfirm ?? '');

  const allAssignments = positions.data?.pages.flatMap((p) => p.data) ?? [];
  const activeAssignments = allAssignments.filter((a) => !a.ended_at);
  const endedAssignments = allAssignments.filter((a) => a.ended_at);

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">{t('active_assignments')}</h3>
        <Button size="sm" onClick={() => setAssignOpen(true)}>
          <Plus className="size-4" />
          {t('assign')}
        </Button>
      </div>
      {activeAssignments.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('no_active')}</p>
      ) : (
        <div className="space-y-2">
          {activeAssignments.map((a) => {
            const posName = a.position ? localizeName(locale, a.position.title_ar, a.position.title_en) : '-';
            const deptName = a.position?.department ? localizeName(locale, a.position.department.name_ar, '') : '';
            return (
              <Card key={a.public_id ?? ''} className="text-sm">
                <CardContent className="p-3 flex items-center justify-between">
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{posName}</span>
                      {a.is_primary && (
                        <Badge variant="outline" className="text-xs">{t('primary')}</Badge>
                      )}
                    </div>
                    {deptName && <span className="text-xs text-muted-foreground">{deptName}</span>}
                    {a.started_at && (
                      <span className="text-xs text-muted-foreground mt-1">
                        <DualDateDisplay gregorian={a.started_at} hijri={a.started_at_hijri} variant="inline" />
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {!a.is_primary && (
                      <Button variant="outline" size="sm" onClick={() => setPrimaryConfirm(a.public_id)}>
                        {t('set_primary')}
                      </Button>
                    )}
                    <Button variant="outline" size="sm" className="border-destructive/30 text-destructive" onClick={() => setEndConfirm(a.public_id)}>
                      {t('end')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {endedAssignments.length > 0 && (
        <>
          <h3 className="text-sm font-medium pt-2">{t('ended_assignments')}</h3>
          <div className="space-y-2">
            {endedAssignments.map((a) => {
              const posName = a.position ? localizeName(locale, a.position.title_ar, a.position.title_en) : '-';
              return (
                <Card key={a.public_id ?? ''} className="text-sm opacity-60">
                  <CardContent className="p-3 flex flex-col gap-0.5">
                    <span className="font-medium">{posName}</span>
                    <span className="text-xs text-muted-foreground">
                      {t('started_at')}: {a.started_at ? <DualDateDisplay gregorian={a.started_at} hijri={a.started_at_hijri} variant="inline" /> : '-'}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {t('ended')}: {a.ended_at ? <DualDateDisplay gregorian={a.ended_at} hijri={a.ended_at_hijri} variant="inline" /> : '-'}
                    </span>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}

      <PositionAssignmentDialog
        userPublicId={userPublicId}
        open={assignOpen}
        onOpenChange={setAssignOpen}
      />

      <ConfirmDeleteDialog
        open={!!endConfirm}
        onOpenChange={() => setEndConfirm(null)}
        title={t('end_confirm_title')}
        description={t('end_confirm_desc')}
        confirmLabel={t('end')}
        onConfirm={() => {
          if (endConfirm) endAssignment.mutate({});
          setEndConfirm(null);
        }}
        isPending={endAssignment.isPending}
      />

      <ConfirmDeleteDialog
        open={!!primaryConfirm}
        onOpenChange={() => setPrimaryConfirm(null)}
        title={t('primary_confirm_title')}
        description={t('primary_confirm_desc')}
        confirmLabel={t('set_primary')}
        onConfirm={() => {
          if (primaryConfirm) setPrimary.mutate();
          setPrimaryConfirm(null);
        }}
        isPending={setPrimary.isPending}
        destructive={false}
      />
    </div>
  );
}
