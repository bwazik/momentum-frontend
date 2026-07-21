'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { ActiveBadge } from '@/components/shared/active-badge';
import { localizeName } from '@/lib/utils/localize';
import { formatAdminAccountType } from '@/lib/utils/admin-utils';
import { UsersRowActions } from './users-row-actions';
import type { components } from '@/lib/generated/api-types';

type UserResource = components['schemas']['UserResource'];

interface UsersMobileCardProps {
  user: UserResource;
  onSelect: (publicId: string) => void;
}

export function UsersMobileCard({ user, onSelect }: UsersMobileCardProps) {
  const locale = useLocale();
  const t = useTranslations('admin.users');
  const name = localizeName(locale, user.name_ar, user.name_en);

  return (
    <Card>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-medium cursor-pointer" onClick={() => onSelect(user.public_id)}>{name}</span>
          <div className="flex items-center gap-2">
            <ActiveBadge
              isActive={user.is_active}
              activeLabel={t('active')}
              inactiveLabel={t('inactive')}
            />
            <UsersRowActions user={user} />
          </div>
        </div>
        <div className="text-sm text-muted-foreground space-y-1">
          <p>{user.email}</p>
          {user.employee_id && <p>{t('employee_id')}: {user.employee_id}</p>}
          <p>{t(`account_type_${formatAdminAccountType(user.account_type)}`)}</p>
        </div>
      </CardContent>
    </Card>
  );
}
