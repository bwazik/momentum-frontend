'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { BilingualNameFields } from '@/components/shared/bilingual-name-fields';
import { RtlSelect } from '@/components/shared/rtl-select';
import { SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUpdateTenant } from '@/lib/api/hooks/use-platform';
import type { PlatformTenant } from '@/lib/utils/platform-utils';

export function EditTenantDialog({ tenant, open, onOpenChange }: { tenant: PlatformTenant; open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useTranslations('platform.tenants'); const c = useTranslations('platform.common'); const update = useUpdateTenant(tenant.public_id);
  const [form, setForm] = useState({ name_ar: tenant.name_ar, name_en: tenant.name_en, domain: tenant.domain ?? '', timezone: tenant.timezone ?? '', default_language: tenant.default_language ?? '1', logo_path: tenant.logo_path ?? '', settings: JSON.stringify(tenant.settings, null, 2) });
  function submit(event: React.FormEvent) { event.preventDefault(); let settings: unknown = null; if (form.settings.trim()) { try { settings = JSON.parse(form.settings) as unknown; } catch { settings = { value: form.settings }; } } update.mutate({ ...form, default_language: form.default_language as '1' | '2', domain: form.domain || null, timezone: form.timezone || null, logo_path: form.logo_path || null, settings } as never, { onSuccess: () => onOpenChange(false) }); }
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>{t('edit_title')}</DialogTitle></DialogHeader><form onSubmit={submit}><FieldGroup className="max-h-[70vh] space-y-3 overflow-y-auto"><BilingualNameFields form={form} setForm={setForm} t={t} /><Field><FieldLabel>{t('slug')}</FieldLabel><Input readOnly dir="ltr" value={tenant.slug} /></Field><Field><FieldLabel>{t('domain')}</FieldLabel><Input dir="ltr" value={form.domain} onChange={(e) => setForm((p) => ({ ...p, domain: e.target.value }))} /></Field><Field><FieldLabel>{t('timezone')}</FieldLabel><Input dir="ltr" value={form.timezone} onChange={(e) => setForm((p) => ({ ...p, timezone: e.target.value }))} /></Field><Field><FieldLabel>{t('default_language')}</FieldLabel><RtlSelect value={form.default_language} onValueChange={(v) => setForm((p) => ({ ...p, default_language: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent position="popper"><SelectItem value="1">{t('language_ar')}</SelectItem><SelectItem value="2">{t('language_en')}</SelectItem></SelectContent></RtlSelect></Field><Field><FieldLabel>{t('logo_path')}</FieldLabel><Input dir="ltr" value={form.logo_path} onChange={(e) => setForm((p) => ({ ...p, logo_path: e.target.value }))} /></Field><Field><FieldLabel>{t('settings')}</FieldLabel><Textarea dir="ltr" value={form.settings} onChange={(e) => setForm((p) => ({ ...p, settings: e.target.value }))} /></Field></FieldGroup><DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{c('cancel')}</Button><Button type="submit" disabled={update.isPending}>{c('save')}</Button></DialogFooter></form></DialogContent></Dialog>;
}
