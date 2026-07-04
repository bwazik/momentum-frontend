'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Paperclip } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
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
    <div className={cn('flex gap-3', isCurrentUser && 'flex-row-reverse')}>
      <Avatar className="size-7 shrink-0">
        <AvatarFallback aria-hidden="true">{initials}</AvatarFallback>
      </Avatar>
      <div className={cn('flex min-w-0 flex-1 flex-col', isCurrentUser && 'items-end')}>
        <div
          className={cn(
            'max-w-[85%] rounded-xl border px-3 py-2',
            isCurrentUser ? 'bg-muted' : 'bg-background',
          )}
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-foreground">{authorName}</span>
            <time className="text-xs text-muted-foreground" dateTime={reply.created_at}>
              {formatRelativeTime(reply.created_at, timeFmt)}
            </time>
          </div>
          <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{reply.body}</p>
        </div>
        {(reply.attachment_count ?? 0) > 0 && (
          <span className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Paperclip className="size-3" aria-hidden="true" />
            {reply.attachment_count}
          </span>
        )}
      </div>
    </div>
  );
}
