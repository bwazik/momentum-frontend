'use client';

import { MoreHorizontal, Pencil, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { PlatformTenant } from '@/lib/utils/platform-utils';

export function TenantRowActions({ tenant, onEdit }: { tenant: PlatformTenant; onEdit: (tenant: PlatformTenant) => void }) {
  const t = useTranslations('platform.tenants'); const locale = useLocale(); const router = useRouter();
  return <DropdownMenu dir={locale === 'ar' ? 'rtl' : 'ltr'}><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label={t('actions')}><MoreHorizontal /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => router.push(`/tenants/${tenant.public_id}`)}><ExternalLink />{t('open')}</DropdownMenuItem><DropdownMenuItem onClick={() => onEdit(tenant)}><Pencil />{t('edit_title')}</DropdownMenuItem></DropdownMenuContent></DropdownMenu>;
}
