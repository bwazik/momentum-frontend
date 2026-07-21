'use client';

import { useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { RtlTable } from '@/components/shared/rtl-table';
import { TableHeader, TableRow, TableHead, TableBody } from '@/components/ui/table';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { useCapability } from '@/lib/api/hooks/use-capabilities';
import { useTaskPriorities } from '@/lib/api/hooks/use-task-priorities';
import { PrioritiesFilters } from './priorities-filters';
import { PrioritiesTableRow } from './priorities-table-row';
import { Plus, ListOrdered } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface PrioritiesTabPanelProps {
  onCreatePriority?: () => void;
}

export function PrioritiesTabPanel({ onCreatePriority }: PrioritiesTabPanelProps) {
  const t = useTranslations('admin.priorities');
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const canManage = useCapability('task.manage_priorities');

  const query = useTaskPriorities(true);

  const filtered = useMemo(() => {
    if (!query.data) return [];
    let items = query.data;
    const isActive = sp.get('isActive');
    if (isActive === 'active') items = items.filter((p) => String(p.is_active) !== 'false');
    if (isActive === 'inactive') items = items.filter((p) => String(p.is_active) === 'false');
    return items;
  }, [query.data, sp]);

  function resetFilters() { router.replace(pathname); }

  if (query.isLoading) return <PrioritiesSkeleton />;
  if (query.isError) return <ErrorState onRetry={() => query.refetch()} message={t('error')} />;
  if (filtered.length === 0) return (
    <EmptyState
      icon={ListOrdered}
      title={t('empty_title')}
      description={t('empty_description')}
      action={
        <div className="flex gap-2">
          {canManage && (
            <Button onClick={() => onCreatePriority?.()}>
              <Plus className="size-4" />
              {t('create_priority')}
            </Button>
          )}
          <Button variant="outline" onClick={resetFilters}>{t('reset_filters')}</Button>
        </div>
      }
    />
  );

  return (
    <>
      <PrioritiesFilters />
      <RtlTable aria-label={t('table_aria_label')}>
        <TableHeader>
          <TableRow>
            <TableHead className="text-start">{t('col_name')}</TableHead>
            <TableHead className="text-start">{t('col_severity')}</TableHead>
            <TableHead className="text-start">{t('col_color')}</TableHead>
            <TableHead className="text-start">{t('col_order')}</TableHead>
            <TableHead className="text-start">{t('col_default')}</TableHead>
            <TableHead className="text-start">{t('col_status')}</TableHead>
            <TableHead className="text-end">{t('col_actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((p) => (
            <PrioritiesTableRow key={p.public_id} priority={p} />
          ))}
        </TableBody>
      </RtlTable>
    </>
  );
}

function PrioritiesSkeleton() {
  return (
    <div className="flex flex-col gap-4" data-testid="priorities-skeleton">
      <Skeleton className="h-9 w-full" />

      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="text-start p-2"><Skeleton className="h-4 w-24" /></th>
            <th className="text-start p-2"><Skeleton className="h-4 w-16" /></th>
            <th className="text-start p-2"><Skeleton className="h-4 w-16" /></th>
            <th className="text-start p-2"><Skeleton className="h-4 w-14" /></th>
            <th className="text-start p-2"><Skeleton className="h-4 w-14" /></th>
            <th className="text-start p-2"><Skeleton className="h-4 w-14" /></th>
            <th className="text-end p-2"><Skeleton className="h-4 w-12 ms-auto" /></th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }).map((_, i) => (
            <tr key={i} className="border-b border-border">
              <td className="p-2"><Skeleton className="h-5 w-32" /></td>
              <td className="p-2"><Skeleton className="h-5 w-20" /></td>
              <td className="p-2"><div className="flex gap-1"><Skeleton className="h-5 w-5 rounded-full" /><Skeleton className="h-5 w-16" /></div></td>
              <td className="p-2"><Skeleton className="h-5 w-14" /></td>
              <td className="p-2"><Skeleton className="h-5 w-14" /></td>
              <td className="p-2"><Skeleton className="h-5 w-14" /></td>
              <td className="p-2"><div className="flex justify-end"><Skeleton className="h-8 w-8" /></div></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
