'use client';

import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Ellipsis, ExternalLink, GitBranch, Copy } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { BoardTable } from '@/components/domain/tasks/board-table';
import { copyTaskLink, copyToClipboard } from '@/components/shared/copy-link-button';
import type { BoardTaskResource } from './task-board-types';

interface TaskBoardTableProps {
  tasks: BoardTaskResource[];
}

export function TaskBoardTable({ tasks }: TaskBoardTableProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('tasks.board.columns');
  const nav = useTranslations('nav');

  return (
    <BoardTable
      tasks={tasks}
      columnLabels={{
        sla: t('sla'),
        task: t('task'),
        stage: t('stage'),
        assignees: t('assignees'),
        time_in_stage: t('time_in_stage'),
        actions: t('actions'),
        table_label: t('table_label'),
      }}
      renderActions={(task) => (
        <DropdownMenu dir={locale === 'ar' ? 'rtl' : 'ltr'}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8"
              aria-label={t('row_actions')}
              onClick={(e) => e.stopPropagation()}
            >
              <Ellipsis className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="bottom" className="min-w-36">
            <DropdownMenuItem
              className="whitespace-nowrap"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/tasks/${task.public_id}/workflow`);
              }}
            >
              <GitBranch className="me-2 size-4" />
              {nav('label_workflow')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="whitespace-nowrap"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/tasks/${task.public_id}`);
              }}
            >
              <ExternalLink className="me-2 size-4" />
              {t('open_details')}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="whitespace-nowrap"
              onClick={(e) => {
                e.stopPropagation();
                copyToClipboard(copyTaskLink(task.public_id), t('link_copied'), t('copy_failed'));
              }}
            >
              <Copy className="me-2 size-4" />
              {t('copy_link')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    />
  );
}
