'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function TaskBoardSkeleton() {
  return (
    <div className="flex flex-col gap-4" data-testid="task-board-skeleton">
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-9 w-24" />
        ))}
        <Skeleton className="h-9 w-16" />
      </div>
      <div className="flex flex-wrap gap-2">
        <Skeleton className="h-8 flex-1" />
        <Skeleton className="h-8 w-40" />
        <Skeleton className="size-8 rounded-md" />
      </div>
      <div className="overflow-x-auto">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="flex gap-2 border-b p-2 last:border-b-0">
            <div className="flex w-28 items-start ps-1">
              <div className="border-s-4 border-s-zinc-300 ps-2">
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-0.5">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-4 w-full max-w-56" />
              <div className="flex gap-1.5">
                <Skeleton className="h-3 w-14 rounded" />
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
            </div>
            <div className="flex w-36 flex-col gap-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
            <div className="flex w-28 items-start gap-0.5">
              <div className="flex -space-x-1.5 *:ring-2 *:ring-background">
                <Skeleton className="size-6 rounded-full" />
                <Skeleton className="size-6 rounded-full" />
                <Skeleton className="size-6 rounded-full" />
              </div>
            </div>
            <div className="flex w-28 flex-col gap-1">
              <Skeleton className="h-4 w-14" />
              <Skeleton className="h-3 w-12" />
            </div>
            <div className="flex w-16 items-start justify-end">
              <Skeleton className="size-8 rounded-md" />
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-3 md:hidden">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="rounded-xl border-s-4 border-s-zinc-300 p-4">
            <div className="flex items-start justify-between gap-2 pb-2">
              <div className="flex flex-1 flex-col gap-1">
                <Skeleton className="h-4 w-3/4" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-14 rounded-full" />
                </div>
              </div>
              <Skeleton className="h-5 w-20 shrink-0 rounded-full" />
            </div>
            <div className="flex flex-col gap-1.5 border-t pt-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="flex -space-x-1.5">
                <Skeleton className="size-6 rounded-full" />
                <Skeleton className="size-6 rounded-full" />
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-4 w-14" />
                <Skeleton className="h-4 w-12" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
