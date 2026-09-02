'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { ConfirmDeleteDialog } from '@/components/shared/confirm-delete-dialog';
import { useDeactivateAdmin, usePlatformAdminsInfinite, usePlatformAuth, useReactivateAdmin } from '@/lib/api/hooks/use-platform';
import { AdminsFilters } from './admins-filters';
import { AdminsSkeleton } from './admins-skeleton';
import { AdminsTable } from './admins-table';
import { AdminsCardList } from './admins-card-list';
import { AdminFormDialog } from './admin-form-dialog';
import type { PlatformAdmin } from '@/lib/utils/platform-utils';

export function AdminsTabPanel() { const t = useTranslations('platform.admins'); const c = useTranslations('platform.common'); const params = useSearchParams(); const auth = usePlatformAuth(); const [editing, setEditing] = useState<PlatformAdmin | null>(null); const [deactivating, setDeactivating] = useState<PlatformAdmin | null>(null); const [reactivating, setReactivating] = useState<PlatformAdmin | null>(null); const filters = useMemo(() => ({ search: params.get('search') || undefined, per_page: 15 }), [params]); const query = usePlatformAdminsInfinite(filters); const admins = query.data?.pages.flatMap((page) => page.data) ?? []; const deactivate = useDeactivateAdmin(deactivating?.public_id ?? ''); const reactivate = useReactivateAdmin(reactivating?.public_id ?? ''); if (query.isLoading) return <AdminsSkeleton />; if (query.isError) return <ErrorState message={t('error')} onRetry={() => query.refetch()} />; return <><AdminsFilters />{admins.length === 0 ? <EmptyState title={t('empty_title')} description={t('empty_description')} /> : <><div className="hidden md:block"><AdminsTable admins={admins} currentAdminId={auth.data?.public_id} onEdit={setEditing} onDeactivate={setDeactivating} onReactivate={setReactivating} /></div><AdminsCardList admins={admins} currentAdminId={auth.data?.public_id} onEdit={setEditing} onDeactivate={setDeactivating} onReactivate={setReactivating} />{query.hasNextPage && <Button className="mt-4 w-full" variant="outline" onClick={() => query.fetchNextPage()} disabled={query.isFetchingNextPage}>{query.isFetchingNextPage ? c('loading_more') : c('load_more')}</Button>}</>}{editing && <AdminFormDialog admin={editing} open={!!editing} onOpenChange={(open) => !open && setEditing(null)} />}{deactivating && <ConfirmDeleteDialog open={!!deactivating} onOpenChange={(open) => !open && setDeactivating(null)} title={t('confirm_deactivate_title')} description={t('confirm_deactivate_description')} confirmLabel={c('suspend')} onConfirm={() => deactivate.mutate(undefined, { onSuccess: () => setDeactivating(null) })} isPending={deactivate.isPending} />}{reactivating && <ConfirmDeleteDialog open={!!reactivating} onOpenChange={(open) => !open && setReactivating(null)} title={c('reactivate')} description={t('confirm_deactivate_description')} confirmLabel={c('reactivate')} destructive={false} onConfirm={() => reactivate.mutate(undefined, { onSuccess: () => setReactivating(null) })} isPending={reactivate.isPending} />}</>; }
