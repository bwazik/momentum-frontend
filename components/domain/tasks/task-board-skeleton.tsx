'use client';

import { Skeleton } from '@/components/ui/skeleton';

import { BoardTableSkeleton } from './board-table-skeleton';

export function TaskBoardSkeleton() {
  return (
    <div className="flex flex-col gap-4" data-testid="task-board-skeleton">
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-lg" />
        ))}
        <Skeleton className="h-8 w-16 rounded-lg" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Skeleton className="h-8 flex-1" />
        <Skeleton className="h-8 flex-1" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 flex-1" />
          <Skeleton className="size-8 shrink-0" />
        </div>
      </div>
      <BoardTableSkeleton />
    </div>
  );
}
