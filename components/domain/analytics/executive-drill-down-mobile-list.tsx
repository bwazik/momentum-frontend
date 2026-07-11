'use client';

import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Card } from '@/components/ui/card';
import { SlaBadge, PriorityBadge } from '@/components/domain/tasks/task-badges';
import { localizeName } from '@/lib/utils/localize';
import type { DrillDownTaskItem } from './executive-dashboard-types';
import { formatDate } from './aging-report-utils';

interface ExecutiveDrillDownMobileListProps {
  tasks: DrillDownTaskItem[];
}

export function ExecutiveDrillDownMobileList({ tasks }: ExecutiveDrillDownMobileListProps) {
  const router = useRouter();
  const locale = useLocale();

  return (
    <div className="flex flex-col gap-3" data-testid="drill-down-mobile-list">
      {tasks.map((task) => {
        const name = localizeName(locale, task.titleAr, task.titleEn);
        const stage = localizeName(locale, task.currentStageNameAr, task.currentStageNameEn) || '-';
        return (
          <Card
            key={task.taskPublicId}
            className="p-4 cursor-pointer transition-colors hover:bg-muted/50"
            tabIndex={0}
            onClick={() => router.push(`/tasks/${task.taskPublicId}`)}
            onKeyDown={(e) => { if (e.key === 'Enter') router.push(`/tasks/${task.taskPublicId}`); }}
          >
            <div className="flex items-center gap-3 mb-2">
              <SlaBadge health={task.slaHealth} status={task.status} />
              <span className="text-sm font-medium truncate">{name}</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {task.priority ? <PriorityBadge priority={task.priority} /> : <span>-</span>}
              <span>{stage}</span>
              <span>{formatDate(task.createdAt, locale)}</span>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
