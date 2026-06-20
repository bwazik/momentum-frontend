'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StageTimelineNode } from './stage-timeline-node';
import type {
  TaskStageInstanceResource,
  SlaTimerInstanceResource,
} from './task-detail-types';

interface StageTimelineProps {
  stages?: TaskStageInstanceResource[];
  slaTimers?: SlaTimerInstanceResource[];
  taskPublicId: string;
  blueprintId?: string;
}

export function StageTimeline({
  stages,
  slaTimers,
  taskPublicId,
  blueprintId,
}: StageTimelineProps) {
  const t = useTranslations('tasks.detail');

  const sorted = useMemo(() => {
    if (!stages || stages.length === 0) return [];
    return [...stages].sort(
      (a, b) =>
        new Date(a.entered_at).getTime() -
        new Date(b.entered_at).getTime(),
    );
  }, [stages]);

  if (!stages || stages.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('stage_timeline')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t('no_stages')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('stage_timeline')}</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="relative space-y-6 [--timeline-line:17px] before:absolute before:start-[17px] before:top-2 before:bottom-2 before:w-0.5 before:bg-border before:pointer-events-none">
          {sorted.map((stage, i) => (
            <StageTimelineNode
              key={`${stage.blueprint_stage.public_id}-${i}`}
              stage={stage}
              index={i}
              slaTimers={slaTimers}
              taskPublicId={taskPublicId}
              blueprintId={blueprintId}
            />
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
