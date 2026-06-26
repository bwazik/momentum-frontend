'use client';

import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { ApiRequestError } from '@/lib/api/client';
import { useFollowUpBottlenecks } from '@/lib/api/hooks/use-follow-up';
import { useCapability } from '@/lib/api/hooks/use-capabilities';
import { getBottleneckEntities, localizeName, formatTimeInStage } from './follow-up-utils';

const MAX_VISIBLE = 3;

export function BottleneckPanel() {
  const t = useTranslations('followUp.bottlenecks');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const canViewOrg = useCapability('task.view.organization');
  const canViewFollowUp = useCapability('task.view.follow_up_scope');
  const canView = canViewOrg || canViewFollowUp;
  const query = useFollowUpBottlenecks({});
  const [showAll, setShowAll] = useState(false);

  if (!canView) return null;

  if (query.isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-sm">{t('title')}</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg p-2">
              <Skeleton className="w-1.5 shrink-0 self-stretch rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between gap-x-2">
                  <Skeleton className="h-3 w-3/5" />
                  <Skeleton className="h-3 w-1/5" />
                </div>
                <Skeleton className="h-2.5 w-2/5" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (query.isError) {
    const message = query.error instanceof ApiRequestError ? query.error.error.message : t('error_title');
    return (
      <Card>
        <CardHeader><CardTitle className="text-sm">{t('title')}</CardTitle></CardHeader>
        <CardContent>
          <ErrorState message={message} onRetry={() => query.refetch()} />
        </CardContent>
      </Card>
    );
  }

  const items = query.data?.data ?? [];
  if (items.length === 0) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-sm">{t('title')}</CardTitle></CardHeader>
        <CardContent>
          <EmptyState title={t('empty_title')} description={t('empty_description')} />
        </CardContent>
      </Card>
    );
  }

  function applyBottleneck(stageTypeId?: string, departmentId?: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (stageTypeId) params.set('stageTypeId', stageTypeId);
    else params.delete('stageTypeId');
    if (departmentId) params.set('departmentId', departmentId);
    else params.delete('departmentId');
    router.replace(`${pathname}?${params.toString()}`);
  }

  const renderItem = (item: typeof items[number]) => {
    const { stageType, department } = getBottleneckEntities(item);
    const overdue = Number(item.overdue_count);
    const atRisk = Number(item.at_risk_count);
    return (
      <button
        key={`${stageType?.public_id ?? '?'}-${department?.public_id ?? '?'}`}
        type="button"
        onClick={() => { setShowAll(false); applyBottleneck(stageType?.public_id, department?.public_id); }}
        className="flex cursor-pointer items-center gap-3 rounded-lg p-2 text-start hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className={`w-1.5 shrink-0 self-stretch rounded-full ${overdue > 0 ? 'bg-red-500' : 'bg-amber-500'}`} aria-hidden="true" />
        <div className="flex-1">
          <div className="flex flex-wrap items-center justify-between gap-x-2 text-xs">
            <span className="font-medium text-foreground">
              {stageType ? localizeName(locale, stageType.name_ar, stageType.name_en) : '-'}
              {department && ` · ${localizeName(locale, department.name_ar, department.name_en)}`}
            </span>
            <div className="flex items-center gap-2">
              {overdue > 0 && (
                <span className="font-medium text-red-600 dark:text-red-400">{overdue} {t('overdue')}</span>
              )}
              {atRisk > 0 && (
                <span className="font-medium text-amber-600 dark:text-amber-400">{atRisk} {t('at_risk')}</span>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {formatTimeInStage(item.average_time_at_stage_seconds, locale)}
          </p>
        </div>
      </button>
    );
  };

  return (
    <>
      <Card>
        <CardHeader><CardTitle className="text-sm">{t('title')}</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-3">
          {items.slice(0, MAX_VISIBLE).map(renderItem)}
          {items.length > MAX_VISIBLE && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="mt-1 block cursor-pointer text-xs font-medium text-primary hover:underline text-start"
            >
              {t('view_all_stages', { count: items.length })} <ArrowRight className="inline size-3 rtl:rotate-180" />
            </button>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAll} onOpenChange={(o) => { if (!o) setShowAll(false); }}>
        <DialogContent className="max-h-[80vh] max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('title')}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="flex flex-col gap-2 pe-2">
              {items.map(renderItem)}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
