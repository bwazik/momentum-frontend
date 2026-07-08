'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ApiRequestError } from '@/lib/api/client';
import {
  useCreateTaskExternalReference,
  useUpdateTaskExternalReference,
} from '@/lib/api/hooks/use-external-references';
import { ReferenceTypeSelect } from './reference-type-select';
import { ExternalEntitySelect } from './external-entity-select';
import { InlineExternalEntityCreator } from './inline-external-entity-creator';
import { EXTERNAL_REFERENCE_TYPE_MAP } from './task-external-reference-utils';
import type { TaskExternalReferenceResource } from './task-external-reference-types';

interface TaskExternalReferenceDialogProps {
  taskPublicId: string;
  reference: TaskExternalReferenceResource | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskExternalReferenceDialog({ taskPublicId, reference, open, onOpenChange }: TaskExternalReferenceDialogProps) {
  const t = useTranslations('tasks.references');
  const create = useCreateTaskExternalReference(taskPublicId);
  const update = useUpdateTaskExternalReference(taskPublicId);
  const isEdit = !!reference;

  const [referenceType, setReferenceType] = useState<string>('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [entityId, setEntityId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [inlineCreatorOpen, setInlineCreatorOpen] = useState(false);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        if (reference) {
          setReferenceType(reference.reference_type ?? '');
          setReferenceNumber(reference.reference_number);
          setEntityId(reference.external_entity?.public_id ?? null);
          setNotes(reference.notes ?? '');
        } else {
          setReferenceType('');
          setReferenceNumber('');
          setEntityId(null);
          setNotes('');
        }
        setErrors({});
      }, 0);
    }
  }, [open, reference]);

  const mutationError = create.error || update.error;
  const inlineError = mutationError instanceof ApiRequestError && mutationError.status === 422
    ? mutationError.error.message
    : null;

  function submit() {
    const next: Record<string, string> = {};
    if (referenceType === '') {
      next.referenceType = t('reference_type_required');
      toast.error(t('reference_type_required'));
    }
    if (!referenceNumber.trim()) {
      next.referenceNumber = t('reference_number_required');
      if (!next.referenceType) toast.error(t('reference_number_required'));
    }
    if (Object.keys(next).length > 0) {
      setErrors(next);
      return;
    }
    const body = {
      reference_type: EXTERNAL_REFERENCE_TYPE_MAP[referenceType],
      reference_number: referenceNumber.trim(),
      external_entity_id: entityId,
      notes: notes.trim() || null,
    };
    if (reference) {
      update.mutate({ referencePublicId: reference.public_id, body }, { onSuccess: () => onOpenChange(false) });
    } else {
      create.mutate(body, { onSuccess: () => onOpenChange(false) });
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="text-start">
          <DialogHeader><DialogTitle>{isEdit ? t('edit_reference') : t('add_reference')}</DialogTitle></DialogHeader>
          <div className="space-y-4" dir="auto">
            <Field>
              <FieldLabel>{t('reference_type')} <span className="text-destructive">*</span></FieldLabel>
              <ReferenceTypeSelect value={referenceType} onValueChange={setReferenceType} />
            </Field>
            <Field>
              <FieldLabel>{t('reference_number')} <span className="text-destructive">*</span></FieldLabel>
              <Input value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)} maxLength={100} placeholder={t('reference_number_placeholder')} aria-invalid={errors.referenceNumber ? true : undefined} />
            </Field>
            <Field>
              <FieldLabel>{t('issuing_entity')}</FieldLabel>
              <ExternalEntitySelect
                value={entityId}
                onValueChange={(value) => {
                  if (value === '__create__') setInlineCreatorOpen(true);
                  else setEntityId(value);
                }}
              />
            </Field>
            <Field>
              <FieldLabel>{t('notes')}</FieldLabel>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={2000} rows={3} />
            </Field>
            {inlineError && <p className="text-sm text-destructive">{inlineError}</p>}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>{t('cancel')}</Button>
            <Button onClick={submit} disabled={create.isPending || update.isPending}>
              {create.isPending || update.isPending ? t('saving') : (isEdit ? t('save') : t('add'))}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <InlineExternalEntityCreator
        open={inlineCreatorOpen}
        onOpenChange={setInlineCreatorOpen}
        onCreated={(newEntity) => setEntityId(newEntity.public_id)}
      />
    </>
  );
}
