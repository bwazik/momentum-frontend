'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowRight, Link2, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { useCapability } from '@/lib/api/hooks/use-capabilities';
import { useTaskExternalReferences } from '@/lib/api/hooks/use-external-references';
import { TaskExternalReferencesSkeleton } from './task-external-references-skeleton';
import { TaskExternalReferenceItem } from './task-external-reference-item';
import { TaskExternalReferencesList } from './task-external-references-list';
import { TaskExternalReferenceDialog } from './task-external-reference-dialog';
import { TaskExternalReferenceDeleteDialog } from './task-external-reference-delete-dialog';
import { useDeleteTaskExternalReference } from '@/lib/api/hooks/use-external-references';
import type { TaskExternalReferenceResource } from './task-external-reference-types';

const MAX_VISIBLE = 3;

interface TaskExternalReferencesCardProps {
  publicId: string;
}

export function TaskExternalReferencesCard({ publicId }: TaskExternalReferencesCardProps) {
  const t = useTranslations('tasks.references');
  const locale = useLocale();
  const canManage = useCapability('task.manage');
  const referencesQuery = useTaskExternalReferences(publicId);
  const [showAll, setShowAll] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editReference, setEditReference] = useState<TaskExternalReferenceResource | null>(null);
  const [deleteReference, setDeleteReference] = useState<TaskExternalReferenceResource | null>(null);
  const deleteMutation = useDeleteTaskExternalReference(publicId);

  const allReferences = useMemo(
    () => referencesQuery.data?.pages.flatMap((p) => p.data) ?? [],
    [referencesQuery.data],
  );
  const preview = useMemo(() => allReferences.slice(0, MAX_VISIBLE), [allReferences]);
  const totalCount = allReferences.length;

  if (referencesQuery.isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('title')}</CardTitle>
        </CardHeader>
        <CardContent><TaskExternalReferencesSkeleton /></CardContent>
      </Card>
    );
  }

  if (referencesQuery.isError) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('title')}</CardTitle></CardHeader>
        <CardContent><ErrorState message={t('error')} onRetry={() => referencesQuery.refetch()} /></CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('title')}</CardTitle>
          {canManage && (
            <Button size="sm" onClick={() => { setEditReference(null); setDialogOpen(true); }}>
              <Plus className="me-1 size-4" /> {t('add')}
            </Button>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {allReferences.length === 0 ? (
            <EmptyState
              icon={Link2}
              title={t('empty_title')}
              description={t('empty_description')}
              action={canManage ? (
                <Button size="sm" variant="outline" onClick={() => { setEditReference(null); setDialogOpen(true); }}>
                  <Plus className="me-1 size-4" /> {t('add')}
                </Button>
              ) : undefined}
            />
          ) : (
            <>
              <div className="flex flex-col gap-2" aria-label={t('title')}>
                {preview.map((ref) => (
                  <TaskExternalReferenceItem
                    key={ref.public_id}
                    reference={ref}
                    canManage={canManage}
                    onEdit={() => { setEditReference(ref); setDialogOpen(true); }}
                    onDelete={() => setDeleteReference(ref)}
                  />
                ))}
              </div>
              {totalCount > MAX_VISIBLE && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => setShowAll(true)}
                  className="mt-1 h-auto px-0"
                >
                  {t('view_all', { count: totalCount })} <ArrowRight className="inline size-3 rtl:rotate-180" />
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <TaskExternalReferenceDialog
        taskPublicId={publicId}
        reference={editReference}
        open={dialogOpen}
        onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditReference(null); }}
      />

      <TaskExternalReferenceDeleteDialog
        reference={deleteReference}
        open={!!deleteReference}
        onOpenChange={(open) => { if (!open) setDeleteReference(null); }}
        onConfirm={() => {
          if (deleteReference) {
            deleteMutation.mutate(deleteReference.public_id, { onSuccess: () => setDeleteReference(null) });
          }
        }}
        isPending={deleteMutation.isPending}
      />

      <Dialog open={showAll} onOpenChange={(o) => { if (!o) setShowAll(false); }}>
        <DialogContent className="max-h-[80vh] max-w-2xl text-start">
          <DialogHeader><DialogTitle>{t('title')}</DialogTitle></DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
            <TaskExternalReferencesList
              references={allReferences}
              taskPublicId={publicId}
              fetchNextPage={referencesQuery.fetchNextPage}
              hasNextPage={referencesQuery.hasNextPage}
              isFetchingNextPage={referencesQuery.isFetchingNextPage}
              canManage={canManage}
              onEdit={(ref) => { setEditReference(ref); setDialogOpen(true); }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
