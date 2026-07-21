'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function UserDetailSkeleton() {
  return (
    <div className="px-4 space-y-6 mt-4">
      <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2">
        <Skeleton className="h-4 w-28" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-16 rounded-md" />
          <Skeleton className="h-5 w-20 rounded-md" />
        </div>
      </div>

      <Skeleton className="h-px w-full" />

      <div className="flex gap-2">
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-20" />
      </div>

      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-1">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-px w-full mt-3" />
          </div>
        ))}
      </div>
    </div>
  );
}
