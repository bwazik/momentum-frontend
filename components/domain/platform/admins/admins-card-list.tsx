'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ActiveBadge } from '@/components/shared/active-badge';
import { AdminRowActions } from './admin-row-actions';
import { localizeName, type PlatformAdmin } from '@/lib/utils/platform-utils';
import { formatAdminAccountType } from '@/lib/utils/admin-utils';

export function AdminsCardList({ admins, currentAdminId, onEdit, onDeactivate, onReactivate }: { admins: PlatformAdmin[]; currentAdminId?: string; onEdit: (admin: PlatformAdmin) => void; onDeactivate: (admin: PlatformAdmin) => void; onReactivate: (admin: PlatformAdmin) => void }) {
  const t = useTranslations('platform');
  const locale = useLocale();
  return (
    <div className="grid gap-3 md:hidden">
      {admins.map((admin) => {
        const typeKey = formatAdminAccountType(admin.account_type);
        return (
          <Card key={admin.public_id}>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>{localizeName(locale, admin.name_ar, admin.name_en)}</CardTitle>
              <AdminRowActions admin={admin} currentAdminId={currentAdminId} onEdit={() => onEdit(admin)} onDeactivate={() => onDeactivate(admin)} onReactivate={() => onReactivate(admin)} />
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p dir="ltr">{admin.email}</p>
              {typeKey && (
                <p className="text-muted-foreground">
                  {t('admins.account_type')}: <span className="text-foreground">{t(`admins.account_type_${typeKey}`)}</span>
                </p>
              )}
              <ActiveBadge isActive={admin.is_active} activeLabel={t('common.active')} inactiveLabel={t('common.inactive')} />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

