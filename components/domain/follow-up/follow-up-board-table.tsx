'use client';

import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Ellipsis, ExternalLink, GitBranch, PhoneCall, ShieldAlert } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { BoardTable } from '@/components/shared/board-table';
import { useCapability } from '@/lib/api/hooks/use-capabilities';
import type { BoardTaskResource } from './follow-up-types';

interface FollowUpBoardTableProps {
  tasks: BoardTaskResource[];
  onLogFollowUp: (task: BoardTaskResource) => void;
  onEscalate: (task: BoardTaskResource) => void;
}

export function FollowUpBoardTable({ tasks, onLogFollowUp, onEscalate }: FollowUpBoardTableProps) {
  const t = useTranslations('followUp.board');
  const locale = useLocale();
  const router = useRouter();
  const canEscalate = useCapability('task.escalate');

  return (
    <BoardTable
      tasks={tasks}
      columnLabels={{
        sla: t('columns.sla'),
        task: t('columns.task'),
        stage: t('columns.stage'),
        assignees: t('columns.assignees'),
        time_in_stage: t('columns.time_in_stage'),
        actions: t('columns.actions'),
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
          <DropdownMenuContent align={locale === 'ar' ? 'start' : 'end'} side="bottom" className="min-w-40">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/tasks/${task.public_id}`); }}>
              <ExternalLink className="me-2 size-4" /> {t('open_details')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); router.push(`/tasks/${task.public_id}/workflow`); }}>
              <GitBranch className="me-2 size-4" /> {t('open_workflow')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onLogFollowUp(task); }}>
              <PhoneCall className="me-2 size-4" /> {t('log_follow_up')}
            </DropdownMenuItem>
            {canEscalate && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEscalate(task); }}>
                <ShieldAlert className="me-2 size-4" /> {t('escalate')}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    />
  );
}
