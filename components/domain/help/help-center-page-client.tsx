'use client';

import { useState, useEffect, useTransition, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Plus, FolderTree } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/page-header';
import { useCapability } from '@/lib/api/hooks/use-capabilities';
import { useHelpCategories, useHelpArticlesInfinite } from '@/lib/api/hooks/use-help-center';
import { HelpSearchHero } from './help-search-hero';
import { HelpCategoryGrid } from './help-category-grid';
import { HelpCategoryTabs } from './help-category-tabs';
import { HelpFeaturedArticles } from './help-featured-articles';
import { HelpArticleList } from './help-article-list';
import { HelpSearchResults } from './help-search-results';
import { HelpCategoryManagerDialog } from './help-category-manager-dialog';
import { HelpCenterSkeleton } from './help-center-skeleton';
import { PermissionDenied } from './permission-denied';

export function HelpCenterPageClient() {
  const t = useTranslations('help_center');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const canView = useCapability('helpcenter.view');
  const canManage = useCapability('helpcenter.manage');

  // Wait for capabilities to hydrate before rendering permission guard
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);

  const currentCategory = searchParams.get('category') || null;
  const initialQuery = searchParams.get('q') || '';
  const currentStatus = (searchParams.get('status') as 'all' | 'published' | 'draft') || 'all';

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);

  const { data: categories = [], isLoading: categoriesLoading } = useHelpCategories();

  // Resolve slug → public_id: URL uses slugs for readability, API needs UUIDs
  const slugToIdMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const cat of categories) {
      if (cat.slug) map.set(cat.slug, cat.public_id);
    }
    return map;
  }, [categories]);

  const resolvedCategoryId = useMemo(() => {
    if (!currentCategory) return null;
    // If it's already a UUID, pass through
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(currentCategory)) {
      return currentCategory;
    }
    // Otherwise it's a slug — resolve to public_id
    return slugToIdMap.get(currentCategory) ?? null;
  }, [currentCategory, slugToIdMap]);

  // Also prefetch/fetch top articles for featured section
  const { data: featuredData, isLoading: featuredLoading } = useHelpArticlesInfinite({
    is_published: true,
    per_page: 4,
  });

  const queryParam = searchParams.get('q') || '';

  const updateUrlParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value.trim()) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    startTransition(() => {
      const qs = params.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ''}`, { scroll: false });
    });
  };

  // Sync state if URL queryParam changes externally
  useEffect(() => {
    setSearchQuery(queryParam);
  }, [queryParam]);

  // Debounce search query sync to URL (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== queryParam) {
        updateUrlParam('q', searchQuery);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, queryParam]);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    updateUrlParam('q', null);
  };

  const handleSelectCategory = (categoryId: string | null) => {
    updateUrlParam('category', categoryId);
  };

  const handleStatusChange = (status: 'all' | 'published' | 'draft') => {
    updateUrlParam('status', status === 'all' ? null : status);
  };

  const isSearchActive = searchQuery.trim().length >= 2;
  const featuredArticles = featuredData?.pages[0]?.data ?? [];

  // --- Conditional renders (after all hooks) ---

  if (!hydrated) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={t('title')}
          description={t('description')}
        />
        <HelpCenterSkeleton />
      </div>
    );
  }

  if (!canView && !canManage) {
    return <PermissionDenied />;
  }

  if (categoriesLoading && featuredLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={t('title')}
          description={t('description')}
        />
        <HelpCenterSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-8" data-testid="help-center-page">
      <PageHeader
        title={t('title')}
        description={t('description')}
        actions={
          canManage && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCategoryManagerOpen(true)}
              >
                <FolderTree className="me-2 size-4" />
                {t('articles.manage_categories_btn')}
              </Button>
              <Button asChild size="sm">
                <Link href="/help/new">
                  <Plus className="me-2 size-4" />
                  {t('articles.create_article_btn')}
                </Link>
              </Button>
            </div>
          )
        }
      />

      {/* Hero Search Section */}
      <HelpSearchHero
        value={searchQuery}
        onChange={handleSearchChange}
        onClear={handleClearSearch}
      />

      {/* Search results mode vs Directory mode */}
      {isSearchActive ? (
        <HelpSearchResults
          query={searchQuery}
          categoryId={resolvedCategoryId}
          canManage={canManage}
          onClearSearch={handleClearSearch}
        />
      ) : (
        <div className="space-y-8">
          {/* Categories Grid (hidden if a single category is selected) */}
          {!currentCategory && (
            <HelpCategoryGrid
              categories={categories}
              selectedCategoryId={currentCategory}
              onSelectCategory={handleSelectCategory}
            />
          )}

          {/* Category Tabs */}
          <HelpCategoryTabs
            categories={categories}
            selectedCategoryId={currentCategory}
            onSelectCategory={handleSelectCategory}
          />

          {/* Featured Guides (only shown on root all-categories directory) */}
          {!currentCategory && featuredArticles.length > 0 && (
            <HelpFeaturedArticles
              articles={featuredArticles}
              canManage={canManage}
            />
          )}

          {/* Cursor-paginated Article Feed */}
          <HelpArticleList
            categoryId={resolvedCategoryId}
            status={currentStatus}
            onStatusChange={handleStatusChange}
            canManage={canManage}
          />
        </div>
      )}

      {/* Category Manager Dialog */}
      {canManage && (
        <HelpCategoryManagerDialog
          open={categoryManagerOpen}
          onOpenChange={setCategoryManagerOpen}
        />
      )}
    </div>
  );
}
