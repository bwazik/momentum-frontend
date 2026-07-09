'use client';

import { AgingReportCard } from './aging-report-card';
import type { AgingReportItem } from './aging-report-types';

interface AgingReportMobileListProps {
  tasks: AgingReportItem[];
}

export function AgingReportMobileList({ tasks }: AgingReportMobileListProps) {
  return (
    <div className="flex flex-col gap-3" data-testid="aging-report-mobile-list">
      {tasks.map((task) => (
        <AgingReportCard key={task.task_public_id} task={task} />
      ))}
    </div>
  );
}
