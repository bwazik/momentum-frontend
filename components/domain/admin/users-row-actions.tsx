'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { ActionsDropdown, editAction, reactivateAction } from '@/components/shared/catalog-table';
import { Ban } from 'lucide-react';
import { useCapability } from '@/lib/api/hooks/use-capabilities';
import { UserFormDialog } from './user-form-dialog';
import { ConfirmDeleteDialog } from '@/components/shared/confirm-delete-dialog';
import { useDeactivateUser, useReactivateUser } from '@/lib/api/hooks/use-admin-users';
import type { components } from '@/lib/generated/api-types';

type UserResource = components['schemas']['UserResource'];

interface UsersRowActionsProps {
  user: UserResource;
}

export function UsersRowActions({ user }: UsersRowActionsProps) {
  const t = useTranslations('admin.users');
  const canManage = useCapability('iam.manage_users');
  const [editOpen, setEditOpen] = useState(false);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [reactivateOpen, setReactivateOpen] = useState(false);

  const deactivate = useDeactivateUser(user.public_id);
  const reactivate = useReactivateUser(user.public_id);

  if (!canManage) return null;

  const isActive = String(user.is_active) !== 'false';

  const actions = useMemo(() => {
    const items = [editAction(t('edit'), () => setEditOpen(true))];
    if (isActive) {
      items.push({ label: t('deactivate'), onClick: () => setDeactivateOpen(true), icon: <Ban className="size-4" />, className: 'text-destructive' });
    } else {
      items.push(reactivateAction(t('reactivate'), () => setReactivateOpen(true)));
    }
    return items;
  }, [t, isActive]);

  return (
    <>
      <ActionsDropdown actions={actions} translationsNamespace="admin.users" />

      <UserFormDialog
        user={user as unknown as components['schemas']['UserDetailResource']}
        open={editOpen}
        onOpenChange={setEditOpen}
      />

      <ConfirmDeleteDialog
        open={deactivateOpen}
        onOpenChange={setDeactivateOpen}
        title={t('deactivate_confirm_title')}
        description={t('deactivate_confirm_desc', { name: user.name_ar })}
        confirmLabel={t('deactivate')}
        onConfirm={() => { deactivate.mutate(); setDeactivateOpen(false); }}
        isPending={deactivate.isPending}
      />

      <ConfirmDeleteDialog
        open={reactivateOpen}
        onOpenChange={setReactivateOpen}
        title={t('reactivate_confirm_title')}
        description={t('reactivate_confirm_desc', { name: user.name_ar })}
        confirmLabel={t('reactivate')}
        onConfirm={() => { reactivate.mutate(); setReactivateOpen(false); }}
        isPending={reactivate.isPending}
      />
    </>
  );
}
