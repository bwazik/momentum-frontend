'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function DelegationTableSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <Skeleton className="h-9 w-full" />
        </div>
        <div className="flex-1">
          <Skeleton className="h-9 w-full" />
        </div>
        <div className="flex-1">
          <Skeleton className="h-9 w-full" />
        </div>
        <div className="flex-1">
          <Skeleton className="h-9 w-full" />
        </div>
        <Skeleton className="h-9 w-16" />
      </div>

      <div className="hidden md:block">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-start p-2">
                <Skeleton className="h-4 w-20" />
              </th>
              <th className="text-start p-2">
                <Skeleton className="h-4 w-20" />
              </th>
              <th className="text-start p-2">
                <Skeleton className="h-4 w-16" />
              </th>
              <th className="text-start p-2">
                <Skeleton className="h-4 w-24" />
              </th>
              <th className="text-start p-2">
                <Skeleton className="h-4 w-14" />
              </th>
              <th className="text-end p-2">
                <Skeleton className="h-4 w-12 ms-auto" />
              </th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-border">
                <td className="p-2">
                  <Skeleton className="h-5 w-28" />
                </td>
                <td className="p-2">
                  <Skeleton className="h-5 w-28" />
                </td>
                <td className="p-2">
                  <Skeleton className="h-5 w-24" />
                </td>
                <td className="p-2">
                  <Skeleton className="h-5 w-32" />
                </td>
                <td className="p-2">
                  <Skeleton className="h-5 w-16" />
                </td>
                <td className="p-2">
                  <div className="flex justify-end gap-1">
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden flex flex-col gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-3 rounded-lg border border-border p-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-8 w-8" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-14" />
              <div className="flex flex-col gap-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-4 w-14" />
              <div className="flex flex-col gap-1">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-28" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <Skeleton className="h-9 w-full" />
    </div>
  );
}
