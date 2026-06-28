'use client';

import { useState, useMemo, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Building2 } from 'lucide-react';
import { useDepartmentTree, useDepartmentsInfinite, useDeleteDepartment, useReactivateDepartment } from '@/lib/api/hooks/use-organization';
import { useCapability } from '@/lib/api/hooks/use-capabilities';
import { localizeName, buildParentMap } from './organization-utils';
import { DepartmentsToolbar } from './departments-toolbar';
import { DepartmentTreePanel } from './department-tree-panel';
import { DepartmentsTable } from './departments-table';
import { DepartmentFormDialog } from './department-form-dialog';
import { DepartmentDeactivateDialog } from './department-deactivate-dialog';
import { ApiRequestError } from '@/lib/api/client';
import { OrgSkeleton } from './org-skeleton';
import { PermissionDenied } from './permission-denied';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { ConfirmDeleteDialog } from '@/components/shared/confirm-delete-dialog';
import type { components } from '@/lib/generated/api-types';

type DepartmentResource = components['schemas']['DepartmentResource'];

export function DepartmentsPanel() {
  const t = useTranslations('organization');
  const locale = useLocale();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const search = searchParams.get('search') ?? '';
  const activeParam = searchParams.get('is_active');
  const is_active = activeParam === 'true' ? true : activeParam === 'false' ? false : undefined;
  const parent = searchParams.get('parent_department_id') ?? undefined;

  const canManage = useCapability('organization.manage');

  const tree = useDepartmentTree();

  const filters = useMemo(
    () => ({ is_active, parent_department_id: parent }),
    [is_active, parent],
  );

  const depts = useDepartmentsInfinite(filters);
  const allDepartments = useMemo(() => {
    const loaded = depts.data?.pages.flatMap((p) => p.data) ?? [];
    if (!search) return loaded;
    const lower = search.toLowerCase();
    return loaded.filter(
      (d) =>
        d.name_ar?.toLowerCase().includes(lower) ||
        d.name_en?.toLowerCase().includes(lower),
    );
  }, [depts.data, search]);

  const parentMap = useMemo(
    () => buildParentMap(tree.data ?? [], locale),
    [tree.data, locale],
  );

  const [editDept, setEditDept] = useState<DepartmentResource | null>(null);
  const [deactivateDept, setDeactivateDept] = useState<DepartmentResource | null>(null);
  const [reactivateDept, setReactivateDept] = useState<DepartmentResource | null>(null);
  const [deleteDept, setDeleteDept] = useState<DepartmentResource | null>(null);

  const deleteMutation = useDeleteDepartment();
  const reactivateMutation = useReactivateDepartment(reactivateDept?.public_id ?? '');

  const setFilter = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.replace(`${pathname}?${params.toString()}`);
    },
    [searchParams, router, pathname],
  );

  if (tree.isLoading || depts.isLoading) {
    return <OrgSkeleton variant="departments" />;
  }

  const treeErr = tree.error;
  const deptsErr = depts.error;

  if (treeErr instanceof ApiRequestError && treeErr.status === 403) {
    return <PermissionDenied />;
  }

  if (deptsErr instanceof ApiRequestError && deptsErr.status === 403) {
    return <PermissionDenied />;
  }

  if (tree.isError) {
    return <ErrorState message={tree.error?.message} onRetry={() => tree.refetch()} />;
  }

  if (depts.isError) {
    return <ErrorState message={depts.error?.message} onRetry={() => depts.refetch()} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <DepartmentsToolbar
        search={search}
        onSearchChange={(v) => setFilter('search', v || null)}
        isActive={is_active}
        onActiveChange={(v) => setFilter('is_active', v === null ? null : String(v))}
      />

      <div className="grid gap-4 lg:grid-cols-[320px,1fr]">
        <DepartmentTreePanel
          tree={tree.data ?? []}
          selectedParent={parent}
          onSelect={(id: string | undefined) => setFilter('parent_department_id', id ?? null)}
        />

        {allDepartments.length === 0 && !depts.isFetching ? (
          <EmptyState
            icon={Building2}
            title={t('departments.empty.title')}
            description={t('departments.empty.description')}
          />
        ) : (
          <DepartmentsTable
            departments={allDepartments}
            parentMap={parentMap}
            hasNextPage={depts.hasNextPage}
            isFetchingNextPage={depts.isFetchingNextPage}
            onLoadMore={() => depts.fetchNextPage()}
            onEdit={(dept) => setEditDept(dept)}
            onDeactivate={(dept) => setDeactivateDept(dept)}
            onReactivate={(dept) => setReactivateDept(dept)}
            onDelete={(dept) => setDeleteDept(dept)}
            canManage={canManage}
          />
        )}
      </div>

      {editDept && canManage && (
        <DepartmentFormDialog
          key={editDept.public_id}
          open
          onOpenChange={(open: boolean) => { if (!open) setEditDept(null); }}
          department={editDept}
          tree={tree.data ?? []}
        />
      )}

      {deactivateDept && (
        <DepartmentDeactivateDialog
          open
          onOpenChange={(open: boolean) => { if (!open) setDeactivateDept(null); }}
          department={deactivateDept}
        />
      )}

      {reactivateDept && (
        <ConfirmDeleteDialog
          open
          onOpenChange={(open: boolean) => { if (!open) setReactivateDept(null); }}
          title={t('actions.reactivate')}
          description={t('dialogs.confirm_reactivate_desc', { name: localizeName(reactivateDept, locale) })}
          onConfirm={() => {
            reactivateMutation.mutate(undefined, { onSuccess: () => setReactivateDept(null) });
          }}
          confirmLabel={t('actions.reactivate')}
          cancelLabel={t('actions.cancel')}
        />
      )}

      {deleteDept && (
        <ConfirmDeleteDialog
          open
          onOpenChange={(open: boolean) => { if (!open) setDeleteDept(null); }}
          title={t('actions.delete')}
          description={t('dialogs.confirm_delete_desc', { name: localizeName(deleteDept, locale) })}
          onConfirm={() => {
            deleteMutation.mutate(deleteDept.public_id);
            setDeleteDept(null);
          }}
          confirmLabel={t('actions.delete')}
          cancelLabel={t('actions.cancel')}
        />
      )}
    </div>
  );
}
