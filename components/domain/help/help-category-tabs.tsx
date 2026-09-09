'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import type { HelpArticleCategory } from '@/lib/api/types/help-center-types';
import { cn } from '@/lib/utils';

interface HelpCategoryTabsProps {
  categories: HelpArticleCategory[];
  selectedCategoryId?: string | null;
  onSelectCategory: (categoryId: string | null) => void;
}

export function HelpCategoryTabs({
  categories,
  selectedCategoryId,
  onSelectCategory,
}: HelpCategoryTabsProps) {
  const locale = useLocale();
  const t = useTranslations('help_center.categories');

  if (categories.length === 0) return null;

  return (
    <div
      className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none"
      data-testid="help-category-tabs"
      role="tablist"
      aria-label={t('title')}
    >
      <Button
        key="all"
        type="button"
        variant={!selectedCategoryId ? 'default' : 'outline'}
        size="sm"
        onClick={() => onSelectCategory(null)}
        className={cn(
          'rounded-full px-4 text-xs shrink-0',
          !selectedCategoryId ? 'shadow-xs' : 'text-muted-foreground'
        )}
        role="tab"
        aria-selected={!selectedCategoryId}
      >
        {t('all_categories')}
      </Button>

      {categories.map((category) => {
        const categoryKey = category.slug || category.public_id;
        const isSelected = selectedCategoryId === categoryKey || selectedCategoryId === category.public_id;
        const name = locale === 'ar' ? (category.name_ar || category.name_en) : (category.name_en || category.name_ar);

        return (
          <Button
            key={category.public_id}
            type="button"
            variant={isSelected ? 'default' : 'outline'}
            size="sm"
            onClick={() => onSelectCategory(categoryKey)}
            className={cn(
              'rounded-full px-4 text-xs shrink-0',
              isSelected ? 'shadow-xs' : 'text-muted-foreground'
            )}
            role="tab"
            aria-selected={isSelected}
          >
            {name}
            {typeof category.article_count === 'number' && (
              <span className={cn('ms-1.5 text-[10px] opacity-70')}>
                ({category.article_count})
              </span>
            )}
          </Button>
        );
      })}
    </div>
  );
}
