'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Building2, Briefcase, UserCheck, UserX } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useDepartmentTree, usePositionsInfinite } from '@/lib/api/hooks/use-organization';

const STAT_CARDS = [
  { key: 'total_departments', icon: Building2, color: 'text-primary' },
  { key: 'total_positions', icon: Briefcase, color: 'text-primary' },
  { key: 'filled', icon: UserCheck, color: 'text-emerald-600 dark:text-emerald-400' },
  { key: 'vacant', icon: UserX, color: 'text-amber-600 dark:text-amber-400' },
] as const;


function StatCardSkeleton() {
  return (
    <div className="rounded-xl border p-5">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-3 w-24 animate-pulse motion-reduce:animate-none" />
          <Skeleton className="h-8 w-16 animate-pulse motion-reduce:animate-none" />
        </div>
        <Skeleton className="size-10 rounded-xl animate-pulse motion-reduce:animate-none" />
      </div>
    </div>
  );
}

export function OrgStatCards() {
  const t = useTranslations('organization');
  const { data: tree, isLoading: treeLoading, isError: treeError } = useDepartmentTree();
  const { data: posPages, isLoading: posLoading, isError: posError } = usePositionsInfinite({ per_page: 200 });

  const isLoading = treeLoading || posLoading;
  const isError = treeError || posError;

  const stats = useMemo(() => {
    if (!tree || !posPages) return null;
    const positions = posPages.pages.flatMap((p) => p.data);
    const totalDepts = tree.length;
    const totalPositions = positions.length;
    const filled = positions.filter((p) => p.current_occupant != null).length;
    const vacant = totalPositions - filled;
    return { total_departments: totalDepts, total_positions: totalPositions, filled, vacant };
  }, [tree, posPages]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (isError || !stats) return null;

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {STAT_CARDS.map((def) => {
        const value = stats[def.key as keyof typeof stats];
        const isVacantHigh = def.key === 'vacant' && value > 0;
        return (
          <Card key={def.key}>
            <CardContent className="flex items-center justify-between p-5">
              <div className="flex flex-col gap-1">
                <span className="sr-only">{t(`overview.${def.key}`)}</span>
                <span className="text-xs text-muted-foreground">
                  {t(`overview.${def.key}`)}
                </span>
                <span className={cn('text-2xl font-bold', isVacantHigh && 'text-amber-600 dark:text-amber-400')}>
                  {value}
                </span>
              </div>
              <def.icon className={cn('size-10 rounded-xl bg-muted/50 p-2', def.color)} />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
