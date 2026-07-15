'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClassificationBadge, TaskStatusBadge } from './task-badges';
import { DualDateDisplay } from '@/components/shared/dual-date-display';
import { localizeName } from '@/lib/utils/localize';
import type { TaskDetailResource } from './task-detail-types';

interface DetailsCardProps {
  task: TaskDetailResource;
}

export function DetailsCard({ task }: DetailsCardProps) {
  const locale = useLocale();
  const t = useTranslations('tasks.detail');
  const totalStages = task.blueprint?.stages?.length ?? task.stages?.length ?? 0;
  const completedCount =
    task.stages?.filter((s) => s.status === 'completed').length ?? 0;
  const stageLabel =
    task.status === 'completed' ? t('completed') :
    task.status === 'cancelled' ? t('cancelled') :
    task.status === 'suspended' ? t('suspended') :
    t('active');
  const stageCount =
    task.status === 'completed' || task.status === 'cancelled'
      ? completedCount
      : completedCount + 1;
  const stageProgress =
    totalStages > 0 && task.status !== 'draft'
      ? `${stageLabel} — ${stageCount} ${t('of')} ${totalStages}`
      : null;
  const initiatorName = localizeName(locale, task.initiator_name_ar, task.initiator_name_en) || task.initiator_id || '-';
  const activeStage = task.stages?.find((s) => s.status === 'active');
  const departmentName = activeStage
    ? localizeName(locale, activeStage.department_name_ar, activeStage.department_name_en)
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t('details')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="space-y-3">
          <DetailRow
            label={t('status')}
            value={<TaskStatusBadge status={task.status} />}
          />
          {stageProgress && (
            <DetailRow label={t('stage_progress')} value={stageProgress} />
          )}
          <DetailRow label={t('initiator')} value={initiatorName} />
          <DetailRow
            label={t('blueprint')}
            value={
              task.blueprint
                ? localizeName(
                    locale,
                    task.blueprint.name_ar,
                    task.blueprint.name_en,
                  )
                : '-'
            }
          />
          {departmentName && (
            <DetailRow label={t('department')} value={departmentName} />
          )}
          <DetailRow
            label={t('created')}
            value={<DualDateDisplay gregorian={task.created_at} hijri={task.created_at_hijri} />}
          />
          <DetailRow
            label={t('due_date')}
            value={task.due_date ? <DualDateDisplay gregorian={task.due_date} hijri={task.due_date_hijri} /> : '-'}
          />
          <DetailRow
            label={t('confidentiality')}
            value={<ClassificationBadge level={task.classification_level} />}
          />
          {task.suspended_at && (
            <DetailRow label={t('suspended_at')} value={<DualDateDisplay gregorian={task.suspended_at} />} />
          )}
          {task.suspension_reason && (
            <DetailRow
              label={t('suspension_reason')}
              value={task.suspension_reason}
            />
          )}
          {task.cancelled_at && (
            <DetailRow label={t('cancelled_at')} value={<DualDateDisplay gregorian={task.cancelled_at} />} />
          )}
          {task.cancellation_reason && (
            <DetailRow
              label={t('cancellation_reason')}
              value={task.cancellation_reason}
            />
          )}
        </dl>
      </CardContent>
    </Card>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-[10px] uppercase text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm text-foreground">{value}</dd>
    </div>
  );
}
