'use client';

import { useState, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { PageHeader } from '@/components/shared/page-header';
import { ErrorState } from '@/components/shared/error-state';
import { useCapability } from '@/lib/api/hooks/use-capabilities';
import { useHelpArticle, useHelpCategories } from '@/lib/api/hooks/use-help-center';
import { useHelpDisplayStore } from '@/lib/stores/use-help-display-store';
import { HelpArticleForm } from './help-article-form';
import { HelpArticleReaderSkeleton } from './help-article-reader-skeleton';
import { PermissionDenied } from './permission-denied';

interface HelpArticleEditorPageClientProps {
  mode: 'create' | 'edit';
  publicId?: string;
}

export function HelpArticleEditorPageClient({
  mode,
  publicId,
}: HelpArticleEditorPageClientProps) {
  const locale = useLocale();
  const t = useTranslations('help_center');
  const canManage = useCapability('helpcenter.manage');

  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);

  const {
    data: article,
    isLoading,
    isError,
    error,
    refetch,
  } = useHelpArticle(publicId || '');

  const setArticleDisplay = useHelpDisplayStore((s) => s.setArticleDisplay);
  const clearArticleDisplay = useHelpDisplayStore((s) => s.clearArticleDisplay);

  const { data: categories = [] } = useHelpCategories();

  // Backend article payload carries no category slug — resolve it from the cached categories list
  const categorySlug =
    categories.find((c) => c.public_id === article?.category?.public_id)?.slug ||
    article?.category?.slug ||
    article?.category?.public_id ||
    null;

  useEffect(() => {
    if (mode === 'edit' && article) {
      const title = locale === 'ar' ? (article.title_ar || article.title_en) : (article.title_en || article.title_ar);
      const catName = article.category
        ? locale === 'ar'
          ? (article.category.name_ar || article.category.name_en)
          : (article.category.name_en || article.category.name_ar)
        : null;

      setArticleDisplay(title, catName, categorySlug);
    }

    return () => {
      clearArticleDisplay();
    };
  }, [mode, article, locale, categorySlug, setArticleDisplay, clearArticleDisplay]);

  if (hydrated && !canManage) {
    return <PermissionDenied />;
  }

  if (!hydrated || (mode === 'edit' && isLoading)) {
    return <HelpArticleReaderSkeleton />;
  }

  if (mode === 'edit' && (isError || !article)) {
    return (
      <div className="space-y-6 py-8">
        <ErrorState
          message={error instanceof Error ? error.message : t('articles.article_not_found')}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8" data-testid="help-article-editor-page">
      <PageHeader
        title={mode === 'create' ? t('editor.create_title') : t('editor.edit_title')}
        description={mode === 'create' ? t('editor.create_desc') : t('editor.edit_desc')}
      />

      <HelpArticleForm
        mode={mode}
        initialData={mode === 'edit' ? article : undefined}
      />
    </div>
  );
}
