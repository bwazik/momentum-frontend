'use client';

import { useState, useRef, useCallback } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface DepartmentsToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  isActive: boolean | undefined;
  onActiveChange: (value: boolean | null) => void;
}

export function DepartmentsToolbar({
  search,
  onSearchChange,
  isActive,
  onActiveChange,
}: DepartmentsToolbarProps) {
  const t = useTranslations('organization');
  const locale = useLocale();
  const [localSearch, setLocalSearch] = useState(search);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchInput = useCallback(
    (value: string) => {
      setLocalSearch(value);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        onSearchChange(value);
      }, 300);
    },
    [onSearchChange],
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute start-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={localSearch}
          onChange={(e) => handleSearchInput(e.target.value)}
          placeholder={t('departments.search_placeholder')}
          className="ps-8"
        />
      </div>

      <ToggleGroup
        type="single"
        dir={locale === 'ar' ? 'rtl' : 'ltr'}
        value={isActive === undefined ? 'all' : isActive ? 'active' : 'inactive'}
        onValueChange={(v: string) => {
          if (v === 'all') onActiveChange(null);
          else if (v === 'active') onActiveChange(true);
          else onActiveChange(false);
        }}
        className="[&_[data-state=on]]:!bg-primary [&_[data-state=on]]:!text-primary-foreground"
      >
        <ToggleGroupItem value="all" size="sm">{t('departments.all')}</ToggleGroupItem>
        <ToggleGroupItem value="active" size="sm">{t('status.active')}</ToggleGroupItem>
        <ToggleGroupItem value="inactive" size="sm">{t('status.inactive')}</ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}
