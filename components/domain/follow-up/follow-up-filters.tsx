'use client';

import { useTranslations } from 'next-intl';
import { BoardFilters } from '@/components/shared/board-filters';
import type { TaskBoardUrlFilters } from './follow-up-types';

interface FollowUpFiltersProps {
  filters: TaskBoardUrlFilters;
}

export function FollowUpFilters({ filters }: FollowUpFiltersProps) {
  const t = useTranslations('followUp.filters');
  return <BoardFilters t={t} filters={filters} />;
}
