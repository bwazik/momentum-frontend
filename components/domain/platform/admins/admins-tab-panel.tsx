'use client';

import { useMemo, useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { ConfirmDeleteDialog } from '@/components/shared/confirm-delete-dialog';
import {
  useDeactivateAdmin,
  usePlatformAdminsInfinite,
  usePlatformAuth,
  useReactivateAdmin,
} from '@/lib/api/hooks/use-platform';
import { AdminsFilters } from './admins-filters';
import { AdminsSkeleton, AdminsTableSkeleton } from './admins-skeleton';
import { AdminsTable } from './admins-table';
import { AdminsCardList } from './admins-card-list';
import { AdminFormDialog } from './admin-form-dialog';
import type { PlatformAdmin } from '@/lib/utils/platform-utils';
import { Shield, Plus } from 'lucide-react';

interface AdminsTabPanelProps {
  onCreateAdmin?: () => void;
}

export function AdminsTabPanel({ onCreateAdmin }: AdminsTabPanelProps) {
  const t = useTranslations('platform.admins');
  const c = useTranslations('platform.common');
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const auth = usePlatformAuth();

  const [editing, setEditing] = useState<PlatformAdmin | null>(null);
  const [deactivating, setDeactivating] = useState<PlatformAdmin | null>(null);
  const [reactivating, setReactivating] = useState<PlatformAdmin | null>(null);

  const filters = useMemo(() => ({
    search: sp.get('search') || undefined,
    per_page: 15,
  }), [sp]);

  const query = usePlatformAdminsInfinite(filters);
  const admins = query.data?.pages.flatMap((page) => page.data) ?? [];

  const deactivate = useDeactivateAdmin(deactivating?.public_id ?? '');
  const reactivate = useReactivateAdmin(reactivating?.public_id ?? '');

  const isFirstLoad = query.isLoading;
  const isRefetching = query.isFetching && !query.isLoading;

  function resetFilters() {
    const params = new URLSearchParams();
    const tab = sp.get('tab');
    if (tab) params.set('tab', tab);
    const q = params.toString();
    router.replace(q ? `${pathname}?${q}` : pathname);
  }

  if (isFirstLoad) return <AdminsSkeleton />;

  return (
    <>
      <AdminsFilters />
      {isRefetching ? (
        <AdminsTableSkeleton />
      ) : query.isError ? (
        <ErrorState message={t('error')} onRetry={() => query.refetch()} />
      ) : admins.length === 0 ? (
        <EmptyState
          icon={Shield}
          title={t('empty_title')}
          description={t('empty_description')}
          action={
            <div className="flex gap-2">
              {onCreateAdmin && (
                <Button onClick={onCreateAdmin}>
                  <Plus className="size-4" /> {t('add_title')}
                </Button>
              )}
              <Button variant="outline" onClick={resetFilters}>{c('reset_filters')}</Button>
            </div>
          }
        />
      ) : (
        <>
          <div className="hidden md:block">
            <AdminsTable
              admins={admins}
              currentAdminId={auth.data?.public_id}
              onEdit={setEditing}
              onDeactivate={setDeactivating}
              onReactivate={setReactivating}
            />
          </div>
          <AdminsCardList
            admins={admins}
            currentAdminId={auth.data?.public_id}
            onEdit={setEditing}
            onDeactivate={setDeactivating}
            onReactivate={setReactivating}
          />
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
        <AdminFormDialog
          admin={editing}
          open={!!editing}
          onOpenChange={(open) => !open && setEditing(null)}
        />
      )}

      {deactivating && (
        <ConfirmDeleteDialog
          open={!!deactivating}
          onOpenChange={(open) => !open && setDeactivating(null)}
          title={t('confirm_deactivate_title')}
          description={t('confirm_deactivate_description')}
          confirmLabel={c('suspend')}
          onConfirm={() =>
            deactivate.mutate(undefined, { onSuccess: () => setDeactivating(null) })
          }
          isPending={deactivate.isPending}
        />
      )}

      {reactivating && (
        <ConfirmDeleteDialog
          open={!!reactivating}
          onOpenChange={(open) => !open && setReactivating(null)}
          title={t('confirm_reactivate_title')}
          description={t('confirm_reactivate_description')}
          confirmLabel={c('reactivate')}
          destructive={false}
          onConfirm={() =>
            reactivate.mutate(undefined, { onSuccess: () => setReactivating(null) })
          }
          isPending={reactivate.isPending}
        />
      )}
    </>
  );
}
