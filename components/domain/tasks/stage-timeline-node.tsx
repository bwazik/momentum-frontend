'use client';

import { useState } from 'react';
import { Check, Undo2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useCurrentUser } from '@/lib/api/hooks/use-auth';
import { useCapability } from '@/lib/api/hooks/use-capabilities';
import { useLocale, useTranslations } from 'next-intl';
import { AssigneeAvatarStack } from './assignee-avatar-stack';
import { SubStageList } from './sub-stage-list';
import { CompleteStageDialog } from './complete-stage-dialog';
import { ReturnStageDialog } from './return-stage-dialog';
import { OverrideAssignmentDialog } from './override-assignment-dialog';
import {
  getStageAssignees,
  isUserAssignee,
  getStageTimer,
  formatSlaInline,
  formatDuration,
  localizeName,
  timeFmtFromT,
} from './task-detail-utils';
import type {
  TaskStageInstanceResource,
  SlaTimerInstanceResource,
} from './task-detail-types';

interface StageTimelineNodeProps {
  stage: TaskStageInstanceResource;
  index: number;
  slaTimers?: SlaTimerInstanceResource[];
  taskPublicId: string;
  blueprintId?: string;
}

interface NodeStyle {
  icon: (index: number) => React.ReactNode;
  className: string;
}

const NODE_STYLES: Record<string, NodeStyle> = {
  completed: {
    icon: () => <Check className="size-4" aria-hidden="true" />,
    className:
      'bg-emerald-100 border-emerald-500 text-emerald-600 dark:bg-emerald-950 dark:border-emerald-400',
  },
  active: {
    icon: () => (
      <div
        className="size-3 animate-pulse rounded-full bg-blue-500 motion-reduce:animate-none"
        aria-hidden="true"
      />
    ),
    className:
      'bg-blue-100 border-blue-500 text-blue-600 dark:bg-blue-950 dark:border-blue-400',
  },
  pending: {
    icon: (i) => <span className="text-xs font-medium">{i + 1}</span>,
    className:
      'bg-slate-100 border-slate-300 text-slate-400 dark:bg-slate-900 dark:border-slate-700',
  },
  returned: {
    icon: () => <Undo2 className="size-4 rtl:rotate-180" aria-hidden="true" />,
    className:
      'bg-slate-100 border-slate-300 text-slate-400 dark:bg-slate-900 dark:border-slate-700',
  },
  skipped: {
    icon: (i) => <span className="text-xs font-medium">{i + 1}</span>,
    className:
      'bg-slate-100 border-slate-300 text-slate-400 dark:bg-slate-900 dark:border-slate-700',
  },
};

