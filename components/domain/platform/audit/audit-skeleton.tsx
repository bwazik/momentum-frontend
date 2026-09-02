'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function AuditSkeleton() {
  return (
    <div className="flex flex-col gap-4" data-testid="audit-table-skeleton">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>

      <AuditTableSkeleton />
    </div>
  );
}

export function AuditTableSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="hidden md:block">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-start p-2"><Skeleton className="h-4 w-28" /></th>
              <th className="text-start p-2"><Skeleton className="h-4 w-24" /></th>
              <th className="text-start p-2"><Skeleton className="h-4 w-32" /></th>
              <th className="text-start p-2"><Skeleton className="h-4 w-28" /></th>
              <th className="text-end p-2"><Skeleton className="h-4 w-12 ms-auto" /></th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 6 }).map((_, i) => (
              <tr key={i} className="border-b border-border">
                <td className="p-2"><Skeleton className="h-5 w-28" /></td>
                <td className="p-2"><Skeleton className="h-5 w-24" /></td>
                <td className="p-2"><Skeleton className="h-5 w-36" /></td>
                <td className="p-2"><Skeleton className="h-5 w-28" /></td>
                <td className="p-2"><div className="flex justify-end"><Skeleton className="h-8 w-12" /></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden flex flex-col gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-3 rounded-lg border border-border p-4">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>

      <Skeleton className="h-9 w-full" />
    </div>
  );
}
