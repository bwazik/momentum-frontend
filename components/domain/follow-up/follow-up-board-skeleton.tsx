'use client';

import { Skeleton } from '@/components/ui/skeleton';

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
        <div className="flex gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-20 rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Skeleton className="h-10 rounded-lg" />
          <Skeleton className="h-10 rounded-lg" />
        </div>
      </div>

      {/* Table skeleton */}
      <div className="hidden md:block">
        <Skeleton className="h-12 w-full rounded-t-xl" />
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-none border-t border-border/50" />
        ))}
      </div>

      {/* Mobile cards skeleton */}
      <div className="flex flex-col gap-3 md:hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-52 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
