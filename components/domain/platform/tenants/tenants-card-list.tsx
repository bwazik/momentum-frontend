'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ActiveBadge } from '@/components/shared/active-badge';
import { TenantRowActions } from './tenant-row-actions';
import { localizeName, type PlatformTenant } from '@/lib/utils/platform-utils';

export function TenantsCardList({ tenants, onEdit }: { tenants: PlatformTenant[]; onEdit: (tenant: PlatformTenant) => void }) {
  const t = useTranslations('platform.tenants'); const c = useTranslations('platform.common'); const locale = useLocale();
  return <div className="grid gap-3 md:hidden">{tenants.map((tenant) => <Card key={tenant.public_id}><CardHeader className="flex-row items-center justify-between"><CardTitle>{localizeName(locale, tenant.name_ar, tenant.name_en)}</CardTitle><TenantRowActions tenant={tenant} onEdit={onEdit} /></CardHeader><CardContent className="space-y-1 text-sm"><p dir="ltr">{tenant.slug}</p><p className="text-muted-foreground" dir="ltr">{tenant.domain ?? t('not_available')}</p><ActiveBadge isActive={tenant.is_active} activeLabel={c('active')} inactiveLabel={c('inactive')} /></CardContent></Card>)}</div>;
}
