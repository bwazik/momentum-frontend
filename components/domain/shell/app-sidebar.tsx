'use client';

import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { LayoutDashboard, ListTodo, FolderKanban, BarChart3, GitMerge, Building2, Shield, Zap, Plus, Mail, Settings2, UserCog } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar';
import { VersionSwitcher } from '@/components/version-switcher';
import { NavMain } from '@/components/domain/shell/nav-main';
import { NavUser } from '@/components/domain/shell/nav-user';
import { Button } from '@/components/ui/button';
import { useCurrentUser, useLogout } from '@/lib/api/hooks/use-auth';
import { useCapabilities, useCapability } from '@/lib/api/hooks/use-capabilities';
import { usePlatformAuth, usePlatformLogout } from '@/lib/api/hooks/use-platform';
import { Skeleton } from '@/components/ui/skeleton';
import { useBrandName } from '@/lib/api/hooks/use-brand-name';

type SidebarMode = 'tenant' | 'platform';

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  locale?: 'ar' | 'en';
  mode?: SidebarMode;
}

export function AppSidebar({ locale = 'ar', mode = 'tenant', ...props }: AppSidebarProps) {
  const pathname = usePathname();
  const tnav = useTranslations('nav');
  const tver = useTranslations('version');
  const pt = useTranslations('platform.workspace');
  const tenantAuth = useCurrentUser(mode === 'tenant');
  const platformAuth = usePlatformAuth(mode === 'platform');
  const tenantLogout = useLogout();
  const platformLogout = usePlatformLogout();
  const { data: tenantUser } = tenantAuth;
  const { data: platformUser } = platformAuth;
  const user = mode === 'platform' ? platformUser : tenantUser;
  const isLoading = mode === 'platform' ? platformAuth.isLoading : tenantAuth.isLoading;
  const canAdmin = useCapability('iam.manage_users', mode === 'tenant');
  const canManageBlueprints = useCapability('blueprint.manage', mode === 'tenant');
  const canManageEntities = useCapability('task.manage_external_entities', mode === 'tenant');
  const canManageGovernance = useCapability('iam.manage_capabilities', mode === 'tenant');
  const canViewAnalyticsOrg = useCapability('analytics.view.organization', mode === 'tenant');
  const canViewAnalyticsDept = useCapability('analytics.view.department', mode === 'tenant');
  const canViewFollowUpScope = useCapability('task.view.follow_up_scope', mode === 'tenant');
  const appName = useBrandName(mode === 'tenant');

  useCapabilities(tenantUser?.public_id, mode === 'tenant');

  const canViewAnalytics = canViewAnalyticsOrg || canViewAnalyticsDept || canViewFollowUpScope;
  const canViewDepartmentDashboard = canViewAnalyticsOrg || canViewAnalyticsDept;

  const tenantMainItems = [
    { title: tnav('dashboard'), url: '/', icon: LayoutDashboard },
    { title: tnav('tasks'), url: '/tasks', icon: ListTodo },
  ];

  const catalogItems = canManageBlueprints
    ? [{ title: tnav('blueprints'), url: '/blueprints', icon: FolderKanban, isActive: (p: string) => p === '/blueprints' || (p.startsWith('/blueprints/') && !p.startsWith('/blueprints/catalog')) }, { title: tnav('blueprint_catalog'), url: '/blueprints/catalog', icon: Settings2 }]
    : [{ title: tnav('blueprints'), url: '/blueprints', icon: FolderKanban, isActive: (p: string) => p === '/blueprints' || (p.startsWith('/blueprints/') && !p.startsWith('/blueprints/catalog')) }];

  const workflowItems = [
    { title: tnav('follow_up'), url: '/follow-up', icon: GitMerge },
    { title: tnav('organization'), url: '/organization', icon: Building2 },
  ];

  const platformItems = [
    { title: pt('title'), url: '/', icon: LayoutDashboard, isActive: () => true },
  ];
  const logout = mode === 'platform'
    ? { onLogout: () => platformLogout.mutate(), isPending: platformLogout.isPending }
    : { onLogout: () => tenantLogout.mutate(), isPending: tenantLogout.isPending };

  return (
    <Sidebar collapsible="offcanvas" side={locale === 'ar' ? 'right' : 'left'} {...props}>
      <SidebarHeader>
        <VersionSwitcher versions={['1.0.0-beta']} defaultVersion="1.0.0-beta" appName={mode === 'platform' ? 'Momentum' : appName} icon={Zap} locale={locale} versionLabel={tver('label')} />
      </SidebarHeader>
      <SidebarContent>
        {mode === 'tenant' ? (
          <>
            <SidebarMenu>
              <SidebarMenuItem className="flex items-center gap-2">
                <SidebarMenuButton asChild tooltip={tnav('quick_create')} className="min-w-8 bg-primary text-primary-foreground duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground">
                  <Link href="/tasks/new">
                    <Plus data-slot="sidebar-menu-button-icon" />
                    <span>{tnav('quick_create')}</span>
                  </Link>
                </SidebarMenuButton>
                <Button size="icon" className="size-8 group-data-[collapsible=icon]:opacity-0" variant="outline" asChild>
                  <Link href="#">
                    <Mail data-slot="icon" />
                    <span className="sr-only">{tnav('inbox')}</span>
                  </Link>
                </Button>
              </SidebarMenuItem>
            </SidebarMenu>

            <SidebarGroup>
              <SidebarGroupLabel>{tnav('label_main')}</SidebarGroupLabel>
              <SidebarGroupContent>
                <NavMain items={tenantMainItems} pathname={pathname} />
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        ) : (
          <SidebarGroup>
            <SidebarGroupLabel>{pt('title')}</SidebarGroupLabel>
            <SidebarGroupContent>
              <NavMain items={platformItems} pathname={pathname} />
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {mode === 'tenant' && canViewAnalytics && (
          <SidebarGroup>
            <SidebarGroupLabel>{tnav('analytics')}</SidebarGroupLabel>
            <SidebarGroupContent>
              <NavMain items={[
                ...(canViewDepartmentDashboard ? [{ title: tnav('department_dashboard'), url: '/analytics/department', icon: BarChart3 }] : []),
                { title: tnav('aging_report'), url: '/analytics/aging', icon: BarChart3 },
              ]} pathname={pathname} />
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {mode === 'tenant' && <SidebarGroup>
          <SidebarGroupLabel>{tnav('label_blueprints')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <NavMain items={catalogItems} pathname={pathname} />
          </SidebarGroupContent>
        </SidebarGroup>}

        {mode === 'tenant' && <SidebarGroup>
          <SidebarGroupLabel>{tnav('label_workflow')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <NavMain items={workflowItems} pathname={pathname} />
          </SidebarGroupContent>
        </SidebarGroup>}

        {mode === 'tenant' && (canAdmin || canManageEntities || canManageGovernance) && (
          <SidebarGroup>
            <SidebarGroupLabel>{tnav('label_admin')}</SidebarGroupLabel>
            <SidebarGroupContent>
              <NavMain items={[
                ...(canAdmin ? [{ title: tnav('admin'), url: '/admin', icon: UserCog, isActive: (p: string) => p === '/admin' || (p.startsWith('/admin/') && !p.startsWith('/admin/external-entities') && !p.startsWith('/admin/confidential-governance')) }] : []),
                ...(canManageEntities ? [{ title: tnav('external_entities'), url: '/admin/external-entities', icon: Building2 }] : []),
                ...(canManageGovernance ? [{ title: tnav('governance_participants'), url: '/admin/confidential-governance', icon: Shield }] : []),
              ]} pathname={pathname} />
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter>
        {isLoading || !user ? (
          <div className="flex items-center gap-3 p-2">
            <Skeleton className="size-8 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-2 w-16" />
            </div>
          </div>
        ) : (
          <NavUser
            user={user}
            locale={locale}
            logout={logout}
            settingsHref={mode === 'platform' ? null : '/settings'}
            showLocalizationContext
            localizationContextMode={mode}
          />
        )}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
