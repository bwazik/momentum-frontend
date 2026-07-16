'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Ellipsis, Pencil, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useCapability } from '@/lib/api/hooks/use-capabilities';
import { DelegationFormDialog } from './delegation-form-dialog';
import { RevokeDelegationDialog } from './revoke-delegation-dialog';
import type { components } from '@/lib/generated/api-types';

type DelegationResource = components['schemas']['DelegationResource'];

interface DelegationRowActionsProps {
  delegation: DelegationResource;
}

export function DelegationRowActions({ delegation }: DelegationRowActionsProps) {
  const t = useTranslations('settings.delegations');
  const locale = useLocale();
  const canManage = useCapability('iam.manage_users');
  const [editOpen, setEditOpen] = useState(false);
  const [revokeOpen, setRevokeOpen] = useState(false);

  return (
    <>
      <DropdownMenu dir={locale === 'ar' ? 'rtl' : 'ltr'}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8" aria-label={t('columns.actions')}>
            <Ellipsis className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="bottom" className="min-w-36">
          {canManage && (
            <DropdownMenuItem onClick={() => setEditOpen(true)}>
              <Pencil className="me-2 size-4" /> {t('form.edit_title')}
            </DropdownMenuItem>
          )}
          {canManage && (
            <DropdownMenuItem onClick={() => setRevokeOpen(true)} className="text-destructive">
              <Ban className="me-2 size-4" /> {t('revoke.title')}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {canManage && (
        <DelegationFormDialog
          delegation={delegation}
          open={editOpen}
          onOpenChange={setEditOpen}
        />
      )}

      {canManage && (
        <RevokeDelegationDialog
          publicId={delegation.public_id}
          open={revokeOpen}
          onOpenChange={setRevokeOpen}
        />
      )}
    </>
  );
}
