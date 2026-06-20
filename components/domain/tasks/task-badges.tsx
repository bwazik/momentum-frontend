'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Shield, Lock, Globe } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { localizeName } from './task-board-utils';

const SLA_STYLES: Record<string, string> = {
  green: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
  red: 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400',
  grey: 'bg-slate-50 text-slate-500 dark:bg-slate-900 dark:text-slate-400',
  none: 'bg-muted text-muted-foreground',
} as const;

const STATUS_VARIANTS: Record<string, string> = {
  draft: 'text-zinc-500 border-zinc-300 dark:text-zinc-500 dark:border-zinc-700',
  active: 'text-blue-600 border-blue-300 dark:text-blue-400 dark:border-blue-700',
  suspended: 'text-orange-600 border-orange-300 dark:text-orange-400 dark:border-orange-700',
  completed: 'text-teal-600 border-teal-300 dark:text-teal-400 dark:border-teal-700',
  cancelled: 'text-rose-600 border-rose-300 dark:text-rose-400 dark:border-rose-700',
} as const;

const PRIORITY_DOT: Record<string, string> = {
  critical: 'bg-red-500',
  urgent: 'bg-amber-500',
  routine: 'bg-transparent',
} as const;

export function SlaBadge({ health, status }: { health?: string | null; status?: string | null }) {
  const t = useTranslations('tasks.board.sla');
  const effective = status === 'completed' || status === 'cancelled' ? 'none' : health;
  const raw = (effective ?? '').toLowerCase();
  const value: string = raw === 'green' || raw === 'amber' || raw === 'red' || raw === 'grey' || raw === 'none' ? raw : 'none';

  return (
    <Badge
      variant="outline"
      role="status"
      className={cn('gap-1.5', SLA_STYLES[value])}
    >
      {value !== 'none' && (
        <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      )}
      {t(value)}
    </Badge>
  );
}

export function TaskStatusBadge({ status }: { status?: string | null }) {
  const t = useTranslations('tasks.board.status');
  const key = status && status in STATUS_VARIANTS ? status : 'draft';

  return (
    <Badge
      variant="outline"
      className={cn('gap-1.5', STATUS_VARIANTS[key])}
    >
      {t(key)}
    </Badge>
  );
}

export function PriorityBadge({ priority }: { priority?: { name_ar?: string; name_en?: string; severity_rank?: string } | null }) {
  const t = useTranslations('tasks.board.priority');
  const locale = useLocale();
  const severity = priority?.severity_rank;
  const dotColor = severity && severity in PRIORITY_DOT ? PRIORITY_DOT[severity] : 'bg-transparent';

  return (
    <Badge
      variant="outline"
      className="gap-1.5 bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
    >
      {severity !== 'routine' && severity && (
        <span className={cn('size-1.5 rounded-full', dotColor)} aria-hidden="true" />
      )}
      {priority ? localizeName(locale, priority.name_ar, priority.name_en) : t('unknown')}
    </Badge>
  );
}

const CLASSIFICATION_MAP: Record<string, string> = {
  '1': 'public',
  '2': 'internal',
  '3': 'confidential',
};

export function ClassificationBadge({ level }: { level?: string | number | null }) {
  const t = useTranslations('tasks.board.classification');

  const key = level != null ? (CLASSIFICATION_MAP[String(level)] ?? String(level)) : null;

  const isPublic = !key || key === 'public';

  return (
    <span className={cn(
      'inline-flex items-center gap-1 text-xs',
      isPublic ? 'text-muted-foreground/50' : 'text-muted-foreground',
    )}>
      {key === 'confidential' ? (
        <Lock className="size-3" aria-hidden="true" />
      ) : isPublic ? (
        <Globe className="size-3" aria-hidden="true" />
      ) : (
        <Shield className="size-3" aria-hidden="true" />
      )}
      {t(isPublic ? 'public' : key)}
    </span>
  );
}
