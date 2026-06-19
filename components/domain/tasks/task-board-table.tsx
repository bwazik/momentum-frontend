'use client';

import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Ellipsis, ExternalLink, Copy } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
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

import type { BoardTaskResource } from './task-board-types';
import {
  SlaBadge,
  TaskStatusBadge,
  PriorityBadge,
  ClassificationBadge,
} from './task-badges';
import {
  getCurrentAssignees,
  localizeName,
  formatTimeInStage,
  formatDueDate,
} from './task-board-utils';

const SLA_BORDER: Record<string, string> = {
  green: 'border-s-4 border-s-emerald-500 dark:border-s-emerald-400',
  amber: 'border-s-4 border-s-amber-500 dark:border-s-amber-400',
  red: 'border-s-4 border-s-red-500 dark:border-s-red-400',
  grey: 'border-s-4 border-s-slate-400 dark:border-s-slate-500',
} as const;

interface TaskBoardTableProps {
  tasks: BoardTaskResource[];
}

export function TaskBoardTable({ tasks }: TaskBoardTableProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('tasks.board.columns');

  function handleRowClick(publicId: string) {
    router.push(`/tasks/${publicId}`);
  }

  function handleRowKeyDown(event: React.KeyboardEvent, publicId: string) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      router.push(`/tasks/${publicId}`);
    }
  }

  function handleCopyLink(publicId: string) {
    const url = `${window.location.origin}/tasks/${publicId}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      toast.success(t('link_copied'));
    } else {
      toast.error(t('copy_failed'));
    }
  }

  return (
    <Table aria-label={t('table_label')}>
      <TableHeader>
        <TableRow>
          <TableHead className="w-28 text-start">{t('sla')}</TableHead>
          <TableHead className="text-start">{t('task')}</TableHead>
          <TableHead className="text-start">{t('stage')}</TableHead>
          <TableHead className="text-start">{t('assignees')}</TableHead>
          <TableHead className="w-32 text-start">{t('time_in_stage')}</TableHead>
          <TableHead className="w-12 text-end">{t('actions')}</TableHead>
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
              onClick={() => handleRowClick(task.public_id)}
              onKeyDown={(event) => handleRowKeyDown(event, task.public_id)}
            >
              <TableCell className={cn('text-start', borderColor)}>
                <SlaBadge health={task.sla_health} />
              </TableCell>
              <TableCell className="text-start">
                <div className="flex flex-col gap-0.5">
                  {task.public_id && (
                    <span className="text-xs text-muted-foreground">
                      {task.public_id}
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
                {task.current_stage ? (
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm">
                      {localizeName(locale, task.current_stage.name_ar, task.current_stage.name_en)}
                    </span>
                    {task.department && (
                      <span className="text-xs text-muted-foreground">
                        {localizeName(locale, task.department.name_ar, task.department.name_en)}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">-</span>
                )}
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
                    {formatTimeInStage(task.time_at_current_stage_seconds)}
                  </span>
                  {task.due_date && (
                    <span className={cn(
                      'text-xs text-muted-foreground',
                      formatDueDate(task.due_date).includes('overdue') && 'font-semibold',
                    )}>
                      {formatDueDate(task.due_date)}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-end align-top">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      aria-label={t('row_actions')}
                    >
                      <Ellipsis className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="bottom" align={locale === 'ar' ? 'start' : 'end'} className="min-w-36">
                    <DropdownMenuItem
                      className="whitespace-nowrap"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRowClick(task.public_id);
                      }}
                    >
                      <ExternalLink className="me-2 size-4" />
                      {t('open_details')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="whitespace-nowrap"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyLink(task.public_id);
                      }}
                    >
                      <Copy className="me-2 size-4" />
                      {t('copy_link')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
