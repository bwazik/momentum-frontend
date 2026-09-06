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
import { usePlatformAdminsInfinite } from '@/lib/api/hooks/use-platform';
import {
  PLATFORM_AUDIT_ACTION_LABELS,
  PLATFORM_AUDIT_ENTITY_LABELS,
  formatPlatformAuditAction,
  formatPlatformAuditEntity,
  localizeName,
} from '@/lib/utils/platform-utils';
import { X } from 'lucide-react';

export function AuditFilters() {
  const t = useTranslations('platform.audit');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const currentAction = sp.get('action');
  const isKnownAction = currentAction ? Boolean(PLATFORM_AUDIT_ACTION_LABELS[currentAction]) : true;
  const [customAction, setCustomAction] = useState(!isKnownAction && Boolean(currentAction));

  const adminsQuery = usePlatformAdminsInfinite({ per_page: 50 });
  const admins = adminsQuery.data?.pages.flatMap((p) => p.data) ?? [];

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
    setCustomAction(false);
    router.replace(params.toString() ? `${pathname}?${params.toString()}` : pathname);
  }

  const hasFilters = Boolean(
    sp.get('action') ||
    sp.get('entity_type') ||
    sp.get('user_id') ||
    sp.get('from') ||
    sp.get('to')
  );

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      {/* Action Filter */}
      <RtlSelect
        value={customAction ? 'custom' : (currentAction ?? 'all')}
        onValueChange={(v) => {
          if (v === 'custom') {
            setCustomAction(true);
            setFilter('action', null);
          } else {
            setCustomAction(false);
            setFilter('action', v === 'all' ? null : v);
          }
        }}
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder={t('action_all')} />
        </SelectTrigger>
        <SelectContent position="popper">
          <SelectItem value="all">{t('action_all')}</SelectItem>
          {Object.keys(PLATFORM_AUDIT_ACTION_LABELS).map((actionKey) => (
            <SelectItem key={actionKey} value={actionKey}>
              {formatPlatformAuditAction(locale, actionKey)}
            </SelectItem>
          ))}
          <SelectItem value="custom">{t('action_custom')}</SelectItem>
        </SelectContent>
      </RtlSelect>

      {customAction && (
        <Input
          className="w-40"
          placeholder={t('action_placeholder')}
          value={currentAction ?? ''}
          onChange={(e) => setFilter('action', e.target.value || null)}
          dir="ltr"
        />
      )}

      {/* Entity Type Filter */}
      <RtlSelect
        value={sp.get('entity_type') ?? 'all'}
        onValueChange={(v) => setFilter('entity_type', v === 'all' ? null : v)}
      >
        <SelectTrigger className="w-36">
          <SelectValue placeholder={t('entity_type_all')} />
        </SelectTrigger>
        <SelectContent position="popper">
          <SelectItem value="all">{t('entity_type_all')}</SelectItem>
          {Object.keys(PLATFORM_AUDIT_ENTITY_LABELS).map((entityKey) => (
            <SelectItem key={entityKey} value={entityKey}>
              {formatPlatformAuditEntity(locale, entityKey)}
            </SelectItem>
          ))}
        </SelectContent>
      </RtlSelect>

      {/* Actor / Admin Filter */}
      <RtlSelect
        value={sp.get('user_id') ?? 'all'}
        onValueChange={(v) => setFilter('user_id', v === 'all' ? null : v)}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder={t('all_actors')} />
        </SelectTrigger>
        <SelectContent position="popper">
          <SelectItem value="all">{t('all_actors')}</SelectItem>
          {admins.map((adm) => (
            <SelectItem key={adm.public_id} value={adm.public_id}>
              {localizeName(locale, adm.name_ar, adm.name_en) || adm.email}
            </SelectItem>
          ))}
        </SelectContent>
      </RtlSelect>

      {/* Date Range Picker */}
      <div className="min-w-[220px] flex-1">
        <DateRangePicker
          from={sp.get('from') ?? null}
          to={sp.get('to') ?? null}
          calendarSystem={(sp.get('calendar_system') as 'gregorian' | 'hijri') || 'gregorian'}
          onChange={(from, to) => {
            const params = new URLSearchParams(sp.toString());
            if (from) params.set('from', from);
            else params.delete('from');
            if (to) params.set('to', to);
            else params.delete('to');
            router.replace(`${pathname}?${params.toString()}`);
          }}
        />
      </div>

      {/* Hijri / Gregorian Toggle */}
      <CalendarSystemToggle
        value={(sp.get('calendar_system') as 'gregorian' | 'hijri') || 'gregorian'}
        onChange={(v) => {
          const params = new URLSearchParams(sp.toString());
          params.set('calendar_system', v);
          params.delete('from');
          params.delete('to');
          router.replace(`${pathname}?${params.toString()}`);
        }}
      />

      {/* Reset Button */}
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={resetFilters} aria-label={t('reset_filters')}>
          <X className="size-4" />
        </Button>
      )}
    </div>
  );
}
