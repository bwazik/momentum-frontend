'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { TaskCommentItem } from './task-comment-item';
import type { CommentResource } from './task-comment-types';

interface TaskCommentsListProps {
  comments: CommentResource[];
  currentUserPublicId?: string;
  replyToPublicId: string | null;
  onReply: (publicId: string | null) => void;
  onPostReply: (body: string) => void;
  isPosting: boolean;
  fetchNextPage: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage: boolean;
}

export function TaskCommentsList({
  comments,
  currentUserPublicId,
  replyToPublicId,
  onReply,
  onPostReply,
  isPosting,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
}: TaskCommentsListProps) {
  const t = useTranslations('tasks.comments');

  return (
    <div className="max-h-[60vh] overflow-y-auto">
      <ol className="space-y-4" aria-label={t('comments_list_label')}>
        {comments.map((comment) => (
          <li key={comment.public_id}>
            <TaskCommentItem
              comment={comment}
              currentUserPublicId={currentUserPublicId}
              isReplyOpen={replyToPublicId === comment.public_id}
              onReply={onReply}
              onPostReply={onPostReply}
              isPosting={isPosting}
            />
          </li>
        ))}
      </ol>
      {hasNextPage && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          className="w-full"
        >
          {isFetchingNextPage ? t('loading_more') : t('load_more')}
        </Button>
      )}
    </div>
  );
}
