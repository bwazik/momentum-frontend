'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { useNotifications, useMarkAllNotificationsRead } from '@/lib/api/hooks/use-notifications';
import { NotificationItem } from './notification-item';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell } from 'lucide-react';

export function NotificationPanel({ onClose }: { onClose: () => void }) {
  const t = useTranslations('notifications');
  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } = useNotifications();
  const markAllRead = useMarkAllNotificationsRead();
  const allNotifications = data?.pages.flatMap((p) => p.data) ?? [];

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between border-b p-3">
        <h3 className="text-sm font-medium">{t('title')}</h3>
        {allNotifications.some((n) => !n.read_at) && (
          <Button
            variant="ghost"
            size="sm"
            className="h-auto text-xs cursor-pointer"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
          >
            {t('mark_all_read')}
          </Button>
        )}
      </div>
      <div className="max-h-80 overflow-y-auto">
        {isLoading && (
          <div className="space-y-2 p-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="size-8 rounded-full shrink-0" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-2 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}
        {isError && (
          <div className="p-3">
            <ErrorState onRetry={() => refetch()} />
          </div>
        )}
        {!isLoading && !isError && allNotifications.length === 0 && (
          <EmptyState icon={Bell} title={t('empty')} description={t('empty_description')} />
        )}
        {!isLoading && !isError && allNotifications.length > 0 && (
          <>
            {allNotifications.map((notification) => (
              <NotificationItem key={notification.id} notification={notification} onClose={onClose} />
            ))}
            {hasNextPage && (
              <div className="border-t p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs cursor-pointer"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage ? t('loading') : t('load_more')}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
