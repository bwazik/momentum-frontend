'use client';

import { useTranslations } from 'next-intl';
import { BookOpen, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { useHelpArticlesInfinite } from '@/lib/api/hooks/use-help-center';
import { HelpArticleCard } from './help-article-card';
import { cn } from '@/lib/utils';

interface HelpArticleListProps {
  categoryId?: string | null;
  status?: 'all' | 'published' | 'draft';
  onStatusChange?: (status: 'all' | 'published' | 'draft') => void;
  canManage?: boolean;
}

export function HelpArticleList({
  categoryId,
  status = 'all',
  onStatusChange,
  canManage = false,
}: HelpArticleListProps) {
  const t = useTranslations('help_center.articles');

  const isPublishedFilter =
    status === 'published' ? true : status === 'draft' ? false : undefined;

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useHelpArticlesInfinite({
    category_id: categoryId || undefined,
    is_published: canManage ? isPublishedFilter : true,
    per_page: 15,
  });

  if (isLoading) {
    return (
      <div className="space-y-4" data-testid="help-article-list-loading">
        <Skeleton className="h-6 w-32" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between rounded-xl border p-4">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-2/3 sm:w-1/3" />
                <Skeleton className="h-3 w-40" />
              </div>
              <Skeleton className="size-8 rounded-full ms-4 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div data-testid="help-article-list-error">
        <ErrorState
          message={error instanceof Error ? error.message : undefined}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const articles = data?.pages.flatMap((page) => page.data) ?? [];

  return (
    <div className="space-y-4" data-testid="help-article-list">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold tracking-tight">{t('all_title')}</h2>

        {canManage && onStatusChange && (
          <div className="flex items-center gap-1 rounded-lg border bg-muted/40 p-1 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => onStatusChange('all')}
              className={cn(
                'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                status === 'all'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {t('filter_all')}
            </button>
            <button
              type="button"
              onClick={() => onStatusChange('published')}
              className={cn(
                'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                status === 'published'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {t('filter_published')}
            </button>
            <button
              type="button"
              onClick={() => onStatusChange('draft')}
              className={cn(
                'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                status === 'draft'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {t('filter_drafts')}
            </button>
          </div>
        )}
      </div>

      {articles.length === 0 ? (
        <div className="py-8" data-testid="help-article-list-empty">
          <EmptyState
            icon={BookOpen}
            title={t('empty_title')}
            description={t('empty_desc')}
          />
        </div>
      ) : (
        <div className="space-y-2.5">
          {articles.map((article) => (
            <HelpArticleCard
              key={article.public_id}
              article={article}
              canManage={canManage}
            />
          ))}
        </div>
      )}

      {hasNextPage && (
        <div className="pt-4 text-center">
          <Button
            variant="outline"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="w-full sm:w-auto"
          >
            {isFetchingNextPage ? (
              <>
                <RefreshCw className="me-2 size-4 animate-spin" />
                {t('loading_more')}
              </>
            ) : (
              t('load_more')
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
