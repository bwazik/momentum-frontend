'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { NotificationBell } from '@/components/domain/shell/notification-bell';
import { LocaleToggle } from '@/components/shared/locale-toggle';
import { useBrandName } from '@/lib/utils/use-brand-name';
import { useTaskDisplayStore } from '@/lib/stores/use-task-display-store';
import { useBlueprintBuilderStore } from '@/lib/stores/use-blueprint-builder-store';

const GlobalSearch = dynamic(() => import('@/components/domain/search/global-search').then(m => m.GlobalSearch), { ssr: false });

interface Crumb {
  label: string;
  href?: string;
}

function usePageBreadcrumb(): Crumb[] | null {
  const pathname = usePathname();
  const nav = useTranslations('nav');

  const displayId = useTaskDisplayStore((s) => s.displayId);
  const blueprintName = useBlueprintBuilderStore((s) => s.blueprintName);

  const taskDetail = pathname.match(/^\/tasks\/(.+)$/);
  if (taskDetail) {
    return [
      { label: nav('dashboard'), href: '/' },
      { label: nav('tasks'), href: '/tasks' },
      { label: displayId || '...' },
    ];
  }

  if (pathname === '/tasks') {
    return [
      { label: nav('dashboard'), href: '/' },
      { label: nav('tasks') },
    ];
  }

  const blueprintDetail = pathname.match(/^\/blueprints\/([^/]+)$/);
  if (blueprintDetail && blueprintDetail[1] !== 'catalog') {
    return [
      { label: nav('dashboard'), href: '/' },
      { label: nav('blueprints'), href: '/blueprints' },
      { label: blueprintName || '...' },
    ];
  }

  if (pathname === '/blueprints/catalog') {
    return [
      { label: nav('dashboard'), href: '/' },
      { label: nav('blueprints'), href: '/blueprints' },
      { label: nav('blueprint_catalog') },
    ];
  }

  if (pathname === '/blueprints') {
    return [
      { label: nav('dashboard'), href: '/' },
      { label: nav('blueprints') },
    ];
  }

  if (pathname === '/analytics') {
    return [
      { label: nav('dashboard'), href: '/' },
      { label: nav('analytics') },
    ];
  }

  if (pathname === '/follow-up') {
    return [
      { label: nav('dashboard'), href: '/' },
      { label: nav('follow_up') },
    ];
  }

  return null;
}

export function SiteHeader() {
  const pathname = usePathname();
  const t = useTranslations('shell');
  const appName = useBrandName();
  const crumbs = usePageBreadcrumb();

  const pageTitles: Record<string, string> = {
    '/': t('page_titles.dashboard'),
    '/tasks': t('page_titles.tasks'),
    '/blueprints': t('page_titles.blueprints'),
    '/blueprints/catalog': t('page_titles.blueprints'),
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
        {crumbs ? (
          <>
            <Separator orientation="vertical" className="mx-2 data-[orientation=vertical]:h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                {crumbs.flatMap((crumb, i) => [
                  i > 0 && <BreadcrumbSeparator key={`sep-${i}`} />,
                  <BreadcrumbItem key={i}>
                    {crumb.href ? (
                      <BreadcrumbLink href={crumb.href}>{crumb.label}</BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                    )}
                  </BreadcrumbItem>,
                ])}
              </BreadcrumbList>
            </Breadcrumb>
          </>
        ) : (
          <h1 className="ms-1 text-base font-medium">{pageTitle}</h1>
        )}
        <div className="ms-auto flex items-center gap-2">
          <GlobalSearch />
          <NotificationBell />
          <LocaleToggle />
        </div>
      </div>
    </header>
  );
}
