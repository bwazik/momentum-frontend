'use client';

import { useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { localizeName } from '@/lib/utils/localize';
import type { TaskStageInstanceResource, SlaTimerInstanceResource, BlueprintStageResource } from './workflow-types';

interface TimelineDayViewProps {
  stages?: TaskStageInstanceResource[];
  blueprintStages?: BlueprintStageResource[];
  slaTimers?: SlaTimerInstanceResource[];
}

interface Segment {
  stageName: string;
  startDay: number;
  endDay: number;
  deadlineDay?: number;
  color: string;
  textColor: string;
  label: string;
  durationLabel: string;
  isOverdue: boolean;
}

function buildSegments(
  stages: TaskStageInstanceResource[],
  blueprintStages: BlueprintStageResource[] | undefined,
  slaTimers: SlaTimerInstanceResource[] | undefined,
  locale: string,
  t: (key: string) => string,
): Segment[] {
  const blueprintMap = new Map((blueprintStages ?? []).map((s) => [s.public_id, s]));
  const timerMap = new Map(
    (slaTimers ?? []).filter((t) => !t.sub_stage_instance_id).map((t) => [t.stage_instance_id, t]),
  );

  const sorted = [...stages].sort(
    (a, b) => new Date(a.entered_at || 0).getTime() - new Date(b.entered_at || 0).getTime(),
  );
  if (sorted.length === 0) return [];

  const startDate = new Date(sorted[0].entered_at).getTime();

  const segments: Segment[] = [];
  let lastEndDay = 0;
  const durDays = (s: number, e: number) =>
    Math.floor(e - s) < 1 ? `${Math.round((e - s) * 24)} ${t('legend_hours')}` : `${Math.floor(e - s)} ${t('legend_days')}`;

  for (const stage of sorted) {
    const bpStage = stage.blueprint_stage.public_id ? blueprintMap.get(stage.blueprint_stage.public_id) : undefined;
    const timer = timerMap.get(stage.instance_id);
    const name = localizeName(locale, stage.blueprint_stage.name_ar ?? '', stage.blueprint_stage.name_en ?? '');

    if (stage.status === 'completed' && stage.entered_at && stage.exited_at) {
      const start = (new Date(stage.entered_at).getTime() - startDate) / 86400000;
      const end = (new Date(stage.exited_at).getTime() - startDate) / 86400000;
      segments.push({
        stageName: name, startDay: start, endDay: end,
        color: 'bg-emerald-100', textColor: 'text-emerald-700',
        label: `${t('timeline_day')} ${Math.round(start)}-${Math.round(end)}`,
        durationLabel: durDays(start, end), isOverdue: false,
      });
      lastEndDay = end;
    } else if (stage.status === 'active' && stage.entered_at) {
      const start = (new Date(stage.entered_at).getTime() - startDate) / 86400000;
      const now = (Date.now() - startDate) / 86400000;
      const deadline = timer?.deadline_at ? (new Date(timer.deadline_at).getTime() - startDate) / 86400000 : undefined;
      const isOverdue = timer?.status === 'breached' || (deadline !== undefined && now > deadline);
      const isWarning = timer?.status === 'warning';
      segments.push({
        stageName: name, startDay: start, endDay: now, deadlineDay: deadline,
        color: isOverdue ? 'bg-red-100' : isWarning ? 'bg-amber-100' : 'bg-blue-100',
        textColor: isOverdue ? 'text-red-700' : isWarning ? 'text-amber-700' : 'text-blue-700',
        label: `${t('timeline_day')} ${Math.round(start)}-${Math.round(now)}`,
        durationLabel: durDays(start, now), isOverdue,
      });
      lastEndDay = now;
    } else if (stage.status === 'returned' && stage.entered_at && stage.exited_at) {
      const start = (new Date(stage.entered_at).getTime() - startDate) / 86400000;
      const end = (new Date(stage.exited_at).getTime() - startDate) / 86400000;
      segments.push({
        stageName: name, startDay: start, endDay: end,
        color: 'bg-slate-100', textColor: 'text-slate-500',
        label: `${t('timeline_day')} ${Math.round(start)}-${Math.round(end)}`,
        durationLabel: durDays(start, end), isOverdue: false,
      });
      lastEndDay = end;
    }
  }

  return segments;
}

export function WorkflowTimelineBar({ stages, blueprintStages, slaTimers }: TimelineDayViewProps) {
  const locale = useLocale();
  const t = useTranslations('tasks.workflow');

  const segments = useMemo(
    () => (stages ? buildSegments(stages, blueprintStages, slaTimers, locale, t) : []),
    [stages, blueprintStages, slaTimers, locale, t],
  );

  if (segments.length === 0) return null;

  const totalDays = Math.max(...segments.map((s) => s.endDay), 1);
  const firstDate = stages?.[0]?.entered_at;
  const todayDay = firstDate ? (Date.now() - new Date(firstDate).getTime()) / 86400000 : NaN;

  return (
    <div className="rounded-xl border bg-card p-5">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
        {t('timeline_title')}
      </h3>
      <div className="relative h-8">
        <div className="absolute inset-0 flex rounded-md overflow-hidden">
          {segments.map((seg, i) => (
            <div
              key={i}
              className={cn('flex items-center justify-center text-[10px] font-medium border-e border-white last:border-e-0', seg.color, seg.textColor)}
              style={{ width: `${((seg.endDay - seg.startDay) / totalDays) * 100}%` }}
            >
              {seg.label}
            </div>
          ))}
        </div>
        {segments.map((seg, i) =>
          seg.deadlineDay !== undefined ? (
            <div
              key={`dl-${i}`}
              className="absolute top-0 bottom-0 border-dashed border-s border-foreground/40"
              style={{ insetInlineStart: `${(seg.deadlineDay / totalDays) * 100}%` }}
              aria-hidden="true"
            />
          ) : null
        )}
        
      </div>
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-4 text-[10px] text-muted-foreground flex-wrap">
          {segments.map((seg, i) => (
            <span key={i} className={cn(seg.textColor)}>
              ● {seg.stageName} ({seg.durationLabel}){seg.isOverdue ? ' ⚠' : ''}
            </span>
          ))}
        </div>
        {!isNaN(todayDay) && (
          <span className="text-[10px] text-muted-foreground shrink-0">
            {t('timeline_today')}: {t('timeline_day')} {Math.round(todayDay)}
          </span>
        )}
      </div>
    </div>
  );
}
