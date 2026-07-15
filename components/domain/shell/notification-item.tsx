'use client';

import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useMarkNotificationRead } from '@/lib/api/hooks/use-notifications';
import { DualDateDisplay } from '@/components/shared/dual-date-display';
import { cn } from '@/lib/utils';

import type { Notification } from '@/lib/api/hooks/use-notifications';

interface NotificationItemProps {
  notification: Notification;
  onClose: () => void;
}

export function NotificationItem({ notification, onClose }: NotificationItemProps) {
  const markRead = useMarkNotificationRead();
  const router = useRouter();
  const locale = useLocale();
  const isUnread = !notification.read_at;
  const title = locale === 'ar' ? (notification.data?.title_ar || notification.data?.title_en) : (notification.data?.title_en || notification.data?.title_ar);
  const body = locale === 'ar' ? (notification.data?.body_ar || notification.data?.body_en) : (notification.data?.body_en || notification.data?.body_ar);
  const taskPublicId = notification.data?.task_public_id;

  function handleClick() {
    if (isUnread) {
      markRead.mutate(notification.id);
    }
    if (taskPublicId) {
      router.push(`/tasks/${taskPublicId}`);
    }
    onClose();
  }

  return (
    <button
      onClick={handleClick}
      className={cn(
        'flex w-full flex-col gap-1 px-3 py-2.5 text-start text-sm transition-colors hover:bg-muted/50 cursor-pointer',
        isUnread && 'bg-muted/30',
      )}
    >
      <div className="flex items-start gap-2">
        {isUnread && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" aria-hidden="true" />}
        <span className={cn('flex-1 font-medium', !isUnread && 'me-4')}>{title || notification.type}</span>
      </div>
      {body && <span className="line-clamp-2 text-xs text-muted-foreground">{body}</span>}
      <span className="text-[10px] text-muted-foreground/60">
        <DualDateDisplay gregorian={notification.created_at} hijri={notification.created_at_hijri} />
      </span>
    </button>
  );
}
