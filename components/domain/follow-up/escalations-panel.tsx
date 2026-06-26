'use client';

import { useMemo, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { CheckCircle2, AlertTriangle, User, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { ApiRequestError } from '@/lib/api/client';
import { useEscalationsInfinite } from '@/lib/api/hooks/use-escalations';
import { useCapability } from '@/lib/api/hooks/use-capabilities';
import { useCurrentUser } from '@/lib/api/hooks/use-auth';
import { localizeName, ESCALATION_TYPE_MAP } from './follow-up-utils';
import { formatDualDate } from '@/lib/utils/date-utils';
import type { EscalationResource } from './follow-up-types';

const MAX_VISIBLE = 3;
const STATUS_OPTIONS = [
  { value: 1, label: 'open' },
  { value: 2, label: 'resolved' },
] as const;

interface EscalationsPanelProps {
  onResolve: (escalationPublicId: string) => void;
}

function EscalationItem({ e, typeKey, locale, statusFilter, canResolve, user, onResolve, t }: {
  e: EscalationResource; typeKey: string; locale: string; statusFilter: number;
  canResolve: boolean; user: { public_id: string } | undefined; onResolve: (id: string) => void;
  t: (key: string, values?: Record<string, string | number | Date>) => string;
}) {
  const escalatedToName = e.escalated_to_user
    ? localizeName(locale, e.escalated_to_user.name_ar, e.escalated_to_user.name_en)
    : '-';
  const canResolveThis = statusFilter === 1 && (canResolve || e.escalated_to_user?.public_id === user?.public_id);
  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center">
        <div className={`flex size-8 items-center justify-center rounded-full ${
          typeKey === 'auto'
            ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400'
            : 'bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-400'
        }`}>
          {typeKey === 'auto' ? <AlertTriangle className="size-4" /> : <User className="size-4" />}
        </div>
        <div className="mt-1 w-px flex-1 bg-border/50" />
      </div>
      <div className="flex-1 pb-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs font-medium text-foreground">
              {t(`event_${typeKey}`, { task: e.task_display_id })}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {t(`event_${typeKey}_to`, { to: escalatedToName })}
            </p>
          </div>
          <span className="shrink-0 text-xs text-muted-foreground">
            {e.created_at && formatDualDate(e.created_at, locale)}
          </span>
        </div>
        {e.reason && (
          <p className="mt-1 text-xs italic text-muted-foreground/80">&ldquo;{e.reason}&rdquo;</p>
        )}
        {canResolveThis && (
          <Button size="sm" variant="outline" className="mt-2 h-7 text-xs" onClick={() => onResolve(e.public_id)}>
            {t('resolve')}
          </Button>
        )}
      </div>
    </div>
  );
}

function getTypeKey(e: EscalationResource): string {
  const rawType = String(e.escalation_type ?? '').toLowerCase();
  return ESCALATION_TYPE_MAP[rawType] ?? (rawType === '1' ? 'auto' : 'manual');
}

export function EscalationsPanel({ onResolve }: EscalationsPanelProps) {
  const t = useTranslations('followUp.escalations');
  const locale = useLocale();
  const canResolve = useCapability('task.resolve_escalations');
  const { data: user } = useCurrentUser();
  const [statusFilter, setStatusFilter] = useState<number>(1);
  const [showAll, setShowAll] = useState(false);
  const query = useEscalationsInfinite({ status: statusFilter });

  const items = useMemo(
    () => query.data?.pages.flatMap((p) => p.data) ?? [],
    [query.data],
  );

  const preview = useMemo(() => items.slice(0, MAX_VISIBLE), [items]);

  const renderItem = (e: EscalationResource) => (
    <EscalationItem
      key={e.public_id}
      e={e}
      typeKey={getTypeKey(e)}
      locale={locale}
      statusFilter={statusFilter}
      canResolve={canResolve}
      user={user}
      onResolve={onResolve}
      t={t}
    />
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm">{t('title')}</CardTitle>
          <div className="flex gap-0.5 rounded-lg bg-muted p-0.5" role="tablist">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                role="tab"
                aria-selected={statusFilter === opt.value}
                onClick={() => setStatusFilter(opt.value)}
                className={`cursor-pointer rounded-md px-2 py-0.5 text-xs font-medium transition-colors ${
                  statusFilter === opt.value
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t(`tab_${opt.label}`)}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {query.isLoading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <Skeleton className="size-8 rounded-full" />
                  {i < 2 && <Skeleton className="mt-1 w-px flex-1" />}
                </div>
                <div className="flex-1 pb-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <Skeleton className="h-3 w-3/5" />
                    <Skeleton className="h-2.5 w-1/5" />
                  </div>
                  <Skeleton className="h-2.5 w-2/5" />
                  <Skeleton className="h-2.5 w-4/5" />
                </div>
              </div>
            ))}
          </div>
        ) : query.isError ? (
          <ErrorState
            message={query.error instanceof ApiRequestError ? query.error.error.message : t('error_title')}
            onRetry={() => query.refetch()}
          />
        ) : items.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title={t(`empty_title_${statusFilter === 1 ? 'open' : 'resolved'}`)}
            description={t(`empty_description_${statusFilter === 1 ? 'open' : 'resolved'}`)}
          />
        ) : (
          <>
            {preview.map(renderItem)}
            {items.length > MAX_VISIBLE && (
              <button
                type="button"
                onClick={() => setShowAll(true)}
                className="mt-1 block cursor-pointer text-xs font-medium text-primary hover:underline text-start"
              >
                {t('view_all', { count: items.length })} <ArrowRight className="inline size-3 rtl:rotate-180" />
              </button>
            )}
          </>
        )}
      </CardContent>

      <Dialog open={showAll} onOpenChange={(o) => { if (!o) setShowAll(false); }}>
        <DialogContent className="max-h-[80vh] max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('title')}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="flex flex-col gap-2 pe-2" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
              {items.map(renderItem)}
            </div>
          </ScrollArea>
          {query.hasNextPage && (
            <Button variant="outline" onClick={() => query.fetchNextPage()} disabled={query.isFetchingNextPage}>
              {t('load_more')}
            </Button>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
