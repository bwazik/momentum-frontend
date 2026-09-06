'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function ImpersonationSessionsSkeleton() {
  return (
    <div className="flex flex-col gap-4" data-testid="impersonation-table-skeleton">
      <div className="hidden md:block">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-start p-2"><Skeleton className="h-4 w-24" /></th>
              <th className="text-start p-2"><Skeleton className="h-4 w-20" /></th>
              <th className="text-start p-2"><Skeleton className="h-4 w-32" /></th>
              <th className="text-start p-2"><Skeleton className="h-4 w-28" /></th>
              <th className="text-start p-2"><Skeleton className="h-4 w-28" /></th>
              <th className="text-end p-2"><Skeleton className="h-4 w-16 ms-auto" /></th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 4 }).map((_, i) => (
              <tr key={i} className="border-b border-border">
                <td className="p-2"><Skeleton className="h-5 w-28" /></td>
                <td className="p-2"><Skeleton className="h-5 w-20" /></td>
                <td className="p-2"><Skeleton className="h-5 w-36" /></td>
                <td className="p-2"><Skeleton className="h-5 w-28" /></td>
                <td className="p-2"><Skeleton className="h-5 w-28" /></td>
                <td className="p-2"><div className="flex justify-end"><Skeleton className="h-8 w-16" /></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden flex flex-col gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-3 rounded-lg border border-border p-4">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
        ))}
      </div>
    </div>
  );
}
