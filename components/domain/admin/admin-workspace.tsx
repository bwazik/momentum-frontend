'use client';

import { useMemo, useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PageHeader } from '@/components/shared/page-header';
import { useCapability } from '@/lib/api/hooks/use-capabilities';
import { UsersTabPanel } from './users-tab-panel';
import { AccessTabPanel } from './access-tab-panel';
import { PrioritiesTabPanel } from './priorities-tab-panel';
import { AuditTabPanel } from './audit-tab-panel';
import { UserFormDialog } from './user-form-dialog';
import { PriorityFormDialog } from './priority-form-dialog';

const TAB_VALUES = ['users', 'access', 'priorities', 'audit'] as const;
type TabValue = (typeof TAB_VALUES)[number];

interface AdminWorkspaceProps {
  title: string;
  description: string;
}

export function AdminWorkspace({ title, description }: AdminWorkspaceProps) {
  const t = useTranslations('admin');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const canManageUsers = useCapability('iam.manage_users');
  const canManageCapabilities = useCapability('iam.manage_capabilities');
  const canManagePriorities = useCapability('task.manage_priorities');
  const canViewAudit = useCapability('audit.view_system');

  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [createPriorityOpen, setCreatePriorityOpen] = useState(false);

  const tabAllowed = useMemo<Record<TabValue, boolean>>(() => ({
    users: canManageUsers || canViewAudit,
    access: canManageUsers || canManageCapabilities,
    priorities: canManagePriorities,
    audit: canViewAudit,
  }), [canManageUsers, canManageCapabilities, canManagePriorities, canViewAudit]);

  const allowedTabs = useMemo(() => TAB_VALUES.filter((v) => tabAllowed[v]), [tabAllowed]);

  const rawTab = searchParams.get('tab');
  const activeTab: TabValue = (rawTab && TAB_VALUES.includes(rawTab as TabValue) && tabAllowed[rawTab as TabValue])
    ? (rawTab as TabValue)
    : (allowedTabs[0] ?? 'users');

  function setTab(next: TabValue) {
    if (next === activeTab) return;
    const params = new URLSearchParams(searchParams.toString());
    if (next === 'users') params.delete('tab');
    else params.set('tab', next);
    ['userPublicId', 'selectedPositionId', 'eventType', 'entityType', 'dateFrom', 'dateTo'].forEach((k) => params.delete(k));
    router.replace(`${pathname}?${params.toString()}`);
  }

  const pageAction = (() => {
    switch (activeTab) {
      case 'users':
        return canManageUsers ? (
          <Button size="sm" onClick={() => setCreateUserOpen(true)}>
            <Plus className="size-4" /> {t('users.create_user')}
          </Button>
        ) : undefined;
      case 'priorities':
        return canManagePriorities ? (
          <Button size="sm" onClick={() => setCreatePriorityOpen(true)}>
            <Plus className="size-4" /> {t('priorities.create_priority')}
          </Button>
        ) : undefined;
      default:
        return undefined;
    }
  })();

  return (
    <div className="flex flex-col gap-4 p-6">
      <PageHeader
        title={title}
        description={description}
        actions={pageAction}
      />
      <Tabs value={activeTab} onValueChange={(v) => setTab(v as TabValue)}>
        <TabsList className={cn('w-full justify-start', locale === 'ar' && 'flex-row-reverse')}>
          {tabAllowed.users && <TabsTrigger value="users">{t('tabs.users')}</TabsTrigger>}
          {tabAllowed.access && <TabsTrigger value="access">{t('tabs.access')}</TabsTrigger>}
          {tabAllowed.priorities && <TabsTrigger value="priorities">{t('tabs.priorities')}</TabsTrigger>}
          {tabAllowed.audit && <TabsTrigger value="audit">{t('tabs.audit')}</TabsTrigger>}
        </TabsList>
        <div dir={locale === 'ar' ? 'rtl' : 'ltr'}>
          {tabAllowed.users && <TabsContent value="users" className="mt-0"><UsersTabPanel onCreateUser={() => setCreateUserOpen(true)} /></TabsContent>}
          {tabAllowed.access && <TabsContent value="access" className="mt-0"><AccessTabPanel /></TabsContent>}
          {tabAllowed.priorities && <TabsContent value="priorities" className="mt-0"><PrioritiesTabPanel onCreatePriority={() => setCreatePriorityOpen(true)} /></TabsContent>}
          {tabAllowed.audit && <TabsContent value="audit" className="mt-0"><AuditTabPanel /></TabsContent>}
        </div>
      </Tabs>

      {canManageUsers && (
        <UserFormDialog open={createUserOpen} onOpenChange={setCreateUserOpen} />
      )}
      {canManagePriorities && (
        <PriorityFormDialog open={createPriorityOpen} onOpenChange={setCreatePriorityOpen} />
      )}
    </div>
  );
}
