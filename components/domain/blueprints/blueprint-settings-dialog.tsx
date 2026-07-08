'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field, FieldLabel } from '@/components/ui/field';
import { SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { RtlSelect } from '@/components/shared/rtl-select';
import { BilingualNameFields } from '@/components/shared/bilingual-name-fields';
import { BilingualDescriptionFields } from '@/components/shared/bilingual-description-fields';
import { useState } from 'react';
import { useUpdateBlueprint, useBlueprintCategories } from '@/lib/api/hooks/use-blueprints';
import { useBlueprintBuilderStore } from '@/lib/stores/use-blueprint-builder-store';
import { useDepartmentsInfinite } from '@/lib/api/hooks/use-organization';
import { useCapability } from '@/lib/api/hooks/use-capabilities';
import { toast } from 'sonner';
import type { BlueprintResource } from './blueprint-types';
import type { components } from '@/lib/generated/api-types';

type UpdateBlueprintRequest = components['schemas']['UpdateBlueprintRequest'];

function SettingsForm({ blueprint, onSuccess }: { blueprint: BlueprintResource; onSuccess: () => void }) {
  const t = useTranslations('blueprints.library.create');
  const ts = useTranslations('blueprints.builder.top_bar');
  const tb = useTranslations('blueprints.badges');
  const locale = useLocale();
  const update = useUpdateBlueprint(blueprint.public_id);
  const { data: categories } = useBlueprintCategories();
  const { data: deptPages } = useDepartmentsInfinite();
  const departments = deptPages?.pages.flatMap((p) => p.data) ?? [];
  const canCreateDept = useCapability('blueprint.create.department');
  const { setMetadataDirty } = useBlueprintBuilderStore();

  const [form, setForm] = useState({
    name_ar: blueprint.name_ar ?? '',
    name_en: blueprint.name_en ?? '',
    description_ar: blueprint.description_ar ?? '',
    description_en: blueprint.description_en ?? '',
    category_id: blueprint.category?.public_id ?? '',
    scope: blueprint.scope === 'department' ? '2' : '1',
    department_id: blueprint.department_id ?? '',
  });
  const isLocked = !!blueprint.is_locked;

  function submit() {
    if (!form.name_ar) { toast.error(t('name_ar_required')); return; }
    if (!form.category_id) { toast.error(t('category_required')); return; }
    if (form.scope === '2' && !form.department_id) { toast.error(t('department_required')); return; }

    update.mutate({
      name_ar: form.name_ar,
      name_en: form.name_en || undefined,
      description_ar: form.description_ar || undefined,
      description_en: form.description_en || undefined,
      category_id: form.category_id,
      scope: Number(form.scope) as 1 | 2,
      department_id: form.scope === '2' ? form.department_id : undefined,
    } as UpdateBlueprintRequest, {
      onSuccess: () => { setMetadataDirty(false); onSuccess(); },
    });
  }

  return (
    <div className="space-y-3">
      <BilingualNameFields form={form} setForm={setForm} t={t} readOnly={isLocked} />
      <BilingualDescriptionFields form={form} setForm={setForm} t={t} readOnly={isLocked} />
      <Field>
        <FieldLabel>{t('category')} <span className="text-destructive">*</span></FieldLabel>
        <RtlSelect value={form.category_id} onValueChange={(v) => { setForm({ ...form, category_id: v }); setMetadataDirty(true); }} disabled={isLocked}>
          <SelectTrigger><SelectValue placeholder={t('category_placeholder')} /></SelectTrigger>
          <SelectContent position="popper">{(categories ?? []).map((c) => <SelectItem key={c.public_id} value={c.public_id}>{locale === 'ar' ? c.name_ar : c.name_en}</SelectItem>)}</SelectContent>
        </RtlSelect>
        
      </Field>
      <Field>
        <FieldLabel>{t('scope')} <span className="text-destructive">*</span></FieldLabel>
        <RtlSelect value={form.scope} onValueChange={(v) => { setForm({ ...form, scope: v, department_id: '' }); setMetadataDirty(true); }} disabled={isLocked}>
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
              <RtlSelect value={form.department_id} onValueChange={(v) => { setForm({ ...form, department_id: v }); setMetadataDirty(true); }} disabled={isLocked}>
                <SelectTrigger><SelectValue placeholder={t('department_placeholder')} /></SelectTrigger>
                <SelectContent position="popper">{departments.map((d) => <SelectItem key={d.public_id} value={d.public_id}>{locale === 'ar' ? d.name_ar : d.name_en}</SelectItem>)}</SelectContent>
          </RtlSelect>
          
        </Field>
      )}
      <DialogFooter>
        <Button variant="outline" onClick={onSuccess}>{t('cancel')}</Button>
        {!isLocked && <Button onClick={submit} disabled={update.isPending}>{update.isPending ? t('saving') : ts('save')}</Button>}
      </DialogFooter>
    </div>
  );
}

interface BlueprintSettingsDialogProps {
  blueprint: BlueprintResource;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BlueprintSettingsDialog({ blueprint, open, onOpenChange }: BlueprintSettingsDialogProps) {
  const tb = useTranslations('blueprints.builder.top_bar');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{tb('settings_title')}</DialogTitle></DialogHeader>
        {open && <SettingsForm key={blueprint.public_id} blueprint={blueprint} onSuccess={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}
