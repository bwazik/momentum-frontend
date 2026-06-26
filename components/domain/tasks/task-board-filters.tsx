'use client';

import { useTranslations } from 'next-intl';
import { BoardFilters } from '@/components/shared/board-filters';
import type { TaskBoardUrlFilters } from './task-board-types';

interface TaskBoardFiltersProps {
  filters: TaskBoardUrlFilters;
}

export function TaskBoardFilters({ filters }: TaskBoardFiltersProps) {
  const t = useTranslations('tasks.board.filters');
  return <BoardFilters t={t} filters={filters} />;
}
