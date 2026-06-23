'use client';

import Link from 'next/link';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  isActive?: (pathname: string) => boolean;
}

export function NavMain({ items, pathname }: { items: NavItem[]; pathname: string }) {
  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = item.isActive ? item.isActive(pathname) : pathname === item.url || pathname.startsWith(item.url + '/');
            return (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton asChild isActive={isActive} tooltip={item.title} className={isActive ? 'data-[active=true]:bg-primary data-[active=true]:text-primary-foreground' : ''}>
                  <Link href={item.url}>
                    <Icon data-slot="sidebar-menu-button-icon" />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
