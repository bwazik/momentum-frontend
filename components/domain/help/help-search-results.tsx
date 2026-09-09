'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Search, ChevronRight, Clock, Eye, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { useHelpArticleSearch } from '@/lib/api/hooks/use-help-center';
import { estimateReadTime, sanitizeArticleHtml } from '@/lib/utils/help-center-utils';
import { cn } from '@/lib/utils';

interface HelpSearchResultsProps {
  query: string;
  categoryId?: string | null;
  canManage?: boolean;
  onClearSearch: () => void;
}

export function HelpSearchResults({
  query,
  categoryId,
  canManage = false,
  onClearSearch,
}: HelpSearchResultsProps) {
  const locale = useLocale();
  const t = useTranslations('help_center.articles');

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useHelpArticleSearch({
    q: query,
    category_id: categoryId || undefined,
  });

  if (isLoading) {
    return (
      <div className="space-y-4" data-testid="help-search-loading">
        <Skeleton className="h-6 w-48" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border p-4 space-y-2">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <div className="flex gap-3">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div data-testid="help-search-error">
        <ErrorState
          message={error instanceof Error ? error.message : undefined}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const articles = data?.pages.flatMap((page) => page.data) ?? [];

  if (articles.length === 0) {
    return (
      <div className="py-8" data-testid="help-search-empty">
        <EmptyState
          icon={Search}
          title={t('empty_search_title')}
          description={t('empty_search_desc')}
          action={
            <Button variant="outline" size="sm" onClick={onClearSearch}>
              {t('clear_search_btn')}
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="help-search-results">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold tracking-tight">
          {t('search_results_title', { query })}
        </h2>
        <Button variant="ghost" size="sm" onClick={onClearSearch} className="text-xs text-muted-foreground">
          {t('clear_search_btn')}
        </Button>
      </div>

      <div className="space-y-3">
        {articles.map((article) => {
          const title = locale === 'ar' ? (article.title_ar || article.title_en) : (article.title_en || article.title_ar);
          const categoryName = article.category
            ? locale === 'ar'
              ? (article.category.name_ar || article.category.name_en)
              : (article.category.name_en || article.category.name_ar)
            : null;
          const readTimeMinutes = estimateReadTime(title, article.estimated_read_time);
          const sanitizedSnippet = article.snippet ? sanitizeArticleHtml(article.snippet) : null;

          return (
            <Link
              key={article.public_id}
              href={`/help/${article.slug || article.public_id}`}
              className={cn(
                'group flex flex-col gap-2 rounded-xl border border-border/70 bg-card p-4 transition-all',
                'hover:border-primary/50 hover:bg-muted/30 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {categoryName && (
                      <Badge variant="secondary" className="text-[11px] font-normal px-2 py-0">
                        {categoryName}
                      </Badge>
                    )}
                    {canManage && (
                      <Badge
                        variant={article.is_published ? 'outline' : 'secondary'}
                        className={cn(
                          'text-[10px] px-1.5 py-0',
                          article.is_published
                            ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                            : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {article.is_published ? t('published') : t('draft')}
                      </Badge>
                    )}
                  </div>

                  <h3 className="font-semibold text-base text-foreground group-hover:text-primary transition-colors">
                    {title}
                  </h3>
                </div>

                <ChevronRight className="size-5 shrink-0 text-muted-foreground rtl:rotate-180 group-hover:text-primary group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 transition-transform mt-1" />
              </div>

              {sanitizedSnippet && (
                <div
                  className="text-xs text-muted-foreground line-clamp-2 leading-relaxed [&_mark]:bg-primary/20 [&_mark]:text-primary [&_mark]:font-medium"
                  dangerouslySetInnerHTML={{ __html: sanitizedSnippet }}
                />
              )}

              <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1 border-t border-border/30">
                <div className="flex items-center gap-1">
                  <Clock className="size-3.5" />
                  <span>{readTimeMinutes} {t('min_read')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="size-3.5" />
                  <span>{article.view_count.toLocaleString()} {t('views')}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

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
