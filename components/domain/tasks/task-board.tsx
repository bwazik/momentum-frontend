'use client';

import { useMemo } from 'react';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { useCurrentUser } from '@/lib/api/hooks/use-auth';
import { useTaskBoardInfinite } from '@/lib/api/hooks/use-task-board';
import { ApiRequestError } from '@/lib/api/client';
import { readBoardFilters, toBoardQuery } from './task-board-utils';
import { TaskBoardFilters } from './task-board-filters';
import { TaskBoardSkeleton } from './task-board-skeleton';
import { TaskBoardTable } from './task-board-table';
import { TaskBoardMobileList } from './task-board-mobile-list';

export function TaskBoard() {
  const t = useTranslations('tasks.board');
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { data: user } = useCurrentUser();

  const urlFilters = useMemo(
    () => readBoardFilters(searchParams),
    [searchParams],
  );

  const apiFilters = useMemo(
    () => toBoardQuery(urlFilters, user?.public_id),
    [urlFilters, user?.public_id],
  );

  const query = useTaskBoardInfinite(apiFilters);
  const allTasks = useMemo(() => {
    const seen = new Set<string>();
    return (query.data?.pages.flatMap((page) => page.data) ?? []).filter((task) => {
      if (seen.has(task.public_id)) return false;
      seen.add(task.public_id);
      return true;
    });
  }, [query.data]);

  if (query.isLoading) return <TaskBoardSkeleton />;

  if (query.isError) {
    const error = query.error;
    if (error instanceof ApiRequestError && error.status === 403) {
      return (
        <EmptyState
          title={t('no_permission_title')}
          description={t('no_permission_description')}
        />
      );
    }
    return (
      <ErrorState
        message={t('error')}
        onRetry={() => query.refetch()}
      />
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <TaskBoardFilters filters={urlFilters} />
      {allTasks.length === 0 ? (
        <EmptyState
          title={t('empty_title')}
          description={t('empty_description')}
          action={
            <Button variant="outline" onClick={() => router.replace(pathname)}>
              {t('reset_filters')}
            </Button>
          }
        />
      ) : (
        <>
          <div className="hidden md:block">
            <TaskBoardTable tasks={allTasks} />
          </div>
          <div className="md:hidden">
            <TaskBoardMobileList tasks={allTasks} />
          </div>
          {query.hasNextPage && (
            <Button
              variant="outline"
              onClick={() => query.fetchNextPage()}
              disabled={query.isFetchingNextPage}
            >
              {query.isFetchingNextPage ? t('loading_more') : t('load_more')}
            </Button>
          )}
        </>
      )}
    </section>
  );
}
