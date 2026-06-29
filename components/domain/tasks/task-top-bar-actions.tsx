'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { GitBranch, Pencil, Loader2, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTaskDetail } from '@/lib/api/hooks/use-task-detail';
import { useCurrentUser } from '@/lib/api/hooks/use-auth';
import { useCapability } from '@/lib/api/hooks/use-capabilities';
import { useResumeTask } from '@/lib/api/hooks/use-task-detail';
import { useLaunchTask } from '@/lib/api/hooks/use-task-create';
import { isUserAssignee, getActiveStage } from './task-detail-utils';
import { TaskLifecycleDialog } from './task-lifecycle-dialog';
import { CompleteStageDialog } from './complete-stage-dialog';

interface TaskTopBarActionsProps {
  publicId: string;
}

export function TaskTopBarActions({ publicId }: TaskTopBarActionsProps) {
  const t = useTranslations('tasks.detail');
  const nav = useTranslations('nav');
  const router = useRouter();
  const { data: task } = useTaskDetail(publicId);
  const { data: user } = useCurrentUser();
  const canSuspend = useCapability('task.suspend_resume');
  const canCancel = useCapability('task.cancel');
  const canManage = useCapability('task.manage');
  const resumeMut = useResumeTask(publicId);
  const launchMut = useLaunchTask();

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

  const isDraft = status === 'draft';
  const isInitiatorOrManager = isDraft && (task.initiator_id === user?.public_id || canManage);

  const handleLaunch = async () => {
    try {
      await launchMut.mutateAsync({ publicId });
      router.push(`/tasks/${publicId}`);
    } catch {
      // error toast handled by mutation
    }
  };

  return (
    <div className="flex items-center gap-2">
      {isDraft && isInitiatorOrManager && (
        <Button variant="outline" size="sm" asChild>
          <Link href={`/tasks/${publicId}/edit`}>
            <Pencil data-icon="inline-start" className="size-4" />
            {t('edit_draft')}
          </Link>
        </Button>
      )}
      {isDraft && isInitiatorOrManager && (
        <Button size="sm" onClick={handleLaunch} disabled={launchMut.isPending}>
          {launchMut.isPending ? <Loader2 className="size-4 animate-spin" /> : <Rocket data-icon="inline-start" className="size-4" />}
          {t('launch')}
        </Button>
      )}
      <Button variant="outline" size="sm" asChild>
        <Link href={`/tasks/${publicId}/workflow`}>
          <GitBranch data-icon="inline-start" className="size-4" />
          {nav('label_workflow')}
        </Link>
      </Button>
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
          transitions={task.blueprint?.transitions}
          currentStageBlueprintId={activeStage.blueprint_stage.public_id}
          blueprintStages={task.blueprint?.stages}
        />
      )}
    </div>
  );
}
