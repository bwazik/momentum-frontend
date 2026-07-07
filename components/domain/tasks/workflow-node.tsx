'use client';

import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { localizeName, getStageAssignees, formatSlaInline, formatDuration, timeFmtFromT } from './task-detail-utils';
import { AssigneeAvatarStack } from './assignee-avatar-stack';
import type { WorkflowNodeModel } from './workflow-types';

interface WorkflowNodeProps {
  node: WorkflowNodeModel;
  taskPublicId: string;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
}

const NODE_STYLES: Record<string, { border: string; badge: string }> = {
  completed: {
    border: 'border-s-emerald-500',
    badge: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400',
  },
  pending: {
    border: 'border-s-slate-300',
    badge: 'bg-slate-100 text-slate-400 dark:bg-slate-900 dark:text-slate-400',
  },
  returned: {
    border: 'border-s-slate-300',
    badge: 'bg-slate-100 text-slate-400 dark:bg-slate-900 dark:text-slate-400',
  },
  skipped: {
    border: 'border-s-slate-300',
    badge: 'bg-slate-100 text-slate-400 dark:bg-slate-900 dark:text-slate-400',
  },
};

function getActiveNodeClasses(): { border: string; badge: string } {
  return {
    border: 'border-s-blue-500',
    badge: 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
  };
}

function formatSlaUnit(unit: string, t: (key: string) => string): string {
  const isHours = unit === 'hours' || unit === '1';
  return t(isHours ? 'sla_unit_hours' : 'sla_unit_days');
}

function WorkflowNodeSla({ node }: { node: WorkflowNodeModel }) {
  const t = useTranslations('tasks.workflow');
  const td = useTranslations('tasks.detail');
  const fmt = timeFmtFromT(td);

  const slaPolicy = node.slaTimer?.sla_policy ?? node.blueprintStage.sla_policy;
  const slaPolicyLabel = slaPolicy ? `${t('sla')}: ${slaPolicy.sla_value} ${formatSlaUnit(slaPolicy.sla_unit, t)}` : null;

  if (node.isActive && node.slaTimer) {
    const text = formatSlaInline(node.slaTimer, fmt);
    return (
      <p
        className={cn(
          'text-xs',
          text?.includes(fmt.overduePrefix)
            ? 'text-red-600 dark:text-red-400'
            : text?.includes(fmt.atRisk)
              ? 'text-amber-600 dark:text-amber-400'
              : 'text-emerald-600 dark:text-emerald-400',
        )}
        aria-live="polite"
      >
        {slaPolicyLabel && <span className="text-muted-foreground">{slaPolicyLabel} — </span>}
        {text ?? t('sla_no_policy')}
      </p>
    );
  }

  if (slaPolicy) {
    return (
      <p className="text-xs text-muted-foreground">
        {t('sla')}: {slaPolicy.sla_value} {formatSlaUnit(slaPolicy.sla_unit, t)}
      </p>
    );
  }

  return <p className="text-xs text-muted-foreground">{t('sla_no_policy')}</p>;
}

function WorkflowNodeTooltip({ node }: { node: WorkflowNodeModel }) {
  const locale = useLocale();
  const t = useTranslations('tasks.workflow');
  const td = useTranslations('tasks.detail');
  const fmt = timeFmtFromT(td);
  const entered = node.instance?.entered_at ? new Intl.DateTimeFormat(locale, { dateStyle: 'short', timeStyle: 'short' }).format(new Date(node.instance.entered_at)) : null;
  const exited = node.instance?.exited_at ? new Intl.DateTimeFormat(locale, { dateStyle: 'short', timeStyle: 'short' }).format(new Date(node.instance.exited_at)) : null;
  const duration = node.instance ? formatDuration(node.instance.entered_at, node.instance.exited_at ?? null, fmt) : null;
  const assignees = node.instance ? getStageAssignees(node.instance.assignments) : [];

  const hasData = entered || exited || duration || assignees.length > 0;

  if (!hasData) {
    return <p className="text-xs">{t('tooltip_not_started')}</p>;
  }

  return (
    <div className="space-y-1 text-xs">
      {entered && <p>{t('tooltip_entered')}: {entered}</p>}
      {exited && <p>{t('tooltip_exited')}: {exited}</p>}
      {duration && <p>{t('tooltip_duration')}: {duration}</p>}
      {assignees.length > 0 && (
        <p>{t('tooltip_assignees')}: {assignees.map((a) => localizeName(locale, a.user_name_ar, a.user_name_en)).join(', ')}</p>
      )}
    </div>
  );
}

