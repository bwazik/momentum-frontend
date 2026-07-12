import { Skeleton } from '@/components/ui/skeleton';

export function DepartmentDrillDownSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="border-b border-border px-4 py-3">
        <div className="flex gap-4">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-36" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-28" />
        </div>
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-4 border-b border-border last:border-b-0">
          <Skeleton className="h-5 w-16 shrink-0 rounded-full" />
          <Skeleton className="h-4 w-full max-w-56" />
          <Skeleton className="h-5 w-14 shrink-0 rounded-full" />
          <Skeleton className="h-4 w-20 shrink-0" />
          <Skeleton className="h-4 w-28 shrink-0" />
        </div>
      ))}
    </div>
  );
}
