'use client';

import { Skeleton } from '@/components/ui/skeleton';

interface OrgSkeletonProps {
  variant: 'overview' | 'departments' | 'positions' | 'grades' | 'calendars';
}

export function OrgSkeleton({ variant }: OrgSkeletonProps) {
  if (variant === 'overview') {
    return (
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border p-5">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-2">
                  <Skeleton className="h-3 w-24 animate-pulse motion-reduce:animate-none" />
                  <Skeleton className="h-8 w-16 animate-pulse motion-reduce:animate-none" />
                </div>
                <Skeleton className="size-10 rounded-xl animate-pulse motion-reduce:animate-none" />
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-xl border p-6">
          <div className="flex flex-col gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full animate-pulse motion-reduce:animate-none" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'departments') {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-32 animate-pulse motion-reduce:animate-none" />
          <Skeleton className="h-9 flex-1 animate-pulse motion-reduce:animate-none" />
        </div>
        <div className="grid gap-4 lg:grid-cols-[320px,1fr]">
          <div className="rounded-xl border p-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="mb-2 h-10 w-full animate-pulse motion-reduce:animate-none" />
            ))}
          </div>
          <div className="rounded-xl border">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full animate-pulse motion-reduce:animate-none border-b last:border-b-0" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'positions') {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-32 animate-pulse motion-reduce:animate-none" />
          <Skeleton className="h-9 w-40 animate-pulse motion-reduce:animate-none" />
          <Skeleton className="h-9 flex-1 animate-pulse motion-reduce:animate-none" />
        </div>
        <div className="rounded-xl border">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full animate-pulse motion-reduce:animate-none border-b last:border-b-0" />
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'grades') {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-9 w-40 animate-pulse motion-reduce:animate-none" />
        <div className="rounded-xl border">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full animate-pulse motion-reduce:animate-none border-b last:border-b-0" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-9 w-40 animate-pulse motion-reduce:animate-none" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full animate-pulse motion-reduce:animate-none rounded-xl" />
        ))}
      </div>
    </div>
  );
}
