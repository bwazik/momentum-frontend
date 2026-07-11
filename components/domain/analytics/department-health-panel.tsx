'use client';

import { useTranslations } from 'next-intl';
import { DepartmentHealthRow } from './department-health-row';
import type { DepartmentHealthItem } from './executive-dashboard-types';

interface DepartmentHealthPanelProps {
  departments: DepartmentHealthItem[];
}

export function DepartmentHealthPanel({ departments }: DepartmentHealthPanelProps) {
  const t = useTranslations('analytics.executive');
  return (
    <section data-testid="department-health-panel">
      <h2 className="text-base font-semibold text-foreground mb-3">{t('panel_department_health')}</h2>
      <div className="flex flex-col gap-2">
        {departments.map((dept) => (
          <DepartmentHealthRow key={dept.departmentPublicId} department={dept} />
        ))}
      </div>
    </section>
  );
}
