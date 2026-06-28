'use client';

import { useState, useMemo, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Briefcase } from 'lucide-react';
import {
  usePositionsInfinite,
  useAuthorityGrades,
  useDepartmentTree,
  useDeletePosition,
  useDeactivatePosition,
  useReactivatePosition,
} from '@/lib/api/hooks/use-organization';
import { useCapability } from '@/lib/api/hooks/use-capabilities';
import { flattenTree, localizeTitle } from './organization-utils';
import { PositionsToolbar } from './positions-toolbar';
import { PositionsTable } from './positions-table';
import { PositionsCardList } from './positions-card-list';
import { PositionFormDialog } from './position-form-dialog';
import { TransferPositionDialog } from './transfer-position-dialog';
import { PositionDetailDrawer } from './position-detail-drawer';
import { ApiRequestError } from '@/lib/api/client';
import { OrgSkeleton } from './org-skeleton';
import { PermissionDenied } from './permission-denied';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { ConfirmDeleteDialog } from '@/components/shared/confirm-delete-dialog';
import type { components } from '@/lib/generated/api-types';

type PositionResource = components['schemas']['PositionResource'];

export function PositionsPanel() {
  const t = useTranslations('organization');
  const locale = useLocale();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const search = searchParams.get('search') ?? '';
  const activeParam = searchParams.get('is_active');
  const is_active = activeParam === 'true' ? true : activeParam === 'false' ? false : undefined;
  const department_id = searchParams.get('department_id') ?? undefined;
  const authority_grade_id = searchParams.get('authority_grade_id') ?? undefined;

  const canManage = useCapability('organization.manage');

  const tree = useDepartmentTree();
  const grades = useAuthorityGrades();
  const allDepts = useMemo(() => flattenTree(tree.data ?? []), [tree.data]);

  const filters = useMemo(
    () => ({ is_active, department_id, authority_grade_id, search: search || undefined }),
    [is_active, department_id, authority_grade_id, search],
  );

  const positions = usePositionsInfinite(filters);
  const allPositions = useMemo(() => {
    const loaded = positions.data?.pages.flatMap((p) => p.data) ?? [];
    if (!search) return loaded;
    const lower = search.toLowerCase();
    return loaded.filter(
      (p) =>
        p.title_ar?.toLowerCase().includes(lower) ||
        p.title_en?.toLowerCase().includes(lower),
    );
  }, [positions.data, search]);

  const [editPos, setEditPos] = useState<PositionResource | null>(null);
  const [transferPos, setTransferPos] = useState<PositionResource | null>(null);
  const [deactivatePos, setDeactivatePos] = useState<PositionResource | null>(null);
  const [reactivatePos, setReactivatePos] = useState<PositionResource | null>(null);
  const [deletePos, setDeletePos] = useState<PositionResource | null>(null);
  const [detailPos, setDetailPos] = useState<PositionResource | null>(null);

  const deleteMutation = useDeletePosition();
  const deactivateMutation = useDeactivatePosition(deactivatePos?.public_id ?? '');
  const reactivateMutation = useReactivatePosition(reactivatePos?.public_id ?? '');

  function handleDeactivate(pos: PositionResource) {
    setDeactivatePos(pos);
  }

  function handleReactivate(pos: PositionResource) {
    setReactivatePos(pos);
  }

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

  const isLoading = positions.isLoading || tree.isLoading || grades.isLoading;
  if (isLoading) {
    return <OrgSkeleton variant="positions" />;
  }

  const posErr = positions.error;
  const treeErr = tree.error;
  const gradesErr = grades.error;

  if (posErr instanceof ApiRequestError && posErr.status === 403) {
    return <PermissionDenied />;
  }

  if (treeErr instanceof ApiRequestError && treeErr.status === 403) {
    return <PermissionDenied />;
  }

  if (gradesErr instanceof ApiRequestError && gradesErr.status === 403) {
    return <PermissionDenied />;
  }

  if (positions.isError) {
    return <ErrorState message={positions.error?.message} onRetry={() => positions.refetch()} />;
  }

  if (tree.isError) {
    return <ErrorState message={tree.error?.message} onRetry={() => tree.refetch()} />;
  }

  if (grades.isError) {
    return <ErrorState message={grades.error?.message} onRetry={() => grades.refetch()} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <PositionsToolbar
        search={search}
        onSearchChange={(v: string) => {
          if (v !== search) setFilter('search', v || null);
        }}
        isActive={is_active}
        onActiveChange={(v: boolean | null) => {
          if (v !== (is_active ?? null)) setFilter('is_active', v === null ? null : String(v));
        }}
        departmentId={department_id}
        onDepartmentChange={(v: string | null) => {
          if (v !== (department_id ?? null)) setFilter('department_id', v);
        }}
        gradeId={authority_grade_id}
        onGradeChange={(v: string | null) => {
          if (v !== (authority_grade_id ?? null)) setFilter('authority_grade_id', v);
        }}
        departments={allDepts}
        grades={grades.data ?? []}
      />

      {allPositions.length === 0 && !positions.isFetching ? (
        <EmptyState
          icon={Briefcase}
          title={t('empty.no_positions')}
          description={t('empty.no_positions_desc')}
        />
      ) : (
        <>
          <PositionsTable
            positions={allPositions}
            hasNextPage={positions.hasNextPage}
            isFetchingNextPage={positions.isFetchingNextPage}
            onLoadMore={() => positions.fetchNextPage()}
            onEdit={(pos: PositionResource) => setEditPos(pos)}
            onTransfer={(pos: PositionResource) => setTransferPos(pos)}
            onDeactivate={(pos: PositionResource) => handleDeactivate(pos)}
            onReactivate={(pos: PositionResource) => handleReactivate(pos)}
            onDelete={(pos: PositionResource) => setDeletePos(pos)}
            onViewDetail={(pos: PositionResource) => setDetailPos(pos)}
          />
          <PositionsCardList
            positions={allPositions}
            hasNextPage={positions.hasNextPage}
            isFetchingNextPage={positions.isFetchingNextPage}
            onLoadMore={() => positions.fetchNextPage()}
            onEdit={(pos: PositionResource) => setEditPos(pos)}
            onTransfer={(pos: PositionResource) => setTransferPos(pos)}
            onDeactivate={(pos: PositionResource) => handleDeactivate(pos)}
            onReactivate={(pos: PositionResource) => handleReactivate(pos)}
            onDelete={(pos: PositionResource) => setDeletePos(pos)}
            onViewDetail={(pos: PositionResource) => setDetailPos(pos)}
          />
        </>
      )}

      {editPos && canManage && (
        <PositionFormDialog
          open
          onOpenChange={(open: boolean) => { if (!open) setEditPos(null); }}
          position={editPos}
          departments={allDepts}
          grades={grades.data ?? []}
          positions={allPositions}
        />
      )}

      {transferPos && canManage && (
        <TransferPositionDialog
          open
          onOpenChange={(open: boolean) => { if (!open) setTransferPos(null); }}
          position={transferPos}
          departments={allDepts}
        />
      )}

      {deactivatePos && (
        <ConfirmDeleteDialog
          open
          onOpenChange={(open: boolean) => { if (!open) setDeactivatePos(null); }}
          title={t('actions.deactivate')}
          description={t('dialogs.confirm_deactivate_desc', { name: localizeTitle(deactivatePos, locale) })}
          onConfirm={() => {
            deactivateMutation.mutate(undefined, { onSuccess: () => setDeactivatePos(null) });
          }}
          confirmLabel={t('actions.deactivate')}
          cancelLabel={t('actions.cancel')}
        />
      )}

      {reactivatePos && (
        <ConfirmDeleteDialog
          open
          onOpenChange={(open: boolean) => { if (!open) setReactivatePos(null); }}
          title={t('actions.reactivate')}
          description={t('dialogs.confirm_reactivate_desc', { name: localizeTitle(reactivatePos, locale) })}
          onConfirm={() => {
            reactivateMutation.mutate(undefined, { onSuccess: () => setReactivatePos(null) });
          }}
          confirmLabel={t('actions.reactivate')}
          cancelLabel={t('actions.cancel')}
        />
      )}

      {deletePos && (
        <ConfirmDeleteDialog
          open
          onOpenChange={(open: boolean) => { if (!open) setDeletePos(null); }}
          title={t('actions.delete')}
          description={t('dialogs.confirm_delete_desc', { name: localizeTitle(deletePos, locale) })}
          onConfirm={() => {
            deleteMutation.mutate(deletePos.public_id);
            setDeletePos(null);
          }}
          confirmLabel={t('actions.delete')}
          cancelLabel={t('actions.cancel')}
        />
      )}

      {detailPos && (
        <PositionDetailDrawer
          open
          onOpenChange={(open: boolean) => { if (!open) setDetailPos(null); }}
          position={detailPos}
          positions={allPositions}
        />
      )}
    </div>
  );
}
