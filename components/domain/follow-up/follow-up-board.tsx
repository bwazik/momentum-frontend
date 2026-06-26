'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { ApiRequestError } from '@/lib/api/client';
import { FollowUpBoardSkeleton } from './follow-up-board-skeleton';
import { FollowUpBoardTable } from './follow-up-board-table';
import { FollowUpBoardMobileList } from './follow-up-board-mobile-list';
import type { BoardTaskResource } from './follow-up-types';
import type { InfiniteData } from '@tanstack/react-query';

interface CursorPage<T> {
  data: T[];
  next_cursor: string | null;
  has_more: boolean;
}

interface FollowUpBoardProps {
  allTasks: BoardTaskResource[];
  query: {
    isLoading: boolean;
    isError: boolean;
    error: unknown;
    data: InfiniteData<CursorPage<BoardTaskResource>> | undefined;
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
    fetchNextPage: () => void;
    refetch: () => void;
  };
  onLogFollowUp: (task: BoardTaskResource) => void;
  onEscalate: (task: BoardTaskResource) => void;
}

export function FollowUpBoard({ allTasks, query, onLogFollowUp, onEscalate }: FollowUpBoardProps) {
  const t = useTranslations('followUp.board');
  const router = useRouter();
  const pathname = usePathname();

  if (query.isLoading) return <FollowUpBoardSkeleton />;

  if (query.isError) {
    const error = query.error;
    if (error instanceof ApiRequestError && error.status === 403) {
      return <EmptyState title={t('no_permission_title')} description={t('no_permission_description')} />;
    }
    const message = error instanceof ApiRequestError ? error.error.message : t('error');
    return <ErrorState message={message} onRetry={() => query.refetch()} />;
  }

  if (allTasks.length === 0) {
    return (
      <EmptyState
        title={t('empty_title')}
        description={t('empty_description')}
        action={
          <Button variant="outline" onClick={() => router.replace(pathname)}>
            {t('reset_filters')}
          </Button>
        }
      />
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="hidden md:block">
        <FollowUpBoardTable tasks={allTasks} onLogFollowUp={onLogFollowUp} onEscalate={onEscalate} />
      </div>
      <div className="md:hidden">
        <FollowUpBoardMobileList tasks={allTasks} onLogFollowUp={onLogFollowUp} onEscalate={onEscalate} />
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
    </section>
  );
}
