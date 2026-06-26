'use client';

import { useTranslations } from 'next-intl';
import { BoardTaskCard } from '@/components/shared/board-task-card';
import type { BoardTaskResource } from './task-board-types';

interface TaskCardProps {
  task: BoardTaskResource;
}

export function TaskCard({ task }: TaskCardProps) {
  const t = useTranslations('tasks.board.columns');
  const nav = useTranslations('nav');
  return (
    <BoardTaskCard
      task={task}
      actionLabels={{
        openDetails: t('open_details'),
        openWorkflow: nav('label_workflow'),
        copyLink: t('copy_link'),
      }}
      linkCopiedLabel={t('link_copied')}
      copyFailedLabel={t('copy_failed')}
    />
  );
}
