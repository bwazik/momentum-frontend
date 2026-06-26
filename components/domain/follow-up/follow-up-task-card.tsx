'use client';

import { useTranslations } from 'next-intl';
import { BoardTaskCard } from '@/components/shared/board-task-card';
import type { BoardTaskResource } from './follow-up-types';

interface FollowUpTaskCardProps {
  task: BoardTaskResource;
  onLogFollowUp: () => void;
  onEscalate: () => void;
}

export function FollowUpTaskCard({ task, onLogFollowUp, onEscalate }: FollowUpTaskCardProps) {
  const t = useTranslations('followUp.board');
  return (
    <BoardTaskCard
      task={task}
      onLogFollowUp={onLogFollowUp}
      onEscalate={onEscalate}
      actionLabels={{
        openDetails: t('open_details'),
        openWorkflow: t('open_workflow'),
        logFollowUp: t('log_follow_up'),
        escalate: t('escalate'),
      }}
    />
  );
}
