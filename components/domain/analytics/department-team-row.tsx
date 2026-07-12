'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { localizeName } from '@/lib/utils/localize';
import type { TeamMember } from './department-dashboard-types';

interface DepartmentTeamRowProps {
  member: TeamMember;
}

export function DepartmentTeamRow({ member }: DepartmentTeamRowProps) {
  const locale = useLocale();
  const t = useTranslations('analytics.department');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const name = localizeName(locale, member.nameAr, member.nameEn);

  function handleClick() {
    const params = new URLSearchParams(searchParams.toString());
    params.set('assigneeId', member.userPublicId);
    params.delete('status');
    params.delete('slaHealth');
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="w-full text-start p-3 rounded-lg border border-border bg-card hover:bg-muted/50 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <div className="flex items-center justify-between gap-4 mb-2">
        <span className="text-sm font-medium text-foreground truncate">{name}</span>
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span>{t('team_active', { count: member.activeAssignments })}</span>
        {member.overdueAssignments > 0 && (
          <span className="text-red-600">{t('team_overdue', { count: member.overdueAssignments })}</span>
        )}
        <span>{t('team_completed', { count: member.completedStages })}</span>
      </div>
    </button>
  );
}
