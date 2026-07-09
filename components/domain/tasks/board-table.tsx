'use client';

import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
} from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { SlaBadge, TaskStatusBadge, PriorityBadge, ClassificationBadge } from '@/components/domain/tasks/task-badges';
import { getCurrentAssignees, formatTimeInStage, formatDueDate } from '@/components/domain/tasks/task-board-utils';
import { localizeName } from '@/lib/utils/localize';
import type { BoardTaskResource } from '@/components/domain/tasks/task-board-types';

const SLA_BORDER: Record<string, string> = {
  green: 'border-s-4 border-s-emerald-500 dark:border-s-emerald-400',
  amber: 'border-s-4 border-s-amber-500 dark:border-s-amber-400',
  red: 'border-s-4 border-s-red-500 dark:border-s-red-400',
  grey: 'border-s-4 border-s-slate-400 dark:border-s-slate-500',
} as const;

interface ColumnLabels {
  sla: string;
  task: string;
  stage: string;
  assignees: string;
  time_in_stage: string;
  actions: string;
  table_label?: string;
}

interface BoardTableProps {
  tasks: BoardTaskResource[];
  columnLabels: ColumnLabels;
  renderActions: (task: BoardTaskResource) => React.ReactNode;
  onRowHover?: (publicId: string) => void;
}

export function BoardTable({ tasks, columnLabels, renderActions, onRowHover }: BoardTableProps) {
  const router = useRouter();
  const locale = useLocale();

  return (
    <Table aria-label={columnLabels.table_label ?? columnLabels.sla}>
      <TableHeader>
        <TableRow>
          <TableHead className="w-28 text-start text-xs uppercase tracking-wider">{columnLabels.sla}</TableHead>
          <TableHead className="text-start text-xs uppercase tracking-wider">{columnLabels.task}</TableHead>
          <TableHead className="text-start text-xs uppercase tracking-wider">{columnLabels.stage}</TableHead>
          <TableHead className="text-start text-xs uppercase tracking-wider">{columnLabels.assignees}</TableHead>
          <TableHead className="w-32 text-start text-xs uppercase tracking-wider">{columnLabels.time_in_stage}</TableHead>
          <TableHead className="w-12 text-end text-xs uppercase tracking-wider">{columnLabels.actions}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody className="[&_tr:last-child]:border-b-0">
        {tasks.map((task) => {
          const assignees = getCurrentAssignees(task);
          const slaHealth = (task.sla_health ?? '').toLowerCase();
          const borderColor = SLA_BORDER[slaHealth] || 'border-s-4 border-s-zinc-300 dark:border-s-zinc-600';
          return (
            <TableRow
              key={task.public_id}
              tabIndex={0}
              className="cursor-pointer"
              onClick={() => router.push(`/tasks/${task.public_id}`)}
              onKeyDown={(e) => { if (e.key === 'Enter') router.push(`/tasks/${task.public_id}`); }}
              onMouseEnter={() => onRowHover?.(task.public_id)}
            >
              <TableCell className={cn('text-start', borderColor)}>
                <SlaBadge health={task.sla_health} status={task.status} />
              </TableCell>
              <TableCell className="text-start">
                <div className="flex flex-col gap-0.5">
                  {task.display_id && (
                    <span className="text-xs text-muted-foreground">
                      {task.display_id ?? task.public_id}
                    </span>
                  )}
                  <span className="text-sm font-medium leading-tight">
                    {localizeName(locale, task.title_ar, task.title_en)}
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <ClassificationBadge level={task.classification_level} />
                    <TaskStatusBadge status={task.status} />
                    <PriorityBadge priority={task.priority} />
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-start align-top">
                {(() => {
                  const stageName = task.current_stage
                    ? localizeName(locale, task.current_stage.name_ar, task.current_stage.name_en)
                    : '';
                  if (!stageName) {
                    return <span className="text-sm text-muted-foreground">-</span>;
                  }
                  return (
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{stageName}</span>
                        {task.current_stage!.stage_type && (
                          <Badge variant="outline" className="text-[10px] leading-none py-0.5">
                            {localizeName(locale, task.current_stage!.stage_type.name_ar, task.current_stage!.stage_type.name_en)}
                          </Badge>
                        )}
                      </div>
                      {task.department && (
                        <span className="text-xs text-muted-foreground">
                          {localizeName(locale, task.department.name_ar, task.department.name_en)}
                        </span>
                      )}
                    </div>
                  );
                })()}
              </TableCell>
              <TableCell className="text-start align-top">
                {assignees.length > 0 ? (
                  <AvatarGroup>
                    {assignees.slice(0, 3).map((user) => {
                      const name = localizeName(locale, user.name_ar, user.name_en);
                      return (
                        <Tooltip key={user.public_id}>
                          <TooltipTrigger asChild>
                            <Avatar size="sm">
                              <AvatarFallback>{name.charAt(0)}</AvatarFallback>
                            </Avatar>
                          </TooltipTrigger>
                          <TooltipContent side="top">{name}</TooltipContent>
                        </Tooltip>
                      );
                    })}
                    {assignees.length > 3 && (
                      <AvatarGroupCount>+{assignees.length - 3}</AvatarGroupCount>
                    )}
                  </AvatarGroup>
                ) : (
                  <span className="text-sm text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell className="text-start align-top">
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm">
                    {task.status === 'draft' || task.status === 'completed' || task.status === 'cancelled' ? '-' : formatTimeInStage(task.time_at_current_stage_seconds, locale, task.working_day_seconds ? Number(task.working_day_seconds) : null)}
                  </span>
                  {task.due_date && (
                    <span className={cn(
                      'text-xs text-muted-foreground',
                      formatDueDate(task.due_date, locale).includes('overdue') && 'font-semibold',
                    )}>
                      {formatDueDate(task.due_date, locale)}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-end align-top">
                {renderActions(task)}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
