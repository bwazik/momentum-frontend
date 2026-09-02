'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Pencil, Ban, RotateCcw } from 'lucide-react';
import { ActionsDropdown, type ActionsDropdownAction } from '@/components/shared/catalog-table';
import type { PlatformAdmin } from '@/lib/utils/platform-utils';

interface AdminRowActionsProps {
  admin: PlatformAdmin;
  currentAdminId?: string;
  onEdit: () => void;
  onDeactivate: () => void;
  onReactivate: () => void;
}

export function AdminRowActions({
  admin,
  currentAdminId,
  onEdit,
  onDeactivate,
  onReactivate,
}: AdminRowActionsProps) {
  const t = useTranslations('platform');

  const actions = useMemo(() => {
    const list: ActionsDropdownAction[] = [
      {
        label: t('common.edit'),
        onClick: onEdit,
        icon: <Pencil className="size-4" />,
      },
    ];

    if (currentAdminId !== admin.public_id) {
      if (admin.is_active) {
        list.push({
          label: t('common.suspend'),
          onClick: onDeactivate,
          icon: <Ban className="size-4" />,
          className: 'text-destructive',
        });
      } else {
        list.push({
          label: t('common.reactivate'),
          onClick: onReactivate,
          icon: <RotateCcw className="size-4" />,
        });
      }
    }

    return list;
  }, [admin, currentAdminId, onEdit, onDeactivate, onReactivate, t]);

  return <ActionsDropdown actions={actions} translationsNamespace="platform.common" />;
}
