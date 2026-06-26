'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel, FieldError } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateFollowUpAction } from '@/lib/api/hooks/use-follow-up';
import type { BoardTaskResource } from './follow-up-types';

interface LogFollowUpDialogProps {
  task: BoardTaskResource;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LogFollowUpDialog({ task, open, onOpenChange }: LogFollowUpDialogProps) {
  const t = useTranslations('followUp.actions');
  const mut = useCreateFollowUpAction(task.public_id);
  const [actionType, setActionType] = useState('');
  const [noteAr, setNoteAr] = useState('');
  const [noteEn, setNoteEn] = useState('');
  const [contact, setContact] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleSubmit() {
    const errs: Record<string, string> = {};
    if (!actionType) errs.action_type = t('action_type_required');
    if (!noteAr.trim()) errs.note_ar = t('note_ar_required');
    setErrors(errs);
    if (Object.keys(errs).length) return;
    mut.mutate(
      {
        action_type: Number(actionType) as 1 | 2 | 3 | 4 | 5,
        note_ar: noteAr,
        note_en: noteEn || undefined,
        contact_name: contact || undefined,
      },
      { onSuccess: () => { onOpenChange(false); reset(); } },
    );
  }

  function reset() {
    setActionType('');
    setNoteAr('');
    setNoteEn('');
    setContact('');
    setErrors({});
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('log_title')}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <Field>
            <FieldLabel>{t('action_type')} *</FieldLabel>
            <Select value={actionType} onValueChange={setActionType}>
              <SelectTrigger aria-label={t('action_type')}>
                <SelectValue placeholder={t('action_type_placeholder')} />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectGroup>
                  {(['1', '2', '3', '4', '5'] as const).map((v) => (
                    <SelectItem key={v} value={v}>{t(`type_${v}`)}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            {errors.action_type && <FieldError>{errors.action_type}</FieldError>}
          </Field>
          <Field>
            <FieldLabel>{t('note_ar')} *</FieldLabel>
            <Textarea dir="rtl" value={noteAr} onChange={(e) => setNoteAr(e.target.value)} />
            {errors.note_ar && <FieldError>{errors.note_ar}</FieldError>}
          </Field>
          <Field>
            <FieldLabel>{t('note_en')}</FieldLabel>
            <Textarea dir="ltr" value={noteEn} onChange={(e) => setNoteEn(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel>{t('contact_name')}</FieldLabel>
            <Input value={contact} onChange={(e) => setContact(e.target.value)} placeholder={t('contact_name_placeholder')} />
          </Field>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('cancel')}</Button>
          <Button onClick={handleSubmit} disabled={mut.isPending}>
            {mut.isPending ? t('submitting') : t('submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
