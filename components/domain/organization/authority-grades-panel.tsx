'use client';

import { useState, useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ShieldCheck } from 'lucide-react';
import {
  useAuthorityGrades,
  usePositionsInfinite,
  useDeleteAuthorityGrade,
} from '@/lib/api/hooks/use-organization';
import { useCapability } from '@/lib/api/hooks/use-capabilities';
import { localizeName } from './organization-utils';
import { AuthorityGradesToolbar } from './authority-grades-toolbar';
import { AuthorityGradesTable } from './authority-grades-table';
import { AuthorityGradeFormDialog } from './authority-grade-form-dialog';
import { ApiRequestError } from '@/lib/api/client';
import { OrgSkeleton } from './org-skeleton';
import { PermissionDenied } from './permission-denied';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { ConfirmDeleteDialog } from '@/components/shared/confirm-delete-dialog';
import type { components } from '@/lib/generated/api-types';

type AuthorityGradeResource = components['schemas']['AuthorityGradeResource'];

export function AuthorityGradesPanel() {
  const t = useTranslations('organization');
  const locale = useLocale();

  const canManage = useCapability('organization.manage');

  const grades = useAuthorityGrades();
  const positions = usePositionsInfinite(
    canManage ? { per_page: 200 } : { per_page: 0 },
  );

  const activeGradeIds = useMemo(() => {
    if (!canManage) return new Set<string>();
    const allPositions = positions.data?.pages.flatMap((p) => p.data) ?? [];
    const ids = new Set<string>();
    for (const pos of allPositions) {
      if (pos.authority_grade?.public_id) {
        ids.add(pos.authority_grade.public_id);
      }
    }
    return ids;
  }, [positions.data, canManage]);

  const [editGrade, setEditGrade] = useState<AuthorityGradeResource | null>(null);
  const [deleteGrade, setDeleteGrade] = useState<AuthorityGradeResource | null>(null);

  const deleteMutation = useDeleteAuthorityGrade();

  if (grades.isLoading) {
    return <OrgSkeleton variant="grades" />;
  }

  if (grades.isError) {
    const err = grades.error;
    if (err instanceof ApiRequestError && err.status === 403) {
      return <PermissionDenied />;
    }
    return <ErrorState message={grades.error?.message} onRetry={() => grades.refetch()} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <AuthorityGradesToolbar />

      {grades.data && grades.data.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title={t('grades.empty.title')}
          description={t('grades.empty.description')}
        />
      ) : (
        <>
          <AuthorityGradesTable
            grades={grades.data ?? []}
            activeGradeIds={activeGradeIds}
            onEdit={(grade: AuthorityGradeResource) => setEditGrade(grade)}
            onDelete={(grade: AuthorityGradeResource) => setDeleteGrade(grade)}
            canManage={canManage}
          />
          <p className="text-xs text-muted-foreground">
            {t('grades.no_deactivation_hint')}
          </p>
        </>
      )}

      {editGrade && canManage && (
        <AuthorityGradeFormDialog
          key={editGrade.public_id}
          open
          onOpenChange={(open: boolean) => {
            if (!open) setEditGrade(null);
          }}
          grade={editGrade}
        />
      )}

      {deleteGrade && (
        <ConfirmDeleteDialog
          open
          onOpenChange={(open: boolean) => {
            if (!open) setDeleteGrade(null);
          }}
          title={t('actions.delete')}
          description={t('dialogs.confirm_delete_desc', {
            name: localizeName(deleteGrade, locale),
          })}
          onConfirm={() => {
            deleteMutation.mutate(deleteGrade.public_id);
            setDeleteGrade(null);
          }}
          confirmLabel={t('actions.delete')}
          cancelLabel={t('actions.cancel')}
        />
      )}
    </div>
  );
}
