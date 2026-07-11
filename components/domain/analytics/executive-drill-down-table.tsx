'use client';

import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { SlaBadge, PriorityBadge } from '@/components/domain/tasks/task-badges';
import { localizeName } from '@/lib/utils/localize';
import type { DrillDownTaskItem } from './executive-dashboard-types';
import { formatDate } from './aging-report-utils';

interface ExecutiveDrillDownTableProps {
  tasks: DrillDownTaskItem[];
}

const SLA_BORDER: Record<string, string> = {
  green: 'border-s-4 border-s-emerald-500 dark:border-s-emerald-400',
  amber: 'border-s-4 border-s-amber-500 dark:border-s-amber-400',
  red: 'border-s-4 border-s-red-500 dark:border-s-red-400',
  grey: 'border-s-4 border-s-slate-400 dark:border-s-slate-500',
  none: 'border-s-4 border-s-zinc-300 dark:border-s-zinc-600',
};

export function ExecutiveDrillDownTable({ tasks }: ExecutiveDrillDownTableProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('analytics.executive.columns');

  return (
    <Table aria-label={t('table_label')}>
      <TableHeader>
        <TableRow>
          <TableHead scope="col" className="w-28 text-start text-xs uppercase tracking-wider">{t('sla')}</TableHead>
          <TableHead scope="col" className="text-start text-xs uppercase tracking-wider">{t('task')}</TableHead>
          <TableHead scope="col" className="text-start text-xs uppercase tracking-wider">{t('priority')}</TableHead>
          <TableHead scope="col" className="text-start text-xs uppercase tracking-wider">{t('stage')}</TableHead>
          <TableHead scope="col" className="w-32 text-start text-xs uppercase tracking-wider">{t('created_at')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tasks.map((task) => {
          const slaKey = task.slaHealth.toLowerCase();
          return (
            <TableRow
              key={task.taskPublicId}
              tabIndex={0}
              className="cursor-pointer"
              onClick={() => router.push(`/tasks/${task.taskPublicId}`)}
              onKeyDown={(e) => { if (e.key === 'Enter') router.push(`/tasks/${task.taskPublicId}`); }}
            >
              <TableCell className={cn('text-start', SLA_BORDER[slaKey] || '')}>
                <SlaBadge health={task.slaHealth} status={task.status} />
              </TableCell>
              <TableCell className="text-start">
                <span className="text-sm font-medium leading-tight">
                  {localizeName(locale, task.titleAr, task.titleEn)}
                </span>
              </TableCell>
              <TableCell className="text-start">
                {task.priority ? (
                  <PriorityBadge priority={task.priority} />
                ) : (
                  <span className="text-sm text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell className="text-start">
                <span className="text-sm">
                  {localizeName(locale, task.currentStageNameAr, task.currentStageNameEn) || '-'}
                </span>
              </TableCell>
              <TableCell className="text-start">
                <span className="text-sm text-muted-foreground">
                  {formatDate(task.createdAt, locale)}
                </span>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
