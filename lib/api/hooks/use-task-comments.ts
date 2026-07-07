import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { apiClient, ApiRequestError } from '@/lib/api/client';
import { queryKeys } from '@/lib/api/query-keys';
import { toast } from 'sonner';
import type { CursorPage } from '@/lib/api/types';
import type { CommentResource } from '@/components/domain/tasks/task-comment-types';
import type { components } from '@/lib/generated/api-types';

type StoreCommentRequest = components['schemas']['StoreCommentRequest'];

export function useTaskComments(taskPublicId: string) {
  return useInfiniteQuery({
    queryKey: queryKeys.tasks.comments(taskPublicId),
    queryFn: ({ pageParam }) =>
      apiClient.get<CursorPage<CommentResource>>(`/v1/tasks/${taskPublicId}/comments`, {
        params: { cursor: pageParam },
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? lastPage.next_cursor : undefined,
    enabled: !!taskPublicId,
  });
}

export function useCreateComment(taskPublicId: string) {
  const t = useTranslations('tasks.comments');
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: StoreCommentRequest) =>
      apiClient.post<CommentResource>(`/v1/tasks/${taskPublicId}/comments`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.comments(taskPublicId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.timeline(taskPublicId) });
      toast.success(t('toast_posted'));
    },
    onError: (error) => {
      toast.error(error instanceof ApiRequestError ? error.error.message : error.message);
    },
  });
}
