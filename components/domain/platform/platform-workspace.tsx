'use client';

import { useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
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

const TAB_VALUES = ['tenants', 'admins', 'impersonation', 'audit'] as const;
type TabValue = (typeof TAB_VALUES)[number];

export function PlatformWorkspace() {
  const t = useTranslations('platform');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [tenantDialog, setTenantDialog] = useState(false);
  const [adminDialog, setAdminDialog] = useState(false);

  const rawTab = searchParams.get('tab');
  const activeTab: TabValue = (rawTab && TAB_VALUES.includes(rawTab as TabValue))
    ? (rawTab as TabValue)
    : 'tenants';

  function setTab(next: TabValue) {
    if (next === activeTab) return;
    const params = new URLSearchParams(searchParams.toString());
    if (next === 'tenants') {
      params.delete('tab');
    } else {
      params.set('tab', next);
    }
    ['search', 'isActive', 'action', 'entity_type', 'from', 'to'].forEach((key) => params.delete(key));
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }

  const pageAction = (() => {
    switch (activeTab) {
      case 'tenants':
        return (
          <Button size="sm" onClick={() => setTenantDialog(true)}>
            <Plus className="size-4" /> {t('workspace.create_tenant')}
          </Button>
        );
      case 'admins':
        return (
          <Button size="sm" onClick={() => setAdminDialog(true)}>
            <Plus className="size-4" /> {t('workspace.create_admin')}
          </Button>
        );
      default:
        return undefined;
    }
  })();

  return (
    <div className="flex flex-col gap-4 p-6">
      <PageHeader
        title={t('workspace.title')}
        description={t('workspace.description')}
        actions={pageAction}
      />
      <Tabs value={activeTab} onValueChange={(v) => setTab(v as TabValue)}>
        <TabsList className="w-full justify-start">
          <TabsTrigger value="tenants">{t('workspace.tabs.tenants')}</TabsTrigger>
          <TabsTrigger value="admins">{t('workspace.tabs.admins')}</TabsTrigger>
          <TabsTrigger value="impersonation">{t('workspace.tabs.impersonation')}</TabsTrigger>
          <TabsTrigger value="audit">{t('workspace.tabs.audit')}</TabsTrigger>
        </TabsList>
        <div>
          <TabsContent value="tenants" className="mt-0">
            <TenantsTabPanel onCreateTenant={() => setTenantDialog(true)} />
          </TabsContent>
          <TabsContent value="admins" className="mt-0">
            <AdminsTabPanel onCreateAdmin={() => setAdminDialog(true)} />
          </TabsContent>
          <TabsContent value="impersonation" className="mt-0">
            <ImpersonationTabPanel />
          </TabsContent>
          <TabsContent value="audit" className="mt-0">
            <AuditTabPanel />
          </TabsContent>
        </div>
      </Tabs>

      <ProvisionTenantDialog open={tenantDialog} onOpenChange={setTenantDialog} />
      <AdminFormDialog
        key={adminDialog ? 'create-admin' : 'closed'}
        open={adminDialog}
        onOpenChange={setAdminDialog}
      />
    </div>
  );
}
