'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { TaskCommentComposer } from './task-comment-composer';

interface TaskCommentReplyComposerProps {
  onSubmit: (body: string) => void;
  isPending: boolean;
  onCancel: () => void;
}

export function TaskCommentReplyComposer({
  onSubmit,
  isPending,
  onCancel,
}: TaskCommentReplyComposerProps) {
  const t = useTranslations('tasks.comments');
  const [value, setValue] = useState('');

  return (
    <TaskCommentComposer
      value={value}
      onChange={setValue}
      onSubmit={() => onSubmit(value)}
      isPending={isPending}
      submitLabel={t('post_reply')}
      onCancel={onCancel}
      cancelLabel={t('cancel')}
    />
  );
}
