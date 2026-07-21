'use client';

import { useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { TableCell, TableRow } from '@/components/ui/table';
import { ActiveBadge } from '@/components/shared/active-badge';
import { useCapability } from '@/lib/api/hooks/use-capabilities';
import { localizeName } from '@/lib/utils/localize';
import { formatAdminAccountType, formatPreferredLanguage } from '@/lib/utils/admin-utils';
import { UsersRowActions } from './users-row-actions';
import type { components } from '@/lib/generated/api-types';

type UserResource = components['schemas']['UserResource'];

interface UsersTableRowProps {
  user: UserResource;
  onSelect: (publicId: string) => void;
}

export function UsersTableRow({ user, onSelect }: UsersTableRowProps) {
  const locale = useLocale();
  const t = useTranslations('admin.users');
  const canManage = useCapability('iam.manage_users');
  const name = localizeName(locale, user.name_ar, user.name_en);
  const deptName = user.current_position?.position?.department
    ? localizeName(locale, user.current_position.position.department.name_ar, '')
    : '';

  const handleSelect = useCallback(() => onSelect(user.public_id), [onSelect, user.public_id]);

  return (
    <TableRow
      className="cursor-pointer"
      onClick={handleSelect}
      data-testid="users-table-row"
    >
      <TableCell className="font-medium">{name}</TableCell>
      <TableCell>{user.employee_id ?? '-'}</TableCell>
      <TableCell className="text-muted-foreground">{user.email}</TableCell>
      <TableCell>{t(`account_type_${formatAdminAccountType(user.account_type)}`)}</TableCell>
      <TableCell>{deptName || '-'}</TableCell>
      <TableCell>{formatPreferredLanguage(locale, user.preferred_language)}</TableCell>
      <TableCell>
        <ActiveBadge
          isActive={user.is_active}
          activeLabel={t('active')}
          inactiveLabel={t('inactive')}
        />
      </TableCell>
      {canManage && (
        <TableCell className="text-end" onClick={(e) => e.stopPropagation()}>
          <UsersRowActions user={user} />
        </TableCell>
      )}
    </TableRow>
  );
}
