'use client';

import { useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/shared/page-header';
import { useCapability } from '@/lib/api/hooks/use-capabilities';
import { ProfileSettingsCard } from './profile-settings-card';
import { AvailabilityCard } from './availability-card';
import { ActiveDelegationsPanel } from './active-delegations-panel';
import { DelegationFormDialog } from './delegation-form-dialog';

export function SettingsWorkspace() {
  const t = useTranslations('settings');
  const ft = useTranslations('settings.delegations.form');
  const locale = useLocale();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const viewDelegations = useCapability('iam.view_delegations');
  const manageUsers = useCapability('iam.manage_users');
  const canViewDelegations = viewDelegations || manageUsers;
  const [createDelegationOpen, setCreateDelegationOpen] = useState(false);

  const rawTab = searchParams.get('tab');
  const tab = rawTab === 'delegations' && canViewDelegations ? 'delegations' : 'profile';

  function setTab(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === 'profile') params.delete('tab');
    else params.set('tab', next);
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <PageHeader
        title={t('page_title')}
        description={t('page_description')}
        actions={
          manageUsers && tab === 'delegations' ? (
            <Button size="sm" onClick={() => setCreateDelegationOpen(true)}>
              <Plus className="size-4" /> {ft('create')}
            </Button>
          ) : undefined
        }
      />
      <Tabs value={tab} onValueChange={setTab} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
        <TabsList className={cn('w-full justify-start', locale === 'ar' && 'flex-row-reverse')}>
          <TabsTrigger value="profile">{t('tabs.profile')}</TabsTrigger>
          {canViewDelegations && (
            <TabsTrigger value="delegations">{t('tabs.delegations')}</TabsTrigger>
          )}
        </TabsList>
        <div dir={locale === 'ar' ? 'rtl' : 'ltr'}>
          <TabsContent value="profile" className="mt-0">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <ProfileSettingsCard />
              </div>
              <div>
                <AvailabilityCard />
              </div>
            </div>
          </TabsContent>
          {canViewDelegations && (
            <TabsContent value="delegations" className="mt-0">
              <ActiveDelegationsPanel />
            </TabsContent>
          )}
        </div>
      </Tabs>

      {manageUsers && (
        <DelegationFormDialog
          open={createDelegationOpen}
          onOpenChange={setCreateDelegationOpen}
        />
      )}
    </div>
  );
}
