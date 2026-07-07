'use client';

import { useLocale, useTranslations } from 'next-intl';
import { ArrowUp, ArrowDown, Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { localizeName } from '@/lib/utils/localize';
import { formatSlaSummary } from '@/lib/utils/blueprint-utils';
import { ConfirmDeleteDialog } from '@/components/shared/confirm-delete-dialog';
import { useDeleteSubStage, useReorderSubStages } from '@/lib/api/hooks/use-blueprints';
import { useState } from 'react';
import type { BlueprintResource, BlueprintStageResource } from './blueprint-types';

interface SubStageListProps {
  blueprint: BlueprintResource;
  stage: BlueprintStageResource;
  readOnly: boolean;
  onEditSubStage?: (id: string | 'new') => void;
}

export function SubStageList({ blueprint, stage, readOnly, onEditSubStage }: SubStageListProps) {
  const t = useTranslations('blueprints.builder.panel.sub_stages');
  const tCanvas = useTranslations('blueprints.builder.canvas');
  const locale = useLocale();
  const subStages = stage.sub_stages ?? [];
  const sorted = [...subStages].sort((a, b) => Number(a.sequence_order) - Number(b.sequence_order));
  const deleteSubStage = useDeleteSubStage(blueprint.public_id);
  const reorderSubStages = useReorderSubStages(blueprint.public_id, stage.public_id);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  function moveSubStage(index: number, direction: 'up' | 'down') {
    const newOrder = sorted.map((s) => ({ public_id: s.public_id, sequence_order: Number(s.sequence_order) }));
    const swapIdx = direction === 'up' ? index - 1 : index + 1;
    if (swapIdx < 0 || swapIdx >= newOrder.length) return;
    const tmp = newOrder[index].sequence_order;
    newOrder[index].sequence_order = newOrder[swapIdx].sequence_order;
    newOrder[swapIdx].sequence_order = tmp;
    reorderSubStages.mutate(newOrder);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold">{t('title')}</h3>
        {!readOnly && onEditSubStage && (
          <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => onEditSubStage('new')}>
            <Plus className="size-3 me-1" /> {t('add')}
          </Button>
        )}
      </div>
      {sorted.length === 0 ? (
        <p className="text-xs text-muted-foreground">{t('no_sub_stages')}</p>
      ) : (
        <div className="space-y-1">
          {sorted.map((ss, i) => (
            <div key={ss.public_id} className="flex items-center gap-2 rounded-lg border p-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{localizeName(locale, ss.name_ar, ss.name_en)}</p>
                {ss.sla_policy && (
                  <p className="text-[10px] text-muted-foreground">{t('sla')}: {formatSlaSummary(ss.sla_policy, tCanvas)}</p>
                )}
              </div>
              {ss.is_required && <Badge variant="outline" className="text-[10px]">{t('required')}</Badge>}
              {!readOnly && (
                <div className="flex items-center gap-0.5">
                  <Button variant="ghost" size="icon" className="size-6" onClick={() => onEditSubStage?.(ss.public_id)} aria-label={t('edit')}><Pencil className="size-3" /></Button>
                  <Button variant="ghost" size="icon" className="size-6" disabled={i === 0} onClick={() => moveSubStage(i, 'up')} aria-label={t('move_up')}><ArrowUp className="size-3" /></Button>
                  <Button variant="ghost" size="icon" className="size-6" disabled={i === sorted.length - 1} onClick={() => moveSubStage(i, 'down')} aria-label={t('move_down')}><ArrowDown className="size-3" /></Button>
                  <Button variant="ghost" size="icon" className="size-6 text-destructive" onClick={() => setDeleteId(ss.public_id)} aria-label={t('actions')}><Trash2 className="size-3" /></Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {(() => {
        const delSubStage = sorted.find((s) => s.public_id === deleteId);
        const delName = delSubStage ? localizeName(locale, delSubStage.name_ar, delSubStage.name_en) : '';
        return (
          <ConfirmDeleteDialog
            open={!!deleteId}
            onOpenChange={(v) => !v && setDeleteId(null)}
            title={t('delete_title')}
            description={t('delete_description', { name: delName })}
            confirmLabel={t('delete')}
            cancelLabel={t('cancel')}
            onConfirm={() => { if (deleteId) deleteSubStage.mutate({ stageId: stage.public_id, subStageId: deleteId }, { onSuccess: () => setDeleteId(null) }); }}
          />
        );
      })()}
    </div>
  );
}
