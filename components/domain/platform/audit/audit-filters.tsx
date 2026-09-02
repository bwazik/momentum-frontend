'use client';

import { useState, useRef, useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Field, FieldLabel } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

export function AuditFilters() {
  const t = useTranslations('platform.audit');
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const [action, setAction] = useState(sp.get('action') ?? '');
  const [entity, setEntity] = useState(sp.get('entity_type') ?? '');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(sp.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      router.replace(`${pathname}?${params.toString()}`);
    },
    [sp, pathname, router],
  );

  const handleActionChange = (value: string) => {
    setAction(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      updateParam('action', value);
    }, 300);
  };

  const handleEntityChange = (value: string) => {
    setEntity(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      updateParam('entity_type', value);
    }, 300);
  };

  function reset() {
    const params = new URLSearchParams();
    const tab = sp.get('tab');
    if (tab) params.set('tab', tab);
    setAction('');
    setEntity('');
    const q = params.toString();
    router.replace(q ? `${pathname}?${q}` : pathname);
  }

  const hasFilters = Boolean(
    sp.get('action') || sp.get('entity_type') || sp.get('from') || sp.get('to'),
  );

  return (
    <div className="mb-4 flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field>
          <FieldLabel>{t('search_action')}</FieldLabel>
          <Input
            value={action}
            onChange={(e) => handleActionChange(e.target.value)}
            placeholder={t('action_placeholder')}
            dir="ltr"
          />
        </Field>
        <Field>
          <FieldLabel>{t('entity_type')}</FieldLabel>
          <Input
            value={entity}
            onChange={(e) => handleEntityChange(e.target.value)}
            placeholder={t('entity_placeholder')}
            dir="ltr"
          />
        </Field>
        <Field>
          <FieldLabel>{t('from')}</FieldLabel>
          <Input
            type="date"
            value={sp.get('from') ?? ''}
            onChange={(e) => updateParam('from', e.target.value)}
          />
        </Field>
        <Field>
          <FieldLabel>{t('to')}</FieldLabel>
          <Input
            type="date"
            value={sp.get('to') ?? ''}
            onChange={(e) => updateParam('to', e.target.value)}
          />
        </Field>
      </div>
      {hasFilters && (
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={reset} aria-label={t('empty_description')}>
            <X className="me-1 size-4" /> {t('empty_description')}
          </Button>
        </div>
      )}
    </div>
  );
}
