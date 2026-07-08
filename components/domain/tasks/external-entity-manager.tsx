'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Field, FieldLabel } from '@/components/ui/field';
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ActiveBadge } from '@/components/shared/active-badge';
import { BilingualNameFields } from '@/components/shared/bilingual-name-fields';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { RtlTable } from '@/components/shared/rtl-table';
import {
  ActionsDropdown, FormDialog, CatalogSkeleton, editAction, deactivateAction, reactivateAction,
} from '@/components/shared/catalog-table';
import { useCapability } from '@/lib/api/hooks/use-capabilities';
import {
  useExternalEntities, useCreateExternalEntity, useUpdateExternalEntity,
  useDeactivateExternalEntity, useReactivateExternalEntity,
} from '@/lib/api/hooks/use-external-references';
import { ExternalEntityTypeSelect } from './external-entity-type-select';
import { asBool } from '@/components/domain/organization/organization-utils';
import { EXTERNAL_ENTITY_TYPE_MAP, useEntityTypeLabel } from './task-external-reference-utils';
import type { ExternalEntityResource } from './task-external-reference-types';

function EntityTypeCell({ value }: { value?: string }) {
  const label = useEntityTypeLabel(value);
  return <span className="text-sm">{label}</span>;
}

interface ExternalEntityManagerProps {
  openCreate?: boolean;
  onOpenCreateChange?: (open: boolean) => void;
}

export function ExternalEntityManager({ openCreate, onOpenCreateChange }: ExternalEntityManagerProps) {
  const t = useTranslations('tasks.entities');
  const { data, isLoading, isError, refetch } = useExternalEntities();
  const canManage = useCapability('task.manage_external_entities');
  const create = useCreateExternalEntity();
  const update = useUpdateExternalEntity();
  const deactivate = useDeactivateExternalEntity();
  const reactivate = useReactivateExternalEntity();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<ExternalEntityResource | null>(null);
  const [form, setForm] = useState({ name_ar: '', name_en: '', entity_type: 'governmentministry' });
  function openCreateDialog() {
    setEditItem(null);
    setForm({ name_ar: '', name_en: '', entity_type: 'governmentministry' });
    setDialogOpen(true);
  }

  useEffect(() => {
    if (openCreate) {
      setTimeout(() => openCreateDialog(), 0);
      onOpenCreateChange?.(false);
    }
  }, [openCreate, onOpenCreateChange]);

  function openEdit(entity: ExternalEntityResource) {
    setEditItem(entity);
    setForm({ name_ar: entity.name_ar, name_en: entity.name_en ?? '', entity_type: entity.entity_type });
    setDialogOpen(true);
  }

  function submit() {
    if (!form.name_ar.trim()) {
      toast.error(t('name_ar_required'));
      return;
    }

    const body = {
      name_ar: form.name_ar.trim(),
      name_en: form.name_en.trim() || undefined,
      entity_type: EXTERNAL_ENTITY_TYPE_MAP[form.entity_type],
    };
    if (editItem) {
      update.mutate({ entityPublicId: editItem.public_id, body }, { onSuccess: () => setDialogOpen(false) });
    } else {
      create.mutate(body, { onSuccess: () => setDialogOpen(false) });
    }
  }

  if (isLoading) return <CatalogSkeleton />;
  if (isError) return <ErrorState message={t('error')} onRetry={() => refetch()} />;

  const entities = data ?? [];

  return (
    <div className="space-y-4">
      {entities.length === 0 ? (
        <EmptyState title={t('empty_title')} description={t('empty_description')} />
      ) : (
        <RtlTable>
          <TableHeader>
            <TableRow>
              <TableHead className="w-50 text-start">{t('name_ar')}</TableHead>
              <TableHead className="w-50 text-start">{t('name_en')}</TableHead>
              <TableHead className="w-32 text-start">{t('entity_type')}</TableHead>
              <TableHead className="w-20 text-start">{t('status')}</TableHead>
              <TableHead className="w-12 text-end">{t('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entities.map((entity) => (
              <TableRow key={entity.public_id}>
                <TableCell className="text-start text-sm">{entity.name_ar}</TableCell>
                <TableCell className="text-start text-sm">{entity.name_en}</TableCell>
                <TableCell className="text-start text-sm"><EntityTypeCell value={entity.entity_type} /></TableCell>
                <TableCell className="text-start text-sm">
                  <ActiveBadge isActive={asBool(entity.is_active)} activeLabel={t('active')} inactiveLabel={t('inactive')} />
                </TableCell>
                <TableCell className="text-end">
                  {canManage && (
                    <ActionsDropdown actions={[
                      editAction(t('edit'), () => openEdit(entity)),
                      ...(asBool(entity.is_active)
                        ? [deactivateAction(t('deactivate'), () => deactivate.mutate(entity.public_id))]
                        : [reactivateAction(t('reactivate'), () => reactivate.mutate(entity.public_id))]),
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
        onOpenChange={setDialogOpen}
        title={editItem ? t('edit_entity') : t('create_entity')}
        onConfirm={submit}
        isPending={create.isPending || update.isPending}
        confirmLabel={editItem ? t('save') : t('create')}
      >
        <div className="space-y-3">
          <BilingualNameFields form={form} setForm={setForm} t={t} />
          <Field>
            <FieldLabel>{t('entity_type')} <span className="text-destructive">*</span></FieldLabel>
            <ExternalEntityTypeSelect value={form.entity_type} onValueChange={(v) => setForm({ ...form, entity_type: v })} />
          </Field>
        </div>
      </FormDialog>
    </div>
  );
}
