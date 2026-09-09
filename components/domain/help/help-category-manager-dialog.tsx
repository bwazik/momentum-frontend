'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowUp, ArrowDown, Pencil, Trash2, Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BilingualNameFields } from '@/components/shared/bilingual-name-fields';
import { ConfirmDeleteDialog } from '@/components/shared/confirm-delete-dialog';
import {
  useHelpCategories,
  useCreateHelpCategory,
  useUpdateHelpCategory,
  useDeleteHelpCategory,
  useReorderHelpCategories,
} from '@/lib/api/hooks/use-help-center';
import type { HelpArticleCategory } from '@/lib/api/types/help-center-types';
import { ApiRequestError } from '@/lib/api/client';

interface HelpCategoryManagerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HelpCategoryManagerDialog({
  open,
  onOpenChange,
}: HelpCategoryManagerDialogProps) {
  const t = useTranslations('help_center.categories');
  const { data: categories = [], isLoading } = useHelpCategories();

  const createCategory = useCreateHelpCategory();
  const updateCategory = useUpdateHelpCategory();
  const deleteCategory = useDeleteHelpCategory();
  const reorderCategories = useReorderHelpCategories();

  const [editingCategory, setEditingCategory] = useState<HelpArticleCategory | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<HelpArticleCategory | null>(null);
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');

  const isSubmitting = createCategory.isPending || updateCategory.isPending;

  const handleStartEdit = (category: HelpArticleCategory) => {
    setEditingCategory(category);
    setNameAr(category.name_ar);
    setNameEn(category.name_en);
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setNameAr('');
    setNameEn('');
  };

  const handleSave = () => {
    if (!nameAr.trim()) {
      toast.error(t('name_ar_required'));
      return;
    }
    if (!nameEn.trim()) {
      toast.error(t('name_en_required'));
      return;
    }

    if (editingCategory) {
      updateCategory.mutate(
        {
          publicId: editingCategory.public_id,
          data: { name_ar: nameAr.trim(), name_en: nameEn.trim() },
        },
        {
          onSuccess: () => {
            toast.success(t('update_success'));
            handleCancelEdit();
          },
          onError: (err) => {
            toast.error(err instanceof Error ? err.message : t('delete_failed'));
          },
        }
      );
    } else {
      createCategory.mutate(
        {
          name_ar: nameAr.trim(),
          name_en: nameEn.trim(),
          display_order: categories.length,
        },
        {
          onSuccess: () => {
            toast.success(t('create_success'));
            setNameAr('');
            setNameEn('');
          },
          onError: (err) => {
            toast.error(err instanceof Error ? err.message : t('delete_failed'));
          },
        }
      );
    }
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= categories.length) return;

    const newOrder = [...categories];
    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;

    const payload = newOrder.map((cat, idx) => ({
      public_id: cat.public_id,
      display_order: idx,
    }));

    reorderCategories.mutate(payload, {
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : 'Failed to reorder categories');
      },
    });
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;

    deleteCategory.mutate(deleteTarget.public_id, {
      onSuccess: () => {
        toast.success(t('delete_success'));
        if (editingCategory?.public_id === deleteTarget.public_id) {
          handleCancelEdit();
        }
        setDeleteTarget(null);
      },
      onError: (err) => {
        if (err instanceof ApiRequestError && err.status === 422) {
          toast.error(t('category_has_published_articles'));
        } else {
          toast.error(err instanceof Error ? err.message : t('delete_failed'));
        }
        setDeleteTarget(null);
      },
    });
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className="sm:max-w-4xl max-h-[90vh] overflow-y-auto overflow-x-clip"
          data-testid="help-category-manager-dialog"
        >
          <DialogHeader>
            <DialogTitle>{t('manager_title')}</DialogTitle>
            <DialogDescription>{t('manager_desc')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 pt-2">
            {/* Create or Edit Form */}
            <div className="rounded-xl border border-border/80 bg-muted/20 p-4 space-y-4">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                {editingCategory ? (
                  <>
                    <Pencil className="size-4 text-primary" />
                    {t('edit_category')}
                  </>
                ) : (
                  <>
                    <Plus className="size-4 text-primary" />
                    {t('new_category')}
                  </>
                )}
              </h4>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <BilingualNameFields
                  form={{ name_ar: nameAr, name_en: nameEn }}
                  onFieldChange={(key, value) => {
                    if (key === 'name_ar') setNameAr(value);
                    if (key === 'name_en') setNameEn(value);
                  }}
                  t={t}
                  readOnly={isSubmitting}
                  arRequired={true}
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                {editingCategory && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleCancelEdit}
                    disabled={isSubmitting}
                  >
                    {t('cancel')}
                  </Button>
                )}
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSave}
                  disabled={isSubmitting}
                >
                  {isSubmitting && <Loader2 className="me-2 size-3.5 animate-spin" />}
                  {editingCategory ? t('save_changes') : t('add_category')}
                </Button>
              </div>
            </div>

            {/* Categories List */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t('title')} ({categories.length})
              </h4>

              {isLoading ? (
                <div className="flex items-center justify-center p-8 text-muted-foreground">
                  <Loader2 className="size-6 animate-spin" />
                </div>
              ) : categories.length === 0 ? (
                <p className="text-sm text-muted-foreground p-4 text-center border rounded-lg">
                  {t('manager_desc')}
                </p>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto overflow-x-clip pe-1">
                  {categories.map((cat, index) => (
                    <div
                      key={cat.public_id}
                      className="flex items-center justify-between rounded-lg border bg-card p-3 transition-colors hover:bg-muted/40"
                    >
                      <div className="min-w-0 flex-1 pe-2">
                        <p className="text-sm font-medium text-foreground truncate">
                          {cat.name_ar} / {cat.name_en}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {cat.article_count ?? 0} {t('articles_count')}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          disabled={index === 0 || reorderCategories.isPending}
                          onClick={() => handleMove(index, 'up')}
                          aria-label="Move category up"
                        >
                          <ArrowUp className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          disabled={index === categories.length - 1 || reorderCategories.isPending}
                          onClick={() => handleMove(index, 'down')}
                          aria-label="Move category down"
                        >
                          <ArrowDown className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => handleStartEdit(cat)}
                          aria-label={`Edit category ${cat.name_en}`}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() => setDeleteTarget(cat)}
                          aria-label={`Delete category ${cat.name_en}`}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {deleteTarget && (
        <ConfirmDeleteDialog
          open={!!deleteTarget}
          onOpenChange={(o) => {
            if (!o) setDeleteTarget(null);
          }}
          title={t('confirm_delete_title')}
          description={t('confirm_delete_desc', { name: deleteTarget.name_ar })}
          onConfirm={handleDeleteConfirm}
          isPending={deleteCategory.isPending}
        />
      )}
    </>
  );
}
