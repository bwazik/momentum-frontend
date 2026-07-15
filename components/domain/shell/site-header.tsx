'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { CalendarSearch } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
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
import { useBrandName } from '@/lib/api/hooks/use-brand-name';
import { usePageBreadcrumb } from './use-page-breadcrumb';

const GlobalSearch = dynamic(() => import('@/components/domain/search/global-search').then(m => m.GlobalSearch), { ssr: false });
const DateConverterDialog = dynamic(
  () => import('@/components/domain/shell/date-converter-dialog').then((m) => m.DateConverterDialog),
  { ssr: false },
);

export function SiteHeader() {
  const pathname = usePathname();
  const t = useTranslations('shell');
  const lt = useTranslations('localization');
  const appName = useBrandName();
  const crumbs = usePageBreadcrumb();
  const [converterOpen, setConverterOpen] = useState(false);

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
          <Button
            variant="ghost"
            size="icon"
            aria-label={lt('date_converter_label')}
            onClick={() => setConverterOpen(true)}
          >
          <CalendarSearch data-slot="icon" />
          </Button>
          <NotificationBell />
          <LocaleToggle />
        </div>
      </div>
      <DateConverterDialog open={converterOpen} onOpenChange={setConverterOpen} />
    </header>
  );
}
