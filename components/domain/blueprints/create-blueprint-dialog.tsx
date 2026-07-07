'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Field, FieldGroup, FieldLabel, FieldError } from '@/components/ui/field';
import { SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { RtlSelect } from '@/components/shared/rtl-select';
import { BilingualNameFields } from '@/components/shared/bilingual-name-fields';
import { BilingualDescriptionFields } from '@/components/shared/bilingual-description-fields';
import { useCapability } from '@/lib/api/hooks/use-capabilities';
import { useCreateBlueprint, useBlueprintCategories } from '@/lib/api/hooks/use-blueprints';
import { useDepartmentsInfinite } from '@/lib/api/hooks/use-organization';
import { useLocale } from 'next-intl';
import type { components } from '@/lib/generated/api-types';

type StoreBlueprintRequest = components['schemas']['StoreBlueprintRequest'];

export function CreateBlueprintDialog() {
  const t = useTranslations('blueprints.library.create');
  const tb = useTranslations('blueprints.badges');
  const locale = useLocale();
  const router = useRouter();
  const canCreateOrg = useCapability('blueprint.create.organization');
  const canCreateDept = useCapability('blueprint.create.department');
  const canCreate = canCreateOrg || canCreateDept;
  const create = useCreateBlueprint();
  const { data: categories } = useBlueprintCategories();
  const { data: deptPages } = useDepartmentsInfinite();
  const departments = deptPages?.pages.flatMap((p) => p.data) ?? [];
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name_ar: '', name_en: '', description_ar: '', description_en: '', category_id: '', scope: '1', department_id: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!canCreate) return null;

  function submit() {
    const newErrors: Record<string, string> = {};
    if (!form.name_ar) newErrors.name_ar = t('name_ar_required');
    if (!form.category_id) newErrors.category_id = t('category_required');
    if (form.scope === '2' && !form.department_id) newErrors.department_id = t('department_required');
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    create.mutate({
      name_ar: form.name_ar,
      name_en: form.name_en || undefined,
      description_ar: form.description_ar || undefined,
      description_en: form.description_en || undefined,
      category_id: form.category_id,
      scope: Number(form.scope) as 1 | 2,
      department_id: form.scope === '2' ? form.department_id : undefined,
    } as StoreBlueprintRequest, {
      onSuccess: (data) => { setOpen(false); setForm({ name_ar: '', name_en: '', description_ar: '', description_en: '', category_id: '', scope: '1', department_id: '' }); router.push(`/blueprints/${(data as { public_id: string }).public_id}`); },
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setForm({ name_ar: '', name_en: '', description_ar: '', description_en: '', category_id: '', scope: '1', department_id: '' }); }}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="size-4" /> {t('trigger')}</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{t('title')}</DialogTitle></DialogHeader>
        <FieldGroup>
          <BilingualNameFields form={form} setForm={setForm} errors={errors} t={t} />
          <BilingualDescriptionFields form={form} setForm={setForm} t={t} />
          <Field>
            <FieldLabel>{t('category')} <span className="text-destructive">*</span></FieldLabel>
            <RtlSelect value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
              <SelectTrigger><SelectValue placeholder={t('category_placeholder')} /></SelectTrigger>
              <SelectContent position="popper">{(categories ?? []).map((c) => <SelectItem key={c.public_id} value={c.public_id}>{locale === 'ar' ? c.name_ar : c.name_en}</SelectItem>)}</SelectContent>
            </RtlSelect>
            {errors.category_id && <FieldError>{errors.category_id}</FieldError>}
          </Field>
          <Field>
            <FieldLabel>{t('scope')} <span className="text-destructive">*</span></FieldLabel>
            <RtlSelect value={form.scope} onValueChange={(v) => setForm({ ...form, scope: v, department_id: '' })}>
              <SelectTrigger><SelectValue placeholder={t('scope_placeholder')} /></SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="1">{tb('scope_organization')}</SelectItem>
                {canCreateDept && <SelectItem value="2">{tb('scope_department')}</SelectItem>}
              </SelectContent>
            </RtlSelect>
          </Field>
          {form.scope === '2' && (
            <Field>
              <FieldLabel>{t('department')} <span className="text-destructive">*</span></FieldLabel>
              <RtlSelect value={form.department_id} onValueChange={(v) => setForm({ ...form, department_id: v })}>
                <SelectTrigger><SelectValue placeholder={t('department_placeholder')} /></SelectTrigger>
                <SelectContent position="popper">{departments.map((d) => <SelectItem key={d.public_id} value={d.public_id}>{locale === 'ar' ? d.name_ar : d.name_en}</SelectItem>)}</SelectContent>
              </RtlSelect>
              {errors.department_id && <FieldError>{errors.department_id}</FieldError>}
            </Field>
          )}
        </FieldGroup>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>{t('cancel')}</Button>
          <Button onClick={submit} disabled={create.isPending}>{create.isPending ? t('saving') : t('create')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
