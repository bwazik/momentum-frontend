'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { BoardTableSkeleton } from '@/components/domain/tasks/board-table-skeleton';

export function FollowUpBoardSkeleton() {
  return (
    <div data-testid="follow-up-skeleton" className="flex flex-col gap-6">
      {/* Stats skeleton */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>

      {/* Filters skeleton */}
      <div className="flex flex-col gap-3">
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
      </div>

      <BoardTableSkeleton />
    </div>
  );
}
