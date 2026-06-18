'use client';

import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import {
  LayoutDashboard,
  ListTodo,
  FolderKanban,
  BarChart3,
  GitMerge,
  Building2,
  Shield,
  Zap,
  Plus,
  Mail,
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { NavMain } from '@/components/domain/shell/nav-main';
import { NavUser } from '@/components/domain/shell/nav-user';
import { Button } from '@/components/ui/button';
import { useCurrentUser } from '@/lib/api/hooks/use-auth';
import { useCapabilities, useCapability } from '@/lib/api/hooks/use-capabilities';
import { Skeleton } from '@/components/ui/skeleton';
import { useBrandName } from '@/lib/utils/use-brand-name';

export function AppSidebar({ locale = 'ar', ...props }: React.ComponentProps<typeof Sidebar> & { locale?: 'ar' | 'en' }) {
  const pathname = usePathname();
  const tnav = useTranslations('nav');
  const { data: user, isLoading } = useCurrentUser();
  const canAdmin = useCapability('iam.manage_users');
  const appName = useBrandName();

  useCapabilities(user?.public_id);

  const navItems = [
    { title: tnav('dashboard'), url: '/', icon: LayoutDashboard },
    { title: tnav('tasks'), url: '/tasks', icon: ListTodo },
    { title: tnav('blueprints'), url: '/blueprints', icon: FolderKanban },
    { title: tnav('analytics'), url: '/analytics', icon: BarChart3 },
    { title: tnav('follow_up'), url: '/follow-up', icon: GitMerge },
    { title: tnav('organization'), url: '/organization', icon: Building2 },
  ];

  return (
    <Sidebar collapsible="offcanvas" side={locale === 'ar' ? 'right' : 'left'} {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="data-[slot=sidebar-menu-button]:p-1.5! cursor-pointer">
              <Zap className="size-5!" />
              <span className="text-base font-semibold">{appName}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <SidebarMenuButton asChild tooltip={tnav('quick_create')} className="min-w-8 bg-primary text-primary-foreground duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground">
              <Link href="#">
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
        <NavMain items={navItems} pathname={pathname} />
        {canAdmin && (
          <NavMain
            items={[{ title: tnav('admin'), url: '/admin', icon: Shield }]}
            pathname={pathname}
          />
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
          <NavUser user={user} locale={locale} />
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
