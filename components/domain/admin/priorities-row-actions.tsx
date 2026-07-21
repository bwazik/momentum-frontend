'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Ban, CheckCircle } from 'lucide-react';
import { ActionsDropdown, editAction } from '@/components/shared/catalog-table';
import { ConfirmDeleteDialog } from '@/components/shared/confirm-delete-dialog';
import { useDeactivateTaskPriority, useReactivateTaskPriority } from '@/lib/api/hooks/use-task-priorities';
import { PriorityFormDialog } from './priority-form-dialog';
import type { components } from '@/lib/generated/api-types';

type TaskPriorityResource = components['schemas']['TaskPriorityResource'];

interface PrioritiesRowActionsProps {
  priority: TaskPriorityResource;
}

export function PrioritiesRowActions({ priority }: PrioritiesRowActionsProps) {
  const t = useTranslations('admin.priorities');
  const [editOpen, setEditOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [reactivateOpen, setReactivateOpen] = useState(false);

  const deactivate = useDeactivateTaskPriority(priority.public_id);
  const reactivate = useReactivateTaskPriority(priority.public_id);

  const isActive = String(priority.is_active) !== 'false';

  const actions = useMemo(() => {
    const items = [editAction(t('edit'), () => setEditOpen(true))];
    if (isActive) {
      items.push({ label: t('deactivate'), onClick: () => setDeactivateOpen(true), icon: <Ban className="size-4" />, className: 'text-destructive' });
    } else {
      items.push({ label: t('reactivate'), onClick: () => setReactivateOpen(true), icon: <CheckCircle className="size-4" /> });
    }
    return items;
  }, [t, isActive]);

  return (
    <>
      <ActionsDropdown actions={actions} translationsNamespace="admin.priorities" />

      <PriorityFormDialog
        priority={priority}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      <ConfirmDeleteDialog
        open={deactivateOpen}
        onOpenChange={setDeactivateOpen}
        title={t('deactivate_confirm_title')}
        description={t('deactivate_confirm_desc', { name: priority.name_ar })}
        confirmLabel={t('deactivate')}
        onConfirm={() => { deactivate.mutate(); setDeactivateOpen(false); }}
        isPending={deactivate.isPending}
      />

      <ConfirmDeleteDialog
        open={reactivateOpen}
        onOpenChange={setReactivateOpen}
        title={t('reactivate_confirm_title')}
        description={t('reactivate_confirm_desc', { name: priority.name_ar })}
        confirmLabel={t('reactivate')}
        onConfirm={() => { reactivate.mutate(); setReactivateOpen(false); }}
        isPending={reactivate.isPending}
      />
    </>
  );
}
