'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import {
  ArrowLeft,
  Clock,
  Eye,
  User,
  Pencil,
  Trash2,
  Globe,
  AlertTriangle,
  FileCheck,
  FileX,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DualDateDisplay } from '@/components/shared/dual-date-display';
import { ErrorState } from '@/components/shared/error-state';
import { ConfirmDeleteDialog } from '@/components/shared/confirm-delete-dialog';
import { useCapability } from '@/lib/api/hooks/use-capabilities';
import {
  useHelpArticle,
  useHelpArticlesInfinite,
  useHelpArticleDocuments,
  useHelpCategories,
  usePublishHelpArticle,
  useUnpublishHelpArticle,
  useDeleteHelpArticle,
} from '@/lib/api/hooks/use-help-center';
import { useHelpDisplayStore } from '@/lib/stores/use-help-display-store';
import { estimateReadTime } from '@/lib/utils/help-center-utils';
import { HelpArticleContent } from './help-article-content';
import { HelpArticleAttachmentsGallery } from './help-article-attachments-gallery';
import { HelpArticleReaderSkeleton } from './help-article-reader-skeleton';
import { PermissionDenied } from './permission-denied';
import { HelpArticleCard } from './help-article-card';
import { cn } from '@/lib/utils';

interface HelpArticleReaderPageClientProps {
  publicId: string;
}

