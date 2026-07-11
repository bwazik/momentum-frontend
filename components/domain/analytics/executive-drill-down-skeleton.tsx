import { Skeleton } from '@/components/ui/skeleton';

export function ExecutiveDrillDownSkeleton() {
  return (
    <section className="flex flex-col gap-4" data-testid="drill-down-skeleton">
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="border-b border-border px-2 py-3">
          <div className="flex gap-4">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-2 py-4 border-b border-border last:border-b-0">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-5 w-14 rounded-full" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
      </div>
    </section>
  );
}
