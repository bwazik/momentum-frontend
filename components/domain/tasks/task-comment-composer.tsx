'use client';

import { useTranslations } from 'next-intl';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Field, FieldLabel } from '@/components/ui/field';
import { cn } from '@/lib/utils';

const MAX_LENGTH = 5000;

interface TaskCommentComposerProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isPending: boolean;
  submitLabel?: string;
  onCancel?: () => void;
  cancelLabel?: string;
}

export function TaskCommentComposer({
  value,
  onChange,
  onSubmit,
  isPending,
  submitLabel,
  onCancel,
  cancelLabel,
}: TaskCommentComposerProps) {
  const t = useTranslations('tasks.comments');

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      onSubmit();
    }
  }

  const canSubmit = value.trim().length > 0 && value.length <= MAX_LENGTH && !isPending;

  return (
    <div className="flex flex-col gap-2 border-t pt-4">
      <Field>
        <FieldLabel htmlFor="comment-composer" className="sr-only">
          {t('composer_label')}
        </FieldLabel>
        <Textarea
          id="comment-composer"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('composer_placeholder')}
          maxLength={MAX_LENGTH}
          rows={3}
          className="resize-y"
        />
      </Field>
      <div className="flex items-center justify-between">
        <span
          className={cn(
            'text-xs text-muted-foreground',
            value.length > MAX_LENGTH * 0.9 && 'text-amber-600',
          )}
        >
          {value.length} / {MAX_LENGTH}
        </span>
        <div className="flex items-center gap-2">
          {onCancel && (
            <Button variant="ghost" size="sm" onClick={onCancel} disabled={isPending}>
              {cancelLabel ?? t('cancel')}
            </Button>
          )}
          <Button
            size="sm"
            onClick={onSubmit}
            disabled={!canSubmit}
            className="active:scale-[0.98] transition-transform"
          >
            {isPending ? t('posting') : (submitLabel ?? t('post_comment'))}
            {!isPending && <Send className="ms-1.5 size-3.5" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
