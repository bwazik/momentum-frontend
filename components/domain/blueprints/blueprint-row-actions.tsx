'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Ellipsis, ExternalLink, Copy, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useCapability } from '@/lib/api/hooks/use-capabilities';
import { useDuplicateBlueprint, useActivateBlueprint, useDeactivateBlueprint, useDeleteBlueprint } from '@/lib/api/hooks/use-blueprints';
import { getStagesCount } from './blueprint-utils';
import { useState } from 'react';
import type { BlueprintResource } from './blueprint-types';

export function BlueprintRowActions({ blueprint }: { blueprint: BlueprintResource }) {
  const t = useTranslations('blueprints.library.actions');
  const locale = useLocale();
  const router = useRouter();
  const canManage = useCapability('blueprint.manage');
  const duplicate = useDuplicateBlueprint();
  const activate = useActivateBlueprint(blueprint.public_id);
  const deactivate = useDeactivateBlueprint(blueprint.public_id);
  const deleteBlueprint = useDeleteBlueprint();
  const [confirm, setConfirm] = useState<null | 'activate' | 'deactivate' | 'duplicate' | 'delete'>(null);

  const isActive = !!blueprint.is_active;
  const stagesCount = getStagesCount(blueprint);

  return (
    <>
      <DropdownMenu dir={locale === 'ar' ? 'rtl' : 'ltr'}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8" aria-label={t('row_actions')}>
            <Ellipsis className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="bottom" className="min-w-36">
          <DropdownMenuItem onClick={() => router.push(`/blueprints/${blueprint.public_id}`)}>
            <ExternalLink className="me-2 size-4" /> {t('open')}
          </DropdownMenuItem>
          {canManage && (
            <DropdownMenuItem onClick={() => setConfirm('duplicate')}>
              <Copy className="me-2 size-4" /> {t('duplicate')}
            </DropdownMenuItem>
          )}
          {canManage && !isActive && (
            <DropdownMenuItem disabled={stagesCount === 0} onClick={() => setConfirm('activate')}
              title={stagesCount === 0 ? t('activate_no_stages_tooltip') : undefined}>
              <CheckCircle className="me-2 size-4" /> {t('activate')}
            </DropdownMenuItem>
          )}
          {canManage && isActive && (
            <DropdownMenuItem onClick={() => setConfirm('deactivate')}>
              <XCircle className="me-2 size-4" /> {t('deactivate')}
            </DropdownMenuItem>
          )}
          {canManage && (
            <DropdownMenuItem onClick={() => setConfirm('delete')} className="text-destructive">
              <Trash2 className="me-2 size-4" /> {t('delete')}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

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
          <AlertDialogHeader><AlertDialogTitle>{t('duplicate_title')}</AlertDialogTitle><AlertDialogDescription>{t('duplicate_description')}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>{t('cancel')}</AlertDialogCancel><AlertDialogAction onClick={() => { duplicate.mutate(blueprint.public_id, { onSuccess: (data) => { setConfirm(null); router.push(`/blueprints/${data.public_id}`); } }); }}>{t('duplicate')}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirm === 'delete'} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>{t('delete_title')}</AlertDialogTitle><AlertDialogDescription>{t('delete_description')}</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>{t('cancel')}</AlertDialogCancel><AlertDialogAction className="text-destructive" onClick={() => { deleteBlueprint.mutate(blueprint.public_id, { onSuccess: () => setConfirm(null) }); }}>{t('delete')}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
