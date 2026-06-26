'use client';

import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { ShieldAlert, AlertTriangle, Clock, PhoneCall } from 'lucide-react';
import { cn } from '@/lib/utils';
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

  const cards = [
    { label: t('scope'), value: active, sub: scopeLabel, icon: Clock, border: '' },
    { label: t('at_risk'), value: atRisk, sub: t('at_risk_sub'), icon: AlertTriangle, border: 'border-amber-200 dark:border-amber-800' },
    { label: t('overdue'), value: overdue, sub: t('overdue_sub'), icon: ShieldAlert, border: 'border-red-200 dark:border-red-800' },
    { label: t('today'), value: actionsTodayCount, sub: t('today_sub'), icon: PhoneCall, border: '' },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((c) => (
        <Card
          key={c.label}
          className={cn(
            'p-5 transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 motion-reduce:hover:translate-y-0',
            c.border && 'border-s-4',
            c.border,
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{c.label}</p>
              <p className="mt-1 text-2xl font-bold text-foreground">{c.value}</p>
              <p className="text-xs text-muted-foreground">{c.sub}</p>
            </div>
            <c.icon className="size-5 text-muted-foreground/50" aria-hidden="true" />
          </div>
        </Card>
      ))}
    </div>
  );
}
