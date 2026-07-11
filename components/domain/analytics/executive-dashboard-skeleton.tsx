import { Skeleton } from '@/components/ui/skeleton';

export function ExecutiveDashboardSkeleton() {
  return (
    <section className="flex flex-col gap-6" data-testid="executive-dashboard-skeleton">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5 border-s-4 border-s-transparent">
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col gap-1">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-3 w-16" />
              </div>
              <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-3 rounded-lg border border-border">
              <div className="flex items-center justify-between gap-4 mb-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <Skeleton className="h-2 w-full rounded-full mb-2" />
              <Skeleton className="h-3 w-36" />
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-4 rounded-xl border border-border border-s-4 border-s-transparent">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <Skeleton className="h-3 w-28 mb-1" />
                  <Skeleton className="h-3 w-24 mb-1" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-4 w-16 rounded shrink-0" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
