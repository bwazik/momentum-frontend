'use client';

import { useState, useEffect, useMemo, useId } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { Check, ChevronsUpDown, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandInput, CommandList, CommandItem, CommandEmpty } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api/client';
import { useUsersSearch } from '@/lib/api/hooks/use-task-detail';
import { localizeName } from '@/lib/utils/localize';
import type { components } from '@/lib/generated/api-types';

interface MultiUserComboboxProps {
  value: string[];
  onChange: (userPublicIds: string[]) => void;
  placeholder?: string;
  ariaLabel?: string;
}

export function MultiUserCombobox({ value, onChange, placeholder, ariaLabel }: MultiUserComboboxProps) {
  const t = useTranslations('tasks.new');
  const locale = useLocale();
  const id = useId();
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [open, setOpen] = useState(false);
  const [labels, setLabels] = useState<Record<string, string>>({});

  useEffect(() => {
    const tm = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(tm);
  }, [search]);

  const { data, isFetching, isError } = useUsersSearch(debounced);
  const users = data?.data ?? [];

  const unknownIds = useMemo(
    () => value.filter((uid) => !labels[uid]),
    [value, labels],
  );
  const sortedIds = useMemo(() => [...unknownIds].sort(), [unknownIds]);
  const { data: resolvedData } = useQuery({
    queryKey: ['users', 'by-ids', sortedIds],
    queryFn: () => {
      const qs = unknownIds.map((id) => `public_ids[]=${encodeURIComponent(id)}`).join('&');
      return apiClient.get<{ data: components['schemas']['UserResource'][] }>(
        `/v1/iam/users?${qs}&per_page=${unknownIds.length}`,
      );
    },
    enabled: unknownIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });
  const resolvedUsers = resolvedData?.data ?? [];

  useEffect(() => {
    if (resolvedUsers.length === 0) return;
    setLabels((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const user of resolvedUsers) {
        if (next[user.public_id]) continue;
        next[user.public_id] = localizeName(locale, user.name_ar, user.name_en);
        changed = true;
      }
      return changed ? next : prev;
    });
  }, [resolvedUsers, locale]);

  useEffect(() => {
    if (users.length === 0) return;
    setLabels((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const uid of value) {
        if (next[uid]) continue;
        const user = users.find((u) => u.public_id === uid);
        if (user) {
          next[uid] = localizeName(locale, user.name_ar, user.name_en);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [users, value, locale]);

  const toggle = (uid: string) => {
    const user = users.find((u) => u.public_id === uid);
    if (user) {
      setLabels((prev) => ({ ...prev, [uid]: localizeName(locale, user.name_ar, user.name_en) }));
    }
    onChange(value.includes(uid) ? value.filter((v) => v !== uid) : [...value, uid]);
  };

  return (
    <div className="flex flex-col gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" id={id} aria-label={ariaLabel ?? placeholder} className="w-full justify-between">
            <span className="truncate">{placeholder || t('select_users')}</span>
            <ChevronsUpDown className="ms-2 size-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0" align="start" style={{ width: 'var(--radix-popover-trigger-width)' }}>
          <Command shouldFilter={false}>
            <CommandInput value={search} onValueChange={setSearch} placeholder={t('search_users')} />
            <CommandList>
              {isError ? (
                <CommandEmpty>{t('no_users')}</CommandEmpty>
              ) : isFetching ? (
                <CommandEmpty><Loader2 className="mx-auto size-4 animate-spin" /></CommandEmpty>
              ) : debounced.length < 2 ? (
                <CommandEmpty>{t('search_min_chars')}</CommandEmpty>
              ) : users.length === 0 ? (
                <CommandEmpty>{t('no_users')}</CommandEmpty>
              ) : (
                users.map((u) => {
                  const name = localizeName(locale, u.name_ar, u.name_en);
                  return (
                    <CommandItem key={u.public_id} value={u.public_id} onSelect={() => toggle(u.public_id)}>
                      <Check className={cn('me-2 size-4', value.includes(u.public_id) ? 'opacity-100' : 'opacity-0')} />
                      {name}
                    </CommandItem>
                  );
                })
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((uid) => (
            <Badge key={uid} variant="secondary" className="gap-1">
              {labels[uid] || <span className="size-4 animate-pulse rounded bg-muted-foreground/20" />}
              {labels[uid] && (
                <button
                  type="button"
                  className="rounded-full p-1.5 hover:bg-background cursor-pointer"
                  aria-label={t('remove_user', { name: labels[uid] })}
                  onClick={() => onChange(value.filter((v) => v !== uid))}
                >
                  <X className="size-3" aria-hidden="true" />
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
