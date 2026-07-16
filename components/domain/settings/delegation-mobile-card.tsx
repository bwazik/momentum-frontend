'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { ActiveBadge } from '@/components/shared/active-badge';
import { DualDateDisplay } from '@/components/shared/dual-date-display';
import { localizeName } from '@/lib/utils/localize';
import { DelegationRowActions } from './delegation-row-actions';
import type { components } from '@/lib/generated/api-types';

type DelegationResource = components['schemas']['DelegationResource'];

interface DelegationMobileCardProps {
  delegation: DelegationResource;
}

export function DelegationMobileCard({ delegation }: DelegationMobileCardProps) {
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
    <Card>
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="flex items-center justify-between">
          <ActiveBadge isActive={!!delegation.is_active && delegation.is_active !== '0'} activeLabel={t('status_active')} inactiveLabel="" />
          <DelegationRowActions delegation={delegation} />
        </div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <span className="text-muted-foreground">{t('columns.delegator')}</span>
          <span className="text-start font-medium">{delegatorName}</span>
          <span className="text-muted-foreground">{t('columns.delegate')}</span>
          <span className="text-start">{delegateName}</span>
          <span className="text-muted-foreground">{t('columns.scope')}</span>
          <span className="text-start">
            <span>{scopeLabel()}</span>
            {scopeDetail() && <span className="block text-xs text-muted-foreground">{scopeDetail()}</span>}
          </span>
          <span className="text-muted-foreground">{t('columns.dates')}</span>
          <span className="text-start">
            <DualDateDisplay gregorian={delegation.starts_at} hijri={delegation.starts_at_hijri} variant="stacked" />
            <span className="text-muted-foreground"> — </span>
            <DualDateDisplay gregorian={delegation.ends_at} hijri={delegation.ends_at_hijri} variant="stacked" />
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
