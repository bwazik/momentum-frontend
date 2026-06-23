'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function BlueprintBuilderSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-end gap-2 border-b pb-3">
        <Skeleton className="h-9 w-16 rounded-lg" />
        <Skeleton className="h-9 w-24 rounded-lg" />
        <Skeleton className="h-9 w-20 rounded-lg" />
      </div>
      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="flex-1">
          <div className="rounded-xl border bg-card p-6">
            <div className="mb-6 flex items-start justify-between gap-3">
              <div>
                <Skeleton className="mb-1 h-6 w-48" />
                <Skeleton className="h-4 w-72" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-16 rounded-md" />
                <Skeleton className="h-5 w-20 rounded-md" />
              </div>
            </div>
            <div className="space-y-4 rounded-xl border border-dashed p-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-28 w-80 rounded-xl" />
                  <div className="flex shrink-0 flex-col items-center">
                    <Skeleton className="w-0.5 h-8" />
                    <Skeleton className="size-5 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <aside className="hidden w-96 shrink-0 lg:block">
          <div className="sticky top-20 space-y-4 border-s ps-5">
            <Skeleton className="h-5 w-32" />
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full rounded-lg" />
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
