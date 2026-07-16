'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { useActiveDelegationsInfinite, type ActiveDelegationFilters } from '@/lib/api/hooks/use-delegations';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { DelegationFilters } from './delegation-filters';
import { DelegationTableRow } from './delegation-table-row';
import { DelegationMobileCard } from './delegation-mobile-card';
import { DelegationTableSkeleton } from './delegation-table-skeleton';
import { RtlTable } from '@/components/shared/rtl-table';
import { TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';

function readFilters(searchParams: URLSearchParams): ActiveDelegationFilters {
  return {
    delegator_user_id: searchParams.get('delegatorId') ?? undefined,
    delegate_user_id: searchParams.get('delegateId') ?? undefined,
    blueprint_category_id: searchParams.get('blueprintCategoryId') ?? undefined,
    stage_type_id: searchParams.get('stageTypeId') ?? undefined,
  };
}

export function ActiveDelegationsPanel() {
  const t = useTranslations('settings.delegations');
  const searchParams = useSearchParams();
  const filters = useMemo(() => readFilters(searchParams), [searchParams]);
  const query = useActiveDelegationsInfinite(filters);

  const allDelegations = useMemo(
    () => query.data?.pages.flatMap((p) => p.data) ?? [],
    [query.data],
  );

  if (query.isLoading) return <DelegationTableSkeleton />;
  if (query.isError) return <ErrorState message={t('error')} onRetry={() => query.refetch()} />;

  return (
    <div className="flex flex-col gap-4">
      <DelegationFilters filters={filters} />

      {allDelegations.length === 0 ? (
        <EmptyState
          title={t('empty_title')}
          description={t('empty_description')}
        />
      ) : (
        <>
          <div className="hidden md:block">
            <RtlTable>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-start">{t('columns.delegator')}</TableHead>
                  <TableHead className="text-start">{t('columns.delegate')}</TableHead>
                  <TableHead className="text-start">{t('columns.scope')}</TableHead>
                  <TableHead className="text-start">{t('columns.dates')}</TableHead>
                  <TableHead className="text-start">{t('columns.status')}</TableHead>
                  <TableHead className="text-end">{t('columns.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allDelegations.map((d) => (
                  <DelegationTableRow key={d.public_id} delegation={d} />
                ))}
              </TableBody>
            </RtlTable>
          </div>
          <div className="md:hidden flex flex-col gap-4">
            {allDelegations.map((d) => (
              <DelegationMobileCard key={d.public_id} delegation={d} />
            ))}
          </div>
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
    </div>
  );
}
