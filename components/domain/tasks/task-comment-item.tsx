'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Paperclip, Reply } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Bubble, BubbleContent } from '@/components/ui/bubble';
import { Message, MessageAvatar, MessageContent, MessageHeader, MessageFooter } from '@/components/ui/message';
import { localizeName, getInitials, formatRelativeTime, timeFmtFromT } from './task-detail-utils';
import { TaskCommentReply } from './task-comment-reply';
import { TaskCommentReplyComposer } from './task-comment-reply-composer';
import type { CommentResource } from './task-comment-types';

interface TaskCommentItemProps {
  comment: CommentResource;
  currentUserPublicId?: string;
  isReplyOpen: boolean;
  onReply: (publicId: string | null) => void;
  onPostReply: (body: string) => void;
  isPosting: boolean;
}

export function TaskCommentItem({
  comment,
  currentUserPublicId,
  isReplyOpen,
  onReply,
  onPostReply,
  isPosting,
}: TaskCommentItemProps) {
  const locale = useLocale();
  const t = useTranslations('tasks.comments');
  const timeT = useTranslations('tasks.detail');
  const timeFmt = timeFmtFromT(timeT);
  const authorName = localizeName(locale, comment.author.name_ar, comment.author.name_en);
  const isCurrentUser = comment.author.public_id === currentUserPublicId;
  const initials = getInitials(authorName || '?');

  return (
    <article aria-labelledby={`comment-author-${comment.public_id}`}>
      <Message align={isCurrentUser ? 'end' : 'start'}>
        <MessageAvatar>
          <Avatar className="size-9">
            <AvatarFallback aria-hidden="true">{initials}</AvatarFallback>
          </Avatar>
        </MessageAvatar>
        <MessageContent>
          <MessageHeader className="gap-2">
            <span
              id={`comment-author-${comment.public_id}`}
              className="text-xs font-semibold text-foreground"
            >
              {authorName}
            </span>
            <time className="text-xs text-muted-foreground" dateTime={comment.created_at}>
              {formatRelativeTime(comment.created_at, timeFmt)}
            </time>
          </MessageHeader>
          <Bubble variant={isCurrentUser ? 'default' : 'secondary'}>
            <BubbleContent className="whitespace-pre-wrap">{comment.body}</BubbleContent>
          </Bubble>
          <MessageFooter>
            {(comment.attachment_count ?? 0) > 0 && (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Paperclip className="size-3" aria-hidden="true" />
                {comment.attachment_count}
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-auto px-1 py-0.5 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => onReply(isReplyOpen ? null : comment.public_id)}
              aria-label={t('reply_to', { author: authorName })}
            >
              <Reply className="me-1 size-3 rtl:rotate-180" />
              {t('reply')}
            </Button>
          </MessageFooter>
        </MessageContent>
      </Message>

      {comment.replies && comment.replies.length > 0 && (
        <ol className="mt-3 w-full space-y-3 ps-8" aria-label={t('replies_list_label')}>
          {comment.replies.map((reply) => (
            <li key={reply.public_id}>
              <TaskCommentReply
                reply={reply}
                currentUserPublicId={currentUserPublicId}
              />
            </li>
          ))}
        </ol>
      )}

      {isReplyOpen && (
        <div className="mt-3 w-full ps-8">
          <TaskCommentReplyComposer
            onSubmit={onPostReply}
            isPending={isPosting}
            onCancel={() => onReply(null)}
          />
        </div>
      )}
    </article>
  );
}
