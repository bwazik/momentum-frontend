'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowUp, ArrowDown, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ConfirmDeleteDialog } from '@/components/shared/confirm-delete-dialog';
import { localizeName } from '@/lib/utils/localize';
import { formatSlaSummary } from '@/lib/utils/blueprint-utils';
import { useDeleteSubStage } from '@/lib/api/hooks/use-blueprints';
import type { BlueprintSubStageResource } from './blueprint-types';

interface CanvasSubStageCardProps {
  subStage: BlueprintSubStageResource;
  index: number;
  total: number;
  stagePublicId: string;
  blueprintPublicId: string;
  readOnly: boolean;
  locale: string;
  onEditSubStage?: (id: string | 'new') => void;
  onReorder?: (subStageId: string, direction: 'up' | 'down') => void;
  t: (key: string) => string;
}

export function CanvasSubStageCard({
  subStage, index, total, stagePublicId, blueprintPublicId, readOnly, locale, onEditSubStage, onReorder, t,
}: CanvasSubStageCardProps) {
  const localeDir = useLocale();
  const tSub = useTranslations('blueprints.builder.panel.sub_stages');
  const deleteSubStage = useDeleteSubStage(blueprintPublicId);
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="group flex items-start gap-1 px-0.5 py-0.5 text-xs" data-ss-order={subStage.public_id}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => onEditSubStage?.(subStage.public_id)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onEditSubStage?.(subStage.public_id); } }}
        className="flex-1 min-w-0 cursor-pointer rounded px-1 py-0.5 transition-colors hover:bg-muted/30"
      >
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground/60 shrink-0">{index + 1}.</span>
          <span className="text-foreground truncate">{localizeName(locale, subStage.name_ar, subStage.name_en)}</span>
          <span className="text-[10px] text-muted-foreground/60">
            {subStage.sla_policy && `${t('sla')}: ${formatSlaSummary(subStage.sla_policy, t)}`}
            {subStage.sla_policy && subStage.is_required && ' · '}
          </span>
          {subStage.is_required && <span className="text-[10px] text-amber-600/70 dark:text-amber-400/70">{t('required')}</span>}
        </div>
      </div>
      {!readOnly && (
        <div className="invisible group-hover:visible flex items-center gap-0.5 shrink-0 pt-0.5">
          <Button variant="ghost" size="icon" className="size-4" disabled={index === 0} onClick={(e) => { e.stopPropagation(); onReorder?.(subStage.public_id, 'up'); }} aria-label={t('move_up')}><ArrowUp className="size-2.5" /></Button>
          <Button variant="ghost" size="icon" className="size-4" disabled={index === total - 1} onClick={(e) => { e.stopPropagation(); onReorder?.(subStage.public_id, 'down'); }} aria-label={t('move_down')}><ArrowDown className="size-2.5" /></Button>
          <DropdownMenu dir={localeDir === 'ar' ? 'rtl' : 'ltr'}>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="size-4" aria-label={t('stage_actions')}>
                <MoreVertical className="size-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setConfirmDelete(true)} className="text-destructive whitespace-nowrap text-xs">
                {t('delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      <ConfirmDeleteDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={tSub('delete_title')}
        description={tSub('delete_description', { name: localizeName(locale, subStage.name_ar, subStage.name_en) })}
        confirmLabel={tSub('delete')}
        cancelLabel={tSub('cancel')}
        onConfirm={() => { deleteSubStage.mutate({ stageId: stagePublicId, subStageId: subStage.public_id }); setConfirmDelete(false); }}
      />
    </div>
  );
}
