'use client';

import { useState, useEffect, useId } from 'react';
import { useLocale, useTranslations } from 'next-intl';
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
import { useUsersSearch } from '@/lib/api/hooks/use-task-detail';
import { localizeName } from './task-detail-utils';

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
    if (!value) setSelectedLabel('');
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, isFetching } = useUsersSearch(debouncedSearch);
  const users = data?.data ?? [];

  const currentSelected = users.find((u) => u.public_id === value);
  const displayLabel = currentSelected
    ? localizeName(locale, currentSelected.name_ar, currentSelected.name_en)
    : selectedLabel;

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
