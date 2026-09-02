'use client';

import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RtlSelect } from '@/components/shared/rtl-select';
import { SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function TenantsFilters() {
  const t = useTranslations('platform.tenants');
  const router = useRouter(); const pathname = usePathname(); const params = useSearchParams();
  const [search, setSearch] = useState(params.get('search') ?? '');
  useEffect(() => { const timer = setTimeout(() => { const next = new URLSearchParams(params); if (search) next.set('search', search); else next.delete('search'); router.replace(`${pathname}?${next}`); }, 300); return () => clearTimeout(timer); }, [search, params, pathname, router]);
  function setStatus(value: string) { const next = new URLSearchParams(params); if (value === 'all') next.delete('isActive'); else next.set('isActive', value); router.replace(`${pathname}?${next}`); }
  function reset() { const next = new URLSearchParams(); if (params.get('tab')) next.set('tab', params.get('tab')!); router.replace(`${pathname}?${next}`); setSearch(''); }
  const filtered = Boolean(params.get('search') || params.get('isActive'));
  return <div className="mb-4 flex flex-wrap items-center gap-2"><div className="relative min-w-[220px] flex-1"><Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="ps-9" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('search_placeholder')} aria-label={t('search_placeholder')} /></div><RtlSelect value={params.get('isActive') ?? 'all'} onValueChange={setStatus}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent position="popper"><SelectItem value="all">{t('status_all')}</SelectItem><SelectItem value="active">{t('status_active')}</SelectItem><SelectItem value="inactive">{t('status_inactive')}</SelectItem></SelectContent></RtlSelect>{filtered && <Button variant="ghost" size="icon" onClick={reset} aria-label={t('reset_filters')}><X /></Button>}</div>;
}
