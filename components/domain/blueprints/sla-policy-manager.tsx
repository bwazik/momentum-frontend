'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Field, FieldLabel } from '@/components/ui/field';
import { useBlueprintSlaPolicies, useCreateSlaPolicy, useUpdateSlaPolicy, useDeleteSlaPolicy } from '@/lib/api/hooks/use-blueprints';
import { useCapability } from '@/lib/api/hooks/use-capabilities';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { ApiRequestError } from '@/lib/api/client';
import { RtlSelect } from '@/components/shared/rtl-select';
import { RtlTable } from '@/components/shared/rtl-table';
import { BilingualNameFields } from '@/components/shared/bilingual-name-fields';
import { ActionsDropdown, FormDialog, CatalogSkeleton, editAction, deleteAction } from '@/components/shared/catalog-table';
import { ConfirmDeleteDialog } from '@/components/shared/confirm-delete-dialog';
import { SLA_UNIT_MAP, normalizeSlaUnit } from '@/lib/utils/blueprint-utils';
import type { SlaPolicyResource } from './blueprint-types';

interface SlaPolicyManagerProps {
  openCreate: boolean;
  onOpenCreateChange: (open: boolean) => void;
}

export function SlaPolicyManager({ openCreate, onOpenCreateChange }: SlaPolicyManagerProps) {
  const t = useTranslations('blueprints.catalog');
  const { data, isLoading, isError, error, refetch } = useBlueprintSlaPolicies();
  const canManage = useCapability('blueprint.manage');
  const create = useCreateSlaPolicy();
  const update = useUpdateSlaPolicy();
  const del = useDeleteSlaPolicy();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<SlaPolicyResource | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ name_ar: '', name_en: '', sla_value: '1', sla_unit: 'hours', warning_threshold_percentage: '75' });
  function openCreateDialog() {
    setEditItem(null); setForm({ name_ar: '', name_en: '', sla_value: '1', sla_unit: 'hours', warning_threshold_percentage: '75' }); setDialogOpen(true);
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

  function openEdit(item: SlaPolicyResource) {
    setEditItem(item); setForm({ name_ar: item.name_ar, name_en: item.name_en ?? '', sla_value: item.sla_value, sla_unit: normalizeSlaUnit(item.sla_unit), warning_threshold_percentage: item.warning_threshold_percentage }); setDialogOpen(true);
  }

  function submit() {
    if (!form.name_ar) return;

    const body = {
      name_ar: form.name_ar,
      name_en: form.name_en || undefined,
      sla_value: Number(form.sla_value),
      sla_unit: SLA_UNIT_MAP[form.sla_unit],
      warning_threshold_percentage: Number(form.warning_threshold_percentage) || 75,
    };

    if (editItem) {
      update.mutate({ slaPolicyId: editItem.public_id, body }, { onSuccess: () => setDialogOpen(false) });
    } else {
      create.mutate(body, { onSuccess: () => setDialogOpen(false) });
    }
  }

  return (
    <div className="space-y-4">
      {items.length === 0 ? (
        <EmptyState title={t('empty_sla_policies')} />
      ) : (
        <RtlTable>
          <TableHeader>
            <TableRow>
              <TableHead className="w-50 text-start">{t('name_ar')}</TableHead>
              <TableHead className="w-50 text-start">{t('name_en')}</TableHead>
              <TableHead className="w-20 text-start">{t('sla_value')}</TableHead>
              <TableHead className="w-20 text-start">{t('sla_unit')}</TableHead>
              <TableHead className="w-20 text-start">{t('warning_threshold')}</TableHead>
              <TableHead className="w-12 text-end">{t('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.public_id}>
                <TableCell className="text-start text-sm">{item.name_ar}</TableCell>
                <TableCell className="text-start text-sm">{item.name_en}</TableCell>
                <TableCell className="text-start text-sm">{item.sla_value}</TableCell>
                <TableCell className="text-start text-sm">{['hours', '1'].includes(item.sla_unit) ? t('sla_unit_hours') : t('sla_unit_days')}</TableCell>
                <TableCell className="text-start text-sm">{item.warning_threshold_percentage}%</TableCell>
                <TableCell className="text-end">
                  {canManage && (
                    <ActionsDropdown actions={[
                      editAction(t('edit'), () => openEdit(item)),
                      deleteAction(t('delete'), () => setDeleteId(item.public_id)),
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
        title={editItem ? t('edit_sla_policy') : t('create_sla_policy')}
        onConfirm={submit}
        isPending={create.isPending || update.isPending}
        confirmLabel={editItem ? t('edit') : t('create')}
      >
        <div className="space-y-3">
          <BilingualNameFields form={form} setForm={setForm} t={t} />
          <Field>
            <FieldLabel>{t('sla_value')}</FieldLabel>
            <Input type="number" min={1} placeholder={t('sla_value_placeholder')} value={form.sla_value} onChange={(e) => setForm({ ...form, sla_value: e.target.value })} />
          </Field>
          <Field>
            <FieldLabel>{t('sla_unit')}</FieldLabel>
            <RtlSelect value={form.sla_unit} onValueChange={(v) => setForm({ ...form, sla_unit: v })}>
              <SelectTrigger><SelectValue placeholder={t('sla_unit_placeholder')} /></SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="hours">{t('sla_unit_hours')}</SelectItem>
                <SelectItem value="days">{t('sla_unit_days')}</SelectItem>
              </SelectContent>
            </RtlSelect>
          </Field>
          <Field>
            <FieldLabel>{t('warning_threshold')}</FieldLabel>
            <Input type="number" min={0} max={100} placeholder={t('warning_threshold_placeholder')} value={form.warning_threshold_percentage} onChange={(e) => setForm({ ...form, warning_threshold_percentage: e.target.value })} />
          </Field>
        </div>
      </FormDialog>

      <ConfirmDeleteDialog
        open={!!deleteId}
        onOpenChange={(v) => !v && setDeleteId(null)}
        title={t('delete_sla_policy_title')}
        description={t('delete_sla_policy_description')}
        confirmLabel={t('delete')}
        cancelLabel={t('cancel')}
        onConfirm={() => { if (deleteId) del.mutate(deleteId, { onSuccess: () => setDeleteId(null), onError: () => { /* 422 handled by toast */ } }); }}
      />
    </div>
  );
}
