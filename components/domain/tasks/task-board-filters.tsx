'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
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
import type { TaskBoardUrlFilters } from './task-board-types';

interface TaskBoardFiltersProps {
  filters: TaskBoardUrlFilters;
}

export function TaskBoardFilters({ filters }: TaskBoardFiltersProps) {
  const t = useTranslations('tasks.board.filters');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [searchInput, setSearchInput] = useState(filters.search ?? '');

  useEffect(() => {
    const timer = setTimeout(() => {
      const currentSearch = searchParams.get('search') ?? '';
      if (searchInput !== currentSearch) {
        const params = new URLSearchParams(searchParams.toString());
        if (searchInput) params.set('search', searchInput);
        else params.delete('search');
        router.replace(`${pathname}?${params.toString()}`);
      }
    }, 300);
    return () => clearTimeout(timer);
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
          <ToggleGroupItem value="active" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">{t('active')}</ToggleGroupItem>
          <ToggleGroupItem value="mine" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">{t('mine')}</ToggleGroupItem>
          <ToggleGroupItem value="overdue" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">{t('overdue')}</ToggleGroupItem>
          <ToggleGroupItem value="at_risk" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">{t('at_risk')}</ToggleGroupItem>
          <ToggleGroupItem value="suspended" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">{t('suspended')}</ToggleGroupItem>
          <ToggleGroupItem value="all" className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">{t('all')}</ToggleGroupItem>
        </ToggleGroup>
        <Button variant="ghost" onClick={resetFilters}>
          {t('reset')}
        </Button>
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
                <SelectItem value="time_at_stage">{t('sort_time_at_stage')}</SelectItem>
                <SelectItem value="priority">{t('sort_priority')}</SelectItem>
                <SelectItem value="due_date">{t('sort_due_date')}</SelectItem>
                <SelectItem value="created_at">{t('sort_created_at')}</SelectItem>
                <SelectItem value="department">{t('sort_department')}</SelectItem>
                <SelectItem value="stage_type">{t('sort_stage_type')}</SelectItem>
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
            <ArrowUpDown className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
