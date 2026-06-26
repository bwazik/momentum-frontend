'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { PhoneCall, MessageSquare, Users, Mail, HelpCircle, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { ApiRequestError } from '@/lib/api/client';
import { useAllFollowUpActions } from '@/lib/api/hooks/use-follow-up';
import { actionTypeKey, localizeName } from './follow-up-utils';
import { formatDualDate } from '@/lib/utils/date-utils';
import type { FollowUpActionResource } from './follow-up-types';

const MAX_VISIBLE = 3;

function formatTime(isoDate: string): string {
  const d = new Date(isoDate);
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

const ACTION_ICONS: Record<string, typeof PhoneCall> = {
  phone: PhoneCall,
  message: MessageSquare,
  meeting: Users,
  email: Mail,
  other: HelpCircle,
};

function ActionEntry({ a, locale }: { a: FollowUpActionResource; locale: string }) {
  const Icon = ACTION_ICONS[actionTypeKey(a.action_type)] ?? HelpCircle;
  return (
    <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-2.5">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs text-foreground truncate">
            {localizeName(locale, a.note_ar, a.note_en)}
          </p>
          {a.task_display_id && (
            <span className="shrink-0 text-xs text-muted-foreground">{a.task_display_id}</span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {a.created_by ? localizeName(locale, a.created_by.name_ar, a.created_by.name_en) : ''}
          {a.contact_name ? ` · ${a.contact_name}` : ''}
        </p>
        <p className="text-xs text-muted-foreground">
          {a.created_at && formatDualDate(a.created_at, locale)}
          {a.created_at && ` ${formatTime(a.created_at)}`}
        </p>
      </div>
    </div>
  );
}

interface RecentActionsPanelProps {
  onTodayCount?: (count: number) => void;
}

export function RecentActionsPanel({ onTodayCount }: RecentActionsPanelProps) {
  const t = useTranslations('followUp.recent_actions');
  const locale = useLocale();
  const [showAll, setShowAll] = useState(false);
  const query = useAllFollowUpActions({ per_page: 15 });

  const flatActions = useMemo(():
    FollowUpActionResource[] => query.data?.pages.flatMap((p) => p.data) ?? [], [query.data]);

  const preview = useMemo(() => flatActions.slice(0, MAX_VISIBLE), [flatActions]);

  const todayCount = useMemo(
    () => flatActions.filter((a) => {
      if (!a.created_at) return false;
      const today = new Date();
      const created = new Date(a.created_at);
      return created.getFullYear() === today.getFullYear()
        && created.getMonth() === today.getMonth()
        && created.getDate() === today.getDate();
    }).length,
    [flatActions],
  );

  useEffect(() => { onTodayCount?.(todayCount); }, [todayCount, onTodayCount]);

  return (
    <>
      <Card>
        <CardHeader><CardTitle className="text-sm">{t('title')}</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-2">
          {query.isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-start gap-2 rounded-lg bg-muted/50 p-2.5">
                  <Skeleton className="mt-0.5 size-4 shrink-0" />
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <Skeleton className="h-3 flex-1" />
                      <Skeleton className="h-2.5 w-14 shrink-0" />
                    </div>
                    <Skeleton className="h-2.5 w-3/5" />
                    <Skeleton className="h-2.5 w-2/5" />
                  </div>
                </div>
              ))}
            </div>
          ) : query.isError ? (
            <ErrorState
              message={query.error instanceof ApiRequestError ? query.error.error.message : t('error_title')}
              onRetry={() => query.refetch()}
            />
          ) : preview.length === 0 ? (
            <EmptyState title={t('empty_title')} description={t('empty_description')} />
          ) : (
            <>
              {preview.map((a) => <ActionEntry key={a.public_id} a={a} locale={locale} />)}
              {flatActions.length > MAX_VISIBLE && (
                <button
                  type="button"
                  onClick={() => setShowAll(true)}
                  className="mt-1 block cursor-pointer text-xs font-medium text-primary hover:underline text-start"
                >
                  {t('view_all_actions', { count: flatActions.length })} <ArrowRight className="inline size-3 rtl:rotate-180" />
                </button>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAll} onOpenChange={(o) => { if (!o) setShowAll(false); }}>
        <DialogContent className="max-h-[80vh] max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('title')}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="flex flex-col gap-2 pe-2" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
              {flatActions.map((a) => <ActionEntry key={a.public_id} a={a} locale={locale} />)}
            </div>
          </ScrollArea>
          {query.hasNextPage && (
            <Button variant="outline" className="mt-2 w-full" onClick={() => query.fetchNextPage()} disabled={query.isFetchingNextPage}>
              {t('load_more')}
            </Button>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
