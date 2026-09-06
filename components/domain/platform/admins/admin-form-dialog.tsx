'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { BilingualNameFields } from '@/components/shared/bilingual-name-fields';
import { useCreateAdmin, useUpdateAdmin } from '@/lib/api/hooks/use-platform';
import type { PlatformAdmin } from '@/lib/utils/platform-utils';

interface AdminForm {
  [key: string]: unknown;
  name_ar: string;
  name_en: string;
  email: string;
  password: string;
}

const emptyForm: AdminForm = {
  name_ar: '',
  name_en: '',
  email: '',
  password: '',
};

interface AdminFormDialogProps {
  admin?: PlatformAdmin | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AdminFormDialog({ admin, open, onOpenChange }: AdminFormDialogProps) {
  const t = useTranslations('platform.admins');
  const c = useTranslations('platform.common');
  const create = useCreateAdmin();
  const update = useUpdateAdmin(admin?.public_id ?? '');
  const editing = !!admin;

  const [form, setForm] = useState<AdminForm>(emptyForm);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        if (admin) {
          setForm({
            name_ar: admin.name_ar,
            name_en: admin.name_en ?? '',
            email: admin.email,
            password: '',
          });
        } else {
          setForm(emptyForm);
        }
      }, 0);
    }
  }, [open, admin]);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (editing) {
      update.mutate(
        {
          name_ar: form.name_ar,
          name_en: form.name_en || null,
          email: form.email,
          ...(form.password ? { password: form.password } : {}),
        },
        { onSuccess: () => onOpenChange(false) },
      );
    } else {
      create.mutate(
        { name_ar: form.name_ar, name_en: form.name_en || null, email: form.email, password: form.password },
        { onSuccess: () => onOpenChange(false) },
      );
    }
  }

  const isPending = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? t('edit_title') : t('add_title')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <FieldGroup className="flex max-h-[60vh] flex-col gap-4 overflow-y-auto px-1">
            <BilingualNameFields form={form} setForm={setForm} t={t} />
            <Field>
              <FieldLabel>
                {t('email_label')} <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                required
                type="email"
                dir="ltr"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                placeholder={t('email_placeholder')}
              />
            </Field>
            <Field>
              <FieldLabel>
                {t('password')} {!editing && <span className="text-destructive">*</span>}
              </FieldLabel>
              <Input
                required={!editing}
                minLength={8}
                type="password"
                dir="ltr"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                placeholder={editing ? t('password_optional') : t('password_placeholder')}
              />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {c('cancel')}
            </Button>
            <Button type="submit" disabled={isPending}>
              {editing ? c('save') : c('create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
