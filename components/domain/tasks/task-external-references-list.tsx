'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { TaskExternalReferenceItem } from './task-external-reference-item';
import { TaskExternalReferenceDeleteDialog } from './task-external-reference-delete-dialog';
import { useDeleteTaskExternalReference } from '@/lib/api/hooks/use-external-references';
import type { TaskExternalReferenceResource } from './task-external-reference-types';

interface TaskExternalReferencesListProps {
  references: TaskExternalReferenceResource[];
  taskPublicId: string;
  fetchNextPage: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage: boolean;
  canManage: boolean;
  onEdit: (ref: TaskExternalReferenceResource) => void;
}

export function TaskExternalReferencesList({
  references, taskPublicId, fetchNextPage, hasNextPage, isFetchingNextPage, canManage, onEdit,
}: TaskExternalReferencesListProps) {
  const t = useTranslations('tasks.references');
  const [deleteReference, setDeleteReference] = useState<TaskExternalReferenceResource | null>(null);
  const deleteMutation = useDeleteTaskExternalReference(taskPublicId);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-2" aria-label={t('title')}>
        {references.map((ref) => (
          <TaskExternalReferenceItem
            key={ref.public_id}
            reference={ref}
            canManage={canManage}
            onEdit={() => onEdit(ref)}
            onDelete={() => setDeleteReference(ref)}
          />
        ))}
      </div>
      {hasNextPage && (
        <Button variant="outline" onClick={() => fetchNextPage()} disabled={isFetchingNextPage} className="mt-2 w-full">
          {isFetchingNextPage ? t('loading_more') : t('load_more')}
        </Button>
      )}
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
    </div>
  );
}
