'use client';

import { useState, useRef, useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RtlSelect } from '@/components/shared/rtl-select';
import { SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function TenantsFilters() {
  const t = useTranslations('platform.tenants');
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

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

  function setStatus(value: string) {
    const params = new URLSearchParams(sp.toString());
    if (value === 'all') params.delete('isActive');
    else params.set('isActive', value);
    router.replace(`${pathname}?${params.toString()}`);
  }

  function reset() {
    const params = new URLSearchParams();
    const tab = sp.get('tab');
    if (tab) params.set('tab', tab);
    setSearchInput('');
    const q = params.toString();
    router.replace(q ? `${pathname}?${q}` : pathname);
  }

  const hasFilters = Boolean(sp.get('search') || sp.get('isActive'));

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <div className="relative min-w-[200px] flex-1">
        <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="ps-9"
          value={searchInput}
          onChange={(e) => handleSearchInput(e.target.value)}
          placeholder={t('search_placeholder')}
          aria-label={t('search_placeholder')}
        />
      </div>
      <RtlSelect value={sp.get('isActive') ?? 'all'} onValueChange={setStatus}>
        <SelectTrigger className="w-36">
          <SelectValue placeholder={t('status_all')} />
        </SelectTrigger>
        <SelectContent position="popper">
          <SelectItem value="all">{t('status_all')}</SelectItem>
          <SelectItem value="active">{t('status_active')}</SelectItem>
          <SelectItem value="inactive">{t('status_inactive')}</SelectItem>
        </SelectContent>
      </RtlSelect>
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={reset} aria-label={t('reset_filters')}>
          <X className="size-4" />
        </Button>
      )}
    </div>
  );
}
