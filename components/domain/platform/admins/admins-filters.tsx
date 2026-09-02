'use client';

import { useState, useRef, useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function AdminsFilters() {
  const t = useTranslations('platform.admins');
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

  function reset() {
    const params = new URLSearchParams();
    const tab = sp.get('tab');
    if (tab) params.set('tab', tab);
    setSearchInput('');
    const q = params.toString();
    router.replace(q ? `${pathname}?${q}` : pathname);
  }

  const hasFilters = Boolean(sp.get('search'));

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <div className="relative min-w-[200px] max-w-md flex-1">
        <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="ps-9"
          value={searchInput}
          onChange={(e) => handleSearchInput(e.target.value)}
          placeholder={t('search_placeholder')}
          aria-label={t('search_placeholder')}
        />
      </div>
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={reset} aria-label={t('empty_description')}>
          <X className="size-4" />
        </Button>
      )}
    </div>
  );
}
