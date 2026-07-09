'use client';

import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount,
} from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { SlaBadge, PriorityBadge } from '@/components/domain/tasks/task-badges';
import { localizeName } from '@/lib/utils/localize';
import type { AgingReportItem } from './aging-report-types';
import { formatTimeSince, formatDate } from './aging-report-utils';

const SLA_BORDER: Record<string, string> = {
  green: 'border-s-4 border-s-emerald-500 dark:border-s-emerald-400',
  amber: 'border-s-4 border-s-amber-500 dark:border-s-amber-400',
  red: 'border-s-4 border-s-red-500 dark:border-s-red-400',
  grey: 'border-s-4 border-s-slate-400 dark:border-s-slate-500',
  none: 'border-s-4 border-s-zinc-300 dark:border-s-zinc-600',
};

interface AgingReportTableProps {
  tasks: AgingReportItem[];
}

export function AgingReportTable({ tasks }: AgingReportTableProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('analytics.aging.columns');

  return (
    <Table aria-label={t('table_label')}>
      <TableHeader>
        <TableRow>
          <TableHead scope="col" className="w-28 text-start text-xs uppercase tracking-wider">{t('sla')}</TableHead>
          <TableHead scope="col" className="text-start text-xs uppercase tracking-wider">{t('task')}</TableHead>
          <TableHead scope="col" className="text-start text-xs uppercase tracking-wider">{t('priority')}</TableHead>
          <TableHead scope="col" className="text-start text-xs uppercase tracking-wider">{t('stage')}</TableHead>
          <TableHead scope="col" className="text-start text-xs uppercase tracking-wider">{t('assignees')}</TableHead>
          <TableHead scope="col" className="w-32 text-start text-xs uppercase tracking-wider">{t('time_at_stage')}</TableHead>
          <TableHead scope="col" className="w-32 text-start text-xs uppercase tracking-wider">{t('created_at')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasks.map((task) => {
          const slaKey = (task.sla_health ?? 'none').toLowerCase();
          return (
            <TableRow
              key={task.task_public_id}
              tabIndex={0}
              className="cursor-pointer"
              onClick={() => router.push(`/tasks/${task.task_public_id}`)}
              onKeyDown={(e) => { if (e.key === 'Enter') router.push(`/tasks/${task.task_public_id}`); }}
            >
              <TableCell className={cn('text-start', SLA_BORDER[slaKey] || '')}>
                <SlaBadge health={task.sla_health} status="active" />
              </TableCell>
              <TableCell className="text-start">
                <span className="text-sm font-medium leading-tight">
                  {localizeName(locale, task.title_ar, task.title_en)}
                </span>
              </TableCell>
              <TableCell className="text-start">
                {task.priority ? (
                  <PriorityBadge priority={task.priority ?? undefined} />
                ) : (
                  <span className="text-sm text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell className="text-start align-top">
                {task.current_stage_name_ar || task.current_stage_name_en ? (
                  <span className="text-sm">
                    {localizeName(locale, task.current_stage_name_ar, task.current_stage_name_en)}
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell className="text-start align-top">
                {task.active_assignees.length > 0 ? (
                  <AvatarGroup>
                    {task.active_assignees.slice(0, 3).map((user) => {
                      const name = localizeName(locale, user.name_ar, user.name_en);
                      return (
                        <Tooltip key={user.public_id}>
                          <TooltipTrigger asChild>
                            <Avatar size="sm"><AvatarFallback>{name.charAt(0) || '?'}</AvatarFallback></Avatar>
                          </TooltipTrigger>
                          <TooltipContent side="top">{name}</TooltipContent>
                        </Tooltip>
                      );
                    })}
                    {task.active_assignees.length > 3 && (
                      <AvatarGroupCount>+{task.active_assignees.length - 3}</AvatarGroupCount>
                    )}
                  </AvatarGroup>
                ) : (
                  <span className="text-sm text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell className="text-start align-top">
                <span className="text-sm">{formatTimeSince(task.entered_at, locale)}</span>
              </TableCell>
              <TableCell className="text-start align-top">
                <span className="text-sm text-muted-foreground">
                  {formatDate(task.created_at, locale)}
                </span>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
