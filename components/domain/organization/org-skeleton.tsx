'use client';

import { Skeleton } from '@/components/ui/skeleton';

interface OrgSkeletonProps {
  variant: 'overview' | 'departments' | 'positions' | 'grades' | 'calendars';
}

export function OrgSkeleton({ variant }: OrgSkeletonProps) {
  if (variant === 'overview') {
    return (
      <div className="flex flex-col gap-6">
        {/* Stat cards */}
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
        {/* Two-column: chart + positions sidebar */}
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Chart area — zoom controls + department card shapes */}
          <div className="min-w-0 flex-1 rounded-xl border p-4">
            <div className="mb-4 flex items-center gap-1">
              <Skeleton className="size-7 rounded-md animate-pulse motion-reduce:animate-none" />
              <Skeleton className="h-4 w-10 animate-pulse motion-reduce:animate-none" />
              <Skeleton className="size-7 rounded-md animate-pulse motion-reduce:animate-none" />
            </div>
            <div className="flex justify-center gap-12">
              <div className="flex flex-col items-center gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <div className="flex flex-col items-center gap-2 rounded-xl border bg-card p-4">
                      <Skeleton className="size-16 rounded-xl animate-pulse motion-reduce:animate-none" />
                      <Skeleton className="h-4 w-24 animate-pulse motion-reduce:animate-none" />
                      <Skeleton className="h-3 w-20 animate-pulse motion-reduce:animate-none" />
                    </div>
                    {i < 2 && <Skeleton className="h-6 w-0.5 animate-pulse motion-reduce:animate-none" />}
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Positions sidebar */}
          <div className="flex w-full flex-col gap-3 rounded-xl border bg-card p-4 lg:w-[380px] lg:shrink-0">
            <Skeleton className="h-4 w-32 animate-pulse motion-reduce:animate-none" />
            <Skeleton className="h-px w-full animate-pulse motion-reduce:animate-none" />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2 rounded-xl border bg-card p-3">
                <Skeleton className="size-10 rounded-xl animate-pulse motion-reduce:animate-none" />
                <Skeleton className="h-3 w-24 animate-pulse motion-reduce:animate-none" />
                <div className="flex gap-1.5">
                  <Skeleton className="h-4 w-12 rounded-full animate-pulse motion-reduce:animate-none" />
                </div>
                <Skeleton className="h-3 w-16 animate-pulse motion-reduce:animate-none" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'departments') {
    return (
      <div className="flex flex-col gap-4">
        {/* Toolbar: search input + toggle group */}
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-9 min-w-[200px] flex-1 animate-pulse motion-reduce:animate-none rounded-md" />
          <div className="flex gap-1">
            <Skeleton className="h-8 w-14 animate-pulse motion-reduce:animate-none rounded-md" />
            <Skeleton className="h-8 w-16 animate-pulse motion-reduce:animate-none rounded-md" />
            <Skeleton className="h-8 w-16 animate-pulse motion-reduce:animate-none rounded-md" />
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-[320px,1fr]">
          <div className="rounded-xl border p-4">
            <Skeleton className="mb-2 h-4 w-24 animate-pulse motion-reduce:animate-none" />
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="mb-2 h-6 w-full animate-pulse motion-reduce:animate-none" />
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
        {/* Toolbar: search + 2 selects + toggle group */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 flex-1 animate-pulse motion-reduce:animate-none rounded-md" />
          <Skeleton className="h-9 flex-1 animate-pulse motion-reduce:animate-none rounded-md" />
          <Skeleton className="h-9 flex-1 animate-pulse motion-reduce:animate-none rounded-md" />
          <div className="flex gap-1">
            <Skeleton className="h-8 w-14 animate-pulse motion-reduce:animate-none rounded-md" />
            <Skeleton className="h-8 w-16 animate-pulse motion-reduce:animate-none rounded-md" />
            <Skeleton className="h-8 w-16 animate-pulse motion-reduce:animate-none rounded-md" />
          </div>
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
        <div className="rounded-xl border">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full animate-pulse motion-reduce:animate-none border-b last:border-b-0" />
          ))}
        </div>
        <Skeleton className="h-4 w-72 animate-pulse motion-reduce:animate-none" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-3 rounded-xl border p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-1 flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-28 animate-pulse motion-reduce:animate-none" />
                  <Skeleton className="h-5 w-14 animate-pulse motion-reduce:animate-none rounded-full" />
                </div>
                <Skeleton className="h-3 w-36 animate-pulse motion-reduce:animate-none" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-3 w-24 animate-pulse motion-reduce:animate-none" />
              <Skeleton className="h-3 w-20 animate-pulse motion-reduce:animate-none" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
