'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { MessageCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { useCurrentUser } from '@/lib/api/hooks/use-auth';
import { useTaskComments, useCreateComment } from '@/lib/api/hooks/use-task-comments';
import { TaskCommentsList } from './task-comments-list';
import { TaskCommentComposer } from './task-comment-composer';
import { TaskCommentSkeleton } from './task-comment-skeleton';

interface TaskCommentsCardProps {
  publicId: string;
}

export function TaskCommentsCard({ publicId }: TaskCommentsCardProps) {
  const t = useTranslations('tasks.comments');
  const { data: user } = useCurrentUser();
  const commentsQuery = useTaskComments(publicId);
  const createComment = useCreateComment(publicId);
  const [replyToPublicId, setReplyToPublicId] = useState<string | null>(null);
  const [composerText, setComposerText] = useState('');

  const allComments = useMemo(
    () => commentsQuery.data?.pages.flatMap((page) => page.data) ?? [],
    [commentsQuery.data],
  );

  function handlePostTopLevel() {
    if (!composerText.trim()) return;
    createComment.mutate(
      { body: composerText.trim() },
      {
        onSuccess: () => setComposerText(''),
      },
    );
  }

  function handlePostReply(body: string) {
    if (!body.trim() || !replyToPublicId) return;
    createComment.mutate(
      { body: body.trim(), parent_comment_id: replyToPublicId },
      {
        onSuccess: () => setReplyToPublicId(null),
      },
    );
  }

  if (commentsQuery.isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {t('title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TaskCommentSkeleton />
        </CardContent>
      </Card>
    );
  }

  if (commentsQuery.isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {t('title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ErrorState
            message={t('error')}
            onRetry={() => commentsQuery.refetch()}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          {t('title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {allComments.length === 0 ? (
          <EmptyState
            icon={MessageCircle}
            title={t('empty_title')}
            description={t('empty_description')}
          />
        ) : (
          <TaskCommentsList
            comments={allComments}
            currentUserPublicId={user?.public_id}
            replyToPublicId={replyToPublicId}
            onReply={setReplyToPublicId}
            onPostReply={handlePostReply}
            isPosting={createComment.isPending}
            fetchNextPage={commentsQuery.fetchNextPage}
            hasNextPage={commentsQuery.hasNextPage}
            isFetchingNextPage={commentsQuery.isFetchingNextPage}
          />
        )}
        <TaskCommentComposer
          value={composerText}
          onChange={setComposerText}
          onSubmit={handlePostTopLevel}
          isPending={createComment.isPending}
        />
      </CardContent>
    </Card>
  );
}
