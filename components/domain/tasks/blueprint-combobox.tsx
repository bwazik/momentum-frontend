'use client';

import { useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandInput, CommandList, CommandItem, CommandEmpty } from '@/components/ui/command';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useBlueprintsInfinite } from '@/lib/api/hooks/use-blueprints';
import { localizeName } from '@/lib/utils/localize';
import { useTaskFormStore } from '@/lib/stores/use-task-form-store';

export function BlueprintCombobox({ disabled }: { disabled?: boolean }) {
  const t = useTranslations('tasks.new');
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const blueprintId = useTaskFormStore((s) => s.blueprintId);
  const set = useTaskFormStore((s) => s.set);

  const handleOpenChange = (o: boolean) => {
    setOpen(o);
    if (o) setSearch('');
  };

  const blueprintFilters = useMemo(() => ({ is_active: true as const, per_page: 50 as const }), []);
  const query = useBlueprintsInfinite(blueprintFilters);
  const allBps = useMemo(
    () => query.data?.pages.flatMap((p) => p.data) ?? [],
    [query.data],
  );
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allBps;
    return allBps.filter((bp) =>
      (bp.name_ar || '').toLowerCase().includes(q) || (bp.name_en || '').toLowerCase().includes(q),
    );
  }, [allBps, search]);

  const selected = allBps.find((bp) => bp.public_id === blueprintId);
  const label = selected ? localizeName(locale, selected.name_ar, selected.name_en) : '';

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" className="w-full justify-between" disabled={disabled}>
          <span className="truncate">{label || t('select_blueprint')}</span>
          <ChevronsUpDown className="ms-2 size-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0" align="start" style={{ width: 'var(--radix-popover-trigger-width)' }}>
        <Command key={open ? 'open' : 'closed'} shouldFilter={false}>
          <CommandInput value={search} onValueChange={setSearch} placeholder={t('search_blueprint')} />
          <CommandList>
            {query.isError ? (
              <CommandEmpty>{t('no_blueprints')}</CommandEmpty>
            ) : query.isLoading ? (
              <div className="p-2"><Skeleton className="h-6 w-full" /></div>
            ) : filtered.length === 0 ? (
              <CommandEmpty>{t('no_blueprints')}</CommandEmpty>
            ) : (
              <>
                {filtered.map((bp) => (
                  <CommandItem
                    key={bp.public_id}
                    value={bp.public_id}
                    onSelect={() => {
                      set('blueprintId', bp.public_id);
                      set('blueprintName', localizeName(locale, bp.name_ar, bp.name_en));
                      setOpen(false);
                    }}
                  >
                    <Check className={cn('me-2 size-4', blueprintId === bp.public_id ? 'opacity-100' : 'opacity-0')} />
                    {localizeName(locale, bp.name_ar, bp.name_en)}
                  </CommandItem>
                ))}
                {query.hasNextPage && (
                  <Button
                    variant="ghost"
                    className="w-full rounded-none text-muted-foreground"
                    onClick={() => query.fetchNextPage()}
                    disabled={query.isFetchingNextPage}
                  >
                    {query.isFetchingNextPage ? <Loader2 className="mx-auto size-4 animate-spin" /> : t('load_more')}
                  </Button>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
