'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { localizeName } from '@/lib/utils/localize';
import { formatDuration } from './executive-dashboard-utils';
import type { BottleneckItem } from './executive-dashboard-types';

interface BottleneckCardProps {
  bottleneck: BottleneckItem;
}

export function BottleneckCard({ bottleneck }: BottleneckCardProps) {
  const locale = useLocale();
  const t = useTranslations('analytics.executive');
  const severity = bottleneck.overdueCount > 0 ? 'red' : bottleneck.atRiskCount > 0 ? 'amber' : 'slate';
  const stageName = localizeName(locale, bottleneck.stageTypeNameAr, bottleneck.stageTypeNameEn);
  const deptName = localizeName(locale, bottleneck.departmentNameAr, bottleneck.departmentNameEn);

  return (
    <Link
      href={`/analytics/executive/bottlenecks/${bottleneck.stageTypePublicId}/drill-down`}
      className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl"
    >
      <Card className={cn(
        'p-4 transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 motion-reduce:hover:translate-y-0 border-s-4',
        severity === 'red' && 'border-s-red-500 dark:border-s-red-400',
        severity === 'amber' && 'border-s-amber-500 dark:border-s-amber-400',
        severity === 'slate' && 'border-s-border',
      )}>
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="min-w-0">
            <span className={cn(
              'text-xs font-semibold',
              severity === 'red' ? 'text-red-500' : severity === 'amber' ? 'text-amber-500' : 'text-foreground',
            )}>
              {stageName}
            </span>
            <p className="text-xs text-muted-foreground mt-0.5">{deptName}</p>
            <p className="text-xs text-muted-foreground/60 mt-0.5">
              {t('bottleneck_avg_delay', { time: formatDuration(bottleneck.averageTimeAtStageSeconds, locale) })}
            </p>
          </div>
          <div className="flex flex-col items-end gap-0.5 shrink-0">
            {bottleneck.overdueCount > 0 && (
              <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-red-100 text-red-500 dark:bg-red-900 dark:text-red-400">
                {t('bottleneck_overdue_count', { count: bottleneck.overdueCount })}
              </span>
            )}
            {bottleneck.atRiskCount > 0 && (
              <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-amber-100 text-amber-500 dark:bg-amber-900 dark:text-amber-400">
                {t('bottleneck_at_risk_count', { count: bottleneck.atRiskCount })}
              </span>
            )}
            {bottleneck.overdueCount === 0 && bottleneck.atRiskCount === 0 && (
              <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                0
              </span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}
