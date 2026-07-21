'use client';

import { useState, useRef, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Input } from '@/components/ui/input';
import { RtlSelect } from '@/components/shared/rtl-select';
import { SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDepartmentTree } from '@/lib/api/hooks/use-organization';
import { flattenTree } from '@/components/domain/organization/organization-utils';
import { localizeName } from '@/lib/utils/localize';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function UsersFilters() {
  const t = useTranslations('admin.users');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const { data: departmentsTree } = useDepartmentTree();
  const departments = departmentsTree ? flattenTree(departmentsTree) : [];

  const [searchInput, setSearchInput] = useState(sp.get('search') ?? '');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchInput = useCallback(
    (value: string) => {
      setSearchInput(value);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        const params = new URLSearchParams(sp.toString());
        if (value) params.set('search', value);
        else params.delete('search');
        router.replace(`${pathname}?${params.toString()}`);
      }, 300);
    },
    [sp, pathname, router],
  );

  function setFilter(key: string, value: string | null) {
    const params = new URLSearchParams(sp.toString());
    if (value && value !== 'all') params.set(key, value);
    else params.delete(key);
    router.replace(`${pathname}?${params.toString()}`);
  }

  function resetFilters() {
    const params = new URLSearchParams();
    const tab = sp.get('tab');
    if (tab) params.set('tab', tab);
    router.replace(`${pathname}?${params.toString()}`);
  }

  const hasFilters = sp.get('search') || sp.get('isActive') || sp.get('accountType') || sp.get('departmentId');

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="ps-9"
          placeholder={t('search_placeholder')}
          value={searchInput}
          onChange={(e) => handleSearchInput(e.target.value)}
          aria-label={t('search_placeholder')}
        />
      </div>
      <RtlSelect value={sp.get('isActive') ?? 'all'} onValueChange={(v) => setFilter('isActive', v === 'all' ? null : v)}>
        <SelectTrigger className="w-36"><SelectValue placeholder={t('status_all')} /></SelectTrigger>
        <SelectContent position="popper">
          <SelectItem value="all">{t('status_all')}</SelectItem>
          <SelectItem value="active">{t('status_active')}</SelectItem>
          <SelectItem value="inactive">{t('status_inactive')}</SelectItem>
        </SelectContent>
      </RtlSelect>
      <RtlSelect value={sp.get('accountType') ?? 'all'} onValueChange={(v) => setFilter('accountType', v === 'all' ? null : v)}>
        <SelectTrigger className="w-44"><SelectValue placeholder={t('account_type_all')} /></SelectTrigger>
        <SelectContent position="popper">
          <SelectItem value="all">{t('account_type_all')}</SelectItem>
          <SelectItem value="internal_user">{t('account_type_1')}</SelectItem>
          <SelectItem value="tenant_admin">{t('account_type_2')}</SelectItem>
          <SelectItem value="external_auditor">{t('account_type_3')}</SelectItem>
        </SelectContent>
      </RtlSelect>
      <RtlSelect value={sp.get('departmentId') ?? 'all'} onValueChange={(v) => setFilter('departmentId', v === 'all' ? null : v)}>
        <SelectTrigger className="w-44"><SelectValue placeholder={t('department_all')} /></SelectTrigger>
        <SelectContent position="popper">
          <SelectItem value="all">{t('department_all')}</SelectItem>
          {(departments ?? []).map((d) => (
            <SelectItem key={d.public_id} value={d.public_id}>
              {localizeName(locale, d.name_ar, d.name_en)}
            </SelectItem>
          ))}
        </SelectContent>
      </RtlSelect>
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={resetFilters} aria-label={t('reset_filters')}>
          <X className="size-4" />
        </Button>
      )}
    </div>
  );
}
