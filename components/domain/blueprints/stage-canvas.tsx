'use client';

import { useState, useCallback } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ChevronDown, Plus, Check, Lock, MoreVertical, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { StageCard } from './stage-card';
import { ScopeBadge } from './blueprint-badges';
import { cn } from '@/lib/utils';
import { localizeName } from '@/lib/utils/localize';
import { formatSlaSummary } from './blueprint-utils';
import { ConfirmDeleteDialog } from '@/components/shared/confirm-delete-dialog';
import { useDeleteSubStage } from '@/lib/api/hooks/use-blueprints';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api/client';
import { queryKeys } from '@/lib/api/query-keys';
import type { BlueprintResource, BlueprintStageResource, BlueprintTransitionResource, BlueprintSubStageResource } from './blueprint-types';

function CanvasSubStageCard({ subStage, index, total, stagePublicId, blueprintPublicId, readOnly, subStageEditId, locale, onEditSubStage, onReorder, t }: {
  subStage: BlueprintSubStageResource;
  index: number;
  total: number;
  stagePublicId: string;
  blueprintPublicId: string;
  readOnly: boolean;
  subStageEditId: string | null | undefined;
  locale: string;
  onEditSubStage?: (id: string | 'new') => void;
  onReorder?: (subStageId: string, direction: 'up' | 'down') => void;
  t: any;
}) {
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
          <DropdownMenu dir={locale === 'ar' ? 'rtl' : 'ltr'}>
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

function SubStageRowActions({ subStageId, stageId, blueprintId, locale }: { subStageId: string; stageId: string; blueprintId: string; locale: string }) {
  const deleteSubStage = useDeleteSubStage(blueprintId);
  return (
    <DropdownMenu dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-6 shrink-0" aria-label="Sub-stage actions">
          <MoreVertical className="size-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => deleteSubStage.mutate({ stageId, subStageId })}
          className="text-destructive"
        >
          <Trash2 className="size-3.5 me-1.5" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

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
                        {(() => {
                          const sortedAll = subStageItems
                            .slice()
                            .sort((a, b) => Number(a.sequence_order) - Number(b.sequence_order));
                          const displayItems = sortedAll.slice(0, 5);
                          function handleReorderSubStage(subStageId: string, direction: 'up' | 'down') {
                            const ids = sortedAll.map((s) => s.public_id);
                            const idx = ids.indexOf(subStageId);
                            const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
                            if (swapIdx < 0 || swapIdx >= ids.length) return;
                            const newIds = [...ids];
                            [newIds[idx], newIds[swapIdx]] = [newIds[swapIdx], newIds[idx]];
                            const payload = { sub_stages: newIds.map((id, i) => ({ public_id: id, sequence_order: i + 1 })) };
                            apiClient.post(`/v1/blueprints/${blueprint.public_id}/stages/${stage.public_id}/sub-stages/reorder`, payload)
                              .then(() => {
                                queryClient.invalidateQueries({ queryKey: queryKeys.blueprints.detail(blueprint.public_id) });
                                toast.success(t('reorder_success'));
                              })
                              .catch(() => toast.error(t('reorder_error')));
                          }
                          return displayItems.map((ss, i) => (
                            <CanvasSubStageCard
                              key={ss.public_id}
                              subStage={ss}
                              index={i}
                              total={displayItems.length}
                              stagePublicId={stage.public_id}
                              blueprintPublicId={blueprint.public_id}
                              readOnly={readOnly}
                              subStageEditId={subStageEditId}
                              locale={locale}
                              onEditSubStage={onEditSubStage}
                              onReorder={handleReorderSubStage}
                              t={t}
                            />
                          ));
                        })()}
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
