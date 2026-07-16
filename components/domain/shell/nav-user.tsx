'use client';

import { Check, EllipsisVertical, LogOut, Palette, Sun, Moon, Globe, Settings } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import {
  Avatar,
  AvatarFallback,
} from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import Link from 'next/link';
import { useLogout } from '@/lib/api/hooks/use-auth';
import { useBrandColorStore, type BrandColor, brandColorHex } from '@/lib/stores/use-brand-color-store';
import { LocalizationContextSection } from './localization-context-section';
import type { components } from '@/lib/generated/api-types';

type UserResource = components['schemas']['UserResource'];

interface NavUserProps {
  user: UserResource;
  locale?: 'ar' | 'en';
}

const brandColors: BrandColor[] = ['amber', 'al_adaam', 'blue', 'emerald', 'rose', 'slate'];
const themes = ['light', 'dark', 'system'] as const;

export function NavUser({ user, locale = 'ar' }: NavUserProps) {
  const { isMobile } = useSidebar();
  const t = useTranslations('auth');
  const ct = useTranslations('colors');
  const st = useTranslations('shell');
  const { theme, setTheme } = useTheme();
  const logout = useLogout();
  const { color: brandColor, setColor: setBrandColor } = useBrandColorStore();
  const name = locale === 'ar' ? (user.name_ar || user.name_en || user.email) : (user.name_en || user.name_ar || user.email);
  const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
  const menuSide = isMobile ? 'bottom' : (locale === 'ar' ? 'left' : 'right');

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu dir={locale === 'ar' ? 'rtl' : 'ltr'}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-pointer"
            >
              <Avatar className="size-8 rounded-lg grayscale">
                <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-start text-sm leading-tight">
                <span className="truncate font-medium">{name}</span>
                <span className="truncate text-xs text-muted-foreground">{user.email}</span>
              </div>
              <EllipsisVertical data-slot="sidebar-menu-button-icon" className="ms-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={menuSide}
            sideOffset={4}
            align="end"
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-start text-sm">
                <Avatar className="size-8 rounded-lg">
                  <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-start text-sm leading-tight">
                  <span className="truncate font-medium">{name}</span>
                  <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="cursor-pointer">
                  <Sun data-slot="sidebar-menu-button-icon" />
                  <span>{t('theme')}</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {themes.map((mode) => (
                    <DropdownMenuItem key={mode} onClick={() => setTheme(mode)} className={`cursor-pointer ${mode === theme ? 'bg-accent' : ''}`}>
                      {mode === 'light' && <Sun data-slot="sidebar-menu-button-icon" />}
                      {mode === 'dark' && <Moon data-slot="sidebar-menu-button-icon" />}
                      {mode === 'system' && <Sun data-slot="sidebar-menu-button-icon" />}
                      <span>{st(mode)}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="cursor-pointer">
                  <Palette data-slot="sidebar-menu-button-icon" />
                  <span>{t('brand_color')}</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {brandColors.map((c) => (
                    <DropdownMenuItem key={c} onClick={() => setBrandColor(c)} className="gap-3 cursor-pointer">
                      <span className="size-4 rounded-full border" style={{ backgroundColor: brandColorHex[c] }} />
                      <span>{ct(c)}</span>
                      {brandColor === c && <Check className="ms-auto size-4 text-muted-foreground" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="cursor-pointer">
                  <Globe data-slot="sidebar-menu-button-icon" />
                  <span>{t('localization')}</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <LocalizationContextSection />
                </DropdownMenuSubContent>
                </DropdownMenuSub>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="cursor-pointer">
                <Link href="/settings" className="flex items-center gap-2">
                  <Settings data-slot="sidebar-menu-button-icon" />
                  <span>{t('preferences')}</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => logout.mutate()} disabled={logout.isPending} className="cursor-pointer">
              <LogOut data-slot="sidebar-menu-button-icon" />
              {t('logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
