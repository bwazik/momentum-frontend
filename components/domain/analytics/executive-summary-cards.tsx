'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useSearchParams, useRouter } from 'next/navigation';
import { Activity, AlertTriangle, AlertCircle, PauseCircle, CheckCircle2 } from 'lucide-react';
import { StatCard } from '@/components/shared/stat-card';
import type { ExecutiveSummary } from './executive-dashboard-types';

interface ExecutiveSummaryCardsProps {
  summary: ExecutiveSummary;
}

function drillHref(metric: string, params?: URLSearchParams): string {
  const base = `/analytics/executive/drill-down/${metric}`;
  const qs = params?.toString();
  return qs ? `${base}?${qs}` : base;
}

export function ExecutiveSummaryCards({ summary }: ExecutiveSummaryCardsProps) {
  const t = useTranslations('analytics.executive');
  const locale = useLocale();
  const searchParams = useSearchParams();
  const router = useRouter();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4" data-testid="summary-cards">
      <StatCard
        href={drillHref('active', searchParams)}
        label={t('stat_active')}
        value={summary.active}
        icon={Activity}
        subtitle={t('stat_active_sub')}
        variant="active"
        iconVariant="boxed"
        valueSize="3xl"
      />
      <StatCard
        href={drillHref('at_risk', searchParams)}
        label={t('stat_at_risk')}
        value={summary.atRisk}
        icon={AlertTriangle}
        subtitle={t('stat_at_risk_sub')}
        variant="amber"
        iconVariant="boxed"
        valueSize="3xl"
      />
      <StatCard
        href={drillHref('overdue', searchParams)}
        label={t('stat_overdue')}
        value={summary.overdue}
        icon={AlertCircle}
        subtitle={t('stat_overdue_sub')}
        variant="red"
        iconVariant="boxed"
        valueSize="3xl"
      />
      <StatCard
        href={drillHref('suspended', searchParams)}
        label={t('stat_suspended')}
        value={summary.suspended}
        icon={PauseCircle}
        subtitle={t('stat_suspended_sub')}
        variant="suspended"
        iconVariant="boxed"
        valueSize="3xl"
      />
      <StatCard
        href={drillHref('completed', searchParams)}
        label={t('stat_completion_rate')}
        value={Math.round(summary.completionRate * 100)}
        valueSuffix="%"
        icon={CheckCircle2}
        subtitle={
          <span className="flex items-center gap-1">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); router.push(drillHref('completed', searchParams)); }}
              className="hover:underline cursor-pointer bg-transparent border-0 p-0 text-xs text-muted-foreground"
            >
              {t('completed_caption', { count: new Intl.NumberFormat(locale).format(summary.completed) })}
            </button>
            {summary.cancelled > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); router.push(drillHref('cancelled', searchParams)); }}
                  className="hover:underline cursor-pointer bg-transparent border-0 p-0 text-xs text-muted-foreground"
                >
                  {t('cancelled_sub', { count: new Intl.NumberFormat(locale).format(summary.cancelled) })}
                </button>
              </>
            )}
          </span>
        }
        variant="emerald"
        iconVariant="boxed"
        valueSize="3xl"
      />
    </div>
  );
}
