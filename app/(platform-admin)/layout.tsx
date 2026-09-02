import { cookies } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import { QueryClient, dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { prefetchPlatformAdmin } from '@/lib/auth/server';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/domain/shell/app-sidebar';
import { SiteHeader } from '@/components/domain/shell/site-header';

export const dynamic = 'force-dynamic';

export default async function PlatformAdminLayout({ children }: { children: React.ReactNode }) {
  const client = new QueryClient();
  const locale = (await cookies()).get('NEXT_LOCALE')?.value ?? 'ar';
  const t = await getTranslations({ locale, namespace: 'shell' });
  await prefetchPlatformAdmin(client);
  return (
    <HydrationBoundary state={dehydrate(client)}>
      <SidebarProvider
        style={
          {
            '--sidebar-width': 'calc(var(--spacing) * 72)',
            '--header-height': 'calc(var(--spacing) * 12)',
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" locale={locale as 'ar' | 'en'} mode="platform" />
        <SidebarInset>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:start-4 focus:z-[999] focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-lg"
          >
            {t('skip_to_main')}
          </a>
          <SiteHeader mode="platform" />
          <div className="flex flex-1 flex-col" id="main-content">
            <div className="@container/main flex flex-1 flex-col gap-2">
              <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                {children}
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </HydrationBoundary>
  );
}
