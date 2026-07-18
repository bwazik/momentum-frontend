'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { RtlSelect } from '@/components/shared/rtl-select';
import { SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePositionsInfinite, useDepartmentsInfinite } from '@/lib/api/hooks/use-organization';
import { useBlueprintCategories } from '@/lib/api/hooks/use-blueprints';
import { useCreateGovernanceParticipant, useUpdateGovernanceParticipant } from '@/lib/api/hooks/use-confidential-governance';
import { localizeName } from '@/lib/utils/localize';
import { toast } from 'sonner';
import type { components } from '@/lib/generated/api-types';

type GovernanceResource = components['schemas']['ConfidentialGovernanceParticipantResource'];

const GOVERNANCE_SCOPE_OPTIONS = [
  { key: 'tenant', code: 1 },
  { key: 'specific_department', code: 3 },
  { key: 'department_tree', code: 4 },
] as const;

type ScopeKey = typeof GOVERNANCE_SCOPE_OPTIONS[number]['key'];

interface Props {
  item?: GovernanceResource;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FormState {
  position_id: string;
  scope_type: ScopeKey;
  scope_department_id: string;
  blueprint_category_id: string;
  applies_to_classification_level: '1' | '2' | '3';
}

function scopeKeyFromApi(value?: string): ScopeKey {
  const found = GOVERNANCE_SCOPE_OPTIONS.find((o) => o.key === value);
  return found?.key ?? 'tenant';
}

export function GovernanceRuleFormDialog({ item, open, onOpenChange }: Props) {
  const t = useTranslations('confidential.governance.form');
  const locale = useLocale();
  const isEdit = !!item;
  const create = useCreateGovernanceParticipant();
  const update = useUpdateGovernanceParticipant(item?.public_id ?? '');
  const positions = usePositionsInfinite({ per_page: 50 } as Record<string, unknown>);
  const departments = useDepartmentsInfinite({} as Record<string, unknown>);
  const { data: categories } = useBlueprintCategories();

  const [form, setForm] = useState<FormState>({
    position_id: '',
    scope_type: 'tenant',
    scope_department_id: '',
    blueprint_category_id: '',
    applies_to_classification_level: '3',
  });

  useEffect(() => {
    if (!open) return;
    if (item) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        position_id: item.position.public_id,
        scope_type: scopeKeyFromApi(item.scope_type),
        scope_department_id: item.scope_department?.public_id ?? '',
        blueprint_category_id: item.blueprint_category?.public_id ?? '',
        applies_to_classification_level: (String(item.applies_to_classification_level) as '1' | '2' | '3') || '3',
      });
    } else {
      setForm({
        position_id: '',
        scope_type: 'tenant',
        scope_department_id: '',
        blueprint_category_id: '',
        applies_to_classification_level: '3',
      });
    }
  }, [open, item]);

  const needsDepartment = form.scope_type !== 'tenant';

  function validate(): boolean {
    if (!form.position_id) { toast.error(t('position_required')); return false; }
    if (needsDepartment && !form.scope_department_id) { toast.error(t('department_required')); return false; }
    return true;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const scopeCode = GOVERNANCE_SCOPE_OPTIONS.find((o) => o.key === form.scope_type)?.code ?? 1;
    const body = {
      position_id: form.position_id,
      scope_type: scopeCode as 1 | 3 | 4,
      scope_department_id: needsDepartment ? form.scope_department_id : null,
      blueprint_category_id: form.blueprint_category_id || null,
      applies_to_classification_level: Number(form.applies_to_classification_level) as 1 | 2 | 3,
    };

    if (isEdit) {
      update.mutate(body, { onSuccess: () => onOpenChange(false) });
    } else {
      create.mutate(body, { onSuccess: () => onOpenChange(false) });
    }
  }

  const isPending = create.isPending || update.isPending;
  const allPositions = positions.data?.pages.flatMap((p) => p.data) ?? [];
  const allDepartments = departments.data?.pages.flatMap((p) => p.data) ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? t('edit_title') : t('create_title')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field>
            <FieldLabel>{t('position')}</FieldLabel>
            <RtlSelect value={form.position_id} onValueChange={(v) => setForm((f) => ({ ...f, position_id: v }))}>
              <SelectTrigger><SelectValue placeholder={t('select_position')} /></SelectTrigger>
              <SelectContent position="popper">
                {allPositions.map((p) => (
                  <SelectItem key={p.public_id} value={p.public_id}>
                    {localizeName(locale, p.title_ar, p.title_en)}
                  </SelectItem>
                ))}
              </SelectContent>
            </RtlSelect>
          </Field>

          <Field>
            <FieldLabel>{t('scope_type')}</FieldLabel>
            <RtlSelect value={form.scope_type} onValueChange={(v) => setForm((f) => ({ ...f, scope_type: v as ScopeKey, scope_department_id: '' }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent position="popper">
                {GOVERNANCE_SCOPE_OPTIONS.map((o) => (
                  <SelectItem key={o.key} value={o.key}>{t(`scope_${o.key}` as 'scope_tenant')}</SelectItem>
                ))}
              </SelectContent>
            </RtlSelect>
          </Field>

          {needsDepartment && (
            <Field>
              <FieldLabel>{t('department')}</FieldLabel>
              <RtlSelect value={form.scope_department_id} onValueChange={(v) => setForm((f) => ({ ...f, scope_department_id: v }))}>
                <SelectTrigger><SelectValue placeholder={t('select_department')} /></SelectTrigger>
                <SelectContent position="popper">
                  {allDepartments.map((d) => (
                    <SelectItem key={d.public_id} value={d.public_id}>
                      {localizeName(locale, d.name_ar, d.name_en)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </RtlSelect>
            </Field>
          )}

          <Field>
            <FieldLabel>{t('blueprint_category')}</FieldLabel>
            <RtlSelect value={form.blueprint_category_id || 'none'} onValueChange={(v) => setForm((f) => ({ ...f, blueprint_category_id: v === 'none' ? '' : v }))}>
              <SelectTrigger><SelectValue placeholder={t('all_categories')} /></SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="none">{t('all_categories')}</SelectItem>
                {(categories ?? []).map((c: { public_id: string; name_ar: string; name_en: string }) => (
                  <SelectItem key={c.public_id} value={c.public_id}>
                    {localizeName(locale, c.name_ar, c.name_en)}
                  </SelectItem>
                ))}
              </SelectContent>
            </RtlSelect>
          </Field>

          <Field>
            <FieldLabel>{t('classification_level')}</FieldLabel>
            <RtlSelect value={form.applies_to_classification_level} onValueChange={(v) => setForm((f) => ({ ...f, applies_to_classification_level: v as '1' | '2' | '3' }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="1">{t('classification_public')}</SelectItem>
                <SelectItem value="2">{t('classification_internal')}</SelectItem>
                <SelectItem value="3">{t('classification_confidential')}</SelectItem>
              </SelectContent>
            </RtlSelect>
          </Field>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>{t('cancel')}</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? t('saving') : (isEdit ? t('save') : t('create'))}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
