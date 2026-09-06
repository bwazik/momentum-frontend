'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useDebounce } from '@/lib/hooks/use-debounce';
import { useImpersonateUser, usePlatformTenantUsersInfinite } from '@/lib/api/hooks/use-platform';
import { localizeName, type PlatformTenantUser } from '@/lib/utils/platform-utils';

interface ImpersonateUserDialogProps {
  tenantPublicId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImpersonateUserDialog({
  tenantPublicId,
  open,
  onOpenChange,
}: ImpersonateUserDialogProps) {
  const t = useTranslations('platform.impersonation');
  const c = useTranslations('platform.common');
  const locale = useLocale();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [selected, setSelected] = useState<PlatformTenantUser | null>(null);

  const users = usePlatformTenantUsersInfinite(tenantPublicId, {
    search: debouncedSearch || undefined,
    is_active: true,
    per_page: 15,
  });
  const impersonate = useImpersonateUser(tenantPublicId);
  const list = users.data?.pages.flatMap((page) => page.data) ?? [];

  function close(nextOpen: boolean) {
    if (!nextOpen) {
      setSearch('');
      setSelected(null);
    }
    onOpenChange(nextOpen);
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('start_title')}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Field>
            <FieldLabel>{t('select_user')}</FieldLabel>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('search_placeholder')}
            />
          </Field>
          <div className="flex max-h-56 flex-col gap-1 overflow-y-auto rounded-md border p-1">
            {list.map((user) => (
              <button
                type="button"
                key={user.public_id}
                onClick={() => setSelected(user)}
                className={`flex w-full items-center justify-between rounded-md p-2 text-start transition-colors hover:bg-muted ${
                  selected?.public_id === user.public_id ? 'border border-primary bg-primary/10 font-medium' : ''
                }`}
              >
                <span>{localizeName(locale, user.name_ar, user.name_en)}</span>
                <span className="font-mono text-xs text-muted-foreground" dir="ltr">
                  {user.email}
                </span>
              </button>
            ))}
            {!users.isLoading && list.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">{t('no_users')}</p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => close(false)}>
            {c('cancel')}
          </Button>
          <Button
            disabled={!selected || impersonate.isPending}
            onClick={() =>
              selected &&
              impersonate.mutate(
                { user_public_id: selected.public_id },
                { onSuccess: () => close(false) },
              )
            }
          >
            {t('start')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
