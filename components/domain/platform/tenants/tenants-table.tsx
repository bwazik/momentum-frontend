'use client';

import { useLocale, useTranslations } from 'next-intl';
import { RtlTable } from '@/components/shared/rtl-table';
import { ActiveBadge } from '@/components/shared/active-badge';
import { DualDateDisplay } from '@/components/shared/dual-date-display';
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TenantRowActions } from './tenant-row-actions';
import { localizeName, type PlatformTenant } from '@/lib/utils/platform-utils';

interface TenantsTableProps {
  tenants: PlatformTenant[];
  onEdit: (tenant: PlatformTenant) => void;
}

export function TenantsTable({ tenants, onEdit }: TenantsTableProps) {
  const t = useTranslations('platform.tenants');
  const c = useTranslations('platform.common');
  const locale = useLocale();

  return (
    <RtlTable aria-label={t('table_aria_label')}>
      <TableHeader>
        <TableRow>
          <TableHead className="text-start">{t('name')}</TableHead>
          <TableHead className="text-start">{t('slug')}</TableHead>
          <TableHead className="text-start">{t('domain')}</TableHead>
          <TableHead className="text-start">{t('timezone')}</TableHead>
          <TableHead className="text-start">{t('status')}</TableHead>
          <TableHead className="text-start">{t('created_at')}</TableHead>
          <TableHead className="w-12 text-end" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {tenants.map((tenant) => (
          <TableRow key={tenant.public_id}>
            <TableCell className="font-medium">
              {localizeName(locale, tenant.name_ar, tenant.name_en)}
            </TableCell>
            <TableCell className="font-mono text-sm">
              {tenant.slug}
            </TableCell>
            <TableCell className="font-mono text-sm">
              {tenant.domain ?? '-'}
            </TableCell>
            <TableCell>
              {tenant.timezone ?? '-'}
            </TableCell>
            <TableCell>
              <ActiveBadge
                isActive={tenant.is_active}
                activeLabel={c('active')}
                inactiveLabel={c('inactive')}
              />
            </TableCell>
            <TableCell>
              <DualDateDisplay gregorian={tenant.created_at} />
            </TableCell>
            <TableCell className="text-end">
              <TenantRowActions tenant={tenant} onEdit={onEdit} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </RtlTable>
  );
}
