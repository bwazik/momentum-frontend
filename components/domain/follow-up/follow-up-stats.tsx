'use client';

import { useTranslations } from 'next-intl';
import { ShieldAlert, AlertTriangle, Clock, PhoneCall } from 'lucide-react';
import { StatCard } from '@/components/shared/stat-card';
import type { BoardTaskResource } from './follow-up-types';

interface FollowUpStatsProps {
  tasks: BoardTaskResource[];
  actionsTodayCount: number;
  scopeLabel: string;
}

export function FollowUpStats({ tasks, actionsTodayCount, scopeLabel }: FollowUpStatsProps) {
  const t = useTranslations('followUp.stats');
  const active = tasks.length;
  const atRisk = tasks.filter((x) => (x.sla_health ?? '').toLowerCase() === 'amber').length;
  const overdue = tasks.filter((x) => (x.sla_health ?? '').toLowerCase() === 'red').length;

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard
        label={t('scope')}
        value={active}
        icon={Clock}
        subtitle={scopeLabel}
        iconVariant="muted"
        valueSize="2xl"
      />
      <StatCard
        label={t('at_risk')}
        value={atRisk}
        icon={AlertTriangle}
        subtitle={t('at_risk_sub')}
        variant="amber"
        iconVariant="boxed"
        valueSize="2xl"
      />
      <StatCard
        label={t('overdue')}
        value={overdue}
        icon={ShieldAlert}
        subtitle={t('overdue_sub')}
        variant="red"
        iconVariant="boxed"
        valueSize="2xl"
      />
      <StatCard
        label={t('today')}
        value={actionsTodayCount}
        icon={PhoneCall}
        subtitle={t('today_sub')}
        iconVariant="muted"
        valueSize="2xl"
      />
    </div>
  );
}
