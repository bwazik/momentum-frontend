'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { ChevronRight, Eye, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DualDateDisplay } from '@/components/shared/dual-date-display';
import { estimateReadTime } from '@/lib/utils/help-center-utils';
import type { HelpArticle } from '@/lib/api/types/help-center-types';
import { cn } from '@/lib/utils';

interface HelpArticleCardProps {
  article: HelpArticle;
  canManage?: boolean;
}

export function HelpArticleCard({ article, canManage = false }: HelpArticleCardProps) {
  const locale = useLocale();
  const t = useTranslations('help_center.articles');

  const title = locale === 'ar' ? (article.title_ar || article.title_en) : (article.title_en || article.title_ar);
  const categoryName = article.category
    ? locale === 'ar'
      ? (article.category.name_ar || article.category.name_en)
      : (article.category.name_en || article.category.name_ar)
    : null;

  // Read time based on server calculation if available, or estimated from content
  const readTimeMinutes = estimateReadTime(title, article.estimated_read_time);

  return (
    <Link
      href={`/help/${article.slug || article.public_id}`}
      className={cn(
        'group flex items-center justify-between rounded-xl border border-border/70 bg-card p-4 transition-all',
        'hover:border-primary/50 hover:bg-muted/30 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
      )}
      data-testid={`help-article-card-${article.public_id}`}
    >
      <div className="flex-1 min-w-0 space-y-1.5 pe-4">
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

        <h3 className="font-semibold text-base text-foreground group-hover:text-primary transition-colors truncate">
          {title}
        </h3>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="size-3.5" />
            <span>{readTimeMinutes} {t('min_read')}</span>
          </div>

          <div className="flex items-center gap-1">
            <Eye className="size-3.5" />
            <span>{article.view_count.toLocaleString()} {t('views')}</span>
          </div>

          <div className="hidden sm:flex items-center gap-1">
            <span>{t('updated_at')}:</span>
            <DualDateDisplay
              gregorian={article.updated_at}
              className="text-xs text-muted-foreground"
            />
          </div>
        </div>
      </div>

      <div className="shrink-0 flex items-center justify-center size-8 rounded-full bg-muted/50 text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-all">
        <ChevronRight className="size-4 rtl:rotate-180 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" />
      </div>
    </Link>
  );
}
