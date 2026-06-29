'use client';

import { useState, useEffect, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { SearchIcon, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { AdvancedFiltersSheet } from '@/components/shared/advanced-filters-sheet';
import type { TaskBoardUrlFilters } from '@/components/domain/tasks/task-board-types';

const QUICK_FILTERS = ['active', 'mine', 'overdue', 'at_risk', 'suspended', 'draft', 'all'] as const;
const SORT_FIELDS = ['time_at_stage', 'priority', 'due_date', 'created_at', 'department', 'stage_type'] as const;

interface BoardFiltersProps {
  t: ReturnType<typeof useTranslations>;
  filters: TaskBoardUrlFilters;
}

export function BoardFilters({ t, filters }: BoardFiltersProps) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchInput, setSearchInput] = useState(filters.search ?? '');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const currentSearch = searchParams.get('search') ?? '';
      if (searchInput !== currentSearch) {
        const params = new URLSearchParams(searchParams.toString());
        if (searchInput) params.set('search', searchInput);
        else params.delete('search');
        router.replace(`${pathname}?${params.toString()}`);
      }
    }, 300);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [searchInput, pathname, router, searchParams]);

  function setParam(key: string, value?: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.replace(`${pathname}?${params.toString()}`);
  }

  function resetFilters() {
    router.replace(pathname);
  }

  function handleQuickFilter(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('scope');
    params.delete('status');
    if (value === 'mine') params.set('scope', 'mine');
    else if (value !== 'all') params.set('status', value);
    else params.set('status', 'all');
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-3 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <ToggleGroup
          type="single"
          value={filters.scope === 'mine' ? 'mine' : filters.status ?? 'active'}
          onValueChange={(value) => {
            if (!value) return;
            handleQuickFilter(value);
          }}
        >
          {(locale === 'ar' ? [...QUICK_FILTERS].reverse() : QUICK_FILTERS).map((k) => (
            <ToggleGroupItem key={k} value={k} className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
              {t(k)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <Button variant="ghost" onClick={resetFilters}>
          {t('reset')}
        </Button>
        <AdvancedFiltersSheet t={t} filters={filters} onParam={setParam} />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Field>
          <FieldLabel className="sr-only">{t('search')}</FieldLabel>
          <InputGroup>
            <InputGroupInput
              value={searchInput}
              placeholder={t('search_placeholder')}
              onChange={(event) => setSearchInput(event.target.value)}
            />
            <InputGroupAddon>
              <SearchIcon aria-hidden="true" />
            </InputGroupAddon>
          </InputGroup>
        </Field>

        <div className="flex items-center gap-2">
          <Select
            dir={locale === 'ar' ? 'rtl' : 'ltr'}
            value={filters.sortBy ?? 'time_at_stage'}
            onValueChange={(value) => setParam('sortBy', value)}
          >
            <SelectTrigger className="flex-1" aria-label={t('sort_by')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectGroup>
                {SORT_FIELDS.map((k) => (
                  <SelectItem key={k} value={k}>{t(`sort_${k}`)}</SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            className="size-8 shrink-0"
            aria-label={filters.sortDirection === 'asc' ? t('sort_asc') : t('sort_desc')}
            onClick={() => setParam('sortDirection', filters.sortDirection === 'asc' ? 'desc' : 'asc')}
          >
            <ArrowUpDown className="size-4 rtl:rotate-180" />
          </Button>
        </div>
      </div>
    </div>
  );
}
