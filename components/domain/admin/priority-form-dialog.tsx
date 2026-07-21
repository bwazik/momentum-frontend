'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { BilingualNameFields } from '@/components/shared/bilingual-name-fields';
import { useCreateTaskPriority, useUpdateTaskPriority } from '@/lib/api/hooks/use-task-priorities';
import type { components } from '@/lib/generated/api-types';

type TaskPriorityResource = components['schemas']['TaskPriorityResource'];
type StoreTaskPriorityRequest = components['schemas']['StoreTaskPriorityRequest'];
type UpdateTaskPriorityRequest = components['schemas']['UpdateTaskPriorityRequest'];

interface PriorityFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  priority?: TaskPriorityResource | null;
}

const PALETTE = [
  '#059669', '#d97706', '#dc2626', '#2563eb',
  '#7c3aed', '#d946ef', '#64748b', '#06b6d4',
];

type FormState = {
  name_ar: string;
  name_en: string;
  severity_rank: number;
  color_code: string;
  is_default: boolean;
  display_order: number;
};

const emptyForm: FormState = {
  name_ar: '', name_en: '', severity_rank: 1,
  color_code: '#64748b', is_default: false, display_order: 0,
};

export function PriorityFormDialog({ open, onOpenChange, priority }: PriorityFormDialogProps) {
  const t = useTranslations('admin.priorities.form');
  const isEdit = !!priority;
  const [form, setForm] = useState<FormState>(emptyForm);
  const createPriority = useCreateTaskPriority();
  const updatePriority = useUpdateTaskPriority(priority?.public_id ?? '');

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        if (priority) {
          setForm({
            name_ar: priority.name_ar ?? '',
            name_en: priority.name_en ?? '',
            severity_rank: Number(priority.severity_rank) || 1,
            color_code: priority.color_code || '#64748b',
            is_default: String(priority.is_default) === 'true',
            display_order: Number(priority.display_order) || 0,
          });
        } else {
          setForm(emptyForm);
        }
      }, 0);
    }
  }, [open, priority]);

  function handleSubmit() {
    if (!form.name_ar.trim()) return toast.error(t('name_ar_required'));
    if (form.severity_rank < 1) return toast.error(t('severity_rank_invalid'));
    if (!/^#[0-9a-fA-F]{6}$/.test(form.color_code)) return toast.error(t('color_invalid'));

    if (isEdit) {
      const body: UpdateTaskPriorityRequest = {
        name_ar: form.name_ar,
        name_en: form.name_en || null,
        severity_rank: form.severity_rank,
        color_code: form.color_code,
        is_default: form.is_default || null,
        display_order: form.display_order,
      };
      updatePriority.mutate(body, { onSuccess: () => onOpenChange(false) });
    } else {
      const body: StoreTaskPriorityRequest = {
        name_ar: form.name_ar,
        name_en: form.name_en || null,
        severity_rank: form.severity_rank,
        color_code: form.color_code,
        is_default: form.is_default || null,
        display_order: form.display_order,
      };
      createPriority.mutate(body, { onSuccess: () => onOpenChange(false) });
    }
  }

  const isPending = createPriority.isPending || updatePriority.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? t('edit_title') : t('create_title')}</DialogTitle>
        </DialogHeader>
        <FieldGroup className="flex flex-col gap-4">
          <BilingualNameFields form={form as unknown as Record<string, unknown>}
            onFieldChange={(key, value) => setForm((p) => ({ ...p, [key]: value }))}
            t={t} />
          <Field>
            <FieldLabel>{t('severity_rank')} <span className="text-destructive">*</span></FieldLabel>
            <Input type="number" min={1} value={form.severity_rank}
              onChange={(e) => setForm((p) => ({ ...p, severity_rank: Number(e.target.value) || 1 }))} />
          </Field>
          <Field>
            <FieldLabel>{t('color')}</FieldLabel>
            <div className="flex flex-wrap gap-2 mb-2">
              {PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`size-8 rounded-full border-2 ${form.color_code === c ? 'border-primary' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setForm((p) => ({ ...p, color_code: c }))}
                  aria-label={c}
                />
              ))}
            </div>
            <Input type="color" value={form.color_code}
              onChange={(e) => setForm((p) => ({ ...p, color_code: e.target.value }))} />
            <span className="text-xs text-muted-foreground mt-1">{t('severity_rank')}: {form.severity_rank}</span>
          </Field>
          <Field>
            <FieldLabel>{t('display_order')}</FieldLabel>
            <Input type="number" min={0} value={form.display_order}
              onChange={(e) => setForm((p) => ({ ...p, display_order: Number(e.target.value) || 0 }))} />
          </Field>
          <div className="flex items-center gap-2">
            <Checkbox id="is-default" checked={form.is_default}
              onCheckedChange={(v) => setForm((p) => ({ ...p, is_default: v === true }))} />
            <label htmlFor="is-default" className="text-sm">{t('is_default')}</label>
          </div>
        </FieldGroup>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('cancel')}</Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isEdit ? t('save') : t('create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
