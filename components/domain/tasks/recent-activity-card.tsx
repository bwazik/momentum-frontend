'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ActivityEntry } from './activity-entry';
import type { TaskTimelineResource } from './task-detail-types';

interface RecentActivityCardProps {
  entries?: (TaskTimelineResource | { stage_name_ar: string | null; stage_name_en: string | null; timestamp: string; type: string })[];
  isLoading: boolean;
  onViewFull?: () => void;
}

export function RecentActivityCard({
  entries,
  isLoading,
  onViewFull,
}: RecentActivityCardProps) {
  const t = useTranslations('tasks.detail');
  const recent = (entries ?? []).slice(0, 5);

  return (
    <Card>
        <CardHeader>
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t('recent_activity')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          ) : recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('no_activity')}</p>
          ) : (
            <>
              <div className="space-y-3">
                {recent.map((entry, i) => (
                  <ActivityEntry key={i} entry={entry as TaskTimelineResource} />
                ))}
              </div>
              <button
                className="mt-3 block cursor-pointer text-xs font-medium text-primary hover:underline"
                onClick={onViewFull}
              >
                {t('view_full_audit_trail')} →
              </button>
            </>
          )}
        </CardContent>
      </Card>
  );
}
