'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useImpersonateUser, usePlatformTenantUsersInfinite } from '@/lib/api/hooks/use-platform';
import type { PlatformTenantUser } from '@/lib/utils/platform-utils';

export function ImpersonateUserDialog({ tenantPublicId, open, onOpenChange }: { tenantPublicId: string; open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useTranslations('platform.impersonation'); const c = useTranslations('platform.common'); const [search, setSearch] = useState(''); const [selected, setSelected] = useState<PlatformTenantUser | null>(null);
  const users = usePlatformTenantUsersInfinite(tenantPublicId, { search: search || undefined, is_active: true, per_page: 15 }); const impersonate = useImpersonateUser(tenantPublicId); const list = users.data?.pages.flatMap((page) => page.data) ?? [];
  function close(nextOpen: boolean) { if (!nextOpen) { setSearch(''); setSelected(null); } onOpenChange(nextOpen); }
  return <Dialog open={open} onOpenChange={close}><DialogContent><DialogHeader><DialogTitle>{t('start_title')}</DialogTitle></DialogHeader><Field><FieldLabel>{t('select_user')}</FieldLabel><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('search_placeholder')} /></Field><div className="max-h-56 space-y-1 overflow-auto">{list.map((user) => <button type="button" className={`flex w-full items-center justify-between rounded-md border p-2 text-start ${selected?.public_id === user.public_id ? 'border-primary bg-primary/10' : ''}`} key={user.public_id} onClick={() => setSelected(user)}><span>{user.name_ar}</span><span className="text-xs text-muted-foreground" dir="ltr">{user.email}</span></button>)}{!users.isLoading && list.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">{t('no_users')}</p>}</div><DialogFooter><Button type="button" variant="outline" onClick={() => close(false)}>{c('cancel')}</Button><Button disabled={!selected || impersonate.isPending} onClick={() => selected && impersonate.mutate({ user_public_id: selected.public_id }, { onSuccess: () => close(false) })}>{t('start')}</Button></DialogFooter></DialogContent></Dialog>;
}
