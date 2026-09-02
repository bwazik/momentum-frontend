'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ExternalLink, Pencil } from 'lucide-react';
import { ActionsDropdown } from '@/components/shared/catalog-table';
import type { PlatformTenant } from '@/lib/utils/platform-utils';

interface TenantRowActionsProps {
  tenant: PlatformTenant;
  onEdit: (tenant: PlatformTenant) => void;
}

export function TenantRowActions({ tenant, onEdit }: TenantRowActionsProps) {
  const t = useTranslations('platform.tenants');
  const router = useRouter();

  const actions = useMemo(() => [
    {
      label: t('open'),
      onClick: () => router.push(`/tenants/${tenant.public_id}`),
      icon: <ExternalLink className="size-4" />,
    },
    {
      label: t('edit_title'),
      onClick: () => onEdit(tenant),
      icon: <Pencil className="size-4" />,
    },
  ], [router, tenant, onEdit, t]);

  return <ActionsDropdown actions={actions} translationsNamespace="platform.common" />;
}
