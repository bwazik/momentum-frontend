'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  variant?: 'active' | 'amber' | 'red' | 'emerald' | 'suspended';
  subtitle?: string | ReactNode;
  href?: string;
  iconVariant?: 'boxed' | 'muted';
  valueSize?: '2xl' | '3xl';
  valueSuffix?: string;
}

const BORDER_ACCENTS: Record<string, string> = {
  active: 'border-s-blue-500 dark:border-s-blue-400',
  amber: 'border-s-amber-500 dark:border-s-amber-400',
  red: 'border-s-red-500 dark:border-s-red-400',
  emerald: 'border-s-emerald-500 dark:border-s-emerald-400',
  suspended: 'border-s-slate-300 dark:border-s-slate-600',
};

const ICON_BOXES: Record<string, string> = {
  active: 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400',
  red: 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400',
  emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400',
  suspended: 'bg-slate-100 text-slate-400 dark:bg-slate-900 dark:text-slate-400',
};

export function StatCard({
  label,
  value,
  icon: Icon,
  variant,
  subtitle,
  href,
  iconVariant = 'boxed',
  valueSize = '3xl',
  valueSuffix,
}: StatCardProps) {
  const locale = useLocale();

  const card = (
    <Card
      className={cn(
        'p-5 transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 motion-reduce:hover:translate-y-0',
        variant && 'border-s-4',
        variant && BORDER_ACCENTS[variant],
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className={cn(valueSize === '3xl' ? 'text-3xl' : 'text-2xl', 'font-bold text-foreground')}>
            {new Intl.NumberFormat(locale).format(value)}
            {valueSuffix && <span className="text-sm font-medium text-muted-foreground ms-1">{valueSuffix}</span>}
          </p>
          {subtitle && <p className="text-xs text-muted-foreground whitespace-nowrap">{subtitle}</p>}
        </div>
        {iconVariant === 'boxed' && variant ? (
          <div className={cn('size-8 rounded-lg flex items-center justify-center shrink-0', ICON_BOXES[variant])}>
            <Icon className="size-4" aria-hidden="true" />
          </div>
        ) : (
          <Icon className="size-5 text-muted-foreground/50 shrink-0" aria-hidden="true" />
        )}
      </div>
    </Card>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl"
      >
        {card}
      </Link>
    );
  }

  return card;
}
