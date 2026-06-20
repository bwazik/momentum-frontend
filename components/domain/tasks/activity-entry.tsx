'use client';

import { useLocale, useTranslations } from 'next-intl';
import { localizeName, formatRelativeTime, timeFmtFromT } from './task-detail-utils';
import type { TaskTimelineResource } from './task-detail-types';

interface ActivityEntryProps {
  entry: TaskTimelineResource;
}

const TYPE_LABELS: Record<string, { label: string; format: 'stage' | 'assigned' | 'completed' | 'override' | 'sub_stage' }> = {
  stage_entered: { label: 'stage_started', format: 'stage' },
  stage_completed: { label: 'stage_completed', format: 'stage' },
  stage_returned: { label: 'stage_returned', format: 'stage' },
  sub_stage_entered: { label: 'sub_stage_started', format: 'sub_stage' },
  sub_stage_completed: { label: 'sub_stage_completed', format: 'sub_stage' },
  assignment_created: { label: 'assigned_to', format: 'assigned' },
  assignment_completed: { label: 'completed_work_on', format: 'completed' },
  assignment_overridden: { label: 'was_replaced', format: 'override' },
};

function getDetail(entry: TaskTimelineResource): string | null {
  return entry.completion_note || entry.return_reason || entry.reassignment_reason || null;
}

export function ActivityEntry({ entry }: ActivityEntryProps) {
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const t = useTranslations('tasks.detail');
  const timeFmt = timeFmtFromT(t);
  const typeMeta = TYPE_LABELS[entry.type];
  if (!typeMeta) return null;

  const actorName = localizeName(locale, entry.user_name_ar, entry.user_name_en);
  const stageName = localizeName(locale, entry.stage_name_ar, entry.stage_name_en);
  const parentName = localizeName(locale, entry.parent_stage_name_ar, entry.parent_stage_name_en);
  const detail = getDetail(entry);

  return (
    <div className="flex items-start gap-3">
      <div className="mt-1.5 size-2 shrink-0 rounded-full bg-muted-foreground/30" aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-foreground leading-relaxed">
          {typeMeta.format === 'stage' && stageName && (isRtl
            ? <><span className="text-muted-foreground">{t(typeMeta.label)} </span><span className="font-medium">{stageName}</span></>
            : <><span className="font-medium">{stageName} </span><span className="text-muted-foreground">{t(typeMeta.label)}</span></>
          )}
          {typeMeta.format === 'sub_stage' && stageName && (isRtl
            ? <><span className="text-muted-foreground">{t(typeMeta.label)} </span><span className="font-medium">{stageName}</span>{parentName && <span className="text-muted-foreground"> ({parentName})</span>}</>
            : <><span className="font-medium">{stageName} </span><span className="text-muted-foreground">{t(typeMeta.label)}</span>{parentName && <span className="text-muted-foreground"> ({parentName})</span>}</>
          )}
          {typeMeta.format === 'override' && actorName && (isRtl
            ? <><span className="font-medium">{actorName} </span><span className="text-muted-foreground">{t(typeMeta.label)}</span></>
            : <><span className="font-medium">{actorName} </span><span className="text-muted-foreground">{t(typeMeta.label)}</span></>
          )}
          {typeMeta.format === 'assigned' && actorName && (isRtl
            ? <><span className="text-muted-foreground">{t(typeMeta.label)} </span><span className="font-medium">{actorName}</span>{stageName && parentName ? <span className="text-muted-foreground"> {t('substage_suffix')} {stageName} ({parentName})</span> : stageName ? <span className="text-muted-foreground"> {t('stage_suffix')} {stageName}</span> : null}</>
            : <><span className="font-medium">{actorName} </span><span className="text-muted-foreground">{t(typeMeta.label)}</span>{stageName && <span className="text-muted-foreground"> {stageName} {t('stage_suffix')}{parentName ? ` (${parentName})` : ''}</span>}</>
          )}
          {typeMeta.format === 'completed' && actorName && (isRtl
            ? <><span className="font-medium">{actorName} </span><span className="text-muted-foreground">{t(typeMeta.label)}{stageName ? ` ${stageName}` : ''}{parentName ? ` (${parentName})` : ''}</span></>
            : <><span className="font-medium">{actorName} </span><span className="text-muted-foreground">{t(typeMeta.label)}</span>{stageName && <span className="text-muted-foreground"> {stageName} {t('stage_suffix')}{parentName ? ` (${parentName})` : ''}</span>}</>
          )}
        </p>
        {detail && (
          <p className="mt-0.5 text-[10px] text-muted-foreground">
            {detail}
          </p>
        )}
        <p className="text-[10px] text-muted-foreground/60">
          {formatRelativeTime(entry.timestamp, timeFmt)}
        </p>
      </div>
    </div>
  );
}
