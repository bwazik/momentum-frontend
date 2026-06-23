'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useCurrentUser } from '@/lib/api/hooks/use-auth';
import { useCapability } from '@/lib/api/hooks/use-capabilities';
import { AssigneeAvatarStack } from './assignee-avatar-stack';
import { CompleteStageDialog } from './complete-stage-dialog';
import { OverrideAssignmentDialog } from './override-assignment-dialog';
import {
  getStageAssignees,
  isUserAssignee,
  localizeName,
  formatDuration,
  timeFmtFromT,
} from './task-detail-utils';
import type { TaskSubStageInstanceResource } from './task-detail-types';

interface SubStageItemProps {
  subStage: TaskSubStageInstanceResource;
  taskPublicId: string;
}

export function SubStageItem({
  subStage,
  taskPublicId,
}: SubStageItemProps) {
  const locale = useLocale();
  const t = useTranslations('tasks.detail');
  const timeFmt = timeFmtFromT(t);
  const { data: user } = useCurrentUser();
  const canOverride = useCapability('task.override_assignment');
  const [showComplete, setShowComplete] = useState(false);
  const [showOverride, setShowOverride] = useState(false);

  const status = subStage.status;
  const assignees = getStageAssignees(subStage.assignments);
  const isAssignee = isUserAssignee(subStage.assignments, user?.public_id);
  const subStageName = localizeName(
    locale,
    subStage.blueprint_sub_stage?.name_ar,
    subStage.blueprint_sub_stage?.name_en,
  );

  return (
    <div
      className={cn(
        'flex items-start gap-2 rounded-md px-3 py-1.5',
        status === 'active' && 'bg-muted/30',
      )}
    >
      {/* Status indicator */}
      <div className="mt-0.5">
        {status === 'completed' && (
          <Check className="size-3.5 text-emerald-500" aria-hidden="true" />
        )}
        {status === 'active' && (
          <div className="size-2.5 animate-pulse rounded-full bg-blue-500 motion-reduce:animate-none" aria-hidden="true" />
        )}
        {(status === 'pending' || status === 'returned') && (
          <div className="size-2.5 rounded-full border-2 border-slate-300" aria-hidden="true" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'text-xs font-medium',
              status === 'pending' && 'text-muted-foreground',
            )}
          >
            {subStageName}
          </span>
        </div>
        {assignees.length > 0 && (
          <div className="mt-0.5 flex items-center gap-1.5">
            <AssigneeAvatarStack assignments={assignees} max={2} />
            <span className="text-[10px] text-muted-foreground">
              {assignees
                .map((a) =>
                  localizeName(locale, a.user_name_ar, a.user_name_en),
                )
                .join(', ')}
            </span>
          </div>
        )}
        {subStage.entered_at && (
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            {formatDuration(subStage.entered_at, subStage.exited_at || null, timeFmt)}
          </p>
        )}
        {subStage.completion_note && (
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            {subStage.completion_note}
          </p>
        )}
        {status === 'active' && isAssignee && (
          <div className="mt-1 flex gap-1.5">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 text-xs"
              onClick={() => setShowComplete(true)}
            >
              {t('complete')}
            </Button>
            {canOverride && (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 text-xs"
                onClick={() => setShowOverride(true)}
              >
                {t('override_assignment')}
              </Button>
            )}
          </div>
        )}
        {status === 'active' && !isAssignee && canOverride && (
          <div className="mt-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 text-xs"
              onClick={() => setShowOverride(true)}
            >
              {t('override_assignment')}
            </Button>
          </div>
        )}
      </div>

      <CompleteStageDialog
        open={showComplete}
        onOpenChange={setShowComplete}
        taskPublicId={taskPublicId}
        stageInstancePublicId={subStage.instance_id ?? ''}
        detailPublicId={taskPublicId}
        isSubStage
      />
      <OverrideAssignmentDialog
        open={showOverride}
        onOpenChange={setShowOverride}
        taskPublicId={taskPublicId}
        stageInstancePublicId={subStage.instance_id ?? ''}
        currentAssignees={subStage.assignments ?? []}
        detailPublicId={taskPublicId}
        isSubStage={true}
      />
    </div>
  );
}
