'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Field, FieldLabel } from '@/components/ui/field';

export function AuditFilters() {
  const t = useTranslations('platform.audit'); const router = useRouter(); const pathname = usePathname(); const params = useSearchParams();
  const [action, setAction] = useState(params.get('action') ?? ''); const [entity, setEntity] = useState(params.get('entity_type') ?? '');
  const update = useCallback((key: string, value: string) => { const next = new URLSearchParams(params); if (value) next.set(key, value); else next.delete(key); router.replace(`${pathname}?${next}`); }, [params, pathname, router]);
  useEffect(() => { if (params.get('action') === action) return; const timer = setTimeout(() => update('action', action), 300); return () => clearTimeout(timer); }, [action, params, update]);
  return <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Field><FieldLabel>{t('search_action')}</FieldLabel><Input value={action} onChange={(e) => setAction(e.target.value)} placeholder={t('action_placeholder')} dir="ltr" /></Field><Field><FieldLabel>{t('entity_type')}</FieldLabel><Input value={entity} onChange={(e) => { setEntity(e.target.value); update('entity_type', e.target.value); }} placeholder={t('entity_placeholder')} dir="ltr" /></Field><Field><FieldLabel>{t('from')}</FieldLabel><Input type="date" value={params.get('from') ?? ''} onChange={(e) => update('from', e.target.value)} /></Field><Field><FieldLabel>{t('to')}</FieldLabel><Input type="date" value={params.get('to') ?? ''} onChange={(e) => update('to', e.target.value)} /></Field></div>;
}
