'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RtlSelect } from '@/components/shared/rtl-select';
import { SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BilingualNameFields } from '@/components/shared/bilingual-name-fields';
import { useCreateUser, useUpdateUser } from '@/lib/api/hooks/use-admin-users';
import type { components } from '@/lib/generated/api-types';

type UserDetailResource = components['schemas']['UserDetailResource'];
type StoreUserRequest = components['schemas']['StoreUserRequest'];
type UpdateUserRequest = components['schemas']['UpdateUserRequest'];

interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: UserDetailResource | null;
}

type FormState = {
  name_ar: string;
  name_en: string;
  email: string;
  password: string;
  mobile: string;
  employee_id: string;
  account_type: string;
  preferred_language: string;
};

const PREFERRED_LANG_TO_VALUE: Record<string, string> = {
  '1': '1', '2': '2', arabic: '1', english: '2',
};

const emptyForm: FormState = {
  name_ar: '', name_en: '', email: '', password: '',
  mobile: '', employee_id: '', account_type: '', preferred_language: '1',
};

export function UserFormDialog({ open, onOpenChange, user }: UserFormDialogProps) {
  const t = useTranslations('admin.users.form');
  const isEdit = !!user;
  const [form, setForm] = useState<FormState>(emptyForm);
  const createUser = useCreateUser();
  const updateUser = useUpdateUser(user?.public_id ?? '');

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        if (user) {
          setForm({
            name_ar: user.name_ar ?? '',
            name_en: user.name_en ?? '',
            email: user.email ?? '',
            password: '',
            mobile: user.mobile ?? '',
            employee_id: user.employee_id ?? '',
            account_type: String(user.account_type ?? ''),
            preferred_language: PREFERRED_LANG_TO_VALUE[String(user.preferred_language ?? '1')] ?? '1',
          });
        } else {
          setForm(emptyForm);
        }
      }, 0);
    }
  }, [open, user]);

  function submit() {
    if (!form.name_ar.trim()) return toast.error(t('name_ar_required'));
    if (!form.email.trim()) return toast.error(t('email_required'));
    if (!isEdit && form.password.length < 8) return toast.error(t('password_min'));
    if (!form.account_type) return toast.error(t('account_type_required'));

    if (isEdit) {
      const body: UpdateUserRequest = {
        name_ar: form.name_ar,
        name_en: form.name_en || null,
        mobile: form.mobile || null,
        employee_id: form.employee_id || null,
        account_type: form.account_type as unknown as components['schemas']['UpdateUserRequest']['account_type'],
        preferred_language: Number(form.preferred_language) as 1 | 2,
      };
      if (form.password) body.password = form.password;
      updateUser.mutate(body, { onSuccess: () => onOpenChange(false) });
    } else {
      const body: StoreUserRequest = {
        name_ar: form.name_ar,
        name_en: form.name_en || null,
        email: form.email,
        password: form.password,
        mobile: form.mobile || null,
        employee_id: form.employee_id || null,
        account_type: form.account_type as unknown as components['schemas']['StoreUserRequest']['account_type'],
        preferred_language: Number(form.preferred_language) as 1 | 2,
      };
      createUser.mutate(body, { onSuccess: () => onOpenChange(false) });
    }
  }

  const isPending = createUser.isPending || updateUser.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? t('edit_title') : t('create_title')}</DialogTitle>
        </DialogHeader>
        <FieldGroup className="flex flex-col gap-4">
          <BilingualNameFields form={form} setForm={setForm} t={t} />
          <Field>
            <FieldLabel>{t('email')} <span className="text-destructive">*</span></FieldLabel>
            <Input
              dir="ltr"
              type="email"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              placeholder={t('email_placeholder')}
            />
          </Field>
          <Field>
            <FieldLabel>{isEdit ? t('password_new') : t('password')} {!isEdit && <span className="text-destructive">*</span>}</FieldLabel>
            <Input
              dir="ltr"
              type="password"
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              placeholder={isEdit ? t('password_edit_placeholder') : t('password_placeholder')}
            />
          </Field>
          <Field>
            <FieldLabel>{t('mobile')}</FieldLabel>
            <Input
              dir="ltr"
              type="tel"
              value={form.mobile}
              onChange={(e) => setForm((p) => ({ ...p, mobile: e.target.value }))}
              placeholder={t('mobile_placeholder')}
            />
          </Field>
          <Field>
            <FieldLabel>{t('employee_id')}</FieldLabel>
            <Input
              dir="ltr"
              value={form.employee_id}
              onChange={(e) => setForm((p) => ({ ...p, employee_id: e.target.value }))}
              placeholder={t('employee_id_placeholder')}
            />
          </Field>
          <Field>
            <FieldLabel>{t('account_type')} <span className="text-destructive">*</span></FieldLabel>
            <RtlSelect value={form.account_type} onValueChange={(v) => setForm((p) => ({ ...p, account_type: v }))}>
              <SelectTrigger><SelectValue placeholder={t('account_type_placeholder')} /></SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="internal_user">{t('account_type_1')}</SelectItem>
                <SelectItem value="tenant_admin">{t('account_type_2')}</SelectItem>
                <SelectItem value="external_auditor">{t('account_type_3')}</SelectItem>
              </SelectContent>
            </RtlSelect>
          </Field>
          <Field>
            <FieldLabel>{t('preferred_language')}</FieldLabel>
            <RtlSelect value={form.preferred_language} onValueChange={(v) => setForm((p) => ({ ...p, preferred_language: v }))}>
              <SelectTrigger><SelectValue placeholder={t('language_placeholder')} /></SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="1">{t('language_ar')}</SelectItem>
                <SelectItem value="2">{t('language_en')}</SelectItem>
              </SelectContent>
            </RtlSelect>
          </Field>
        </FieldGroup>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('cancel')}</Button>
          <Button onClick={submit} disabled={isPending}>{isEdit ? t('save') : t('create')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
