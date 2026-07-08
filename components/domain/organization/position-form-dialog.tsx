'use client';

import { useState } from 'react';
import { useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';
import { RtlSelect } from '@/components/shared/rtl-select';
import { SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BilingualNameFields } from '@/components/shared/bilingual-name-fields';
import { useCreatePosition, useUpdatePosition, usePositionsInfinite } from '@/lib/api/hooks/use-organization';
import { localizeName, localizeTitle, asBool } from './organization-utils';
import type { components } from '@/lib/generated/api-types';

type PositionResource = components['schemas']['PositionResource'];
type DepartmentTreeResource = components['schemas']['DepartmentTreeResource'];
type AuthorityGradeResource = components['schemas']['AuthorityGradeResource'];

interface PositionFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  position?: PositionResource;
  departments: DepartmentTreeResource[];
  grades: AuthorityGradeResource[];
  positions: PositionResource[];
}

interface PositionFormState {
  title_ar: string;
  title_en: string;
  department_id: string;
  authority_grade_id: string;
  reports_to_position_id: string;
  is_department_head: boolean;
}

export function PositionFormDialog({
  open,
  onOpenChange,
  position,
  departments,
  grades,
  positions,
}: PositionFormDialogProps) {
  const t = useTranslations('organization');
  const locale = useLocale();
  const isEdit = !!position;

  const [form, setForm] = useState<PositionFormState>({
    title_ar: position?.title_ar ?? '',
    title_en: position?.title_en ?? '',
    department_id: position?.department?.public_id ?? '',
    authority_grade_id: position?.authority_grade?.public_id ?? '',
    reports_to_position_id: position?.reports_to_position_id ?? '',
    is_department_head: asBool(position?.is_department_head),
  });


  const createMutation = useCreatePosition();
  const updateMutation = useUpdatePosition(position?.public_id ?? '');

  const sortedGrades = [...grades].sort((a, b) => Number(a.rank) - Number(b.rank));

  const fetchedPositions = usePositionsInfinite(
    positions.length === 0 ? { is_active: true, per_page: 200 } : { per_page: 1 },
  );
  const allPositions = useMemo(
    () => positions.length > 0
      ? positions
      : (fetchedPositions.data?.pages.flatMap((p) => p.data) ?? []),
    [positions, fetchedPositions.data],
  );

  const activePositions = allPositions.filter(
    (p) => asBool(p.is_active) && p.public_id !== position?.public_id,
  );

  function validate(): boolean {
    if (!form.title_ar.trim()) { toast.error(t('dialogs.title_ar_required')); return false; }
    if (!form.department_id) { toast.error(t('dialogs.department_required')); return false; }
    if (!form.authority_grade_id) { toast.error(t('dialogs.grade_required')); return false; }
    return true;
  }

  function handleSubmit() {
    if (!validate()) return;

    if (isEdit) {
      updateMutation.mutate(
        {
          title_ar: form.title_ar,
          title_en: form.title_en || undefined,
          authority_grade_id: form.authority_grade_id as unknown as string,
          reports_to_position_id: form.reports_to_position_id || undefined,
          is_department_head: form.is_department_head,
        },
        { onSuccess: () => onOpenChange(false) },
      );
    } else {
      createMutation.mutate(
        {
          title_ar: form.title_ar,
          title_en: form.title_en || undefined,
          department_id: form.department_id as unknown as string,
          authority_grade_id: form.authority_grade_id as unknown as string,
          reports_to_position_id: form.reports_to_position_id || undefined,
          is_department_head: form.is_department_head,
        },
        { onSuccess: () => onOpenChange(false) },
      );
    }
  }

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? t('dialogs.edit_position') : t('dialogs.add_position')}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <BilingualNameFields
            form={form as unknown as Record<string, unknown>}
            setForm={setForm as unknown as React.Dispatch<React.SetStateAction<Record<string, unknown>>>}
                  t={t}
            nameArKey="title_ar"
            nameEnKey="title_en"
          />

          <Field>
            <FieldLabel>
              {t('dialogs.department')} <span className="text-destructive">*</span>
            </FieldLabel>
            <RtlSelect value={form.department_id} onValueChange={(v) => setForm((prev) => ({ ...prev, department_id: v }))}>
              <SelectTrigger>
                <SelectValue placeholder={t('dialogs.department_placeholder')} />
              </SelectTrigger>
              <SelectContent position="popper">
                {departments.map((dept) => (
                  <SelectItem key={dept.public_id} value={dept.public_id}>
                    {localizeName(dept, locale)}
                  </SelectItem>
                ))}
              </SelectContent>
            </RtlSelect>
            
          </Field>

          <Field>
            <FieldLabel>
              {t('dialogs.authority_grade')} <span className="text-destructive">*</span>
            </FieldLabel>
            <RtlSelect value={form.authority_grade_id} onValueChange={(v) => setForm((prev) => ({ ...prev, authority_grade_id: v }))}>
              <SelectTrigger>
                <SelectValue placeholder={t('dialogs.grade_placeholder')} />
              </SelectTrigger>
              <SelectContent position="popper">
                {sortedGrades.map((grade) => (
                  <SelectItem key={grade.public_id} value={grade.public_id}>
                    {grade.rank} — {localizeName(grade, locale)}
                  </SelectItem>
                ))}
              </SelectContent>
            </RtlSelect>
            
          </Field>

          {activePositions.length > 0 && (
            <Field>
              <FieldLabel>{t('dialogs.reports_to')}</FieldLabel>
              <RtlSelect value={form.reports_to_position_id} onValueChange={(v) => setForm((prev) => ({ ...prev, reports_to_position_id: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder={t('dialogs.reports_to_placeholder')} />
                </SelectTrigger>
                <SelectContent position="popper">
                  {activePositions.map((p) => (
                    <SelectItem key={p.public_id} value={p.public_id}>
                      {localizeTitle(p, locale)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </RtlSelect>
            </Field>
          )}

          <div className="flex items-center gap-2">
            <Checkbox
              id="is_department_head"
              checked={form.is_department_head}
              onCheckedChange={(checked) => setForm((prev) => ({ ...prev, is_department_head: checked === true }))}
            />
            <label htmlFor="is_department_head" className="text-sm font-medium">
              {t('dialogs.head')}
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('actions.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? t('actions.saving') : isEdit ? t('actions.save') : t('actions.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
