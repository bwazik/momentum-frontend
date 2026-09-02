'use client';

import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';

export function AdminsFilters() { const t = useTranslations('platform.admins'); const router = useRouter(); const pathname = usePathname(); const params = useSearchParams(); const [search, setSearch] = useState(params.get('search') ?? ''); useEffect(() => { const timer = setTimeout(() => { const next = new URLSearchParams(params); if (search) next.set('search', search); else next.delete('search'); router.replace(`${pathname}?${next}`); }, 300); return () => clearTimeout(timer); }, [search, params, pathname, router]); return <div className="mb-4 relative max-w-md"><Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="ps-9" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('search_placeholder')} aria-label={t('search_placeholder')} /></div>; }
