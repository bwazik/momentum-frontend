'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { RtlSelect } from '@/components/shared/rtl-select';
import { SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function PrioritiesFilters() {
  const t = useTranslations('admin.priorities');
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  function setFilter(key: string, value: string | null) {
    const params = new URLSearchParams(sp.toString());
    if (value && value !== 'all') params.set(key, value);
    else params.delete(key);
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <RtlSelect value={sp.get('isActive') ?? 'all'} onValueChange={(v) => setFilter('isActive', v === 'all' ? null : v)}>
        <SelectTrigger className="w-full"><SelectValue placeholder={t('status_all')} /></SelectTrigger>
        <SelectContent position="popper">
          <SelectItem value="all">{t('status_all')}</SelectItem>
          <SelectItem value="active">{t('status_active')}</SelectItem>
          <SelectItem value="inactive">{t('status_inactive')}</SelectItem>
        </SelectContent>
      </RtlSelect>
    </div>
  );
}
