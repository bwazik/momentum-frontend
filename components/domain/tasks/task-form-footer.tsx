'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { localizeName } from '@/lib/utils/localize';
import { useTaskFormStore } from '@/lib/stores/use-task-form-store';

interface PriorityItem {
  public_id: string;
  name_ar: string;
  name_en: string;
}

interface Props {
  mode: 'create' | 'edit';
  priorities?: PriorityItem[];
  hasManualItems?: boolean;
  isSaving: boolean;
  isLaunching: boolean;
  onSaveDraft: () => void;
  onLaunch: () => void;
}

export function TaskFormFooter({ priorities = [], hasManualItems = false, isSaving, isLaunching, onSaveDraft, onLaunch }: Props) {
  const t = useTranslations('tasks.new');
  const locale = useLocale();
  const { blueprintName, title_ar, priorityId, classificationLevel, dueDate, manualAssignments } = useTaskFormStore();

  const classificationLabel =
    classificationLevel === 3 ? t('classification_confidential')
    : classificationLevel === 2 ? t('classification_internal')
    : t('classification_public');

  const priorityLabel = priorityId
    ? priorities.find((p) => p.public_id === priorityId)
    : null;
  const priorityName = priorityLabel
    ? localizeName(locale, priorityLabel.name_ar, priorityLabel.name_en)
    : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <p className="text-xs font-medium text-foreground">{t('summary_blueprint')}</p>
          <p className="truncate text-sm text-muted-foreground">{blueprintName || '—'}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-foreground">{t('summary_title')}</p>
          <p className="truncate text-sm text-muted-foreground">{title_ar || '—'}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-foreground">{t('summary_priority')}</p>
          <p className="truncate text-sm text-muted-foreground">{priorityName || '—'}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-foreground">{t('summary_classification')}</p>
          <p className="text-sm text-muted-foreground">{classificationLabel}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-foreground">{t('summary_due')}</p>
          <p className="truncate text-sm text-muted-foreground">{dueDate ? new Date(dueDate).toLocaleDateString() : '—'}</p>
        </div>
        {hasManualItems && (
          <div>
            <p className="text-xs font-medium text-foreground">{t('summary_assignees')}</p>
            <p className="text-sm text-muted-foreground">{Object.values(manualAssignments).reduce((n, ids) => n + ids.length, 0)}</p>
          </div>
        )}
      </div>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" disabled={isSaving || isLaunching} onClick={onSaveDraft}>
          {isSaving && <Loader2 className="size-4 animate-spin" />}
          {t('save_draft')}
        </Button>
        <Button disabled={isLaunching} onClick={onLaunch}>
          {isLaunching && <Loader2 className="size-4 animate-spin" />}
          {t('launch')}
        </Button>
      </div>
    </div>
  );
}
