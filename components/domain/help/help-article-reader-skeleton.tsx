import { Skeleton } from '@/components/ui/skeleton';

export function HelpArticleReaderSkeleton() {
  return (
    <div className="mx-auto max-w-4xl space-y-8" data-testid="help-article-reader-skeleton">
      {/* Top navigation row: back button + manager actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Skeleton className="h-8 w-36 rounded-lg" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-28 rounded-lg" />
          <Skeleton className="h-8 w-20 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
      </div>

      {/* Header: badge + language toggle / title / metadata */}
      <div className="space-y-4 border-b border-border/70 pb-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Skeleton className="h-6 w-28 rounded-full" />
          <Skeleton className="h-7 w-36 rounded-md" />
        </div>
        <Skeleton className="h-10 w-full" />
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-1">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>

      {/* Body paragraphs */}
      <div className="space-y-4">
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-11/12" />
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-3/4" />
      </div>

      {/* Attachments gallery */}
      <div className="space-y-4 pt-6 border-t">
        <Skeleton className="h-5 w-40" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-[68px] rounded-xl" />
          <Skeleton className="h-[68px] rounded-xl" />
          <Skeleton className="h-[68px] rounded-xl" />
        </div>
      </div>

      {/* Related articles */}
      <div className="space-y-4 pt-8 border-t">
        <Skeleton className="h-5 w-40" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
