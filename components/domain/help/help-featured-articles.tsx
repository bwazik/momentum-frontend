'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Sparkles, Clock, Eye, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DualDateDisplay } from '@/components/shared/dual-date-display';
import { estimateReadTime } from '@/lib/utils/help-center-utils';
import type { HelpArticle } from '@/lib/api/types/help-center-types';
import { cn } from '@/lib/utils';

interface HelpFeaturedArticlesProps {
  articles: HelpArticle[];
  canManage?: boolean;
}

export function HelpFeaturedArticles({ articles, canManage = false }: HelpFeaturedArticlesProps) {
  const locale = useLocale();
  const t = useTranslations('help_center.articles');

  if (!articles || articles.length === 0) return null;

  // Show up to 2-4 featured articles
  const featured = articles.slice(0, 4);

  return (
    <div className="space-y-3" data-testid="help-featured-articles">
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-primary" />
        <h2 className="text-lg font-semibold tracking-tight">{t('featured_title')}</h2>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {featured.map((article) => {
          const title = locale === 'ar' ? (article.title_ar || article.title_en) : (article.title_en || article.title_ar);
          const categoryName = article.category
            ? locale === 'ar'
              ? (article.category.name_ar || article.category.name_en)
              : (article.category.name_en || article.category.name_ar)
            : null;
          const readTimeMinutes = estimateReadTime(title, article.estimated_read_time);

          return (
            <Link
              key={article.public_id}
              href={`/help/${article.slug || article.public_id}`}
              className={cn(
                'group flex flex-col justify-between rounded-xl border border-border/70 bg-gradient-to-br from-card to-muted/20 p-5 transition-all',
                'hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
              )}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  {categoryName ? (
                    <Badge variant="secondary" className="text-xs font-normal">
                      {categoryName}
                    </Badge>
                  ) : <div />}

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

                <h3 className="font-semibold text-base sm:text-lg text-foreground group-hover:text-primary transition-colors line-clamp-2">
                  {title}
                </h3>
              </div>

              <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <Clock className="size-3.5" />
                    <span>{readTimeMinutes} {t('min_read')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="size-3.5" />
                    <span>{article.view_count.toLocaleString()}</span>
                  </div>
                  <div className="hidden sm:block">
                    <DualDateDisplay gregorian={article.updated_at} />
                  </div>
                </div>

                <ChevronRight className="size-4 rtl:rotate-180 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
