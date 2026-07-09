'use client';

import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { ExternalLink, GitBranch, Copy, PhoneCall, ShieldAlert } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SlaBadge, TaskStatusBadge, PriorityBadge, ClassificationBadge } from '@/components/domain/tasks/task-badges';
import { useCapability } from '@/lib/api/hooks/use-capabilities';
import { getCurrentAssignees, formatTimeInStage, formatDueDate } from '@/components/domain/tasks/task-board-utils';
import { localizeName } from '@/lib/utils/localize';
import { copyTaskLink, copyToClipboard } from '@/components/shared/copy-link-button';
import type { BoardTaskResource } from '@/components/domain/tasks/task-board-types';

const SLA_BORDER: Record<string, string> = {
  green: 'border-s-emerald-500',
  amber: 'border-s-amber-500',
  red: 'border-s-red-500',
  grey: 'border-s-slate-400',
};

interface ActionLabels {
  openDetails?: string;
  openWorkflow?: string;
  logFollowUp?: string;
  escalate?: string;
  copyLink?: string;
}

interface BoardTaskCardProps {
  task: BoardTaskResource;
  onLogFollowUp?: () => void;
  onEscalate?: () => void;
  actionLabels?: ActionLabels;
  linkCopiedLabel?: string;
  copyFailedLabel?: string;
}

export function BoardTaskCard({ task, onLogFollowUp, onEscalate, actionLabels, linkCopiedLabel, copyFailedLabel }: BoardTaskCardProps) {
  const al = actionLabels ?? {};
  const locale = useLocale();
  const router = useRouter();
  const canEscalate = useCapability('task.escalate');
  const assignees = getCurrentAssignees(task);
  const slaKey = (task.sla_health ?? 'green').toLowerCase();
  const borderClass = SLA_BORDER[slaKey] ?? '';

  return (
    <Card
      className={`cursor-pointer border-s-4 p-4 ${borderClass}`}
      onClick={() => router.push(`/tasks/${task.public_id}`)}
      onKeyDown={(e) => { if (e.key === 'Enter') router.push(`/tasks/${task.public_id}`); }}
      tabIndex={0}
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <SlaBadge health={task.sla_health} status={task.status} />
            <TaskStatusBadge status={task.status} />
            <PriorityBadge priority={task.priority} />
            <ClassificationBadge level={task.classification_level} />
          </div>
          <span className="text-xs text-muted-foreground">{task.display_id ?? task.public_id}</span>
        </div>

        <p className="font-medium text-foreground">
          {localizeName(locale, task.title_ar, task.title_en)}
        </p>

        <div className="flex flex-col gap-1 text-xs text-muted-foreground">
          <span>
            {(() => {
              const sn = task.current_stage ? localizeName(locale, task.current_stage.name_ar, task.current_stage.name_en) : '';
              return sn || '-';
            })()}
            {task.department && ` · ${localizeName(locale, task.department.name_ar, task.department.name_en)}`}
          </span>
          <span>
            {task.status === 'draft' || task.status === 'completed' || task.status === 'cancelled' ? '-' : formatTimeInStage(task.time_at_current_stage_seconds, locale, task.working_day_seconds ? Number(task.working_day_seconds) : null)}
            {task.due_date && ` · ${formatDueDate(task.due_date, locale)}`}
          </span>
        </div>

        {assignees.length > 0 && (
          <div className="flex -space-x-2">
            {assignees.slice(0, 3).map((a) => (
              <div
                key={a.public_id}
                className="flex size-6 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] font-medium"
                title={localizeName(locale, a.name_ar, a.name_en)}
              >
                {(locale === 'ar' ? a.name_ar : a.name_en)?.charAt(0) ?? '?'}
              </div>
            ))}
            {assignees.length > 3 && (
              <div className="flex size-6 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] font-medium">
                +{assignees.length - 3}
              </div>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Button variant="ghost" size="sm" className="gap-1" onClick={(e) => { e.stopPropagation(); router.push(`/tasks/${task.public_id}`); }}>
            <ExternalLink className="size-3" />
            {al.openDetails}
          </Button>
          <Button variant="ghost" size="sm" className="gap-1" onClick={(e) => { e.stopPropagation(); router.push(`/tasks/${task.public_id}/workflow`); }}>
            <GitBranch className="size-3" />
            {al.openWorkflow}
          </Button>
          {onLogFollowUp ? (
            <>
              <Button variant="ghost" size="sm" className="gap-1" onClick={(e) => { e.stopPropagation(); onLogFollowUp(); }}>
                <PhoneCall className="size-3" />
                {al.logFollowUp}
              </Button>
              {canEscalate && onEscalate && (
                <Button variant="ghost" size="sm" className="gap-1" onClick={(e) => { e.stopPropagation(); onEscalate(); }}>
                  <ShieldAlert className="size-3" />
                  {al.escalate}
                </Button>
              )}
            </>
          ) : (
            <Button variant="ghost" size="sm" className="gap-1" onClick={(e) => {
              e.stopPropagation();
              copyToClipboard(copyTaskLink(task.public_id), linkCopiedLabel ?? 'Link copied', copyFailedLabel ?? 'Failed to copy link');
            }}>
              <Copy className="size-3" />
              {al.copyLink}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
