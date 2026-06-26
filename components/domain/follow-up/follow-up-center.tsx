'use client';

import { useCallback, useMemo, useState } from 'react';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Lock } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useCapabilities, useCapability } from '@/lib/api/hooks/use-capabilities';
import { useCurrentUser } from '@/lib/api/hooks/use-auth';
import { FollowUpBoardSkeleton } from './follow-up-board-skeleton';
import { useFollowUpBoardInfinite } from '@/lib/api/hooks/use-follow-up';
import { readBoardFilters, toBoardQuery } from './follow-up-utils';
import { FollowUpStats } from './follow-up-stats';
import { FollowUpAlertBanner } from './follow-up-alert-banner';
import { FollowUpFilters } from './follow-up-filters';
import { FollowUpBoard } from './follow-up-board';
import { BottleneckPanel } from './bottleneck-panel';
import { RecentActionsPanel } from './recent-actions-panel';
import { EscalationsPanel } from './escalations-panel';
import { LogFollowUpDialog } from './log-follow-up-dialog';
import { EscalateDialog } from './escalate-dialog';
import { ResolveEscalationDialog } from './resolve-escalation-dialog';
import type { BoardTaskResource } from './follow-up-types';

export function FollowUpCenter() {
  const t = useTranslations('followUp');
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { data: user } = useCurrentUser();
  const capsQuery = useCapabilities(user?.public_id);
  const canViewOrg = useCapability('task.view.organization');
  const canViewFollowUp = useCapability('task.view.follow_up_scope');
  const canViewDept = useCapability('task.view.department_touched');
  const canView = canViewOrg || canViewFollowUp || canViewDept;

  const urlFilters = useMemo(() => readBoardFilters(searchParams), [searchParams]);
  const apiFilters = useMemo(
    () => toBoardQuery(urlFilters, user?.public_id),
    [urlFilters, user?.public_id],
  );

  const boardQuery = useFollowUpBoardInfinite(apiFilters);

  const [logTask, setLogTask] = useState<BoardTaskResource | null>(null);
  const [escalateTask, setEscalateTask] = useState<BoardTaskResource | null>(null);
  const [resolveEscalationId, setResolveEscalationId] = useState<string | null>(null);
  const [actionsTodayCount, setActionsTodayCount] = useState(0);

  const allTasks = useMemo(() => {
    const seen = new Set<string>();
    return (boardQuery.data?.pages.flatMap((p) => p.data) ?? []).filter((task) => {
      if (seen.has(task.public_id)) return false;
      seen.add(task.public_id);
      return true;
    });
  }, [boardQuery.data]);

  const overdueCount = useMemo(
    () => allTasks.filter((x) => (x.sla_health ?? '').toLowerCase() === 'red').length,
    [allTasks],
  );

  const applyFilter = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.replace(`${pathname}?${params.toString()}`);
  }, [searchParams, pathname, router]);

  if (capsQuery.isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <FollowUpBoardSkeleton />
        </div>
        <aside className="flex flex-col gap-6 lg:sticky lg:top-20 lg:self-start">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-4 w-40" /></CardHeader>
              <CardContent><Skeleton className="h-48 rounded-xl" /></CardContent>
            </Card>
          ))}
        </aside>
      </div>
    );
  }

  if (!canView) {
    return (
      <EmptyState
        icon={Lock}
        title={t('no_permission_title')}
        description={t('no_permission_description')}
      />
    );
  }

  const scopeLabel = canViewOrg ? t('scope_organization') : t('scope_monitoring');

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="flex flex-col gap-6 lg:col-span-2">
        <FollowUpStats tasks={allTasks} actionsTodayCount={actionsTodayCount} scopeLabel={scopeLabel} />
        <FollowUpAlertBanner
          overdueCount={overdueCount}
          onApplyOverdue={() => applyFilter('status', 'overdue')}
        />
        <FollowUpFilters filters={urlFilters} />
        <FollowUpBoard
          allTasks={allTasks}
          query={boardQuery}
          onLogFollowUp={setLogTask}
          onEscalate={setEscalateTask}
        />
      </div>
      <aside className="flex flex-col gap-6 lg:sticky lg:top-20 lg:self-start">
        <BottleneckPanel />
        <RecentActionsPanel onTodayCount={setActionsTodayCount} />
        <EscalationsPanel onResolve={setResolveEscalationId} />
      </aside>

      {logTask && (
        <LogFollowUpDialog
          task={logTask}
          open={!!logTask}
          onOpenChange={(o) => { if (!o) setLogTask(null); }}
        />
      )}
      {escalateTask && (
        <EscalateDialog
          task={escalateTask}
          open={!!escalateTask}
          onOpenChange={(o) => { if (!o) setEscalateTask(null); }}
        />
      )}
      {resolveEscalationId && (
        <ResolveEscalationDialog
          escalationPublicId={resolveEscalationId}
          open={!!resolveEscalationId}
          onOpenChange={(o) => { if (!o) setResolveEscalationId(null); }}
        />
      )}
    </div>
  );
}
