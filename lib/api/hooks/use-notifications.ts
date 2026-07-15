import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { apiClient, ApiRequestError } from '../client';
import { queryKeys } from '../query-keys';

export interface Notification {
  id: string;
  type: string;
  read_at: string | null;
  created_at: string;
  created_at_hijri?: string | null;
  data: {
    title_ar?: string;
    title_en?: string;
    body_ar?: string;
    body_en?: string;
    task_public_id?: string;
    notification_type?: string;
  };
}

interface CursorPaginatedResponse<T> {
  data: T[];
  next_cursor: string | null;
  has_more: boolean;
}

interface UnreadCountResponse {
  unread_count: number;
}

export function useNotifications() {
  return useInfiniteQuery({
    queryKey: queryKeys.notifications.list({}),
    queryFn: ({ pageParam }) =>
      apiClient.get<CursorPaginatedResponse<Notification>>('/v1/notifications', {
        params: { cursor: pageParam },
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.has_more ? lastPage.next_cursor : undefined),
  });
}

export function useNotificationsCount() {
  return useQuery({
    queryKey: queryKeys.notifications.unreadCount(),
    queryFn: () => apiClient.get<UnreadCountResponse>('/v1/notifications/unread-count'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  const t = useTranslations('notifications');

  return useMutation({
    mutationFn: (notificationId: string) =>
      apiClient.post(`/v1/notifications/${notificationId}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount() });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
    onError: (error) => {
      if (error instanceof ApiRequestError) {
        toast.error(error.error.message);
      } else {
        toast.error(t('mark_read_error'));
      }
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  const t = useTranslations('notifications');

  return useMutation({
    mutationFn: () => apiClient.post('/v1/notifications/read-all'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.unreadCount() });
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications.all });
    },
    onError: (error) => {
      if (error instanceof ApiRequestError) {
        toast.error(error.error.message);
      } else {
        toast.error(t('mark_read_error'));
      }
    },
  });
}
