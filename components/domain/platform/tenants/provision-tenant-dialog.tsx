'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { BilingualNameFields } from '@/components/shared/bilingual-name-fields';
import { RtlSelect } from '@/components/shared/rtl-select';
import { SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateTenant } from '@/lib/api/hooks/use-platform';

interface ProvisionForm {
  [key: string]: unknown;
  name_ar: string;
  name_en: string;
  slug: string;
  domain: string;
  timezone: string;
  default_language: '1' | '2';
  logo_path: string;
  settings: string;
}

const initialForm: ProvisionForm = {
  name_ar: '',
  name_en: '',
  slug: '',
  domain: '',
  timezone: '',
  default_language: '1',
  logo_path: '',
  settings: '',
};

interface ProvisionTenantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProvisionTenantDialog({ open, onOpenChange }: ProvisionTenantDialogProps) {
  const t = useTranslations('platform.tenants');
  const c = useTranslations('platform.common');
  const create = useCreateTenant();
  const [form, setForm] = useState<ProvisionForm>(initialForm);

  useEffect(() => {
    if (open) {
      setTimeout(() => setForm(initialForm), 0);
    }
  }, [open]);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    let settings: unknown = null;
    if (form.settings.trim()) {
      try {
        settings = JSON.parse(form.settings) as unknown;
      } catch {
        settings = { value: form.settings };
      }
    }
    create.mutate(
      {
        ...form,
        domain: form.domain || null,
        timezone: form.timezone || null,
        logo_path: form.logo_path || null,
        settings,
      } as never,
      {
        onSuccess: () => {
          onOpenChange(false);
          setForm(initialForm);
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('provision_title')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <FieldGroup className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto px-1">
            <BilingualNameFields form={form} setForm={setForm} t={t} />
            <Field>
              <FieldLabel>
                {t('slug')} <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                required
                dir="ltr"
                value={form.slug}
                onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                placeholder={t('slug_placeholder')}
              />
            </Field>
            <Field>
              <FieldLabel>{t('domain')}</FieldLabel>
              <Input
                dir="ltr"
                value={form.domain}
                onChange={(e) => setForm((p) => ({ ...p, domain: e.target.value }))}
                placeholder={t('domain_placeholder')}
              />
            </Field>
            <Field>
              <FieldLabel>{t('timezone')}</FieldLabel>
              <Input
                dir="ltr"
                value={form.timezone}
                onChange={(e) => setForm((p) => ({ ...p, timezone: e.target.value }))}
                placeholder={t('timezone_placeholder')}
              />
            </Field>
            <Field>
              <FieldLabel>{t('default_language')}</FieldLabel>
              <RtlSelect
                value={form.default_language}
                onValueChange={(v) => setForm((p) => ({ ...p, default_language: v as '1' | '2' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="1">{t('language_ar')}</SelectItem>
                  <SelectItem value="2">{t('language_en')}</SelectItem>
                </SelectContent>
              </RtlSelect>
            </Field>
            <Field>
              <FieldLabel>{t('logo_path')}</FieldLabel>
              <Input
                dir="ltr"
                value={form.logo_path}
                onChange={(e) => setForm((p) => ({ ...p, logo_path: e.target.value }))}
              />
            </Field>
            <Field>
              <FieldLabel>{t('settings')}</FieldLabel>
              <Textarea
                dir="ltr"
                value={form.settings}
                onChange={(e) => setForm((p) => ({ ...p, settings: e.target.value }))}
                placeholder={t('settings_placeholder')}
              />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {c('cancel')}
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {c('create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
