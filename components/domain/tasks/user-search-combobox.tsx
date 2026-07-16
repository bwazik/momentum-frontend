'use client';

import { useState, useEffect, useId } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandEmpty,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api/client';
import { useUsersSearch } from '@/lib/api/hooks/use-task-detail';
import { localizeName } from '@/lib/utils/localize';
import type { CursorPage } from '@/lib/api/types';
import type { components } from '@/lib/generated/api-types';

type UserResource = components['schemas']['UserResource'];

interface UserSearchComboboxProps {
  value: string;
  onChange: (userPublicId: string) => void;
  placeholder?: string;
}

export function UserSearchCombobox({
  value,
  onChange,
  placeholder,
}: UserSearchComboboxProps) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState('');
  const locale = useLocale();
  const t = useTranslations('tasks.detail');
  const id = useId();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isFetching } = useUsersSearch(debouncedSearch);
  const users = data?.data ?? [];

  const { data: resolvedData } = useQuery({
    queryKey: ['users', 'by-ids', value],
    queryFn: () =>
      apiClient.get<CursorPage<UserResource>>(
        `/v1/iam/users?public_ids[]=${encodeURIComponent(value)}&is_active=1&per_page=1`,
      ),
    enabled: !!value && !users.some((u) => u.public_id === value),
    staleTime: 5 * 60 * 1000,
  });

  const resolvedUser = resolvedData?.data?.[0];
  const resolvedLabel = resolvedUser
    ? localizeName(locale, resolvedUser.name_ar, resolvedUser.name_en)
    : '';

  const displayLabel = value
    ? (users.find((u) => u.public_id === value)
        ? localizeName(locale, users.find((u) => u.public_id === value)!.name_ar, users.find((u) => u.public_id === value)!.name_en)
        : selectedLabel || resolvedLabel)
    : '';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          id={id}
          className="w-full justify-between"
        >
          <span className="truncate">
            {displayLabel || placeholder || t('search_users')}
          </span>
          <ChevronsUpDown className="ms-2 size-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0"
        align="start"
        style={{ width: `var(--radix-popover-trigger-width)` }}
      >
        <Command shouldFilter={false}>
          <CommandInput
            value={search}
            onValueChange={setSearch}
            placeholder={t('search_users')}
          />
          <CommandList>
            {isFetching ? (
              <CommandEmpty>
                <Loader2 className="mx-auto size-4 animate-spin" />
              </CommandEmpty>
            ) : (
              <CommandEmpty>{t('no_results')}</CommandEmpty>
            )}
            {users.map((user) => {
              const name = localizeName(
                locale,
                user.name_ar,
                user.name_en,
              );
              return (
                <CommandItem
                  key={user.public_id}
                  value={user.public_id}
                  onSelect={() => {
                    setSelectedLabel(name);
                    onChange(user.public_id);
                    setOpen(false);
                    setSearch('');
                  }}
                >
                  <Check
                    className={cn(
                      'me-2 size-4',
                      value === user.public_id
                        ? 'opacity-100'
                        : 'opacity-0',
                    )}
                  />
                  {name}
                </CommandItem>
              );
            })}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