export function WorkflowNode({ node, taskPublicId, isSelected, onSelect }: WorkflowNodeProps) {
  const locale = useLocale();
  const t = useTranslations('tasks.workflow');
  const styles = node.status === 'active'
    ? getActiveNodeClasses()
    : (NODE_STYLES[node.status] ?? NODE_STYLES.pending);
  const name = localizeName(locale, node.blueprintStage.name_ar, node.blueprintStage.name_en);
  const stageType = node.blueprintStage.stage_type
    ? localizeName(locale, node.blueprintStage.stage_type.name_ar, node.blueprintStage.stage_type.name_en)
    : '';
  const assignees = node.instance ? getStageAssignees(node.instance.assignments) : [];

  const detailHref = node.instance
    ? `/tasks/${taskPublicId}#stage-${node.instance.instance_id}`
    : `/tasks/${taskPublicId}`;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          data-workflow-node
          href={detailHref}
          onClick={() => onSelect?.(node.blueprintStage.public_id)}
          className={cn(
            'group flex w-full md:w-56 shrink-0 flex-col gap-2 rounded-xl border-2 border-s-4 bg-card p-4 text-start shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20',
            styles.border,
            isSelected && 'ring-2 ring-primary/30',
          )}
          aria-label={t('stage_node_label', { name, status: t(`status_${node.status}`) })}
        >
          <div className="flex items-start justify-between gap-2">
            <Badge variant="outline" className={cn('gap-1.5 text-xs', styles.badge)}>
              {node.status === 'active' && (
                <span className="size-1.5 animate-pulse motion-reduce:animate-none rounded-full bg-blue-500" aria-hidden="true" />
              )}
              {t(`status_${node.status}`)}
            </Badge>
            <span className="text-xs text-muted-foreground">{t('stage_n', { n: node.sequenceOrder })}</span>
          </div>

          <p className={cn('text-sm font-semibold', (node.status === 'pending' || node.status === 'skipped') && 'text-muted-foreground')}>
            {name}
            {stageType && <span className="text-xs text-muted-foreground"> — {stageType}</span>}
          </p>

          {assignees.length > 0 && (
            <div className="flex items-center gap-2">
              <AssigneeAvatarStack assignments={assignees} max={2} />
              <span className="truncate text-xs text-muted-foreground">
                {assignees.map((a) => localizeName(locale, a.user_name_ar, a.user_name_en)).join(', ')}
              </span>
            </div>
          )}

          <WorkflowNodeSla node={node} />

          {node.isActive && node.instance?.sub_stages && node.instance.sub_stages.length > 0 && (
            <div className="mt-1 space-y-1 border-t pt-2">
              {node.instance.sub_stages.slice(0, 3).map((sub) => (
                <div key={sub.instance_id} className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="truncate">
                    {localizeName(locale, sub.blueprint_sub_stage.name_ar, sub.blueprint_sub_stage.name_en)}
                  </span>
                  {sub.status === 'completed' ? (
                    <Check className="size-3 text-emerald-500" aria-hidden="true" />
                  ) : sub.status === 'active' ? (
                    <span className="size-1.5 animate-pulse motion-reduce:animate-none rounded-full bg-blue-500" aria-hidden="true" />
                  ) : (
                    <span className="inline-block size-1.5 rounded-full border border-slate-300" aria-hidden="true" />
                  )}
                </div>
              ))}
              {node.instance.sub_stages.length > 3 && (
                <div className="text-xs text-muted-foreground">
                  +{t('more_sub_stages', { n: node.instance.sub_stages.length - 3 })}
                </div>
              )}
            </div>
          )}
        </Link>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <WorkflowNodeTooltip node={node} />
      </TooltipContent>
    </Tooltip>
  );
}
