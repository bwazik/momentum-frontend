'use client';

import { useLocale, useTranslations } from 'next-intl';
import { TableCell, TableRow } from '@/components/ui/table';
import { ActiveBadge } from '@/components/shared/active-badge';
import { DualDateDisplay } from '@/components/shared/dual-date-display';
import { localizeName } from '@/lib/utils/localize';
import { DelegationRowActions } from './delegation-row-actions';
import type { components } from '@/lib/generated/api-types';

type DelegationResource = components['schemas']['DelegationResource'];

interface DelegationTableRowProps {
  delegation: DelegationResource;
}

export function DelegationTableRow({ delegation }: DelegationTableRowProps) {
  const locale = useLocale();
  const t = useTranslations('settings.delegations');

  const delegatorName = localizeName(locale, delegation.delegator?.name_ar, delegation.delegator?.name_en);
  const delegateName = localizeName(locale, delegation.delegate?.name_ar, delegation.delegate?.name_en);

  function scopeLabel(): string {
    const key = String(delegation.scope_type);
    if (key.includes('blueprint_category_and_stage_type')) return t('scope_category_and_stage');
    if (key.includes('blueprint_category')) return t('scope_category');
    if (key.includes('stage_type')) return t('scope_stage_type');
    return t('scope_all');
  }

  function scopeDetail(): string {
    const parts: string[] = [];
    if (delegation.blueprint_category) {
      parts.push(localizeName(locale, delegation.blueprint_category.name_ar, delegation.blueprint_category.name_en));
    }
    if (delegation.stage_type) {
      parts.push(localizeName(locale, delegation.stage_type.name_ar, delegation.stage_type.name_en));
    }
    return parts.join(' · ');
  }

  return (
    <TableRow>
      <TableCell className="text-start font-medium">{delegatorName}</TableCell>
      <TableCell className="text-start">{delegateName}</TableCell>
      <TableCell className="text-start">
        <span className="block text-sm">{scopeLabel()}</span>
        {scopeDetail() && <span className="text-xs text-muted-foreground">{scopeDetail()}</span>}
      </TableCell>
      <TableCell className="text-start">
        <DualDateDisplay gregorian={delegation.starts_at} hijri={delegation.starts_at_hijri} variant="stacked" />
        <span className="text-muted-foreground"> — </span>
        <DualDateDisplay gregorian={delegation.ends_at} hijri={delegation.ends_at_hijri} variant="stacked" />
      </TableCell>
      <TableCell className="text-start">
        <ActiveBadge isActive={!!delegation.is_active && delegation.is_active !== '0'} activeLabel={t('status_active')} inactiveLabel="" />
      </TableCell>
      <TableCell className="text-end" onClick={(e) => e.stopPropagation()}>
        <DelegationRowActions delegation={delegation} />
      </TableCell>
    </TableRow>
  );
}
