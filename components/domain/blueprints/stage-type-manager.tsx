'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useBlueprintStageTypes, useCreateStageType, useUpdateStageType, useDeleteStageType } from '@/lib/api/hooks/use-blueprints';
import { useCapability } from '@/lib/api/hooks/use-capabilities';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { ApiRequestError } from '@/lib/api/client';
import { RtlTable } from '@/components/shared/rtl-table';
import { BilingualNameFields } from '@/components/shared/bilingual-name-fields';
import { ActionsDropdown, FormDialog, CatalogSkeleton, editAction, deleteAction } from '@/components/shared/catalog-table';
import { ConfirmDeleteDialog } from '@/components/shared/confirm-delete-dialog';
import type { StageTypeResource } from './blueprint-types';

interface StageTypeManagerProps {
  openCreate: boolean;
  onOpenCreateChange: (open: boolean) => void;
}

export function StageTypeManager({ openCreate, onOpenCreateChange }: StageTypeManagerProps) {
  const t = useTranslations('blueprints.catalog');
  const { data, isLoading, isError, error, refetch } = useBlueprintStageTypes();
  const canManage = useCapability('blueprint.manage');
  const create = useCreateStageType();
  const update = useUpdateStageType();
  const del = useDeleteStageType();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<StageTypeResource | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ name_ar: '', name_en: '', display_order: '0' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function openCreateDialog() {
    setEditItem(null); setForm({ name_ar: '', name_en: '', display_order: '0' }); setErrors({}); setDialogOpen(true);
  }

  useEffect(() => { if (openCreate) setTimeout(() => openCreateDialog(), 0); }, [openCreate]);

  if (isLoading) return <CatalogSkeleton />;
  if (isError) {
    if (error instanceof ApiRequestError && error.status === 403) {
      return <EmptyState title={t('no_permission_title')} description={t('no_permission_description')} />;
    }
    return <ErrorState message={t('error')} onRetry={() => refetch()} />;
  }

  const items = data ?? [];

  function openEdit(item: StageTypeResource) {
    setEditItem(item); setForm({ name_ar: item.name_ar, name_en: item.name_en ?? '', display_order: item.display_order ?? '0' }); setErrors({}); setDialogOpen(true);
  }

  function submit() {
    const newErrors: Record<string, string> = {};
    if (!form.name_ar && !editItem?.is_system_default) newErrors.name_ar = t('name_ar_required');
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const body = { name_ar: form.name_ar, name_en: form.name_en || undefined, display_order: Number(form.display_order) || 0 };

    if (editItem) {
      update.mutate({ stageTypeId: editItem.public_id, body }, { onSuccess: () => setDialogOpen(false) });
    } else {
      create.mutate(body, { onSuccess: () => setDialogOpen(false) });
    }
  }

  return (
    <div className="space-y-4">
      {items.length === 0 ? (
        <EmptyState title={t('empty_stage_types')} />
      ) : (
        <RtlTable>
          <TableHeader>
            <TableRow>
              <TableHead className="w-50 text-start">{t('name_ar')}</TableHead>
              <TableHead className="w-50 text-start">{t('name_en')}</TableHead>
              <TableHead className="w-20 text-start">{t('display_order')}</TableHead>
              <TableHead className="w-24 text-start">{t('source')}</TableHead>
              <TableHead className="w-12 text-end">{t('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.public_id}>
                <TableCell className="text-start text-sm">{item.name_ar}</TableCell>
                <TableCell className="text-start text-sm">{item.name_en}</TableCell>
                <TableCell className="text-start text-sm">{item.display_order}</TableCell>
                <TableCell className="text-start">
                  <Badge variant={item.is_system_default ? 'secondary' : 'outline'} className="text-xs">
                    {item.is_system_default ? t('source_system') : t('source_custom')}
                  </Badge>
                </TableCell>
                <TableCell className="text-end">
                  {canManage && (
                    <ActionsDropdown actions={[
                      editAction(t('edit'), () => openEdit(item)),
                      deleteAction(t('delete'), () => setDeleteId(item.public_id), !!item.is_system_default),
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
        title={editItem ? t('edit_stage_type') : t('create_stage_type')}
        onConfirm={submit}
        isPending={create.isPending || update.isPending}
        confirmLabel={editItem ? t('edit') : t('create')}
      >
        <div className="space-y-3">
          {editItem?.is_system_default && <p className="text-xs text-muted-foreground">{t('system_default_readonly')}</p>}
          <BilingualNameFields form={form} setForm={setForm} errors={errors} t={t} readOnly={!!editItem?.is_system_default} arRequired={!editItem?.is_system_default} />
          <Field>
            <FieldLabel>{t('display_order')}</FieldLabel>
            <Input type="number" placeholder={t('display_order_placeholder')} value={form.display_order} onChange={(e) => setForm({ ...form, display_order: e.target.value })} />
          </Field>
        </div>
      </FormDialog>

      <ConfirmDeleteDialog
        open={!!deleteId}
        onOpenChange={(v) => !v && setDeleteId(null)}
        title={t('delete_stage_type_title')}
        description={t('delete_stage_type_description')}
        confirmLabel={t('delete')}
        cancelLabel={t('cancel')}
        onConfirm={() => { if (deleteId) del.mutate(deleteId, { onSuccess: () => setDeleteId(null) }); }}
      />
    </div>
  );
}
