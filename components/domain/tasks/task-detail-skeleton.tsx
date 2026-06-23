'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function TaskDetailSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-5 lg:col-span-2">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-16" />
              </div>
              <Skeleton className="h-6 w-3/4" />
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="mb-2 h-4 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="mt-1 h-4 w-full" />
            <Skeleton className="mt-1 h-4 w-2/3" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="size-9 shrink-0 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <span className="flex items-center gap-1.5">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-4 w-12 rounded-full" />
                    </span>
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="space-y-5 lg:col-span-1">
        <div className="space-y-5 lg:sticky lg:top-20">
          <Card>
            <CardHeader>
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i}>
                    <Skeleton className="mb-1 h-3 w-16" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
