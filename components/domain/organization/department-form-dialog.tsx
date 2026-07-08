'use client';

import { useState, useMemo } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useCreateDepartment, useUpdateDepartment } from '@/lib/api/hooks/use-organization';
import { localizeName, flattenTree, extractApiErrors } from './organization-utils';
import { BilingualNameFields } from '@/components/shared/bilingual-name-fields';
import { RtlSelect } from '@/components/shared/rtl-select';
import { SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Field, FieldLabel } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import type { components } from '@/lib/generated/api-types';

type DepartmentResource = components['schemas']['DepartmentResource'];
type DepartmentTreeResource = components['schemas']['DepartmentTreeResource'];
type StoreDepartmentRequest = components['schemas']['StoreDepartmentRequest'];

const NONE_SENTINEL = '__none__';

interface DepartmentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department?: DepartmentResource;
  tree: DepartmentTreeResource[];
}

interface DeptFormState {
  name_ar: string;
  name_en: string;
  parent_department_id: string;
  [key: string]: unknown;
}

export function DepartmentFormDialog({
  open,
  onOpenChange,
  department,
  tree,
}: DepartmentFormDialogProps) {
  const t = useTranslations('organization');
  const locale = useLocale();
  const isEdit = !!department;

  const [form, setForm] = useState<DeptFormState>(() => ({
    name_ar: department?.name_ar ?? '',
    name_en: department?.name_en ?? '',
    parent_department_id: department?.parent_department_id ?? NONE_SENTINEL,
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const flatParents = useMemo(
    () => flattenTree(tree, isEdit ? department?.public_id : undefined),
    [tree, isEdit, department?.public_id],
  );

  const createMutation = useCreateDepartment();
  const updateMutation = useUpdateDepartment(department?.public_id ?? '');

  const isPending = createMutation.isPending || updateMutation.isPending;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const body = {
      name_ar: form.name_ar,
      name_en: form.name_en || undefined,
      parent_department_id:
        form.parent_department_id === NONE_SENTINEL
          ? null
          : form.parent_department_id,
    };

    const mutation = isEdit
      ? updateMutation
      : createMutation;

    mutation.mutate(body as unknown as StoreDepartmentRequest, {
      onSuccess: () => {
        onOpenChange(false);
      },
      onError: (err: Error) => {
        const fieldErrors = extractApiErrors(err);
        if (fieldErrors) setErrors(fieldErrors);
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t('departments.edit_title') : t('departments.create_title')}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? t('departments.edit_description')
              : t('departments.create_description')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <BilingualNameFields
            form={form}
            setForm={(updater) => setForm(updater as DeptFormState)}
                  t={t}
          />

          <Field>
            <FieldLabel>{t('departments.parent')}</FieldLabel>
            <RtlSelect
              value={form.parent_department_id}
              onValueChange={(v: string) =>
                setForm((prev) => ({ ...prev, parent_department_id: v }))
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('departments.parent_placeholder')} />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value={NONE_SENTINEL}>
                  {t('departments.no_parent')}
                </SelectItem>
                {flatParents.map((dept) => (
                  <SelectItem key={dept.public_id} value={dept.public_id}>
                    {localizeName(dept, locale)}
                  </SelectItem>
                ))}
              </SelectContent>
            </RtlSelect>
            {errors.parent_department_id && (
              <p className="text-sm text-destructive">{errors.parent_department_id}</p>
            )}
          </Field>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              {t('actions.cancel')}
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? t('actions.saving') : t('actions.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
