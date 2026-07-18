'use client';

import { useLocale, useTranslations } from 'next-intl';
import { TableCell, TableRow } from '@/components/ui/table';
import { ActiveBadge } from '@/components/shared/active-badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Ellipsis, Pencil, Ban } from 'lucide-react';
import { localizeName } from '@/lib/utils/localize';
import type { components } from '@/lib/generated/api-types';

type GovernanceResource = components['schemas']['ConfidentialGovernanceParticipantResource'];

interface Props {
  item: GovernanceResource;
  canManage: boolean;
  onEdit: () => void;
  onRevoke: () => void;
}

export function GovernanceParticipantRow({ item, canManage, onEdit, onRevoke }: Props) {
  const locale = useLocale();
  const t = useTranslations('confidential.governance');

  const isRevoked = !!item.revoked_at;
  const scopeTarget = item.scope_department
    ? localizeName(locale, item.scope_department.name_ar, item.scope_department.name_en)
    : t('scope_tenant_label');
  const positionName = localizeName(locale, item.position.title_ar, item.position.title_en);
  const categoryName = item.blueprint_category
    ? localizeName(locale, item.blueprint_category.name_ar, item.blueprint_category.name_en)
    : t('all_categories');

  return (
    <TableRow className={isRevoked ? 'opacity-75' : ''}>
      <TableCell className="text-start text-sm font-medium">{positionName}</TableCell>
      <TableCell className="text-start text-sm">{t(`scope_${item.scope_type}` as 'scope_tenant')}</TableCell>
      <TableCell className="text-start text-sm">{scopeTarget}</TableCell>
      <TableCell className="text-start text-sm">{categoryName}</TableCell>
      <TableCell className="text-start text-sm">{t(`classification_level_${item.applies_to_classification_level}` as 'classification_level_1')}</TableCell>
      <TableCell className="text-start text-sm">
        <ActiveBadge isActive={!isRevoked} activeLabel={t('active')} inactiveLabel={t('revoked_status')} />
      </TableCell>
      <TableCell className="text-end">
        {canManage && !isRevoked ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="size-8 p-0">
                <Ellipsis className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={locale === 'ar' ? 'start' : 'end'}>
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="me-2 size-4" />
                {t('edit')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onRevoke} className="text-destructive">
                <Ban className="me-2 size-4" />
                {t('revoke')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : <span className="text-muted-foreground">—</span>}
      </TableCell>
    </TableRow>
  );
}
