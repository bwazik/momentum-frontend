'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTaskDetail } from '@/lib/api/hooks/use-task-detail';
import { useCurrentUser } from '@/lib/api/hooks/use-auth';
import { useCapability } from '@/lib/api/hooks/use-capabilities';
import { useDeleteTask } from '@/lib/api/hooks/use-task-create';
import { TaskCancelButton } from './task-cancel-button';
import { DeleteDraftDialog } from './delete-draft-dialog';

export function TaskEditActions({ publicId }: { publicId: string }) {
  const t = useTranslations('tasks.new');
  const router = useRouter();
  const { data: task } = useTaskDetail(publicId);
  const { data: user } = useCurrentUser();
  const canManage = useCapability('task.manage');
  const deleteMut = useDeleteTask();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const isInitiator = task?.initiator_id === user?.public_id;

  const onDelete = async () => {
    setDeleteOpen(false);
    try {
      await deleteMut.mutateAsync(publicId);
      router.push('/tasks');
    } catch { /* error toast handled by mutation */ }
  };

  return (
    <div className="flex items-center gap-2">
      {isInitiator && (
        <Button variant="ghost" className="text-destructive" disabled={deleteMut.isPending} onClick={() => setDeleteOpen(true)}>
          {deleteMut.isPending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
          {t('delete_draft')}
        </Button>
      )}
      <TaskCancelButton href={`/tasks/${publicId}`} />
      <DeleteDraftDialog open={deleteOpen} onOpenChange={setDeleteOpen} onConfirm={onDelete} />
    </div>
  );
}
