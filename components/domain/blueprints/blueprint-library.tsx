'use client';

import { useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { ApiRequestError } from '@/lib/api/client';
import { queryKeys } from '@/lib/api/query-keys';
import { apiClient } from '@/lib/api/client';
import { useBlueprintsInfinite, type BlueprintListFilters } from '@/lib/api/hooks/use-blueprints';
import { BlueprintFilters } from './blueprint-filters';
import { BlueprintLibrarySkeleton } from './blueprint-library-skeleton';
import { BlueprintTable } from './blueprint-table';
import { BlueprintCardList } from './blueprint-card-list';

function readFilters(searchParams: URLSearchParams): BlueprintListFilters {
  return {
    search: searchParams.get('search') ?? undefined,
    category_id: searchParams.get('category_id') ?? undefined,
    scope: searchParams.get('scope') ? Number(searchParams.get('scope')) : undefined,
    is_active: searchParams.get('is_active') === 'active' ? true : searchParams.get('is_active') === 'inactive' ? false : undefined,
  };
}

export function BlueprintLibrary() {
  const t = useTranslations('blueprints.library');
  const searchParams = useSearchParams();
  const filters = useMemo(() => readFilters(searchParams), [searchParams]);
  const query = useBlueprintsInfinite(filters);
  const queryClient = useQueryClient();

  const allBlueprints = useMemo(() => {
    const seen = new Set<string>();
    return (query.data?.pages.flatMap((p) => p.data) ?? []).filter((b) => {
      if (seen.has(b.public_id)) return false;
      seen.add(b.public_id);
      return true;
    });
  }, [query.data]);

  if (query.isLoading) return <BlueprintLibrarySkeleton />;
  if (query.isError) {
    const error = query.error;
    if (error instanceof ApiRequestError && error.status === 403) {
      return <EmptyState title={t('no_permission_title')} description={t('no_permission_description')} />;
    }
    return <ErrorState message={t('error')} onRetry={() => query.refetch()} />;
  }

  return (
    <section className="flex flex-col gap-4">
      <BlueprintFilters filters={filters} />
      {allBlueprints.length === 0 ? (
        <EmptyState title={t('empty_title')} description={t('empty_description')} />
      ) : (
        <>
          <div className="hidden md:block">
            <BlueprintTable blueprints={allBlueprints} onHover={(id) => {
              queryClient.prefetchQuery({
                queryKey: queryKeys.blueprints.detail(id),
                queryFn: () => apiClient.get(`/v1/blueprints/${id}`),
              });
            }} />
          </div>
          <div className="md:hidden">
            <BlueprintCardList blueprints={allBlueprints} />
          </div>
          {query.hasNextPage && (
            <Button variant="outline" onClick={() => query.fetchNextPage()} disabled={query.isFetchingNextPage}>
              {query.isFetchingNextPage ? t('loading_more') : t('load_more')}
            </Button>
          )}
        </>
      )}
    </section>
  );
}
