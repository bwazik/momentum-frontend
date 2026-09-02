'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { usePlatformTenantsInfinite } from '@/lib/api/hooks/use-platform';
import { useSearchParams } from 'next/navigation';
import { TenantsFilters } from './tenants-filters';
import { TenantsSkeleton } from './tenants-skeleton';
import { TenantsTable } from './tenants-table';
import { TenantsCardList } from './tenants-card-list';
import { EditTenantDialog } from './edit-tenant-dialog';
import type { PlatformTenant } from '@/lib/utils/platform-utils';

export function TenantsTabPanel() {
  const t = useTranslations('platform.tenants'); const common = useTranslations('platform.common'); const params = useSearchParams();
  const [editing, setEditing] = useState<PlatformTenant | null>(null);
  const filters = useMemo(() => ({ search: params.get('search') || undefined, is_active: params.get('isActive') === 'active' ? true : params.get('isActive') === 'inactive' ? false : undefined, per_page: 15 }), [params]);
  const query = usePlatformTenantsInfinite(filters); const tenants = query.data?.pages.flatMap((page) => page.data) ?? [];
  if (query.isLoading) return <TenantsSkeleton />;
  if (query.isError) return <ErrorState message={t('error')} onRetry={() => query.refetch()} />;
  return <><TenantsFilters />{tenants.length === 0 ? <EmptyState title={t('empty_title')} description={t('empty_description')} action={<Button variant="outline" onClick={() => window.location.href = window.location.pathname}>{common('reset_filters')}</Button>} /> : <><div className="hidden md:block"><TenantsTable tenants={tenants} onEdit={setEditing} /></div><TenantsCardList tenants={tenants} onEdit={setEditing} />{query.hasNextPage && <Button className="mt-4 w-full" variant="outline" onClick={() => query.fetchNextPage()} disabled={query.isFetchingNextPage}>{query.isFetchingNextPage ? common('loading_more') : common('load_more')}</Button>}</>}{editing && <EditTenantDialog tenant={editing} open={!!editing} onOpenChange={(open) => !open && setEditing(null)} />}</>;
}