export function HelpArticleReaderPageClient({ publicId }: HelpArticleReaderPageClientProps) {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations('help_center');

  const canView = useCapability('helpcenter.view');
  const canManage = useCapability('helpcenter.manage');

  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setHydrated(true);
  }, []);

  const { data: article, isLoading, isError, error, refetch } = useHelpArticle(publicId);
  const { data: documentsData } = useHelpArticleDocuments(publicId);
  const { data: categories = [] } = useHelpCategories();

  // Backend article payload carries no category slug — resolve it from the cached categories list
  const categorySlug =
    categories.find((c) => c.public_id === article?.category?.public_id)?.slug ||
    article?.category?.slug ||
    article?.category?.public_id ||
    null;

  const publishArticle = usePublishHelpArticle();
  const unpublishArticle = useUnpublishHelpArticle();
  const deleteArticle = useDeleteHelpArticle();

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [contentLocale, setContentLocale] = useState<'ar' | 'en'>(locale as 'ar' | 'en');

  const setArticleDisplay = useHelpDisplayStore((s) => s.setArticleDisplay);
  const clearArticleDisplay = useHelpDisplayStore((s) => s.clearArticleDisplay);

  // Sync breadcrumb store
  useEffect(() => {
    if (article) {
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
  }, [article, locale, categorySlug, setArticleDisplay, clearArticleDisplay]);

  // Query related articles in the same category
  const { data: relatedData } = useHelpArticlesInfinite({
    category_id: article?.category?.public_id,
    is_published: true,
    per_page: 4,
  });

  if (hydrated && !canView && !canManage) {
    return <PermissionDenied />;
  }

  if (!hydrated || isLoading) {
    return <HelpArticleReaderSkeleton />;
  }

  if (isError || !article) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 py-8" data-testid="help-article-error">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/help">
            <ArrowLeft className="me-2 size-4 rtl:rotate-180" />
            {t('articles.back_to_help')}
          </Link>
        </Button>
        <ErrorState
          message={error instanceof Error ? error.message : t('articles.article_not_found')}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const title = locale === 'ar' ? (article.title_ar || article.title_en) : (article.title_en || article.title_ar);
  const categoryName = article.category
    ? locale === 'ar'
      ? (article.category.name_ar || article.category.name_en)
      : (article.category.name_en || article.category.name_ar)
    : null;

  // Choose content based on user's contentLocale selection
  const rawBody =
    contentLocale === 'ar'
      ? article.body_ar || article.body_en || ''
      : article.body_en || article.body_ar || '';

  const authorName = article.author
    ? locale === 'ar'
      ? (article.author.name_ar || article.author.name_en)
      : (article.author.name_en || article.author.name_ar)
    : null;

  const readTimeMinutes = estimateReadTime(rawBody);
  const documents = documentsData?.pages.flatMap((p) => p.data) ?? [];

  // Related articles excluding current
  const relatedArticles =
    relatedData?.pages
      .flatMap((p) => p.data)
      .filter((a) => a.public_id !== article.public_id)
      .slice(0, 3) ?? [];

  const handleTogglePublish = () => {
    if (article.is_published) {
      unpublishArticle.mutate(article.public_id, {
        onSuccess: () => toast.success(t('articles.unpublish_success')),
        onError: (err) => toast.error(err instanceof Error ? err.message : 'Error unpublishing'),
      });
    } else {
      publishArticle.mutate(article.public_id, {
        onSuccess: () => toast.success(t('articles.publish_success')),
        onError: (err) => toast.error(err instanceof Error ? err.message : 'Error publishing'),
      });
    }
  };

  const handleDeleteArticle = () => {
    deleteArticle.mutate(article.public_id, {
      onSuccess: () => {
        toast.success(t('articles.delete_success'));
        router.replace('/help');
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : 'Error deleting article');
      },
    });
  };

  const hasBothLanguages = !!article.body_ar && !!article.body_en;

  return (
    <div className="mx-auto max-w-4xl space-y-8" data-testid="help-article-reader">
      {/* Top navigation row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/help">
            <ArrowLeft className="me-2 size-4 rtl:rotate-180" />
            {t('articles.back_to_help')}
          </Link>
        </Button>

        {canManage && (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleTogglePublish}
              disabled={publishArticle.isPending || unpublishArticle.isPending}
            >
              {publishArticle.isPending || unpublishArticle.isPending ? (
                <Loader2 className="me-2 size-3.5 animate-spin" />
              ) : article.is_published ? (
                <FileX className="me-2 size-3.5 text-amber-500" />
              ) : (
                <FileCheck className="me-2 size-3.5 text-emerald-500" />
              )}
              {article.is_published ? t('articles.unpublish_btn') : t('articles.publish_btn')}
            </Button>

            <Button asChild variant="outline" size="sm">
              <Link href={`/help/${article.slug || article.public_id}/edit`}>
                <Pencil className="me-2 size-3.5" />
                {t('articles.edit_btn')}
              </Link>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => setDeleteConfirmOpen(true)}
            >
              <Trash2 className="size-3.5" />
              <span className="sr-only sm:not-sr-only sm:ms-2">{t('articles.delete_btn')}</span>
            </Button>
          </div>
        )}
      </div>

      {/* Unpublished Draft Warning Banner for Managers */}
      {!article.is_published && (
        <div
          className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-900 dark:text-amber-200"
          data-testid="draft-warning-banner"
        >
          <AlertTriangle className="size-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-semibold">{t('articles.draft_warning_title')}</h4>
            <p className="text-xs leading-relaxed opacity-90">
              {t('articles.draft_warning_desc')}
            </p>
          </div>
        </div>
      )}

      {/* Header section */}
      <header className="space-y-4 border-b border-border/70 pb-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {article.category && (
            <Link href={`/help?category=${categorySlug}`}>
              <Badge variant="secondary" className="hover:bg-primary/10 transition-colors">
                {categoryName}
              </Badge>
            </Link>
          )}

          {hasBothLanguages && (
            <div className="flex items-center gap-1 rounded-md border bg-muted/40 p-0.5 text-xs">
              <Globe className="size-3.5 ms-1.5 me-0.5 text-muted-foreground" />
              <button
                type="button"
                onClick={() => setContentLocale('ar')}
                className={cn(
                  'rounded px-2 py-0.5 font-medium transition-colors',
                  contentLocale === 'ar'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                العربية
              </button>
              <button
                type="button"
                onClick={() => setContentLocale('en')}
                className={cn(
                  'rounded px-2 py-0.5 font-medium transition-colors',
                  contentLocale === 'en'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                English
              </button>
            </div>
          )}
        </div>

        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground leading-tight">
          {title}
        </h1>

        {/* Metadata info */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground pt-1">
          {authorName && (
            <div className="flex items-center gap-1.5">
              <User className="size-3.5" />
              <span>{authorName}</span>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <Clock className="size-3.5" />
            <span>{readTimeMinutes} {t('articles.min_read')}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Eye className="size-3.5" />
            <span>{article.view_count.toLocaleString()} {t('articles.views')}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span>{t('articles.published_at')}:</span>
            <DualDateDisplay gregorian={article.published_at || article.created_at} />
          </div>
        </div>
      </header>

      {/* Main prose article body */}
      <HelpArticleContent content={rawBody} locale={contentLocale} />

      {/* Attachments & diagrams */}
      <HelpArticleAttachmentsGallery documents={documents} />

      {/* Related articles */}
      {relatedArticles.length > 0 && (
        <div className="space-y-4 pt-8 border-t" data-testid="help-related-articles">
          <h3 className="text-base font-semibold tracking-tight">
            {t('articles.related_articles')}
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {relatedArticles.map((rel) => (
              <HelpArticleCard key={rel.public_id} article={rel} canManage={canManage} />
            ))}
          </div>
        </div>
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDeleteDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title={t('articles.delete_confirm_title')}
        description={t('articles.delete_confirm_desc')}
        onConfirm={handleDeleteArticle}
        isPending={deleteArticle.isPending}
      />
    </div>
  );
}
