'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function AdminsSkeleton() {
  return (
    <div className="flex flex-col gap-4" data-testid="admins-table-skeleton">
      <div className="max-w-md">
        <Skeleton className="h-9 w-full" />
      </div>

      <AdminsTableSkeleton />
    </div>
  );
}

export function AdminsTableSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="hidden md:block">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-start p-2"><Skeleton className="h-4 w-28" /></th>
              <th className="text-start p-2"><Skeleton className="h-4 w-32" /></th>
              <th className="text-start p-2"><Skeleton className="h-4 w-20" /></th>
              <th className="text-start p-2"><Skeleton className="h-4 w-16" /></th>
              <th className="text-start p-2"><Skeleton className="h-4 w-28" /></th>
              <th className="text-end p-2"><Skeleton className="h-4 w-12 ms-auto" /></th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-border">
                <td className="p-2"><Skeleton className="h-5 w-32" /></td>
                <td className="p-2"><Skeleton className="h-5 w-36" /></td>
                <td className="p-2"><Skeleton className="h-5 w-24" /></td>
                <td className="p-2"><Skeleton className="h-5 w-16" /></td>
                <td className="p-2"><Skeleton className="h-5 w-28" /></td>
                <td className="p-2"><div className="flex justify-end"><Skeleton className="h-8 w-8" /></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden flex flex-col gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-3 rounded-lg border border-border p-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-8 w-8" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-36" />
            </div>
          </div>
        ))}
      </div>

      <Skeleton className="h-9 w-full" />
    </div>
  );
}
