'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function BlueprintLibrarySkeleton() {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-9 w-20 rounded-md" />
          <Skeleton className="h-9 w-24 rounded-md" />
          <Skeleton className="h-9 w-16 rounded-md" />
          <Skeleton className="h-9 w-16 rounded-md" />
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
          <Skeleton className="h-10 w-full rounded-md" />
        </div>
      </div>
      <div className="rounded-lg border">
        <div className="flex items-center gap-4 border-b bg-muted/30 px-4 py-3">
          <Skeleton className="h-4 w-50" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="ms-auto h-4 w-12" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b px-4 py-4 last:border-b-0">
            <Skeleton className="h-5 w-50" />
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-5 w-20" />
            <Skeleton className="ms-auto size-8 w-12 rounded-md" />
          </div>
        ))}
      </div>
    </section>
  );
}
