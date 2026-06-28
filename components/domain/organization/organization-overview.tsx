'use client';

import { useState, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { ArrowRightFromLine, Network } from 'lucide-react';
import { useDepartmentTree, usePositionsInfinite } from '@/lib/api/hooks/use-organization';
import { OrgStatCards } from './org-stat-cards';
import { VisualOrgChart } from './visual-org-chart';
import { PositionDetailDrawer } from './position-detail-drawer';
import { OrgSkeleton } from './org-skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { Badge } from '@/components/ui/badge';
import { VacantBadge } from './vacant-badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { localizeName, localizeTitle, asBool } from './organization-utils';
import type { components } from '@/lib/generated/api-types';

export function OrganizationOverview() {
  const t = useTranslations('organization');
  const locale = useLocale();
  const {
    data: tree,
    isLoading: treeLoading,
    isError: treeError,
    error: treeErr,
    refetch: refetchTree,
  } = useDepartmentTree();
  const {
    data: posPages,
    isLoading: posLoading,
    isError: posError,
    error: posErr,
    refetch: refetchPos,
  } = usePositionsInfinite({ per_page: 200 });

  const isLoading = treeLoading || posLoading;
  const isError = treeError || posError;
  const positions = useMemo(() => posPages?.pages.flatMap((p) => p.data) ?? [], [posPages]);

  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);
  const [detailPos, setDetailPos] = useState<components['schemas']['PositionResource'] | null>(null);

  const selectedPositions = useMemo(
    () => positions.filter((p) => p.department.public_id === selectedDeptId),
    [positions, selectedDeptId],
  );

  const selectedDeptName = useMemo(() => {
    if (!selectedDeptId) return null;
    const pos = positions.find((p) => p.department.public_id === selectedDeptId);
    return pos ? localizeName(pos.department, locale) : null;
  }, [selectedDeptId, positions, locale]);

  if (isLoading) return <OrgSkeleton variant="overview" />;

  if (isError) {
    return (
      <ErrorState
        message={treeErr?.message ?? posErr?.message}
        onRetry={() => {
          refetchTree();
          refetchPos();
        }}
      />
    );
  }

  if (!tree || tree.length === 0) {
    return (
      <EmptyState
        icon={Network}
        title={t('overview.empty_title')}
        description={t('overview.empty_description')}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <OrgStatCards />
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="min-w-0 flex-1">
          <VisualOrgChart
            tree={tree}
            positions={positions}
            selectedDeptId={selectedDeptId}
            onSelectDept={setSelectedDeptId}
          />
        </div>
        <div className="flex w-full flex-col gap-3 rounded-xl border bg-card p-4 lg:w-[380px] lg:shrink-0">
          {selectedDeptId && selectedPositions.length > 0 ? (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">
                  {selectedDeptName}
                </h3>
                <span className="text-xs text-muted-foreground">
                  {t('overview.position_count', {
                    filled: selectedPositions.filter((p) => p.current_occupant != null).length,
                    total: selectedPositions.length,
                  })}
                </span>
              </div>
              <Separator />
              <div className="flex flex-col gap-3 overflow-y-auto">
                {selectedPositions.map((pos) => {
                  const isVacant = pos.current_occupant == null;
                  const isHead = asBool(pos.is_department_head);
                  const title = localizeTitle(pos, locale);
                  const initials = title.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w.charAt(0)).join('').toUpperCase();
                  const gradeName = pos.authority_grade ? localizeName(pos.authority_grade, locale) : null;
                  const headName = isVacant ? null : localizeName(pos.current_occupant!, locale);
                  return (
                    <button
                      key={pos.public_id}
                      type="button"
                      onClick={() => setDetailPos(pos)}
                      className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border bg-card p-3 text-center transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shadow">
                        <span className="text-xs font-bold text-white">{initials}</span>
                      </div>
                      <p className="truncate text-xs font-semibold text-foreground">{title}</p>
                      <div className="flex items-center gap-1.5">
                        {isHead && (
                          <Badge variant="secondary" className="text-[10px]">
                            {t('positions.head')}
                          </Badge>
                        )}
                        {isVacant ? <VacantBadge /> : null}
                      </div>
                      {gradeName && (
                        <p className="text-[10px] text-muted-foreground">{gradeName}</p>
                      )}
                      {headName && (
                        <p className="text-xs font-medium text-foreground">{headName}</p>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-3 text-center">
              <ArrowRightFromLine className="size-8 text-muted-foreground/40" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('overview.select_dept')}
                </p>
                <p className="text-xs text-muted-foreground/60">
                  {t('overview.select_dept_desc')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {detailPos && (
        <PositionDetailDrawer
          open
          onOpenChange={(open) => { if (!open) setDetailPos(null); }}
          position={detailPos}
          positions={positions}
        />
      )}
    </div>
  );
}
