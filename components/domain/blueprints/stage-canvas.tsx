'use client';

import { useState, useCallback } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ChevronDown, Plus, Check, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StageCard } from './stage-card';
import { CanvasSubStageCard } from './canvas-sub-stage-card';
import { ScopeBadge } from './blueprint-badges';
import { cn } from '@/lib/utils';
import { localizeName } from '@/lib/utils/localize';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/client';
import { queryKeys } from '@/lib/api/query-keys';
import type { BlueprintResource, BlueprintStageResource, BlueprintTransitionResource } from './blueprint-types';

interface StageCanvasProps {
  blueprint: BlueprintResource;
  stages: BlueprintStageResource[];
  transitions: BlueprintTransitionResource[] | undefined;
  readOnly: boolean;
  selectedStageId: string | null;
  onSelectStage: (id: string | null) => void;
  subStageEditId?: string | null;
  onEditSubStage?: (id: string | 'new') => void;
}

export function StageCanvas({ blueprint, stages, transitions, readOnly, selectedStageId, onSelectStage, subStageEditId, onEditSubStage }: StageCanvasProps) {
  const t = useTranslations('blueprints.builder.canvas');
  const tStatus = useTranslations('blueprints.builder.top_bar');
  const locale = useLocale();
  const queryClient = useQueryClient();
  const [expandedStageId, setExpandedStageId] = useState<string | null>(null);

  const handleToggleExpand = useCallback((stageId: string) => {
    setExpandedStageId((prev) => (prev === stageId ? null : stageId));
  }, []);

  const handleReorderSubStage = useCallback((subStageId: string, direction: 'up' | 'down', stagePublicId: string) => {
    const stage = stages.find((s) => s.public_id === stagePublicId);
    if (!stage) return;
    const sortedAll = (stage.sub_stages ?? []).slice().sort((a, b) => Number(a.sequence_order) - Number(b.sequence_order));
    const ids = sortedAll.map((s) => s.public_id);
    const idx = ids.indexOf(subStageId);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= ids.length) return;
    const newIds = [...ids];
    [newIds[idx], newIds[swapIdx]] = [newIds[swapIdx], newIds[idx]];
    const payload = { sub_stages: newIds.map((id, i) => ({ public_id: id, sequence_order: i + 1 })) };
    apiClient.post(`/v1/blueprints/${blueprint.public_id}/stages/${stagePublicId}/sub-stages/reorder`, payload)
      .then(() => {
        queryClient.invalidateQueries({ queryKey: queryKeys.blueprints.detail(blueprint.public_id) });
        toast.success(t('reorder_success'));
      })
      .catch(() => toast.error(t('reorder_error')));
  }, [stages, blueprint.public_id, queryClient, t]);

  const sorted = [...stages].sort((a, b) => Number(a.sequence_order) - Number(b.sequence_order));
  const name = localizeName(locale, blueprint.name_ar, blueprint.name_en);
  const description = localizeName(locale, blueprint.description_ar, blueprint.description_en);
  const isActive = !!blueprint.is_active;
  const isLocked = !!blueprint.is_locked;

  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold">{name}</h2>
            {isLocked && <Lock className="size-4 text-muted-foreground" />}
          </div>
          {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn(isActive ? 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950' : 'text-muted-foreground')}>
            {isActive ? tStatus('active') : tStatus('inactive')}
          </Badge>
          <ScopeBadge scope={blueprint.scope} />
          {blueprint.category && (
            <Badge variant="outline" className="text-xs">{localizeName(locale, blueprint.category.name_ar, blueprint.category.name_en)}</Badge>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-dashed border-border p-6 bg-muted/30">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <p className="text-sm text-muted-foreground">{readOnly ? t('no_stages_readonly') : t('no_stages')}</p>
            {!readOnly && (
              <Button variant="outline" onClick={() => onSelectStage('new')}><Plus className="size-4" /> {t('add_stage')}</Button>
            )}
          </div>
        ) : (
          <>
            <ol className="space-y-4">
              {sorted.map((stage, index) => {
                const isExpanded = expandedStageId === stage.public_id;
                const subStageItems = stage.sub_stages ?? [];
                const hasSubStages = subStageItems.length > 0;
                const isParentMode = !!subStageEditId && subStageItems.some((s) => s.public_id === subStageEditId);
                const sortedSubStages = subStageItems.slice().sort((a, b) => Number(a.sequence_order) - Number(b.sequence_order));
                const displaySubStages = sortedSubStages.slice(0, 5);
                return (
                  <li key={stage.public_id}>
                    <div className="flex items-center gap-4">
                      <StageCard
                        stage={stage}
                        transitions={transitions}
                        stages={sorted}
                        index={index}
                        total={sorted.length}
                        readOnly={readOnly}
                        selected={selectedStageId === stage.public_id}
                        onSelect={() => onSelectStage(stage.public_id)}
                        isParentMode={isParentMode}
                        isExpanded={isExpanded}
                        hasSubStages={hasSubStages}
                        onToggleExpand={() => handleToggleExpand(stage.public_id)}
                      />
                      {index < sorted.length - 1 && (
                        <div className="flex shrink-0 flex-col items-center">
                          <div className="w-0.5 h-10 bg-muted-foreground/30" />
                          <ChevronDown className="size-5 -mt-2.5 text-muted-foreground" aria-hidden="true" />
                        </div>
                      )}
                      {index === sorted.length - 1 && (
                        <div className="flex shrink-0 flex-col items-center">
                          <div className="w-0.5 h-10 bg-emerald-300 dark:bg-emerald-600" />
                          <div className="-mt-2.5 flex size-7 items-center justify-center rounded-lg border-2 border-emerald-400 bg-emerald-50 dark:border-emerald-600 dark:bg-emerald-950">
                            <Check className="size-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                          </div>
                        </div>
                      )}
                    </div>
                    {isExpanded && hasSubStages && (
                      <div className="ms-16 mt-3 border-s ps-4 space-y-2">
                        {displaySubStages.map((ss, i) => (
                          <CanvasSubStageCard
                            key={ss.public_id}
                            subStage={ss}
                            index={i}
                            total={displaySubStages.length}
                            stagePublicId={stage.public_id}
                            blueprintPublicId={blueprint.public_id}
                            readOnly={readOnly}
                            locale={locale}
                            onEditSubStage={onEditSubStage}
                            onReorder={(id, dir) => handleReorderSubStage(id, dir, stage.public_id)}
                            t={t}
                          />
                        ))}
                        {subStageItems.length > 5 && (
                          <p className="text-[10px] text-muted-foreground ps-0.5">
                            +{subStageItems.length - 5} {t('more')}
                          </p>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
            {!readOnly && (
              <div className="mt-4 flex justify-center">
                <Button variant="outline" onClick={() => onSelectStage('new')}><Plus className="size-4" /> {t('add_stage')}</Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
