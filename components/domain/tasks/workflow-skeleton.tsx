'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function WorkflowSkeleton() {
  return (
    <div className="flex flex-col gap-6" data-testid="workflow-skeleton">
      {/* Section 1: Graph Card */}
      <div className="rounded-xl border bg-card p-6">
        <div className="mb-4">
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="overflow-hidden">
          <div className="flex flex-col gap-6 md:flex-row md:items-start">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-52 w-full rounded-xl md:w-56 shrink-0" />
            ))}
            <Skeleton className="size-10 rounded-full shrink-0" />
          </div>
        </div>
      </div>

      {/* Section 2: Legend Card */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl border bg-card p-4">
        {/* Stage status dots */}
        <div className="flex items-center gap-2">
          <Skeleton className="size-2.5 rounded-full" />
          <Skeleton className="h-3 w-10" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="size-2.5 rounded-full" />
          <Skeleton className="h-3 w-14" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="size-2.5 rounded-full" />
          <Skeleton className="h-3 w-28" />
        </div>

        <Skeleton className="h-3 w-0.5" />

        {/* SLA dots */}
        <div className="flex items-center gap-2">
          <Skeleton className="size-2.5 rounded-full" />
          <Skeleton className="h-3 w-10" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="size-2.5 rounded-full" />
          <Skeleton className="h-3 w-10" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="size-2.5 rounded-full" />
          <Skeleton className="h-3 w-12" />
        </div>

        <Skeleton className="h-3 w-0.5" />

        {/* Path icons */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-0.5 w-4" />
          <Skeleton className="size-2.5" />
          <Skeleton className="h-3 w-10" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="size-4" />
          <Skeleton className="h-3 w-8" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="size-5 rounded-full" />
          <Skeleton className="h-3 w-10" />
        </div>

        {/* Stat labels */}
        <Skeleton className="h-3 w-0.5" />
        <Skeleton className="h-3 w-36" />
        <Skeleton className="h-3 w-28" />
      </div>

      {/* Section 3: Timeline Bar Card */}
      <div className="rounded-xl border bg-card p-5">
        <Skeleton className="h-3 w-24 mb-3" />
        <Skeleton className="h-8 w-full rounded-md" />
        <div className="flex items-center justify-between mt-2">
          <Skeleton className="h-3 w-48" />
          <Skeleton className="h-3 w-12" />
        </div>
      </div>
    </div>
  );
}
