'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { NotificationBell } from '@/components/domain/shell/notification-bell';
import { LocaleToggle } from '@/components/shared/locale-toggle';
import { useBrandName } from '@/lib/utils/use-brand-name';

const GlobalSearch = dynamic(() => import('@/components/domain/search/global-search').then(m => m.GlobalSearch), { ssr: false });

export function SiteHeader() {
  const pathname = usePathname();
  const t = useTranslations('shell');
  const appName = useBrandName();

  const pageTitles: Record<string, string> = {
    '/': t('page_titles.dashboard'),
    '/tasks': t('page_titles.tasks'),
    '/blueprints': t('page_titles.blueprints'),
    '/analytics': t('page_titles.analytics'),
    '/follow-up': t('page_titles.follow_up'),
    '/organization': t('page_titles.organization'),
    '/admin': t('page_titles.admin'),
  };
  const pageTitle = pageTitles[pathname] ?? appName;

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ms-1 cursor-pointer" />
        <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
        <h1 className="text-base font-medium">{pageTitle}</h1>
        <div className="ms-auto flex items-center gap-2">
          <GlobalSearch />
          <NotificationBell />
          <LocaleToggle />
        </div>
      </div>
    </header>
  );
}
