'use client';

import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Card } from '@/components/ui/card';
import { SlaBadge, PriorityBadge } from '@/components/domain/tasks/task-badges';
import { localizeName } from '@/lib/utils/localize';
import type { AgingReportItem } from './aging-report-types';
import { formatTimeSince, formatDate } from './aging-report-utils';

const SLA_BORDER: Record<string, string> = {
  green: 'border-s-emerald-500',
  amber: 'border-s-amber-500',
  red: 'border-s-red-500',
  grey: 'border-s-slate-400',
  none: 'border-s-zinc-300',
};

interface AgingReportCardProps {
  task: AgingReportItem;
}

export function AgingReportCard({ task }: AgingReportCardProps) {
  const router = useRouter();
  const locale = useLocale();
  const slaKey = (task.sla_health ?? 'none').toLowerCase();

  return (
    <Card
      className={`cursor-pointer border-s-4 p-4 ${SLA_BORDER[slaKey] || ''}`}
      onClick={() => router.push(`/tasks/${task.task_public_id}`)}
      onKeyDown={(e) => { if (e.key === 'Enter') router.push(`/tasks/${task.task_public_id}`); }}
      tabIndex={0}
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <SlaBadge health={task.sla_health} status="active" />
          {task.priority && <PriorityBadge priority={task.priority} />}
        </div>
        <p className="font-medium text-foreground">
          {localizeName(locale, task.title_ar, task.title_en)}
        </p>
        <div className="flex flex-col gap-1 text-xs text-muted-foreground">
          <span>
            {task.current_stage_name_ar || task.current_stage_name_en
              ? localizeName(locale, task.current_stage_name_ar, task.current_stage_name_en)
              : '-'}
          </span>
          <span>
            {formatTimeSince(task.entered_at, locale)}
            {task.created_at && ` · ${formatDate(task.created_at, locale)}`}
          </span>
        </div>
        {task.active_assignees.length > 0 && (
          <div className="flex -space-x-2 rtl:space-x-reverse">
            {task.active_assignees.slice(0, 3).map((a) => {
              const name = localizeName(locale, a.name_ar, a.name_en);
              return (
                <div
                  key={a.public_id}
                  className="flex size-6 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] font-medium"
                  title={name}
                >
                  {name.charAt(0) || '?'}
                </div>
              );
            })}
            {task.active_assignees.length > 3 && (
              <div className="flex size-6 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] font-medium">
                +{task.active_assignees.length - 3}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
