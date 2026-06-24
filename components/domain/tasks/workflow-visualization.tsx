'use client';

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { FileQuestion, Lock, GitBranch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { useTaskDisplayStore } from '@/lib/stores/use-task-display-store';
import { useTaskDetail, useTaskSlaHealth } from '@/lib/api/hooks/use-task-detail';
import { useBlueprint } from '@/lib/api/hooks/use-blueprints';
import { ApiRequestError } from '@/lib/api/client';
import { WorkflowSkeleton } from './workflow-skeleton';
import { WorkflowGraph } from './workflow-graph';
import { WorkflowLegend } from './workflow-legend';
import { WorkflowTimelineBar } from './workflow-timeline-bar';
import { buildWorkflowNodes, buildWorkflowEdges, computeAvgCompletionTime, computeTotalSla } from './workflow-utils';

interface WorkflowVisualizationProps {
  publicId: string;
}

export function WorkflowVisualization({ publicId }: WorkflowVisualizationProps) {
  const t = useTranslations('tasks.workflow');
  const setDisplayId = useTaskDisplayStore((s) => s.setDisplayId);
  const detailQuery = useTaskDetail(publicId);
  const slaQuery = useTaskSlaHealth(publicId);
  const blueprintInfo = detailQuery.data?.blueprint;
  const blueprintQuery = useBlueprint(blueprintInfo?.public_id ?? '');

  useEffect(() => {
    if (detailQuery.data?.display_id) {
      setDisplayId(detailQuery.data.display_id);
    }
  }, [detailQuery.data?.display_id, setDisplayId]);

  const nodes = useMemo(
    () => (detailQuery.data ? buildWorkflowNodes(detailQuery.data, slaQuery.data?.timers, blueprintQuery.data) : []),
    [detailQuery.data, slaQuery.data?.timers, blueprintQuery.data],
  );
  const edges = useMemo(
    () => (detailQuery.data ? buildWorkflowEdges(nodes, detailQuery.data.blueprint?.transitions) : []),
    [detailQuery.data, nodes],
  );
  const avgCompletionTime = useMemo(
    () => (detailQuery.data ? computeAvgCompletionTime(detailQuery.data.stages) : null),
    [detailQuery.data],
  );
  const totalSla = useMemo(
    () => (detailQuery.data ? computeTotalSla(detailQuery.data.blueprint?.stages) : null),
    [detailQuery.data],
  );

  if (detailQuery.isLoading) return <WorkflowSkeleton />;

  if (detailQuery.isError) {
    const error = detailQuery.error;
    if (error instanceof ApiRequestError && error.status === 403) {
      return <EmptyState icon={Lock} title={t('no_permission_title')} description={t('no_permission_description')} />;
    }
    if (error instanceof ApiRequestError && error.status === 404) {
      return <EmptyState icon={FileQuestion} title={t('not_found_title')} description={t('not_found_description')} />;
    }
    return <ErrorState message={t('error')} onRetry={() => detailQuery.refetch()} />;
  }

  const task = detailQuery.data;
  if (!task) return <WorkflowSkeleton />;

  if (!task.blueprint?.stages?.length) {
    return (
      <EmptyState
        icon={GitBranch}
        title={t('empty_title')}
        description={t('empty_description')}
        action={
          <Button variant="outline" size="sm" asChild>
            <Link href={`/tasks/${publicId}`}>{t('view_details')}</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <WorkflowGraph
        nodes={nodes}
        edges={edges}
        taskPublicId={publicId}
        isTaskCompleted={task.status === 'completed'}
      />
      <WorkflowLegend avgCompletionTime={avgCompletionTime} totalSla={totalSla} />
      <WorkflowTimelineBar
        stages={task.stages}
        blueprintStages={task.blueprint?.stages}
        slaTimers={slaQuery.data?.timers}
      />
    </div>
  );
}
