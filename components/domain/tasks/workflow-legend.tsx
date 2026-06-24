'use client';

import { useTranslations } from 'next-intl';
import { ArrowLeftRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const SLA_ITEMS = [
  { key: 'overdue', dot: 'bg-red-500' },
  { key: 'at_risk', dot: 'bg-amber-500' },
  { key: 'on_track', dot: 'bg-emerald-500' },
] as const;

interface WorkflowLegendProps {
  avgCompletionTime?: number | null;
  totalSla?: { value: number; unit: string } | null;
}

export function WorkflowLegend({ avgCompletionTime, totalSla }: WorkflowLegendProps) {
  const t = useTranslations('tasks.workflow');

  function formatDurationDays(days: number): string {
    if (days < 1) return `${Math.round(days * 24)} ${t('legend_hours')}`;
    return `${days.toFixed(1)} ${t('legend_days')}`;
  }

  function formatSlaUnit(unit: string): string {
    return unit === 'hours' || unit === '1' ? t('legend_hours') : t('legend_days');
  }

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl border bg-card p-4 text-xs text-muted-foreground">
      <div className="flex items-center gap-2">
        <span className="size-2.5 rounded-full bg-blue-500" aria-hidden="true" />
        <span>{t('legend_active')}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="size-2.5 rounded-full bg-emerald-500" aria-hidden="true" />
        <span>{t('legend_completed')}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="size-2.5 rounded-full bg-slate-300" aria-hidden="true" />
        <span>{t('legend_pending')}, {t('legend_returned')}, {t('legend_skipped')}</span>
      </div>
      <span className="text-muted-foreground/40" aria-hidden="true">|</span>
      {SLA_ITEMS.map((item) => (
        <div key={item.key} className="flex items-center gap-2">
          <span className={cn('size-2.5 rounded-full', item.dot)} aria-hidden="true" />
          <span>{t(`legend_${item.key}`)}</span>
        </div>
      ))}
      <span className="text-muted-foreground/40" aria-hidden="true">|</span>
      <div className="flex items-center gap-2">
        <div className="flex items-center" aria-hidden="true">
          <div className="h-0.5 w-4 bg-muted-foreground/50" />
          <div className="size-0 border-y-[5px] border-l-[6px] border-y-transparent border-l-muted-foreground/50 ltr:block rtl:hidden" />
          <div className="size-0 border-y-[5px] border-r-[6px] border-y-transparent border-r-muted-foreground/50 ltr:hidden rtl:block" />
        </div>
        <span>{t('legend_advance')}</span>
      </div>
      <div className="flex items-center gap-2">
        <ArrowLeftRight className="size-4 text-amber-600" aria-hidden="true" />
        <span>{t('legend_return')}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex size-5 items-center justify-center rounded-full border-2 border-emerald-500" aria-hidden="true">
          <Check className="size-3 text-emerald-500" />
        </div>
        <span>{t('legend_terminal')}</span>
      </div>
      {avgCompletionTime !== null && avgCompletionTime !== undefined && (
        <>
          <span className="text-muted-foreground/40" aria-hidden="true">|</span>
          <span className="text-muted-foreground">
            <span className="font-medium text-foreground">{t('legend_avg_time')}:</span>{' '}
            {formatDurationDays(avgCompletionTime)}
          </span>
        </>
      )}
      {totalSla !== null && totalSla !== undefined && (
        <span className="text-muted-foreground">
          <span className="font-medium text-foreground">{t('legend_total_sla')}:</span>{' '}
          {totalSla.value}{formatSlaUnit(totalSla.unit)}
        </span>
      )}
    </div>
  );
}
