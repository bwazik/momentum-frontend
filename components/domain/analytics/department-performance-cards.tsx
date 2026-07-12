'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Activity, AlertCircle, AlertTriangle, Clock } from 'lucide-react';
import { StatCard } from '@/components/shared/stat-card';
import { formatDuration } from './department-dashboard-utils';
import type { DepartmentPerformance } from './department-dashboard-types';

interface DepartmentPerformanceCardsProps {
  performance: DepartmentPerformance;
}

function setActiveFilter(searchParams: URLSearchParams, pathname: string, router: ReturnType<typeof useRouter>) {
  const params = new URLSearchParams(searchParams.toString());
  params.set('status', 'active');
  params.delete('slaHealth');
  params.delete('assigneeId');
  router.replace(`${pathname}?${params.toString()}`);
}

function setOverdueFilter(searchParams: URLSearchParams, pathname: string, router: ReturnType<typeof useRouter>) {
  const params = new URLSearchParams(searchParams.toString());
  params.set('slaHealth', 'red');
  params.delete('status');
  params.delete('assigneeId');
  router.replace(`${pathname}?${params.toString()}`);
}

function setAtRiskFilter(searchParams: URLSearchParams, pathname: string, router: ReturnType<typeof useRouter>) {
  const params = new URLSearchParams(searchParams.toString());
  params.set('slaHealth', 'amber');
  params.delete('status');
  params.delete('assigneeId');
  router.replace(`${pathname}?${params.toString()}`);
}

export function DepartmentPerformanceCards({ performance }: DepartmentPerformanceCardsProps) {
  const t = useTranslations('analytics.department');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="department-performance-cards">
      <StatCard
        label={t('stat_active')}
        subtitle={t('stat_active_sub')}
        value={performance.activeTasks}
        icon={Activity}
        variant="active"
        iconVariant="boxed"
        valueSize="3xl"
        onClick={() => setActiveFilter(searchParams, pathname, router)}
      />
      <StatCard
        label={t('stat_overdue')}
        subtitle={t('stat_overdue_sub')}
        value={performance.overdueTasks}
        icon={AlertCircle}
        variant="red"
        iconVariant="boxed"
        valueSize="3xl"
        onClick={() => setOverdueFilter(searchParams, pathname, router)}
      />
      <StatCard
        label={t('stat_at_risk')}
        subtitle={t('stat_at_risk_sub')}
        value={performance.atRiskTasks}
        icon={AlertTriangle}
        variant="amber"
        iconVariant="boxed"
        valueSize="3xl"
        onClick={() => setAtRiskFilter(searchParams, pathname, router)}
      />
      <StatCard
        label={t('stat_avg_delay')}
        subtitle={t('stat_avg_delay_sub')}
        value={formatDuration(performance.averageStageDelaySeconds, locale)}
        icon={Clock}
        variant="emerald"
        iconVariant="boxed"
        valueSize="3xl"
      />
    </div>
  );
}
