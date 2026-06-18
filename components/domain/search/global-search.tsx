'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Search as SearchIcon } from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { useSearch, useRecentActivity } from '@/lib/api/hooks/use-search';
import { Skeleton } from '@/components/ui/skeleton';
import { useDebounce } from '@/lib/hooks/use-debounce';

export function GlobalSearch() {
  const t = useTranslations('search');
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const router = useRouter();

  const { data: recentData, isLoading: recentLoading } = useRecentActivity();
  const { data: searchData, isLoading: searchLoading } = useSearch(debouncedQuery);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleSelect = useCallback(
    (publicId: string) => {
      setOpen(false);
      router.push(`/tasks/${publicId}`);
    },
    [router],
  );

  const showResults = debouncedQuery.length >= 2;
  const results = (searchData?.data ?? []) as Array<{ public_id: string; title_ar?: string; title_en?: string; status?: string; sla_health?: string; department_name?: string; blueprint_name?: string }>;
  const recentItems = (recentData?.data ?? []) as Array<{ public_id: string; title_ar?: string; title_en?: string; status?: string; sla_health?: string; department_name?: string; blueprint_name?: string }>;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm text-muted-foreground"
      >
        <SearchIcon className="size-4" />
        <span className="hidden lg:inline">{t('trigger')}</span>
        <kbd className="hidden rounded bg-muted px-1.5 py-0.5 text-[10px] lg:inline">⌘K</kbd>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder={t('placeholder')} value={query} onValueChange={setQuery} />
        <CommandList>
          {!showResults && (
            <CommandGroup heading={t('recent')}>
              {recentLoading && (
                <div className="space-y-2 p-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>
              )}
              {!recentLoading && recentItems.length === 0 && (
                <CommandEmpty>{t('no_recent')}</CommandEmpty>
              )}
              {recentItems.map((item) => (
                <CommandItem key={item.public_id} onSelect={() => handleSelect(item.public_id)} className="cursor-pointer">
                  <SearchIcon className="size-4" />
                  <span>{locale === 'ar' ? (item.title_ar || item.title_en) : (item.title_en || item.title_ar)}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
          {showResults && (
            <CommandGroup heading={t('results')}>
              {searchLoading && (
                <div className="space-y-2 p-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>
              )}
              {!searchLoading && results.length === 0 && (
                <CommandEmpty>{t('no_results_for', { query: debouncedQuery })}</CommandEmpty>
              )}
              {results.map((result) => {
                const title = locale === 'ar' ? (result.title_ar || result.title_en) : (result.title_en || result.title_ar);
                return (
                  <CommandItem key={result.public_id} onSelect={() => handleSelect(result.public_id)} className="cursor-pointer">
                    <SearchIcon className="size-4" />
                    <div className="flex flex-col">
                      <span>{title}</span>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {result.blueprint_name && <span>{result.blueprint_name}</span>}
                        {result.department_name && <span>{result.department_name}</span>}
                      </div>
                    </div>
                    {result.sla_health && (
                      <span className={`ms-auto size-2 rounded-full ${
                        result.sla_health === 'green' ? 'bg-emerald-500' :
                        result.sla_health === 'amber' ? 'bg-amber-500' :
                        result.sla_health === 'red' ? 'bg-red-500' : 'bg-slate-400'
                      }`} />
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
