'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Link as LinkIcon,
  Table as TableIcon,
  Upload,
  Copy,
  Check,
  Eye,
  Edit3,
  Loader2,
  FileCheck,
  Save,
  ArrowLeft,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field, FieldLabel } from '@/components/ui/field';
import { RtlSelect } from '@/components/shared/rtl-select';
import {
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import {
  useHelpCategories,
  useCreateHelpArticle,
  useUpdateHelpArticle,
  usePublishHelpArticle,
  useHelpArticleDocuments,
  useUploadHelpArticleDocument,
  useDeleteHelpArticleDocument,
} from '@/lib/api/hooks/use-help-center';
import type { HelpArticleDetail } from '@/lib/api/types/help-center-types';
import { HelpArticleContent } from './help-article-content';
import { CancelDiscardDialog } from './cancel-discard-dialog';
import { cn } from '@/lib/utils';

interface HelpArticleFormProps {
  initialData?: HelpArticleDetail;
  mode: 'create' | 'edit';
}

export function HelpArticleForm({ initialData, mode }: HelpArticleFormProps) {
  const router = useRouter();
  const t = useTranslations('help_center.editor');
  const tCommon = useTranslations('help_center.articles');

  const { data: categories = [], isLoading: categoriesLoading } = useHelpCategories();

  const createMutation = useCreateHelpArticle();
  const updateMutation = useUpdateHelpArticle();
  const publishMutation = usePublishHelpArticle();

  const [categoryId, setCategoryId] = useState(initialData?.category?.public_id || '');
  const [titleAr, setTitleAr] = useState(initialData?.title_ar || '');
  const [titleEn, setTitleEn] = useState(initialData?.title_en || '');
  const [bodyAr, setBodyAr] = useState(initialData?.body_ar || '');
  const [bodyEn, setBodyEn] = useState(initialData?.body_en || '');
  const [displayOrder, setDisplayOrder] = useState<number>(initialData?.display_order ?? 0);

  const [activeBodyLang, setActiveBodyLang] = useState<'ar' | 'en'>('ar');
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
  const [copiedDocId, setCopiedDocId] = useState<string | null>(null);
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Documents if in edit mode
  const { data: docsData } = useHelpArticleDocuments(initialData?.public_id || '');
  const documents = docsData?.pages.flatMap((p) => p.data) ?? [];
  const uploadDocumentMutation = useUploadHelpArticleDocument(initialData?.public_id || '');
  const deleteDocumentMutation = useDeleteHelpArticleDocument(initialData?.public_id || '');

  const isSubmitting =
    createMutation.isPending || updateMutation.isPending || publishMutation.isPending;

  // Check dirty state
  const isDirty =
    (mode === 'create' &&
      (!!titleAr || !!titleEn || !!bodyAr || !!bodyEn || !!categoryId)) ||
    (mode === 'edit' &&
      (titleAr !== (initialData?.title_ar || '') ||
        titleEn !== (initialData?.title_en || '') ||
        bodyAr !== (initialData?.body_ar || '') ||
        bodyEn !== (initialData?.body_en || '') ||
        categoryId !== (initialData?.category?.public_id || '') ||
        displayOrder !== (initialData?.display_order ?? 0)));

  const handleInsertMarkdown = (snippetStart: string, snippetEnd = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentVal = activeBodyLang === 'ar' ? bodyAr : bodyEn;
    const selectedText = currentVal.substring(start, end);

    const replacement = `${snippetStart}${selectedText || 'text'}${snippetEnd}`;
    const newVal = currentVal.substring(0, start) + replacement + currentVal.substring(end);

    if (activeBodyLang === 'ar') {
      setBodyAr(newVal);
    } else {
      setBodyEn(newVal);
    }

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + snippetStart.length,
        start + snippetStart.length + (selectedText.length || 4)
      );
    }, 0);
  };

  const handleCopyTag = (docName: string, url: string, docId: string) => {
    const tag = `![${docName}](${url})`;
    navigator.clipboard.writeText(tag);
    setCopiedDocId(docId);
    toast.success(t('copied_tag'));
    setTimeout(() => setCopiedDocId(null), 2500);
  };

  const handleDeleteDocument = (docPublicId: string) => {
    deleteDocumentMutation.mutate(docPublicId, {
      onSuccess: () => {
        toast.success(t('attachment_deleted'));
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : 'Failed to delete attachment');
      },
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !initialData?.public_id) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds 10MB limit');
      return;
    }

    const formData = new FormData();
    formData.append('document', file);
    formData.append('entity_type', 'HelpArticle');
    formData.append('entity_id', initialData.public_id);

    uploadDocumentMutation.mutate(formData, {
      onSuccess: () => {
        toast.success('Attachment uploaded successfully');
        if (fileInputRef.current) fileInputRef.current.value = '';
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : 'Failed to upload attachment');
      },
    });
  };

  const handleSubmit = async (publishAfterSave: boolean) => {
    if (!categoryId) {
      toast.error(t('category_required'));
      return;
    }
    if (!titleAr.trim()) {
      toast.error(t('title_ar_required'));
      return;
    }
    if (!bodyAr.trim()) {
      toast.error(t('body_ar_required'));
      return;
    }

    if (mode === 'create') {
      createMutation.mutate(
        {
          category_id: categoryId,
          title_ar: titleAr.trim(),
          title_en: titleEn.trim() || undefined,
          body_ar: bodyAr.trim(),
          body_en: bodyEn.trim() || undefined,
          display_order: displayOrder,
        },
        {
          onSuccess: (newArticle) => {
            if (publishAfterSave) {
              publishMutation.mutate(newArticle.public_id, {
                onSuccess: () => {
                  toast.success(tCommon('publish_success'));
                  router.push(`/help/${newArticle.slug || newArticle.public_id}`);
                },
                onError: () => {
                  toast.success('Article draft saved, but publication failed');
                  router.push(`/help/${newArticle.slug || newArticle.public_id}`);
                },
              });
            } else {
              toast.success('Draft article created');
              router.push(`/help/${newArticle.slug || newArticle.public_id}`);
            }
          },
          onError: (err) => {
            toast.error(err instanceof Error ? err.message : 'Error creating article');
          },
        }
      );
    } else {
      if (!initialData) return;

      updateMutation.mutate(
        {
          publicId: initialData.public_id,
          data: {
            category_id: categoryId,
            title_ar: titleAr.trim(),
            title_en: titleEn.trim() || undefined,
            body_ar: bodyAr.trim(),
            body_en: bodyEn.trim() || undefined,
            display_order: displayOrder,
          },
        },
        {
          onSuccess: () => {
            if (publishAfterSave && !initialData.is_published) {
              publishMutation.mutate(initialData.public_id, {
                onSuccess: () => {
                  toast.success(tCommon('publish_success'));
                  router.push(`/help/${initialData.slug || initialData.public_id}`);
                },
                onError: () => {
                  toast.success('Article updated, but publication failed');
                  router.push(`/help/${initialData.slug || initialData.public_id}`);
                },
              });
            } else {
              toast.success('Article updated successfully');
              router.push(`/help/${initialData.slug || initialData.public_id}`);
            }
          },
          onError: (err) => {
            toast.error(err instanceof Error ? err.message : 'Error updating article');
          },
        }
      );
    }
  };

  const handleCancel = () => {
    if (isDirty) {
      setDiscardDialogOpen(true);
    } else {
      router.back();
    }
  };

  const currentBody = activeBodyLang === 'ar' ? bodyAr : bodyEn;

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-12" data-testid="help-article-form">
      {/* Top Bar Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleCancel}
          disabled={isSubmitting}
        >
          <ArrowLeft className="me-2 size-4 rtl:rotate-180" />
          {tCommon('back_to_help')}
        </Button>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleSubmit(false)}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="me-2 size-3.5 animate-spin" />
            ) : (
              <Save className="me-2 size-3.5" />
            )}
            {t('save_draft')}
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => handleSubmit(true)}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="me-2 size-3.5 animate-spin" />
            ) : (
              <FileCheck className="me-2 size-3.5" />
            )}
            {mode === 'create' ? t('save_and_publish') : t('save_changes')}
          </Button>
        </div>
      </div>

      {/* Main Settings Card */}
      <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {/* Category Select */}
          <div className="sm:col-span-2">
            <Field>
              <FieldLabel>
                {t('category_label')} <span className="text-destructive">*</span>
              </FieldLabel>
              <RtlSelect
                value={categoryId}
                onValueChange={setCategoryId}
                disabled={categoriesLoading || isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('category_placeholder')} />
                </SelectTrigger>
                <SelectContent position="popper">
                  {categories.map((cat) => (
                    <SelectItem key={cat.public_id} value={cat.public_id}>
                      {cat.name_ar} / {cat.name_en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </RtlSelect>
            </Field>
          </div>

          {/* Display Order */}
          <div>
            <Field>
              <FieldLabel>{t('display_order')}</FieldLabel>
              <Input
                type="number"
                min={0}
                max={32767}
                value={displayOrder}
                onChange={(e) => setDisplayOrder(parseInt(e.target.value, 10) || 0)}
                disabled={isSubmitting}
              />
            </Field>
          </div>
        </div>

        {/* Bilingual Titles */}
        <div className="space-y-4 pt-2 border-t">
          <Field>
            <FieldLabel>
              {t('title_ar')} <span className="text-destructive">*</span>
            </FieldLabel>
            <Input
              dir="rtl"
              value={titleAr}
              onChange={(e) => setTitleAr(e.target.value)}
              placeholder="أدخل عنوان المقال بالعربية..."
              disabled={isSubmitting}
              maxLength={255}
            />
          </Field>

          <Field>
            <FieldLabel>{t('title_en')}</FieldLabel>
            <Input
              dir="ltr"
              value={titleEn}
              onChange={(e) => setTitleEn(e.target.value)}
              placeholder="Enter article title in English (optional)..."
              disabled={isSubmitting}
              maxLength={255}
            />
          </Field>
        </div>
      </div>

      {/* Rich Text Editor Section */}
      <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs">
        {/* Editor Sub-Header: Language and Write/Preview Tabs */}
        <div className="flex flex-wrap items-center justify-between border-b bg-muted/30 px-4 py-2.5 gap-2">
          {/* Language selector */}
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveBodyLang('ar')}
              className={cn(
                'px-3 py-1 text-xs font-medium rounded-md transition-colors',
                activeBodyLang === 'ar'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              العربية (Arabic) <span className="text-destructive">*</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveBodyLang('en')}
              className={cn(
                'px-3 py-1 text-xs font-medium rounded-md transition-colors',
                activeBodyLang === 'en'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              English
            </button>
          </div>

          {/* Write / Preview Mode Switch */}
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveTab('write')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors',
                activeTab === 'write'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Edit3 className="size-3.5" />
              {t('write_tab')}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors',
                activeTab === 'preview'
                  ? 'bg-background text-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Eye className="size-3.5" />
              {t('preview_tab')}
            </button>
          </div>
        </div>

        {/* Toolbar (only visible in Write tab) */}
        {activeTab === 'write' && (
          <div
            className="flex flex-wrap items-center gap-1 border-b bg-muted/10 p-2 text-muted-foreground"
            role="toolbar"
            aria-label="Formatting"
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => handleInsertMarkdown('**', '**')}
              title="Bold"
            >
              <Bold className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => handleInsertMarkdown('*', '*')}
              title="Italic"
            >
              <Italic className="size-4" />
            </Button>
            <div className="h-4 w-px bg-border/60 mx-1" />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => handleInsertMarkdown('## ')}
              title="Heading 2"
            >
              <Heading2 className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => handleInsertMarkdown('### ')}
              title="Heading 3"
            >
              <Heading3 className="size-4" />
            </Button>
            <div className="h-4 w-px bg-border/60 mx-1" />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => handleInsertMarkdown('- ')}
              title="Bullet List"
            >
              <List className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => handleInsertMarkdown('1. ')}
              title="Numbered List"
            >
              <ListOrdered className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => handleInsertMarkdown('> ')}
              title="Quote"
            >
              <Quote className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => handleInsertMarkdown('```\n', '\n```')}
              title="Code Block"
            >
              <Code className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() => handleInsertMarkdown('[', '](https://)')}
              title="Link"
            >
              <LinkIcon className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-8"
              onClick={() =>
                handleInsertMarkdown(
                  '\n| العمود 1 | العمود 2 |\n|---|---|\n| قيمة 1 | قيمة 2 |\n'
                )
              }
              title="Table"
            >
              <TableIcon className="size-4" />
            </Button>
          </div>
        )}

        {/* Editor Body or Preview Body */}
        <div className="p-4">
          {activeTab === 'write' ? (
            <div className="space-y-2">
              <textarea
                ref={textareaRef}
                dir={activeBodyLang === 'ar' ? 'rtl' : 'ltr'}
                rows={16}
                value={currentBody}
                onChange={(e) => {
                  if (activeBodyLang === 'ar') setBodyAr(e.target.value);
                  else setBodyEn(e.target.value);
                }}
                placeholder={
                  activeBodyLang === 'ar'
                    ? 'اكتب محتوى المقال بتنسيق Markdown أو HTML...'
                    : 'Write article content in Markdown or HTML...'
                }
                className="w-full resize-y rounded-xl border border-input bg-transparent p-4 font-mono text-sm leading-relaxed focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                maxLength={100000}
                disabled={isSubmitting}
              />
              <div className="flex justify-end text-[11px] text-muted-foreground">
                {currentBody.length.toLocaleString()} / 100,000 characters
              </div>
            </div>
          ) : (
            <div className="min-h-[300px] rounded-xl border border-border/50 bg-card p-6">
              {currentBody ? (
                <HelpArticleContent content={currentBody} locale={activeBodyLang} />
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <AlertCircle className="size-8 mb-2 opacity-50" />
                  <p className="text-sm">{t('preview_empty')}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Attachments Section (available in edit mode) */}
      <div className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold tracking-tight">
              {t('attachments_title')}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t('attachments_desc')}
            </p>
          </div>

          {mode === 'edit' && initialData?.public_id && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleFileUpload}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadDocumentMutation.isPending}
              >
                {uploadDocumentMutation.isPending ? (
                  <Loader2 className="me-2 size-3.5 animate-spin" />
                ) : (
                  <Upload className="me-2 size-3.5" />
                )}
                {t('upload_image')}
              </Button>
            </div>
          )}
        </div>

        {mode === 'create' ? (
          <div className="rounded-xl border border-dashed p-6 text-center text-xs text-muted-foreground">
            Attachments and screenshots can be uploaded after creating the draft article.
          </div>
        ) : documents.length === 0 ? (
          <div className="rounded-xl border border-dashed p-6 text-center text-xs text-muted-foreground">
            No image attachments yet. Upload screenshots to embed them in the markdown text.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {documents.map((doc) => {
              const isCopied = copiedDocId === doc.public_id;
              const previewUrl = doc.preview_url || doc.download_url;

              return (
                <div
                  key={doc.public_id}
                  className="flex items-center justify-between gap-3 rounded-xl border p-3 bg-muted/20"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium truncate" title={doc.original_name}>
                      {doc.original_name}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {((doc.size_bytes ?? doc.file_size ?? 0) / 1024).toFixed(0)} KB
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => handleCopyTag(doc.original_name, previewUrl, doc.public_id)}
                    >
                      {isCopied ? (
                        <>
                          <Check className="me-1.5 size-3 text-emerald-500" />
                          {t('copied_tag')}
                        </>
                      ) : (
                        <>
                          <Copy className="me-1.5 size-3" />
                          {t('copy_markdown_tag')}
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => handleDeleteDocument(doc.public_id)}
                      disabled={deleteDocumentMutation.isPending}
                      aria-label={t('delete_attachment')}
                      title={t('delete_attachment')}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Discard Changes Dialog */}
      <CancelDiscardDialog
        open={discardDialogOpen}
        onOpenChange={setDiscardDialogOpen}
        onConfirm={() => {
          setDiscardDialogOpen(false);
          router.back();
        }}
      />
    </div>
  );
}
