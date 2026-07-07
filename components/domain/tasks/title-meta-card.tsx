'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  SlaBadge,
  TaskStatusBadge,
  PriorityBadge,
  ClassificationBadge,
} from './task-badges';
import { CopyLinkButton } from '@/components/shared/copy-link-button';
import { localizeName } from './task-detail-utils';
import type { TaskDetailResource } from './task-detail-types';

interface TitleMetaCardProps {
  task: TaskDetailResource;
  slaHealth: string;
  publicId: string;
}

export function TitleMetaCard({
  task,
  slaHealth,
  publicId,
}: TitleMetaCardProps) {
  const locale = useLocale();
  const t = useTranslations('tasks.detail');
  const title = localizeName(locale, task.title_ar, task.title_en);
  const description = localizeName(
    locale,
    task.description_ar,
    task.description_en,
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <PriorityBadge priority={task.priority} />
              <ClassificationBadge level={task.classification_level} />
              <TaskStatusBadge status={task.status} />
              <SlaBadge health={slaHealth} status={task.status} />
            </div>
            <h1 className="text-xl font-bold text-foreground">{title}</h1>
          </div>
          <div className="flex items-center gap-1">
            <CopyLinkButton publicId={publicId} ariaLabel={t('copy_id')} linkCopiedLabel={t('link_copied')} copyFailedLabel={t('copy_failed')} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="mb-2 text-xs text-muted-foreground">
          {t('ref')}: {task.display_id || publicId}
        </p>
        {description && (
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
