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
  useTaskMetadata,
  useAccessOverride,
} from '@/lib/api/hooks/use-task-detail';
import { ApiRequestError } from '@/lib/api/client';
import { TaskDetailSkeleton } from './task-detail-skeleton';
import { TitleMetaCard } from './title-meta-card';
import { StageTimeline } from './stage-timeline';
import { DetailsCard } from './details-card';
import { RecentActivityCard } from './recent-activity-card';
import { ActivityEntry } from './activity-entry';
import { TaskCommentsCard } from './task-comments-card';
import { TaskDocumentsCard } from './task-documents-card';
import { TaskExternalReferencesCard } from './task-external-references-card';
import { ConfidentialParticipantsCard } from './confidential-participants-card';
import { ConfidentialMetadataPage } from './confidential-metadata-page';
import { TaskOverrideSession } from './task-override-session';
import { AccessOverrideDialog } from './access-override-dialog';
import { TaskMetadataSkeleton } from './task-metadata-skeleton';
import { mapSlaHealth, buildStageActivities } from './task-detail-utils';
import type { components } from '@/lib/generated/api-types';

type TaskDetailResource = components['schemas']['TaskDetailResource'];

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
  const metadataQuery = useTaskMetadata(publicId);
  const override = useAccessOverride(publicId);
  const [overrideDialogOpen, setOverrideDialogOpen] = useState(false);
  const [overrideState, setOverrideState] = useState<{ active: boolean; reason: string; task: TaskDetailResource | null }>({ active: false, reason: '', task: null });

  useEffect(() => {
    if (detailQuery.data?.display_id) {
      setDisplayId(detailQuery.data.display_id);
    }
  }, [detailQuery.data?.display_id, setDisplayId]);

  if (detailQuery.isLoading) return <TaskDetailSkeleton />;

  // Override session bypasses 403 — render full detail with amber banner
  if (overrideState.active && overrideState.task) {
    const overrideTask = overrideState.task;
    const overrideSlaHealth = mapSlaHealth(slaQuery.data?.overall_health ?? 'none');
    const overrideIsConf = String(overrideTask.classification_level ?? '') === '3' || String(overrideTask.classification_level ?? '') === 'confidential';
    const overrideActivities = buildStageActivities(overrideTask.stages);
    return (
      <TaskOverrideSession reason={overrideState.reason}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            <TitleMetaCard task={overrideTask} slaHealth={overrideSlaHealth} publicId={publicId} />
            <StageTimeline stages={overrideTask.stages} slaTimers={slaQuery.data?.timers} blueprintStages={overrideTask.blueprint?.stages} taskPublicId={publicId} blueprintId={overrideTask.blueprint?.public_id} />
            <TaskCommentsCard publicId={publicId} />
          </div>
          <div className="space-y-5 lg:col-span-1">
            <div className="space-y-5 lg:sticky lg:top-20">
              <DetailsCard task={overrideTask} />
              {overrideIsConf && <ConfidentialParticipantsCard taskPublicId={publicId} initiatorId={overrideTask.initiator_id} />}
              <TaskExternalReferencesCard publicId={publicId} />
              <TaskDocumentsCard publicId={publicId} />
              <RecentActivityCard entries={showFullTimeline ? timelineQuery.data : overrideActivities} isLoading={timelineQuery.isLoading} onViewFull={() => setShowFullTimeline(true)} />
            </div>
          </div>
        </div>
      </TaskOverrideSession>
    );
  }

  if (detailQuery.isError) {
    const error = detailQuery.error;
    if (error instanceof ApiRequestError && error.status === 403) {
      if (metadataQuery.isLoading) return <TaskMetadataSkeleton />;
      if (metadataQuery.isError) {
        const metaErr = metadataQuery.error;
        if (metaErr instanceof ApiRequestError) {
          if (metaErr.status === 404) {
            return (
              <EmptyState
                icon={FileQuestion}
                title={t('not_found_title')}
                description={t('not_found_description')}
              />
            );
          }
          if (metaErr.status === 403) {
            return (
              <EmptyState
                icon={Lock}
                title={t('no_permission_title')}
                description={t('no_permission_description')}
              />
            );
          }
        }
        return (
          <ErrorState
            message={t('error')}
            onRetry={() => metadataQuery.refetch()}
          />
        );
      }
      if (!metadataQuery.data) return <TaskMetadataSkeleton />;
      return (
        <>
          <ConfidentialMetadataPage
            metadata={metadataQuery.data}
            taskPublicId={publicId}
            onRequestOverride={() => setOverrideDialogOpen(true)}
          />
          <AccessOverrideDialog
            open={overrideDialogOpen}
            onOpenChange={setOverrideDialogOpen}
            isPending={override.isPending}
            onConfirm={(reason) => {
              override.mutate({ reason }, {
                onSuccess: (data) => {
                  setOverrideState({ active: true, reason, task: data });
                  setOverrideDialogOpen(false);
                },
              });
            }}
          />
        </>
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

  if (!detailQuery.data) return <TaskDetailSkeleton />;

  const task = detailQuery.data;
  const slaHealth = mapSlaHealth(slaQuery.data?.overall_health ?? 'none');
  const isConfidential = String(task.classification_level ?? '') === '3' || String(task.classification_level ?? '') === 'confidential';
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
          blueprintStages={task.blueprint?.stages}
          taskPublicId={publicId}
          blueprintId={task.blueprint?.public_id}
        />
        <TaskCommentsCard publicId={publicId} />
      </div>
      <div className="space-y-5 lg:col-span-1">
        <div className="space-y-5 lg:sticky lg:top-20">
          <DetailsCard task={task} />
          {isConfidential && (
            <ConfidentialParticipantsCard taskPublicId={publicId} initiatorId={task.initiator_id} />
          )}
          <TaskExternalReferencesCard publicId={publicId} />
          <TaskDocumentsCard publicId={publicId} />
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
