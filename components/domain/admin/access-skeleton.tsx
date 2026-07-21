'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function AccessSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[4fr_1fr] gap-6">
      <div className="space-y-4">
        <Skeleton className="h-9 w-64" />
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-start p-2"><Skeleton className="h-4 w-24" /></th>
              <th className="text-start p-2"><Skeleton className="h-4 w-32" /></th>
              <th className="text-start p-2"><Skeleton className="h-4 w-44" /></th>
              <th className="text-start p-2"><Skeleton className="h-4 w-20" /></th>
              <th className="text-end p-2"><Skeleton className="h-4 w-12 ms-auto" /></th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 4 }).map((_, i) => (
              <tr key={i} className="border-b border-border">
                <td className="p-2"><Skeleton className="h-5 w-24" /></td>
                <td className="p-2"><Skeleton className="h-5 w-32" /></td>
                <td className="p-2"><Skeleton className="h-5 w-44" /></td>
                <td className="p-2"><Skeleton className="h-5 w-20" /></td>
                <td className="p-2"><div className="flex justify-end"><Skeleton className="h-8 w-8 rounded-md" /></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="rounded-lg border p-4 space-y-4">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
