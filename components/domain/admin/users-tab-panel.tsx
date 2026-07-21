'use client';

import { useMemo, useRef } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { RtlTable } from '@/components/shared/rtl-table';
import { TableHeader, TableRow, TableHead, TableBody } from '@/components/ui/table';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { useCapability } from '@/lib/api/hooks/use-capabilities';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminUsersSkeleton } from './admin-users-skeleton';
import { UsersFilters } from './users-filters';
import { UsersTableRow } from './users-table-row';
import { UsersCardList } from './users-card-list';
import { UserDetailSheet } from './user-detail-sheet';
import { useAdminUsersInfinite } from '@/lib/api/hooks/use-admin-users';
import type { AdminUserFilters } from '@/lib/api/query-keys';
import { UserPlus, Users } from 'lucide-react';

interface UsersTabPanelProps {
  onCreateUser?: () => void;
}

export function UsersTabPanel({ onCreateUser }: UsersTabPanelProps) {
  const t = useTranslations('admin.users');
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const canManageUsers = useCapability('iam.manage_users');

  const filters = useMemo<AdminUserFilters>(() => ({
    search: sp.get('search') || undefined,
    is_active: sp.get('isActive') === 'inactive' ? '0' : sp.get('isActive') === 'active' ? '1' : undefined,
    account_type: sp.get('accountType') || undefined,
    department_id: sp.get('departmentId') || undefined,
    per_page: 20,
  }), [sp]);

  const query = useAdminUsersInfinite(filters);
  const users = query.data?.pages.flatMap((p) => p.data) ?? [];

  function openUserSheet(publicId: string) {
    const params = new URLSearchParams(sp.toString());
    params.set('userPublicId', publicId);
    router.replace(`${pathname}?${params.toString()}`);
  }

  function closeUserSheet() {
    const params = new URLSearchParams(sp.toString());
    params.delete('userPublicId');
    router.replace(`${pathname}?${params.toString()}`);
  }

  function resetFilters() {
    router.replace(pathname);
  }

  const selectedUserPublicId = sp.get('userPublicId');
  const hasEverLoaded = useRef(false);
  if (query.data) hasEverLoaded.current = true;

  const isFirstLoad = !hasEverLoaded.current && query.isLoading;
  const isRefetching = hasEverLoaded.current && query.isFetching;

  if (isFirstLoad) return <AdminUsersSkeleton />;

  return (
    <>
      <UsersFilters />
      {isRefetching ? (
        <TableSkeleton />
      ) : query.isError ? (
        <ErrorState onRetry={() => query.refetch()} message={t('error')} />
      ) : users.length === 0 ? (
        <EmptyState
          icon={Users}
          title={t('empty_title')}
          description={t('empty_description')}
          action={
            <div className="flex gap-2">
              {canManageUsers && (
                <Button onClick={() => onCreateUser?.()}>
                  <UserPlus className="size-4" />
                  {t('create_user')}
                </Button>
              )}
              <Button variant="outline" onClick={resetFilters}>{t('reset_filters')}</Button>
            </div>
          }
        />
      ) : (
        <>
          <div className="hidden md:block">
            <RtlTable aria-label={t('table_aria_label')}>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-start">{t('col_name')}</TableHead>
                  <TableHead className="text-start">{t('col_employee_id')}</TableHead>
                  <TableHead className="text-start">{t('col_email')}</TableHead>
                  <TableHead className="text-start">{t('col_account_type')}</TableHead>
                  <TableHead className="text-start">{t('col_department')}</TableHead>
                  <TableHead className="text-start">{t('col_language')}</TableHead>
                  <TableHead className="text-start">{t('col_status')}</TableHead>
                  {canManageUsers && <TableHead className="w-12 text-end" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <UsersTableRow key={user.public_id} user={user} onSelect={openUserSheet} />
                ))}
              </TableBody>
            </RtlTable>
          </div>
          <UsersCardList users={users} onSelect={openUserSheet} />
          {query.hasNextPage && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => query.fetchNextPage()}
              disabled={query.isFetchingNextPage}
            >
              {query.isFetchingNextPage ? t('loading_more') : t('load_more')}
            </Button>
          )}
        </>
      )}
      {selectedUserPublicId && (
        <UserDetailSheet publicId={selectedUserPublicId} onClose={closeUserSheet} />
      )}
    </>
  );
}

function TableSkeleton() {
  return (
    <div className="flex flex-col gap-4" data-testid="users-table-skeleton">
      <div className="hidden md:block">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              {Array.from({ length: 8 }).map((_, i) => (
                <th key={i} className="p-2"><Skeleton className="h-4 w-20" /></th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-border">
                {Array.from({ length: 8 }).map((_, j) => (
                  <td key={j} className="p-2"><Skeleton className="h-5 w-full" /></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="md:hidden flex flex-col gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border p-4">
            <Skeleton className="h-5 w-32 mb-3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-24 mt-2" />
          </div>
        ))}
      </div>
      <Skeleton className="h-9 w-full" />
    </div>
  );
}
