'use client';

import { useMemo, useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { usePlatformTenantsInfinite } from '@/lib/api/hooks/use-platform';
import { TenantsFilters } from './tenants-filters';
import { TenantsSkeleton, TenantsTableSkeleton } from './tenants-skeleton';
import { TenantsTable } from './tenants-table';
import { TenantsCardList } from './tenants-card-list';
import { EditTenantDialog } from './edit-tenant-dialog';
import type { PlatformTenant } from '@/lib/utils/platform-utils';
import { Building2, Plus } from 'lucide-react';

interface TenantsTabPanelProps {
  onCreateTenant?: () => void;
}

export function TenantsTabPanel({ onCreateTenant }: TenantsTabPanelProps) {
  const t = useTranslations('platform.tenants');
  const c = useTranslations('platform.common');
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [editing, setEditing] = useState<PlatformTenant | null>(null);

  const filters = useMemo(() => ({
    search: sp.get('search') || undefined,
    is_active: sp.get('isActive') === 'active' ? true : sp.get('isActive') === 'inactive' ? false : undefined,
    per_page: 15,
  }), [sp]);

  const query = usePlatformTenantsInfinite(filters);
  const tenants = query.data?.pages.flatMap((page) => page.data) ?? [];

  const isFirstLoad = query.isLoading;
  const isRefetching = query.isFetching && !query.isLoading;

  function resetFilters() {
    const params = new URLSearchParams();
    const tab = sp.get('tab');
    if (tab) params.set('tab', tab);
    const q = params.toString();
    router.replace(q ? `${pathname}?${q}` : pathname);
  }

  if (isFirstLoad) return <TenantsSkeleton />;

  return (
    <>
      <TenantsFilters />
      {isRefetching ? (
        <TenantsTableSkeleton />
      ) : query.isError ? (
        <ErrorState message={t('error')} onRetry={() => query.refetch()} />
      ) : tenants.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={t('empty_title')}
          description={t('empty_description')}
          action={
            <div className="flex gap-2">
              {onCreateTenant && (
                <Button onClick={onCreateTenant}>
                  <Plus className="size-4" /> {t('provision_title')}
                </Button>
              )}
              <Button variant="outline" onClick={resetFilters}>{c('reset_filters')}</Button>
            </div>
          }
        />
      ) : (
        <>
          <div className="hidden md:block">
            <TenantsTable tenants={tenants} onEdit={setEditing} />
          </div>
          <TenantsCardList tenants={tenants} onEdit={setEditing} />
          {query.hasNextPage && (
            <Button
              className="mt-4 w-full"
              variant="outline"
              onClick={() => query.fetchNextPage()}
              disabled={query.isFetchingNextPage}
            >
              {query.isFetchingNextPage ? c('loading_more') : c('load_more')}
            </Button>
          )}
        </>
      )}
      {editing && (
        <EditTenantDialog
          tenant={editing}
          open={!!editing}
          onOpenChange={(open) => !open && setEditing(null)}
        />
      )}
    </>
  );
}
