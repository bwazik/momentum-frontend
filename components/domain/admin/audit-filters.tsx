'use client';

import { useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RtlSelect } from '@/components/shared/rtl-select';
import { SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateRangePicker } from '@/components/shared/date-range-picker';
import { CalendarSystemToggle } from '@/components/shared/calendar-system-toggle';
import { AUDIT_ENTITY_TYPE_LABELS, AUDIT_EVENT_TYPE_SUGGESTIONS } from '@/lib/utils/audit-utils';
import { UserSearchCombobox } from '@/components/domain/tasks/user-search-combobox';
import { X } from 'lucide-react';

export function AuditFilters() {
  const t = useTranslations('admin.audit');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [customEvent, setCustomEvent] = useState(false);

  function setFilter(key: string, value: string | null) {
    const params = new URLSearchParams(sp.toString());
    if (value && value !== 'all') params.set(key, value);
    else params.delete(key);
    router.replace(`${pathname}?${params.toString()}`);
  }

  function resetFilters() {
    const params = new URLSearchParams();
    const tab = sp.get('tab');
    if (tab) params.set('tab', tab);
    router.replace(`${pathname}?${params.toString()}`);
  }

  const entityTypeLabels = AUDIT_ENTITY_TYPE_LABELS;
  const hasFilters = sp.get('userPublicId') || sp.get('eventType') || sp.get('entityType') || sp.get('dateFrom');

  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <div className="min-w-[200px] flex-1">
        <UserSearchCombobox
          value={sp.get('userPublicId') ?? ''}
          onChange={(v) => setFilter('userPublicId', v || null)}
          placeholder={t('user_placeholder')}
        />
      </div>
      <RtlSelect
        value={customEvent ? 'custom' : (sp.get('eventType') ?? 'all')}
        onValueChange={(v) => {
          if (v === 'custom') { setCustomEvent(true); setFilter('eventType', null); }
          else { setCustomEvent(false); setFilter('eventType', v === 'all' ? null : v); }
        }}
      >
        <SelectTrigger className="w-36"><SelectValue placeholder={t('event_type_all')} /></SelectTrigger>
        <SelectContent position="popper">
          <SelectItem value="all">{t('event_type_all')}</SelectItem>
          {AUDIT_EVENT_TYPE_SUGGESTIONS.map((ev) => (
            <SelectItem key={ev} value={ev}>{ev}</SelectItem>
          ))}
          <SelectItem value="custom">{t('event_type_custom')}</SelectItem>
        </SelectContent>
      </RtlSelect>
      {customEvent && (
        <Input
          className="w-32"
          placeholder={t('event_type_placeholder')}
          value={sp.get('eventType') ?? ''}
          onChange={(e) => setFilter('eventType', e.target.value || null)}
        />
      )}
      <RtlSelect value={sp.get('entityType') ?? 'all'} onValueChange={(v) => setFilter('entityType', v === 'all' ? null : v)}>
        <SelectTrigger className="w-36"><SelectValue placeholder={t('entity_type_all')} /></SelectTrigger>
        <SelectContent position="popper">
          <SelectItem value="all">{t('entity_type_all')}</SelectItem>
          {Object.entries(entityTypeLabels).map(([key, val]) => (
            <SelectItem key={key} value={key}>{locale === 'ar' ? val.ar : val.en}</SelectItem>
          ))}
        </SelectContent>
      </RtlSelect>
      <div className="min-w-[200px] flex-1">
        <DateRangePicker
          from={sp.get('dateFrom') ?? null}
          to={sp.get('dateTo') ?? null}
          calendarSystem={(sp.get('calendarSystem') as 'gregorian' | 'hijri') || 'gregorian'}
          onChange={(from, to) => {
            const params = new URLSearchParams(sp.toString());
            if (from) params.set('dateFrom', from); else params.delete('dateFrom');
            if (to) params.set('dateTo', to); else params.delete('dateTo');
            router.replace(`${pathname}?${params.toString()}`);
          }}
        />
      </div>
      <CalendarSystemToggle
        value={(sp.get('calendarSystem') as 'gregorian' | 'hijri') || 'gregorian'}
        onChange={(v) => {
          const params = new URLSearchParams(sp.toString());
          params.set('calendarSystem', v);
          params.delete('dateFrom');
          params.delete('dateTo');
          router.replace(`${pathname}?${params.toString()}`);
        }}
      />
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={resetFilters} aria-label={t('reset_filters')}>
          <X className="size-4" />
        </Button>
      )}
    </div>
  );
}
