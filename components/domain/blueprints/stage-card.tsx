'use client';

import { useLocale, useTranslations } from 'next-intl';
import { ArrowUp, ArrowDown, ChevronRight, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ConfirmDeleteDialog } from '@/components/shared/confirm-delete-dialog';
import { cn } from '@/lib/utils';
import { useReorderStages, useDeleteStage } from '@/lib/api/hooks/use-blueprints';
import { localizeName } from '@/lib/utils/localize';
import { formatSlaSummary, getStageTransitions } from '@/lib/utils/blueprint-utils';
import { useState } from 'react';
import type { BlueprintStageResource, BlueprintTransitionResource } from './blueprint-types';

interface StageCardProps {
  stage: BlueprintStageResource;
  transitions: BlueprintTransitionResource[] | undefined;
  stages: BlueprintStageResource[];
  index: number;
  total: number;
  readOnly: boolean;
  selected: boolean;
  onSelect: () => void;
  isParentMode?: boolean;
  isExpanded?: boolean;
  hasSubStages?: boolean;
  onToggleExpand?: () => void;
}

export function StageCard({ stage, transitions, stages, index, total, readOnly, selected, onSelect, isParentMode, isExpanded, hasSubStages, onToggleExpand }: StageCardProps) {
  const t = useTranslations('blueprints.builder.canvas');
  const locale = useLocale();
  const reorder = useReorderStages(stage.blueprint_id);
  const del = useDeleteStage(stage.blueprint_id);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const name = localizeName(locale, stage.name_ar, stage.name_en);
  const stageType = stage.stage_type ? localizeName(locale, stage.stage_type.name_ar, stage.stage_type.name_en) : '';
  const slaSummary = formatSlaSummary(stage.sla_policy, t);
  const subStageItems = stage.sub_stages ?? [];
  const subStagesCount = subStageItems.length;
  const visibleSubStages = subStageItems.slice(0, 2);
  const remainingCount = subStagesCount - visibleSubStages.length;
  const stageTransitions = getStageTransitions(transitions, stage.public_id);
  const returnTransitions = stageTransitions.filter((tr) => tr.transition_type === 'return');

  function move(direction: 'up' | 'down') {
    const newOrder = stages.map((s) => ({ public_id: s.public_id, sequence_order: Number(s.sequence_order) }));
    const swapIdx = direction === 'up' ? index - 1 : index + 1;
    if (swapIdx < 0 || swapIdx >= newOrder.length) return;
    const tmp = newOrder[index].sequence_order;
    newOrder[index].sequence_order = newOrder[swapIdx].sequence_order;
    newOrder[swapIdx].sequence_order = tmp;
    reorder.mutate(newOrder);
  }

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        aria-current={selected ? 'true' : undefined}
        onClick={onSelect}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(); } }}
        className={cn(
          'w-80 shrink-0 cursor-pointer rounded-xl border-2 p-4 transition-colors',
          selected && !isParentMode && 'border-primary ring-2 ring-primary/20 bg-card',
          selected && isParentMode && 'border-primary/30 bg-muted/50',
          !selected && 'border-border bg-card hover:border-primary/40',
        )}
      >
        <div className="mb-2 flex items-center justify-between">
          <Badge variant="outline" className="text-[10px]">{t('stage_n', { n: index + 1 })}</Badge>
          {!readOnly && (
            <DropdownMenu dir={locale === 'ar' ? 'rtl' : 'ltr'}>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="icon" className="size-6" aria-label={t('stage_actions')}><MoreVertical className="size-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }} className="text-destructive">{t('delete_stage')}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <p className="text-sm font-semibold">{name}</p>
        <p className="mt-1 text-[10px] text-muted-foreground">{stageType} · {t('sla')}: {slaSummary}</p>
        {subStagesCount > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {visibleSubStages.map((ss) => (
              <span key={ss.public_id} className="max-w-28 truncate rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                {localizeName(locale, ss.name_ar, ss.name_en)}
              </span>
            ))}
            {remainingCount > 0 && (
              <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                +{remainingCount}
              </span>
            )}
          </div>
        )}
        {returnTransitions.length > 0 && (
          <Badge variant="outline" className="mt-1 text-[10px] border-red-200 text-red-600 bg-red-50 dark:border-red-800 dark:text-red-400 dark:bg-red-950">{t('return_path')}</Badge>
        )}
        {!readOnly && (
          <div className="mt-2 flex items-center justify-between border-t pt-2">
            <div className="flex items-center gap-0.5">
              <Button variant="ghost" size="icon" className="size-6" disabled={index === 0 || reorder.isPending} onClick={(e) => { e.stopPropagation(); move('up'); }} aria-label={t('move_up')}><ArrowUp className="size-3.5" /></Button>
              <Button variant="ghost" size="icon" className="size-6" disabled={index === total - 1 || reorder.isPending} onClick={(e) => { e.stopPropagation(); move('down'); }} aria-label={t('move_down')}><ArrowDown className="size-3.5" /></Button>
            </div>
            {hasSubStages && (
              <Button variant="ghost" size="icon" className="size-6" onClick={(e) => { e.stopPropagation(); onToggleExpand?.(); }} aria-label={t('expand')}>
                <ChevronRight className={cn('size-4 transition-transform', isExpanded ? 'rotate-90' : 'rtl:rotate-180')} />
              </Button>
            )}
          </div>
        )}
      </div>

      <ConfirmDeleteDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={t('delete_stage_title')}
        description={t('delete_stage_description', { name })}
        onConfirm={() => del.mutate(stage.public_id, { onSuccess: () => setConfirmDelete(false) })}
      />
    </>
  );
}