export function StageTimelineNode({
  stage,
  index,
  slaTimers,
  taskPublicId,
  blueprintId,
}: StageTimelineNodeProps) {
  const locale = useLocale();
  const t = useTranslations('tasks.detail');
  const timeFmt = timeFmtFromT(t);
  const { data: user } = useCurrentUser();
  const canOverride = useCapability('task.override_assignment');
  const [showComplete, setShowComplete] = useState(false);
  const [showReturn, setShowReturn] = useState(false);
  const [showOverride, setShowOverride] = useState(false);

  const status = stage.status;
  const assignees = getStageAssignees(stage.assignments);
  const isAssignee = isUserAssignee(stage.assignments, user?.public_id);
  const stageName = localizeName(
    locale,
    stage.blueprint_stage.name_ar,
    stage.blueprint_stage.name_en,
  );
  const timer =
    status === 'active'
      ? getStageTimer(slaTimers, stage)
      : undefined;
  const slaInline = formatSlaInline(timer, timeFmt);

  const nodeStyle = NODE_STYLES[status] || NODE_STYLES.pending;

  return (
    <li className="flex gap-4">
      <div
        className={cn(
          'relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full border-2',
          nodeStyle.className,
        )}
      >
        {nodeStyle.icon(index)}
      </div>

      <div className="flex-1 pb-2">
        <div className="flex items-center justify-between gap-2">
          <p
            className={cn(
              'text-sm font-medium',
              (status === 'pending' || status === 'skipped') &&
                'text-muted-foreground',
            )}
          >
            {stageName}
          </p>
          {status === 'completed' && (
            <Badge
              variant="outline"
              className="bg-emerald-50 text-emerald-600 dark:bg-emerald-950"
            >
              {t('completed')}
            </Badge>
          )}
          {status === 'active' && (
            <Badge
              variant="outline"
              className="bg-blue-50 text-blue-600 dark:bg-blue-950"
            >
              {t('active')}
            </Badge>
          )}
          {status === 'returned' && (
            <Badge
              variant="outline"
              className="text-muted-foreground"
            >
              {t('returned')}
            </Badge>
          )}
        </div>

        {assignees.length > 0 && (
          <div className="mt-1.5 flex items-center gap-2">
            <AssigneeAvatarStack assignments={assignees} />
            <span className="text-xs text-muted-foreground">
              {assignees
                .map((a) =>
                  localizeName(locale, a.user_name_ar, a.user_name_en),
                )
                .join(', ')}
            </span>
          </div>
        )}

        {stage.entered_at && (
          <p className="mt-0.5 text-xs text-muted-foreground">
            {formatDuration(stage.entered_at, stage.exited_at || null, timeFmt)}
          </p>
        )}

        {status === 'active' && slaInline && (
          <p
            className={cn(
              'mt-0.5 text-xs font-medium',
              slaInline.includes('Overdue') &&
                'text-red-600 dark:text-red-400',
              slaInline.includes('At risk') &&
                'text-amber-600 dark:text-amber-400',
              !slaInline.includes('Overdue') &&
                !slaInline.includes('At risk') &&
                'text-emerald-600 dark:text-emerald-400',
            )}
            aria-live="polite"
          >
            {slaInline}
          </p>
        )}

        {stage.completion_note && (
          <p className="mt-1 border-s-2 border-border ps-3 text-xs text-muted-foreground">
            {stage.completion_note}
          </p>
        )}

        {status === 'returned' && stage.return_reason && (
          <p className="mt-1 border-s-2 border-border ps-3 text-xs text-muted-foreground">
            {t('return_reason')}: {stage.return_reason}
          </p>
        )}

        {stage.sub_stages && stage.sub_stages.length > 0 && (
          <SubStageList
            subStages={stage.sub_stages}
            taskPublicId={taskPublicId}
          />
        )}

        {status === 'active' && isAssignee && (
          <div className="mt-2 flex flex-wrap gap-2">
            <Button size="sm" onClick={() => setShowComplete(true)}>
              {t('submit_and_advance')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowReturn(true)}
            >
              {t('return_to_previous')}
            </Button>
            {canOverride && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowOverride(true)}
              >
                {t('override_assignment')}
              </Button>
            )}
          </div>
        )}

        {status === 'active' && !isAssignee && canOverride && (
          <div className="mt-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowOverride(true)}
            >
              {t('override_assignment')}
            </Button>
          </div>
        )}

        <CompleteStageDialog
          open={showComplete}
          onOpenChange={setShowComplete}
          taskPublicId={taskPublicId}
          stageInstancePublicId={stage.instance_id ?? ''}
          detailPublicId={taskPublicId}
        />
        <ReturnStageDialog
          open={showReturn}
          onOpenChange={setShowReturn}
          taskPublicId={taskPublicId}
          stageInstancePublicId={stage.instance_id ?? ''}
          currentStageBlueprintId={stage.blueprint_stage.public_id}
          blueprintId={blueprintId}
          detailPublicId={taskPublicId}
          stages={undefined}
        />
        <OverrideAssignmentDialog
          open={showOverride}
          onOpenChange={setShowOverride}
          taskPublicId={taskPublicId}
          stageInstancePublicId={stage.instance_id ?? ''}
          currentAssignees={assignees}
          detailPublicId={taskPublicId}
          isSubStage={false}
        />
      </div>
    </li>
  );
}
