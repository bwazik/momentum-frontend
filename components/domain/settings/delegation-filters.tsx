'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import { UserSearchCombobox } from '@/components/domain/tasks/user-search-combobox';
import { RtlSelect } from '@/components/shared/rtl-select';
import { SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCapability } from '@/lib/api/hooks/use-capabilities';
import { useBlueprintCategories, useBlueprintStageTypes } from '@/lib/api/hooks/use-blueprints';
import { localizeName } from '@/lib/utils/localize';
import type { ActiveDelegationFilters } from '@/lib/api/hooks/use-delegations';

interface DelegationFiltersProps {
  filters: ActiveDelegationFilters;
}

export function DelegationFilters({ filters }: DelegationFiltersProps) {
  const t = useTranslations('settings.delegations.filters');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const canManageUsers = useCapability('iam.manage_users');
  const { data: categories } = useBlueprintCategories();
  const { data: stageTypes } = useBlueprintStageTypes();

  function setParam(key: string, value?: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-2">
      {canManageUsers && (
        <>
          <div className="flex-1">
            <UserSearchCombobox
              value={filters.delegator_user_id ?? ''}
              onChange={(v) => setParam('delegatorId', v || null)}
              placeholder={t('delegator')}
            />
          </div>
          <div className="flex-1">
            <UserSearchCombobox
              value={filters.delegate_user_id ?? ''}
              onChange={(v) => setParam('delegateId', v || null)}
              placeholder={t('delegate')}
            />
          </div>
        </>
      )}
      <div className="flex-1">
        <RtlSelect
          value={filters.blueprint_category_id ?? 'all'}
          onValueChange={(v) => setParam('blueprintCategoryId', v === 'all' ? null : v)}
        >
          <SelectTrigger className="w-full h-9">
            <SelectValue placeholder={t('category')} />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="all">{t('all_categories')}</SelectItem>
            {(categories ?? []).map((c) => (
              <SelectItem key={c.public_id} value={c.public_id}>
                {localizeName(locale, c.name_ar, c.name_en)}
              </SelectItem>
            ))}
          </SelectContent>
        </RtlSelect>
      </div>
      <div className="flex-1">
        <RtlSelect
          value={filters.stage_type_id ?? 'all'}
          onValueChange={(v) => setParam('stageTypeId', v === 'all' ? null : v)}
        >
          <SelectTrigger className="w-full h-9">
            <SelectValue placeholder={t('stage_type')} />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="all">{t('all_stage_types')}</SelectItem>
            {(stageTypes ?? []).map((s) => (
              <SelectItem key={s.public_id} value={s.public_id}>
                {localizeName(locale, s.name_ar, s.name_en)}
              </SelectItem>
            ))}
          </SelectContent>
        </RtlSelect>
      </div>
      <Button variant="ghost" size="sm" onClick={() => {
        const params = new URLSearchParams();
        const tab = searchParams.get('tab');
        if (tab) params.set('tab', tab);
        router.replace(`${pathname}?${params.toString()}`);
      }}>
        {t('reset')}
      </Button>
    </div>
  );
}
