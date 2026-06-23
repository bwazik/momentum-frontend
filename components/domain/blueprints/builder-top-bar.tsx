'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Save, Copy, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { BlueprintSettingsDialog } from './blueprint-settings-dialog';
import { useActivateBlueprint, useDeactivateBlueprint, useDuplicateBlueprint } from '@/lib/api/hooks/use-blueprints';
import { useBlueprintBuilderStore } from '@/lib/stores/use-blueprint-builder-store';
import { getStagesCount } from './blueprint-utils';
import type { BlueprintResource } from './blueprint-types';

interface BuilderTopBarProps {
  blueprint: BlueprintResource;
  readOnly: boolean;
  canManage: boolean;
}

export function BuilderTopBar({ blueprint, readOnly, canManage }: BuilderTopBarProps) {
  const t = useTranslations('blueprints.builder.top_bar');
  const ta = useTranslations('blueprints.library.actions');
  const router = useRouter();
  const activate = useActivateBlueprint(blueprint.public_id);
  const deactivate = useDeactivateBlueprint(blueprint.public_id);
  const duplicate = useDuplicateBlueprint();
  const { metadataDirty } = useBlueprintBuilderStore();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [confirm, setConfirm] = useState<null | 'activate' | 'deactivate' | 'duplicate'>(null);

  const isLocked = !!blueprint.is_locked;
  const isActive = !!blueprint.is_active;
  const stagesCount = getStagesCount(blueprint);

  return (
    <div className="flex flex-wrap items-center justify-end gap-3 border-b pb-3">
      <div className="flex items-center gap-2">
        {!readOnly && canManage && (
          <Button variant="outline" size="sm" onClick={() => setSettingsOpen(true)}>
            <Save className="size-4" /> {metadataDirty ? t('save') + ' *' : t('settings')}
          </Button>
        )}
        {canManage && !isActive && !isLocked && (
          <Button variant="outline" size="sm" disabled={stagesCount === 0} onClick={() => setConfirm('activate')}
            title={stagesCount === 0 ? t('activate_no_stages_tooltip') : undefined}>
            <CheckCircle className="size-4" /> {t('activate')}
          </Button>
        )}
        {canManage && isActive && (
          <Button variant="outline" size="sm" className="border-destructive/30 text-destructive" onClick={() => setConfirm('deactivate')}>
            <XCircle className="size-4" /> {t('deactivate')}
          </Button>
        )}
        {canManage && (
          <Button variant="ghost" size="sm" onClick={() => setConfirm('duplicate')}>
            <Copy className="size-4" /> {t('duplicate')}
          </Button>
        )}
      </div>
      <BlueprintSettingsDialog blueprint={blueprint} open={settingsOpen} onOpenChange={setSettingsOpen} />

      <AlertDialog open={confirm === 'activate'} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>{t('activate_title')}</AlertDialogTitle><AlertDialogDescription>{t('activate_description')}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>{t('cancel')}</AlertDialogCancel><AlertDialogAction onClick={() => { activate.mutate(undefined, { onSuccess: () => setConfirm(null) }); }}>{t('activate')}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirm === 'deactivate'} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>{t('deactivate_title')}</AlertDialogTitle><AlertDialogDescription>{t('deactivate_description')}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>{t('cancel')}</AlertDialogCancel><AlertDialogAction onClick={() => { deactivate.mutate(undefined, { onSuccess: () => setConfirm(null) }); }}>{t('deactivate')}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirm === 'duplicate'} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>{ta('duplicate_title')}</AlertDialogTitle><AlertDialogDescription>{ta('duplicate_description')}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>{t('cancel')}</AlertDialogCancel><AlertDialogAction onClick={() => { duplicate.mutate(blueprint.public_id, { onSuccess: (data) => { setConfirm(null); router.push(`/blueprints/${data.public_id}`); } }); }}>{ta('duplicate')}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
