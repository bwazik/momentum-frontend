'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useCreateAuthorityGrade, useUpdateAuthorityGrade } from '@/lib/api/hooks/use-organization';
import { extractApiErrors } from './organization-utils';
import { BilingualNameFields } from '@/components/shared/bilingual-name-fields';
import { Field, FieldGroup, FieldLabel, FieldError } from '@/components/ui/field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { components } from '@/lib/generated/api-types';

type AuthorityGradeResource = components['schemas']['AuthorityGradeResource'];

interface AuthorityGradeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  grade?: AuthorityGradeResource;
}

interface GradeFormState {
  rank: string;
  name_ar: string;
  name_en: string;
  description: string;
  [key: string]: unknown;
}

export function AuthorityGradeFormDialog({
  open,
  onOpenChange,
  grade,
}: AuthorityGradeFormDialogProps) {
  const t = useTranslations('organization');
  const isEdit = !!grade;

  const [form, setForm] = useState<GradeFormState>(() => ({
    rank: grade?.rank ?? '',
    name_ar: grade?.name_ar ?? '',
    name_en: grade?.name_en ?? '',
    description: grade?.description ?? '',
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = useCreateAuthorityGrade();
  const updateMutation = useUpdateAuthorityGrade(grade?.public_id ?? '');
  const isPending = createMutation.isPending || updateMutation.isPending;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const body = {
      rank: Number(form.rank),
      name_ar: form.name_ar,
      name_en: form.name_en || undefined,
      description: form.description || undefined,
    };

    const mutation = isEdit ? updateMutation : createMutation;

    mutation.mutate(body as never, {
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
            {isEdit ? t('grades.edit_title') : t('grades.create_title')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FieldGroup>
            <Field>
              <FieldLabel>
                {t('grades.columns.rank')}{' '}
                <span className="text-destructive">*</span>
              </FieldLabel>
              <Input
                type="number"
                min={1}
                value={form.rank}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, rank: e.target.value }))
                }
              />
              {errors.rank && <FieldError>{errors.rank}</FieldError>}
            </Field>

            <BilingualNameFields
              form={form}
              setForm={(updater) => setForm(updater as GradeFormState)}
              errors={errors}
              t={t}
              nameArKey="name_ar"
              nameEnKey="name_en"
            />

            <Field>
              <FieldLabel>{t('grades.columns.description')}</FieldLabel>
              <Textarea
                dir="auto"
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, description: e.target.value }))
                }
              />
              {errors.description && (
                <FieldError>{errors.description}</FieldError>
              )}
            </Field>
          </FieldGroup>

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
