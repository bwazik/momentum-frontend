'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { localizeName } from '@/lib/utils/localize';
import type { DepartmentHealthItem } from './executive-dashboard-types';

interface DepartmentHealthRowProps {
  department: DepartmentHealthItem;
}

const HEALTH_STYLES: Record<string, string> = {
  red: 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950 dark:text-red-400 dark:border-red-800',
  amber: 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800',
  green: 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800',
};

const HEALTH_LABEL_MAP: Record<string, string> = {
  green: 'green',
  amber: 'amber',
  red: 'red',
};

export function DepartmentHealthRow({ department }: DepartmentHealthRowProps) {
  const locale = useLocale();
  const texec = useTranslations('analytics.executive');
  const tsla = useTranslations('tasks.board.sla');
  const name = localizeName(locale, department.departmentNameAr, department.departmentNameEn);
  const total = department.activeTasks;
  const overduePct = total > 0 ? (department.overdueTasks / total) * 100 : 0;
  const atRiskPct = total > 0 ? (department.atRiskTasks / total) * 100 : 0;
  const healthyPct = Math.max(0, 100 - overduePct - atRiskPct);

  return (
    <Link
      href={`/analytics/aging?departmentId=${department.departmentPublicId}`}
      className="block p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <div className="flex items-center justify-between gap-4 mb-2">
        <span className="text-sm font-medium text-foreground min-w-0 truncate">{name}</span>
        <Badge className={HEALTH_STYLES[department.health]}>{tsla(HEALTH_LABEL_MAP[department.health] ?? 'green')}</Badge>
      </div>

      {total > 0 ? (
        <div className="flex h-2 w-full rounded-full overflow-hidden mb-2" role="presentation" aria-label={`${Math.round(healthyPct)}% healthy, ${Math.round(atRiskPct)}% at risk, ${Math.round(overduePct)}% overdue`}>
          {healthyPct > 0 && <div className="bg-emerald-500" style={{ width: `${healthyPct}%` }} />}
          {atRiskPct > 0 && <div className="bg-amber-500" style={{ width: `${atRiskPct}%` }} />}
          {overduePct > 0 && <div className="bg-red-500" style={{ width: `${overduePct}%` }} />}
        </div>
      ) : (
        <div className="h-2 w-full rounded-full bg-muted mb-2" role="presentation" />
      )}

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span>{texec('department_active_label', { count: department.activeTasks })}</span>
        {department.overdueTasks > 0 && <span className="text-red-600">{texec('department_overdue_label', { count: department.overdueTasks })}</span>}
        {department.atRiskTasks > 0 && <span className="text-amber-600">{texec('department_at_risk_label', { count: department.atRiskTasks })}</span>}
      </div>
    </Link>
  );
}
