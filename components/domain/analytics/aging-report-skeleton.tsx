'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function AgingReportSkeleton() {
  return (
    <div className="flex flex-col gap-4" data-testid="aging-report-skeleton">
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-16" />
      </div>
      <div className="hidden md:block overflow-x-auto">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex gap-2 border-b p-2 last:border-b-0">
            <div className="flex w-28 items-start ps-1">
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <div className="flex flex-1 flex-col gap-0.5">
              <Skeleton className="h-4 w-full max-w-56" />
            </div>
            <div className="flex w-24 items-start"><Skeleton className="h-5 w-16 rounded-full" /></div>
            <div className="flex w-36 flex-col gap-1"><Skeleton className="h-4 w-24" /></div>
            <div className="flex w-28 items-start"><Skeleton className="h-4 w-14" /></div>
            <div className="flex w-32 flex-col gap-1"><Skeleton className="h-4 w-14" /></div>
            <div className="flex w-32 flex-col gap-1"><Skeleton className="h-4 w-20" /></div>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-3 md:hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-xl border-s-4 border-s-zinc-300 p-4">
            <div className="flex items-start justify-between gap-2 pb-2">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-4 w-3/4" />
            <div className="mt-2 flex flex-col gap-1">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
