'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { useTaskDetail } from '@/lib/api/hooks/use-task-detail';
import { useCurrentUser } from '@/lib/api/hooks/use-auth';
import { useCapability } from '@/lib/api/hooks/use-capabilities';
import { useResumeTask } from '@/lib/api/hooks/use-task-detail';
import { isUserAssignee, getActiveStage } from './task-detail-utils';
import { TaskLifecycleDialog } from './task-lifecycle-dialog';
import { CompleteStageDialog } from './complete-stage-dialog';

interface TaskTopBarActionsProps {
  publicId: string;
}

export function TaskTopBarActions({ publicId }: TaskTopBarActionsProps) {
  const t = useTranslations('tasks.detail');
  const { data: task } = useTaskDetail(publicId);
  const { data: user } = useCurrentUser();
  const canSuspend = useCapability('task.suspend_resume');
  const canCancel = useCapability('task.cancel');
  const resumeMut = useResumeTask(publicId);

  const [showSuspend, setShowSuspend] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [showComplete, setShowComplete] = useState(false);

  if (!task) return null;

  const status = task.status;
  const activeStage = getActiveStage(task.stages);
  const isAssignee = isUserAssignee(
    activeStage?.assignments,
    user?.public_id,
  );

  return (
    <div className="flex items-center gap-2">
      {status === 'active' && canSuspend && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowSuspend(true)}
        >
          {t('suspend')}
        </Button>
      )}
      {status === 'suspended' && canSuspend && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => resumeMut.mutate()}
          disabled={resumeMut.isPending}
        >
          {resumeMut.isPending ? t('submitting') : t('resume')}
        </Button>
      )}
      {(status === 'draft' || status === 'active') && canCancel && (
        <Button
          variant="outline"
          size="sm"
          className="border-destructive/30 text-destructive"
          onClick={() => setShowCancel(true)}
        >
          {t('cancel_task')}
        </Button>
      )}
      {status === 'active' && isAssignee && (
        <Button size="sm" onClick={() => setShowComplete(true)}>
          {t('submit_and_advance')}
        </Button>
      )}

      <TaskLifecycleDialog
        open={showSuspend}
        onOpenChange={setShowSuspend}
        action="suspend"
        publicId={publicId}
      />
      <TaskLifecycleDialog
        open={showCancel}
        onOpenChange={setShowCancel}
        action="cancel"
        publicId={publicId}
      />
      {activeStage && (
        <CompleteStageDialog
          open={showComplete}
          onOpenChange={setShowComplete}
          taskPublicId={publicId}
          stageInstancePublicId={activeStage.instance_id ?? ''}
          detailPublicId={publicId}
        />
      )}
    </div>
  );
}
