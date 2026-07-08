'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { BilingualNameFields } from '@/components/shared/bilingual-name-fields';
import { ExternalEntityTypeSelect } from './external-entity-type-select';
import { useCreateExternalEntity } from '@/lib/api/hooks/use-external-references';
import { ApiRequestError } from '@/lib/api/client';
import { EXTERNAL_ENTITY_TYPE_MAP } from './task-external-reference-utils';
import type { ExternalEntityResource } from './task-external-reference-types';

interface InlineExternalEntityCreatorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (entity: ExternalEntityResource) => void;
}

export function InlineExternalEntityCreator({ open, onOpenChange, onCreated }: InlineExternalEntityCreatorProps) {
  const t = useTranslations('tasks.entities');
  const create = useCreateExternalEntity();
  const [form, setForm] = useState({ name_ar: '', name_en: '', entity_type: 'governmentministry' });
  function submit() {
    if (!form.name_ar.trim()) {
      toast.error(t('name_ar_required'));
      return;
    }

    create.mutate(
      {
        name_ar: form.name_ar.trim(),
        name_en: form.name_en.trim() || undefined,
        entity_type: EXTERNAL_ENTITY_TYPE_MAP[form.entity_type],
      },
      {
        onSuccess: (data) => {
          onCreated(data);
          onOpenChange(false);
          setForm({ name_ar: '', name_en: '', entity_type: 'governmentministry' });
        },
      },
    );
  }

  const inlineError = create.error instanceof ApiRequestError && create.error.status === 422
    ? create.error.error.message
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="text-start">
        <DialogHeader><DialogTitle>{t('create_entity')}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <BilingualNameFields form={form} setForm={setForm} t={t} />
          <Field>
            <FieldLabel>{t('entity_type')} <span className="text-destructive">*</span></FieldLabel>
            <ExternalEntityTypeSelect value={form.entity_type} onValueChange={(v) => setForm({ ...form, entity_type: v })} />
          </Field>
          {inlineError && <p className="text-sm text-destructive">{inlineError}</p>}
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('cancel')}</Button>
          <Button onClick={submit} disabled={create.isPending}>{create.isPending ? t('saving') : t('create')}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
