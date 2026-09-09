'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { getCategoryIcon } from '@/lib/utils/help-center-utils';
import type { HelpArticleCategory } from '@/lib/api/types/help-center-types';
import { cn } from '@/lib/utils';

interface HelpCategoryGridProps {
  categories: HelpArticleCategory[];
  selectedCategoryId?: string | null;
  onSelectCategory: (categoryId: string | null) => void;
}

export function HelpCategoryGrid({
  categories,
  selectedCategoryId,
  onSelectCategory,
}: HelpCategoryGridProps) {
  const locale = useLocale();
  const t = useTranslations('help_center.categories');

  if (categories.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3" data-testid="help-category-grid">
      <h2 className="text-lg font-semibold tracking-tight">{t('title')}</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {categories.map((category) => {
          const categoryKey = category.slug || category.public_id;
          const isSelected = selectedCategoryId === categoryKey || selectedCategoryId === category.public_id;
          const name = locale === 'ar' ? (category.name_ar || category.name_en) : (category.name_en || category.name_ar);
          const Icon = getCategoryIcon(category.slug || name);

          return (
            <button
              key={category.public_id}
              type="button"
              onClick={() => onSelectCategory(isSelected ? null : categoryKey)}
              className={cn(
                'group flex cursor-pointer items-center justify-between gap-3.5 rounded-xl border p-4 text-start transition-all hover:border-primary/50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                isSelected
                  ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/30 dark:bg-primary/10'
                  : 'bg-card border-border/70 hover:bg-muted/30'
              )}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div
                  className={cn(
                    'flex size-10 items-center justify-center rounded-lg transition-colors shrink-0',
                    isSelected
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground'
                  )}
                >
                  <Icon className="size-5" />
                </div>
                <div className="truncate">
                  <div className="font-medium text-sm text-foreground truncate">{name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {category.article_count ?? 0} {t('articles_count')}
                  </div>
                </div>
              </div>
              {isSelected && (
                <Badge variant="default" className="text-[10px] px-1.5 py-0 shrink-0">
                  ✓
                </Badge>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
