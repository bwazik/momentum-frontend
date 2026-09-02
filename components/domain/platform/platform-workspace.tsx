'use client';

import { useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/shared/page-header';
import { TenantsTabPanel } from './tenants/tenants-tab-panel';
import { AdminsTabPanel } from './admins/admins-tab-panel';
import { ImpersonationTabPanel } from './impersonation/impersonation-tab-panel';
import { AuditTabPanel } from './audit/audit-tab-panel';
import { ProvisionTenantDialog } from './tenants/provision-tenant-dialog';
import { AdminFormDialog } from './admins/admin-form-dialog';

const tabs = ['tenants', 'admins', 'impersonation', 'audit'] as const;
type Tab = (typeof tabs)[number];

function resolveTab(value: string | null): Tab {
  return value && tabs.includes(value as Tab) ? value as Tab : 'tenants';
}

export function PlatformWorkspace() {
  const t = useTranslations('platform');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [tenantDialog, setTenantDialog] = useState(false);
  const [adminDialog, setAdminDialog] = useState(false);
  const routeTab = useMemo(() => resolveTab(searchParams.get('tab')), [searchParams]);
  const active = routeTab;

  function setTab(value: string) {
    const nextTab = resolveTab(value);
    const params = new URLSearchParams(searchParams.toString());
    if (nextTab === 'tenants') params.delete('tab'); else params.set('tab', nextTab);
    ['search', 'isActive', 'action', 'entity_type', 'from', 'to'].forEach((key) => params.delete(key));
    const platformPathname = pathname === '/platform' ? '/' : pathname;
    router.replace(`${platformPathname}${params.size ? `?${params}` : ''}`);
  }

  const action = active === 'tenants' ? <Button size="sm" onClick={() => setTenantDialog(true)}><Plus />{t('workspace.create_tenant')}</Button> : active === 'admins' ? <Button size="sm" onClick={() => setAdminDialog(true)}><Plus />{t('workspace.create_admin')}</Button> : undefined;
  return <div className="flex flex-col gap-4 p-6"><PageHeader title={t('workspace.title')} description={t('workspace.description')} actions={action} /><Tabs value={active} onValueChange={setTab}><TabsList className={cn('w-full justify-start', locale === 'ar' && 'flex-row-reverse')}><TabsTrigger value="tenants">{t('workspace.tabs.tenants')}</TabsTrigger><TabsTrigger value="admins">{t('workspace.tabs.admins')}</TabsTrigger><TabsTrigger value="impersonation">{t('workspace.tabs.impersonation')}</TabsTrigger><TabsTrigger value="audit">{t('workspace.tabs.audit')}</TabsTrigger></TabsList><div dir={locale === 'ar' ? 'rtl' : 'ltr'}><TabsContent className="mt-0" value="tenants"><TenantsTabPanel /></TabsContent><TabsContent className="mt-0" value="admins"><AdminsTabPanel /></TabsContent><TabsContent className="mt-0" value="impersonation"><ImpersonationTabPanel /></TabsContent><TabsContent className="mt-0" value="audit"><AuditTabPanel /></TabsContent></div></Tabs><ProvisionTenantDialog open={tenantDialog} onOpenChange={setTenantDialog} /><AdminFormDialog key={adminDialog ? 'create-admin' : 'closed'} open={adminDialog} onOpenChange={setAdminDialog} /></div>;
}
