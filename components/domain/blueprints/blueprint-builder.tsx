'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { FileQuestion, Lock } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { ApiRequestError } from '@/lib/api/client';
import { useBlueprint } from '@/lib/api/hooks/use-blueprints';
import { useCapability } from '@/lib/api/hooks/use-capabilities';
import { useBlueprintBuilderStore } from '@/lib/stores/use-blueprint-builder-store';
import { BuilderTopBar } from './builder-top-bar';
import { StageCanvas } from './stage-canvas';
import { StagePropertiesPanel } from './stage-properties-panel';
import { BlueprintBuilderSkeleton } from './blueprint-builder-skeleton';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { localizeName } from '@/lib/utils/localize';

interface BlueprintBuilderProps {
  publicId: string;
}

export function BlueprintBuilder({ publicId }: BlueprintBuilderProps) {
  const t = useTranslations('blueprints.builder');
  const locale = useLocale();
  const query = useBlueprint(publicId);
  const canManage = useCapability('blueprint.manage');
  const { selectedStageId, setSelectedStage, panelOpen, setPanelOpen, setBlueprintName, reset } = useBlueprintBuilderStore();
  const [isMobile, setIsMobile] = useState(false);
  const [subStageEditId, setSubStageEditId] = useState<string | null>(null);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  function handleSelectStage(id: string | null) {
    setSelectedStage(id);
    if (id && isMobile) setPanelOpen(true);
  }

  useEffect(() => () => reset(), [reset]);

  const bpData = query.data;
  useEffect(() => {
    setBlueprintName(bpData ? localizeName(locale, bpData.name_ar, bpData.name_en) : '');
  }, [bpData, locale, setBlueprintName]);

  if (query.isLoading) return <BlueprintBuilderSkeleton />;
  if (query.isError) {
    const error = query.error;
    if (error instanceof ApiRequestError && error.status === 403) {
      return <EmptyState icon={Lock} title={t('no_permission_title')} description={t('no_permission_description')} />;
    }
    if (error instanceof ApiRequestError && error.status === 404) {
      return <EmptyState icon={FileQuestion} title={t('not_found_title')} description={t('not_found_description')} />;
    }
    return <ErrorState message={t('error')} onRetry={() => query.refetch()} />;
  }

  const blueprint = query.data;
  if (!blueprint) return <BlueprintBuilderSkeleton />;

  const isLocked = !!blueprint.is_locked;
  const readOnly = isLocked || !canManage;
  const stages = blueprint.stages ?? [];
  const panelMode = selectedStageId === 'new' ? 'add' : selectedStageId ? 'edit' : 'idle';
  const selectedStage = panelMode === 'edit' ? stages.find((s) => s.public_id === selectedStageId) ?? null : null;

  return (
    <div className="flex flex-col gap-4">
      <BuilderTopBar blueprint={blueprint} readOnly={readOnly} canManage={canManage} />
      {isLocked && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
          {t('locked_banner')}
        </div>
      )}
      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="flex-1">
          <StageCanvas
            blueprint={blueprint}
            stages={stages}
            transitions={blueprint.transitions}
            readOnly={readOnly}
            selectedStageId={selectedStageId}
            onSelectStage={handleSelectStage}
            subStageEditId={subStageEditId}
            onEditSubStage={setSubStageEditId}
          />
        </div>
        <aside className="hidden w-96 shrink-0 lg:block">
          <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto border-s p-5">
            <StagePropertiesPanel
              blueprint={blueprint}
              stage={selectedStage}
              mode={panelMode}
              readOnly={readOnly}
            subStageEditId={subStageEditId}
            onEditSubStage={setSubStageEditId}
            onSubStageBack={() => setSubStageEditId(null)}
            />
          </div>
        </aside>
        <Sheet open={panelOpen} onOpenChange={setPanelOpen}>
          <SheetContent side={locale === 'ar' ? 'left' : 'right'} className="w-96 overflow-y-auto p-5 pt-10">
            <StagePropertiesPanel
              blueprint={blueprint}
              stage={selectedStage}
              mode={panelMode}
              readOnly={readOnly}
              subStageEditId={subStageEditId}
              onEditSubStage={setSubStageEditId}
              onSubStageBack={() => setSubStageEditId(null)}
            />
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
