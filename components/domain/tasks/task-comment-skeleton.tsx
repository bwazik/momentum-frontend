'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function TaskCommentSkeleton() {
  return (
    <div className="space-y-4" data-testid="task-comments-skeleton">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex gap-3">
          <Skeleton className="size-9 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-16 w-3/4 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}
