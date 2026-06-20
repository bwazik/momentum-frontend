'use client';

import { useState, useEffect } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { FileQuestion, Lock } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { useTaskDisplayStore } from '@/lib/stores/use-task-display-store';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  useTaskDetail,
  useTaskSlaHealth,
  useTaskTimeline,
} from '@/lib/api/hooks/use-task-detail';
import { ApiRequestError } from '@/lib/api/client';
import { TaskDetailSkeleton } from './task-detail-skeleton';
import { TitleMetaCard } from './title-meta-card';
import { StageTimeline } from './stage-timeline';
import { DetailsCard } from './details-card';
import { RecentActivityCard } from './recent-activity-card';
import { ActivityEntry } from './activity-entry';
import { mapSlaHealth, buildStageActivities } from './task-detail-utils';

interface TaskDetailProps {
  publicId: string;
}

export function TaskDetail({ publicId }: TaskDetailProps) {
  const locale = useLocale();
  const t = useTranslations('tasks.detail');
  const [showFullTimeline, setShowFullTimeline] = useState(false);
  const setDisplayId = useTaskDisplayStore((s) => s.setDisplayId);
  const detailQuery = useTaskDetail(publicId);
  const slaQuery = useTaskSlaHealth(publicId);
  const timelineQuery = useTaskTimeline(showFullTimeline ? publicId : '');

  useEffect(() => {
    if (detailQuery.data?.display_id) {
      setDisplayId(detailQuery.data.display_id);
    }
  }, [detailQuery.data?.display_id, setDisplayId]);

  if (detailQuery.isLoading) return <TaskDetailSkeleton />;

  if (detailQuery.isError) {
    const error = detailQuery.error;
    if (error instanceof ApiRequestError && error.status === 403) {
      return (
        <EmptyState
          icon={Lock}
          title={t('no_permission_title')}
          description={t('no_permission_description')}
        />
      );
    }
    if (error instanceof ApiRequestError && error.status === 404) {
      return (
        <EmptyState
          icon={FileQuestion}
          title={t('not_found_title')}
          description={t('not_found_description')}
        />
      );
    }
    return (
      <ErrorState
        message={t('error')}
        onRetry={() => detailQuery.refetch()}
      />
    );
  }

  const task = detailQuery.data;
  if (!task) return <TaskDetailSkeleton />;

  const slaHealth = mapSlaHealth(slaQuery.data?.overall_health ?? 'none');
  const stageActivities = buildStageActivities(task.stages);

  return (
    <>
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-5 lg:col-span-2">
        <TitleMetaCard
          task={task}
          slaHealth={slaHealth}
          publicId={publicId}
        />
        <StageTimeline
          stages={task.stages}
          slaTimers={slaQuery.data?.timers}
          taskPublicId={publicId}
          blueprintId={task.blueprint?.public_id}
        />
      </div>
      <div className="space-y-5 lg:col-span-1">
        <div className="space-y-5 lg:sticky lg:top-20">
          <DetailsCard task={task} />
          <RecentActivityCard
            entries={showFullTimeline ? timelineQuery.data : stageActivities}
            isLoading={timelineQuery.isLoading}
            onViewFull={() => setShowFullTimeline(true)}
          />
        </div>
      </div>
    </div>

    <Dialog open={showFullTimeline && !!timelineQuery.data} onOpenChange={(open) => { if (!open) setShowFullTimeline(false); }}>
      <DialogContent className="max-h-[80vh] max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('audit_trail')}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-3 pe-4" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
            {!timelineQuery.data || timelineQuery.data.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('no_activity')}</p>
            ) : (
              timelineQuery.data.map((entry, i) => (
                <ActivityEntry key={i} entry={entry} />
              ))
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
    </>
  );
}
