'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { SearchIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RtlSelect } from '@/components/shared/rtl-select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useBlueprintCategories } from '@/lib/api/hooks/use-blueprints';
import type { BlueprintListFilters } from '@/lib/api/hooks/use-blueprints';

interface BlueprintFiltersProps {
  filters: BlueprintListFilters;
}

export function BlueprintFilters({ filters }: BlueprintFiltersProps) {
  const t = useTranslations('blueprints.library.filters');
  const tb = useTranslations('blueprints.badges');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data: categories } = useBlueprintCategories();
  const [searchInput, setSearchInput] = useState(filters.search ?? '');

  useEffect(() => {
    const timer = setTimeout(() => {
      const current = filters.search ?? '';
      if (searchInput !== current) {
        const params = new URLSearchParams(searchParams.toString());
        if (searchInput) params.set('search', searchInput);
        else params.delete('search');
        router.replace(`${pathname}?${params.toString()}`);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput, pathname, router, filters.search, searchParams]);

  function setParam(key: string, value?: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value); else params.delete(key);
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-3 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <ToggleGroup type="single" value={filters.is_active === false ? 'inactive' : filters.is_active === true ? 'active' : 'all'}
          onValueChange={(v) => { if (!v) return; setParam('is_active', v === 'all' ? null : v); }}>
          <ToggleGroupItem value="active" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">{t('active')}</ToggleGroupItem>
          <ToggleGroupItem value="inactive" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">{t('inactive')}</ToggleGroupItem>
          <ToggleGroupItem value="all" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">{t('all')}</ToggleGroupItem>
        </ToggleGroup>
        <Button variant="ghost" onClick={() => router.replace(pathname)}>{t('reset')}</Button>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Field>
          <FieldLabel className="sr-only">{t('search')}</FieldLabel>
          <InputGroup>
            <InputGroupInput value={searchInput} placeholder={t('search_placeholder')} onChange={(e) => setSearchInput(e.target.value)} />
            <InputGroupAddon><SearchIcon aria-hidden="true" /></InputGroupAddon>
          </InputGroup>
        </Field>
        <RtlSelect value={filters.category_id ?? 'all'} onValueChange={(v) => setParam('category_id', v === 'all' ? null : v)}>
          <SelectTrigger className="w-full" aria-label={t('category')}><SelectValue /></SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="all">{t('all_categories')}</SelectItem>
            {(categories ?? []).map((c) => (
              <SelectItem key={c.public_id} value={c.public_id}>{locale === 'ar' ? c.name_ar : c.name_en}</SelectItem>
            ))}
          </SelectContent>
        </RtlSelect>
        <RtlSelect value={filters.scope ? String(filters.scope) : 'all'} onValueChange={(v) => setParam('scope', v === 'all' ? null : v)}>
          <SelectTrigger className="w-full" aria-label={t('scope')}><SelectValue /></SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value="all">{t('all_scopes')}</SelectItem>
            <SelectItem value="1">{tb('scope_organization')}</SelectItem>
            <SelectItem value="2">{tb('scope_department')}</SelectItem>
          </SelectContent>
        </RtlSelect>
      </div>
    </div>
  );
}
