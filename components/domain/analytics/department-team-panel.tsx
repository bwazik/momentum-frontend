'use client';

import { useTranslations } from 'next-intl';
import { DepartmentTeamRow } from './department-team-row';
import type { TeamMember } from './department-dashboard-types';

interface DepartmentTeamPanelProps {
  members: TeamMember[];
}

export function DepartmentTeamPanel({ members }: DepartmentTeamPanelProps) {
  const t = useTranslations('analytics.department');
  return (
    <section data-testid="department-team-panel">
      <h2 className="text-base font-semibold text-foreground mb-3">{t('panel_team')}</h2>
      <div className="flex flex-col gap-2">
        {members.map((member) => (
          <DepartmentTeamRow key={member.userPublicId} member={member} />
        ))}
      </div>
    </section>
  );
}
