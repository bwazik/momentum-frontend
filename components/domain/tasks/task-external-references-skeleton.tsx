import { Skeleton } from '@/components/ui/skeleton';

export function TaskExternalReferencesSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 rounded-lg border p-3">
          <div className="flex flex-col gap-2 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-20 rounded-md" />
              <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-3 w-24" />
          </div>
          <div className="flex gap-1 shrink-0">
            <Skeleton className="size-8 rounded-md" />
            <Skeleton className="size-8 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}
