'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function GovernanceTableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>

      <div className="hidden md:block">
        <table className="w-full">
          <thead>
            <tr>
              {Array.from({ length: 6 }).map((_, i) => (
                <th key={i} className="pb-3 text-start">
                  <Skeleton className="h-5 w-24" />
                </th>
              ))}
              <th className="pb-3 text-end">
                <Skeleton className="h-5 w-12 ms-auto" />
              </th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, rowIdx) => (
              <tr key={rowIdx} className="border-b border-border">
                {Array.from({ length: 6 }).map((_, cellIdx) => (
                  <td key={cellIdx} className="py-3 text-start">
                    <Skeleton className="h-5 w-20" />
                  </td>
                ))}
                <td className="py-3 text-end">
                  <Skeleton className="h-8 w-8 ms-auto rounded-md" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden flex flex-col gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-start justify-between gap-4 rounded-lg border p-4">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-5 w-40" />
              <div className="flex flex-wrap gap-1">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="flex gap-1 shrink-0">
              <Skeleton className="size-8 rounded-md" />
              <Skeleton className="size-8 rounded-md" />
            </div>
          </div>
        ))}
      </div>

      <Skeleton className="h-10 w-full" />
    </div>
  );
}
