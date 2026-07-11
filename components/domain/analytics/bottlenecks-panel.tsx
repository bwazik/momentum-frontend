'use client';

import { useTranslations } from 'next-intl';
import { BottleneckCard } from './bottleneck-card';
import type { BottleneckItem } from './executive-dashboard-types';

interface BottlenecksPanelProps {
  bottlenecks: BottleneckItem[];
}

export function BottlenecksPanel({ bottlenecks }: BottlenecksPanelProps) {
  const t = useTranslations('analytics.executive');
  return (
    <section data-testid="bottlenecks-panel">
      <h2 className="text-base font-semibold text-foreground mb-3">{t('panel_bottlenecks')}</h2>
      <div className="flex flex-col gap-3">
        {bottlenecks.map((bn) => (
          <BottleneckCard key={`${bn.stageTypePublicId}-${bn.departmentPublicId}`} bottleneck={bn} />
        ))}
      </div>
    </section>
  );
}
