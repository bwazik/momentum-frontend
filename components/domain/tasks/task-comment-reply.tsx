'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Paperclip } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Bubble, BubbleContent } from '@/components/ui/bubble';
import { Message, MessageAvatar, MessageContent, MessageHeader, MessageFooter } from '@/components/ui/message';
import { localizeName, getInitials, formatRelativeTime, timeFmtFromT } from './task-detail-utils';
import type { CommentResource } from './task-comment-types';

interface TaskCommentReplyProps {
  reply: CommentResource;
  currentUserPublicId?: string;
}

export function TaskCommentReply({ reply, currentUserPublicId }: TaskCommentReplyProps) {
  const locale = useLocale();
  const timeT = useTranslations('tasks.detail');
  const timeFmt = timeFmtFromT(timeT);
  const authorName = localizeName(locale, reply.author.name_ar, reply.author.name_en);
  const isCurrentUser = reply.author.public_id === currentUserPublicId;
  const initials = getInitials(authorName || '?');

  return (
    <Message align={isCurrentUser ? 'end' : 'start'}>
      <MessageAvatar>
        <Avatar className="size-7">
          <AvatarFallback aria-hidden="true">{initials}</AvatarFallback>
        </Avatar>
      </MessageAvatar>
      <MessageContent>
        <MessageHeader className="gap-2">
          <span className="text-xs font-semibold text-foreground">{authorName}</span>
          <time className="text-xs text-muted-foreground" dateTime={reply.created_at}>
            {formatRelativeTime(reply.created_at, timeFmt)}
          </time>
        </MessageHeader>
        <Bubble variant={isCurrentUser ? 'default' : 'secondary'}>
          <BubbleContent className="whitespace-pre-wrap">{reply.body}</BubbleContent>
        </Bubble>
        {(reply.attachment_count ?? 0) > 0 && (
          <MessageFooter>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Paperclip className="size-3" aria-hidden="true" />
              {reply.attachment_count}
            </span>
          </MessageFooter>
        )}
      </MessageContent>
    </Message>
  );
}
