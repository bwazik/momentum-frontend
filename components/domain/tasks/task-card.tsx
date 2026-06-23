'use client';

import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/api/query-keys';
import { apiClient } from '@/lib/api/client';
import { cn } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/card';
import type { BoardTaskResource } from './task-board-types';
import { Badge } from '@/components/ui/badge';
import { SlaBadge, TaskStatusBadge, PriorityBadge, ClassificationBadge } from './task-badges';
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
} from '@/components/ui/avatar';
import { getCurrentAssignees, localizeName, formatTimeInStage, formatDueDate } from './task-board-utils';

const SLA_BORDER: Record<string, string> = {
  green: 'border-s-4 border-s-emerald-500 dark:border-s-emerald-400',
  amber: 'border-s-4 border-s-amber-500 dark:border-s-amber-400',
  red: 'border-s-4 border-s-red-500 dark:border-s-red-400',
  grey: 'border-s-4 border-s-slate-400 dark:border-s-slate-500',
} as const;

interface TaskCardProps {
  task: BoardTaskResource;
}

export function TaskCard({ task }: TaskCardProps) {
  const router = useRouter();
  const locale = useLocale();
  const queryClient = useQueryClient();

  function handleHover() {
    queryClient.prefetchQuery({
      queryKey: queryKeys.tasks.detail(task.public_id),
      queryFn: () => apiClient.get(`/v1/tasks/${task.public_id}`),
    });
  }
  const assignees = getCurrentAssignees(task);
  const slaHealth = (task.sla_health ?? '').toLowerCase();
  const borderColor = SLA_BORDER[slaHealth] || 'border-s-4 border-s-zinc-300 dark:border-s-zinc-600';

  function handleClick() {
    router.push(`/tasks/${task.public_id}`);
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      router.push(`/tasks/${task.public_id}`);
    }
  }

  return (
    <Card
      tabIndex={0}
      className={cn('cursor-pointer', borderColor)}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={handleHover}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-2 p-4 pb-2">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {localizeName(locale, task.title_ar, task.title_en)}
            </span>
            <ClassificationBadge level={task.classification_level} />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <TaskStatusBadge status={task.status} />
            <PriorityBadge priority={task.priority} />
          </div>
        </div>
        <SlaBadge health={task.sla_health} status={task.status} />
      </CardHeader>
      <CardContent className="flex flex-col gap-1 p-4 pt-0 text-sm text-muted-foreground">
        {task.current_stage && (
          <div className="flex justify-between">
            <span>{localizeName(locale, task.current_stage.name_ar, task.current_stage.name_en)}</span>
            <div className="flex items-center gap-1.5">
              {task.current_stage.stage_type && (
                <Badge variant="outline" className="text-[10px] leading-none py-0.5">
                  {localizeName(locale, task.current_stage.stage_type.name_ar, task.current_stage.stage_type.name_en)}
                </Badge>
              )}
                {task.department && (
                <span className="text-xs">{localizeName(locale, task.department.name_ar, task.department.name_en)}</span>
              )}
            </div>
          </div>
        )}
        {assignees.length > 0 && (
          <div className="flex justify-between">
            <AvatarGroup>
              {assignees.slice(0, 3).map((user) => {
                const name = localizeName(locale, user.name_ar, user.name_en);
                return (
                  <Avatar key={user.public_id} size="sm">
                    <AvatarFallback>{name.charAt(0)}</AvatarFallback>
                  </Avatar>
                );
              })}
              {assignees.length > 3 && (
                <AvatarGroupCount>+{assignees.length - 3}</AvatarGroupCount>
              )}
            </AvatarGroup>
          </div>
        )}
        <div className="flex justify-between">
          <span>{formatTimeInStage(task.time_at_current_stage_seconds, locale)}</span>
          {task.due_date && (
            <span className={cn(
              'text-xs text-muted-foreground',
              formatDueDate(task.due_date, locale).includes('overdue') && 'font-semibold',
            )}>
              {formatDueDate(task.due_date, locale)}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
