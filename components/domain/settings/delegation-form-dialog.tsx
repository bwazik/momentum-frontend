'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { RtlSelect } from '@/components/shared/rtl-select';
import { SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/shared/date-picker';
import { UserSearchCombobox } from '@/components/domain/tasks/user-search-combobox';
import { useCapability } from '@/lib/api/hooks/use-capabilities';
import {
  useCreateDelegation,
  useUpdateDelegation,
} from '@/lib/api/hooks/use-delegations';
import { useBlueprintCategories, useBlueprintStageTypes } from '@/lib/api/hooks/use-blueprints';
import { localizeName } from '@/lib/utils/localize';
import { toast } from 'sonner';
import type { components } from '@/lib/generated/api-types';

type DelegationResource = components['schemas']['DelegationResource'];

type ScopeKey = 'all' | 'blueprint_category' | 'stage_type' | 'blueprint_category_and_stage_type';

const SCOPE_KEYS: ScopeKey[] = [
  'all',
  'blueprint_category',
  'stage_type',
  'blueprint_category_and_stage_type',
];

interface DelegationFormDialogProps {
  delegation?: DelegationResource;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface FormState {
  delegator_user_id: string;
  delegate_user_id: string;
  starts_at: string;
  ends_at: string;
  calendar_system: 'gregorian' | 'hijri';
  scope_type: ScopeKey;
  blueprint_category_id: string;
  stage_type_id: string;
}

function scopeFromApi(value?: string | number): ScopeKey {
  const map: Record<string, ScopeKey> = {
    all: 'all',
    blueprint_category: 'blueprint_category',
    stage_type: 'stage_type',
    blueprint_category_and_stage_type: 'blueprint_category_and_stage_type',
  };
  return map[String(value)] ?? 'all';
}

export function DelegationFormDialog({ delegation, open, onOpenChange }: DelegationFormDialogProps) {
  const t = useTranslations('settings.delegations.form');
  const locale = useLocale();
  const canManageUsers = useCapability('iam.manage_users');
  const create = useCreateDelegation();
  const update = useUpdateDelegation();
  const { data: categories } = useBlueprintCategories();
  const { data: stageTypes } = useBlueprintStageTypes();
  const isEdit = !!delegation;
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = open ?? internalOpen;
  const setIsOpen = onOpenChange ?? setInternalOpen;
  const isControlled = open !== undefined;

  const [form, setForm] = useState<FormState>({
    delegator_user_id: '',
    delegate_user_id: '',
    starts_at: '',
    ends_at: '',
    calendar_system: 'gregorian',
    scope_type: 'all',
    blueprint_category_id: '',
    stage_type_id: '',
  });

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      if (delegation) {
        setForm({
          delegator_user_id: delegation.delegator?.public_id ?? '',
          delegate_user_id: delegation.delegate?.public_id ?? '',
          starts_at: delegation.starts_at ? delegation.starts_at.slice(0, 16) : '',
          ends_at: delegation.ends_at ? delegation.ends_at.slice(0, 16) : '',
          calendar_system: 'gregorian',
          scope_type: scopeFromApi(delegation.scope_type),
          blueprint_category_id: delegation.blueprint_category?.public_id ?? '',
          stage_type_id: delegation.stage_type?.public_id ?? '',
        });
      } else {
        setForm({
          delegator_user_id: '',
          delegate_user_id: '',
          starts_at: '',
          ends_at: '',
          calendar_system: 'gregorian',
          scope_type: 'all',
          blueprint_category_id: '',
          stage_type_id: '',
        });
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [isOpen, delegation]);

  function handleChange(key: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleScopeChange(next: ScopeKey) {
    setForm((prev) => ({
      ...prev,
      scope_type: next,
      blueprint_category_id: next.includes('blueprint_category') ? prev.blueprint_category_id : '',
      stage_type_id: next.includes('stage_type') ? prev.stage_type_id : '',
    }));
  }

  function validate(): boolean {
    if (!form.delegate_user_id) {
      toast.error(t('delegate_required'));
      return false;
    }
    if (!form.starts_at || !form.ends_at) {
      toast.error(t('dates_required'));
      return false;
    }
    if (form.scope_type.includes('blueprint_category') && !form.blueprint_category_id) {
      toast.error(t('category_required'));
      return false;
    }
    if (form.scope_type.includes('stage_type') && !form.stage_type_id) {
      toast.error(t('stage_type_required'));
      return false;
    }
    return true;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    type DelegationScopeType = 1 | 2 | 3 | 4;
    const scopeTypeMap: Record<ScopeKey, DelegationScopeType> = {
      all: 1,
      blueprint_category: 2,
      stage_type: 3,
      blueprint_category_and_stage_type: 4,
    };

    const body = {
      calendar_system: form.calendar_system,
      delegator_user_id: canManageUsers ? (form.delegator_user_id || null) : null,
      delegate_user_id: form.delegate_user_id,
      starts_at: form.starts_at,
      ends_at: form.ends_at,
      scope_type: scopeTypeMap[form.scope_type],
      blueprint_category_id: form.scope_type.includes('blueprint_category') ? form.blueprint_category_id : null,
      stage_type_id: form.scope_type.includes('stage_type') ? form.stage_type_id : null,
    };

    if (isEdit && delegation) {
      update.mutate({ publicId: delegation.public_id, body }, { onSuccess: () => setIsOpen(false) });
    } else {
      create.mutate(body, { onSuccess: () => setIsOpen(false) });
    }
  }

  const isPending = create.isPending || update.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {!delegation && !isControlled && (
        <Button onClick={() => setIsOpen(true)}>+ {t('create')}</Button>
      )}
      {delegation && !isControlled && (
        <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
          {t('edit_title')}
        </Button>
      )}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? t('edit_title') : t('create_title')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {canManageUsers && (
            <Field>
              <FieldLabel>{t('delegator_label')}</FieldLabel>
              <UserSearchCombobox
                value={form.delegator_user_id}
                onChange={(v) => handleChange('delegator_user_id', v)}
                placeholder={t('delegator_placeholder')}
              />
            </Field>
          )}
          <Field>
            <FieldLabel>{t('delegate_label')}</FieldLabel>
            <UserSearchCombobox
              value={form.delegate_user_id}
              onChange={(v) => handleChange('delegate_user_id', v)}
              placeholder={t('delegate_placeholder')}
            />
          </Field>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <DatePicker
              id="starts-at"
              label={t('starts_at')}
              value={form.starts_at ? form.starts_at.slice(0, 10) : null}
              calendarSystem={form.calendar_system}
              onChange={(v, cs) => {
                handleChange('starts_at', v ? `${v}T00:00` : '');
                handleChange('calendar_system', cs);
                if (!v) {
                  handleChange('ends_at', '');
                }
              }}
              required
            />
            <DatePicker
              id="ends-at"
              label={t('ends_at')}
              value={form.ends_at ? form.ends_at.slice(0, 10) : null}
              calendarSystem={form.calendar_system}
              onChange={(v, cs) => {
                handleChange('ends_at', v ? `${v}T23:59` : '');
                handleChange('calendar_system', cs);
                if (!v) {
                  handleChange('starts_at', '');
                }
              }}
              required
            />
          </div>
          <Field>
            <FieldLabel>{t('scope_label')}</FieldLabel>
            <RtlSelect value={form.scope_type} onValueChange={(v) => handleScopeChange(v as ScopeKey)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="all">{t('scope_all')}</SelectItem>
                {SCOPE_KEYS.filter((k) => k !== 'all').map((k) => (
                  <SelectItem key={k} value={k}>{t(`scope_${k}`)}</SelectItem>
                ))}
              </SelectContent>
            </RtlSelect>
          </Field>
          {form.scope_type.includes('blueprint_category') && (
            <Field>
              <FieldLabel>{t('category_label')}</FieldLabel>
              <RtlSelect
                value={form.blueprint_category_id || 'none'}
                onValueChange={(v) => handleChange('blueprint_category_id', v === 'none' ? '' : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('select_category')} />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="none">{t('select_category')}</SelectItem>
                  {(categories ?? []).map((c) => (
                    <SelectItem key={c.public_id} value={c.public_id}>
                      {localizeName(locale, c.name_ar, c.name_en)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </RtlSelect>
            </Field>
          )}
          {form.scope_type.includes('stage_type') && (
            <Field>
              <FieldLabel>{t('stage_type_label')}</FieldLabel>
              <RtlSelect
                value={form.stage_type_id || 'none'}
                onValueChange={(v) => handleChange('stage_type_id', v === 'none' ? '' : v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('select_stage_type')} />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="none">{t('select_stage_type')}</SelectItem>
                  {(stageTypes ?? []).map((s) => (
                    <SelectItem key={s.public_id} value={s.public_id}>
                      {localizeName(locale, s.name_ar, s.name_en)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </RtlSelect>
            </Field>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isPending}>
              {t('cancel')}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? t('saving') : (isEdit ? t('save') : t('create'))}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
