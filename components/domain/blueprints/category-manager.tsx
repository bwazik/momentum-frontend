'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { ActiveBadge } from '@/components/shared/active-badge';
import { Field, FieldLabel } from '@/components/ui/field';
import { ConfirmDeleteDialog } from '@/components/shared/confirm-delete-dialog';
import { useBlueprintCategories, useCreateCategory, useUpdateCategory, useDeactivateCategory, useReactivateCategory, useDeleteCategory } from '@/lib/api/hooks/use-blueprints';
import { useCapability } from '@/lib/api/hooks/use-capabilities';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { ApiRequestError } from '@/lib/api/client';
import { RtlTable } from '@/components/shared/rtl-table';
import { BilingualNameFields } from '@/components/shared/bilingual-name-fields';
import { ActionsDropdown, FormDialog, CatalogSkeleton, editAction, deactivateAction, reactivateAction, deleteAction } from '@/components/shared/catalog-table';
import type { BlueprintCategoryResource } from './blueprint-types';

interface CategoryManagerProps {
  openCreate: boolean;
  onOpenCreateChange: (open: boolean) => void;
}

export function CategoryManager({ openCreate, onOpenCreateChange }: CategoryManagerProps) {
  const t = useTranslations('blueprints.catalog');
  const { data, isLoading, isError, error, refetch } = useBlueprintCategories();
  const canManage = useCapability('blueprint.manage');
  const create = useCreateCategory();
  const update = useUpdateCategory();
  const deactivate = useDeactivateCategory();
  const reactivate = useReactivateCategory();
  const deleteCategory = useDeleteCategory();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<BlueprintCategoryResource | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ name_ar: '', name_en: '', display_order: '0' });
  function openCreateDialog() {
    setEditItem(null);
    setForm({ name_ar: '', name_en: '', display_order: '0' });
    setDialogOpen(true);
  }

  useEffect(() => {
    if (openCreate) setTimeout(() => openCreateDialog(), 0);
  }, [openCreate]);

  if (isLoading) return <CatalogSkeleton />;
  if (isError) {
    if (error instanceof ApiRequestError && error.status === 403) {
      return <EmptyState title={t('no_permission_title')} description={t('no_permission_description')} />;
    }
    return <ErrorState message={t('error')} onRetry={() => refetch()} />;
  }

  const categories = data ?? [];

  function openEdit(cat: BlueprintCategoryResource) {
    setEditItem(cat);
    setForm({ name_ar: cat.name_ar, name_en: cat.name_en ?? '', display_order: cat.display_order ?? '0' });
    setDialogOpen(true);
  }

  function submit() {
    if (!form.name_ar) return;

    const body = { name_ar: form.name_ar, name_en: form.name_en || undefined, display_order: Number(form.display_order) || 0 };

    if (editItem) {
      update.mutate({ categoryId: editItem.public_id, body }, { onSuccess: () => setDialogOpen(false) });
    } else {
      create.mutate(body, { onSuccess: () => setDialogOpen(false) });
    }
  }

  return (
    <div className="space-y-4">
      {categories.length === 0 ? (
        <EmptyState title={t('empty_categories')} />
      ) : (
        <RtlTable>
          <TableHeader>
            <TableRow>
              <TableHead className="w-50 text-start">{t('name_ar')}</TableHead>
              <TableHead className="w-50 text-start">{t('name_en')}</TableHead>
              <TableHead className="w-20 text-start">{t('display_order')}</TableHead>
              <TableHead className="w-16 text-start">{t('status')}</TableHead>
              <TableHead className="w-12 text-end">{t('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((cat) => (
              <TableRow key={cat.public_id}>
                <TableCell className="text-start text-sm">{cat.name_ar}</TableCell>
                <TableCell className="text-start text-sm">{cat.name_en}</TableCell>
                <TableCell className="text-start text-sm">{cat.display_order}</TableCell>
                <TableCell className="text-start">
                  <ActiveBadge isActive={!!cat.is_active} activeLabel={t('active')} inactiveLabel={t('inactive')} />
                </TableCell>
                <TableCell className="text-end">
                  {canManage && (
                    <ActionsDropdown actions={[
                      editAction(t('edit'), () => openEdit(cat)),
                      ...(cat.is_active
                        ? [deactivateAction(t('deactivate'), () => deactivate.mutate(cat.public_id))]
                        : [reactivateAction(t('reactivate'), () => reactivate.mutate(cat.public_id))]),
                      deleteAction(t('delete'), () => setDeleteId(cat.public_id)),
                    ]} />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </RtlTable>
      )}

      <FormDialog
        open={dialogOpen}
        onOpenChange={(v) => { setDialogOpen(v); if (!v) onOpenCreateChange(false); }}
        title={editItem ? t('edit_category') : t('create_category')}
        onConfirm={submit}
        isPending={create.isPending || update.isPending}
        confirmLabel={editItem ? t('edit') : t('create')}
      >
        <div className="space-y-3">
          <BilingualNameFields form={form} setForm={setForm} t={t} />
          <Field>
            <FieldLabel>{t('display_order')}</FieldLabel>
            <Input type="number" placeholder={t('display_order_placeholder')} value={form.display_order} onChange={(e) => setForm({ ...form, display_order: e.target.value })} />
          </Field>
        </div>
      </FormDialog>

      <ConfirmDeleteDialog
        open={!!deleteId}
        onOpenChange={(v) => !v && setDeleteId(null)}
        title={t('delete_category_title')}
        description={t('delete_category_description')}
        onConfirm={() => { if (deleteId) deleteCategory.mutate(deleteId, { onSuccess: () => setDeleteId(null) }); }}
        confirmLabel={t('delete')}
        cancelLabel={t('cancel')}
      />
    </div>
  );
}
