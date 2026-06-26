'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel, FieldError } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import { useResolveEscalation } from '@/lib/api/hooks/use-escalations';

interface ResolveEscalationDialogProps {
  escalationPublicId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ResolveEscalationDialog({ escalationPublicId, open, onOpenChange }: ResolveEscalationDialogProps) {
  const t = useTranslations('followUp.escalations');
  const mut = useResolveEscalation();
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  function handleSubmit() {
    if (!note.trim()) {
      setError(t('resolution_required'));
      return;
    }
    setError('');
    mut.mutate(
      { escalationPublicId, body: { resolution_note: note } },
      { onSuccess: () => { onOpenChange(false); setNote(''); } },
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) { setNote(''); setError(''); } }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('resolve_title')}</DialogTitle>
        </DialogHeader>
        <Field>
          <FieldLabel>{t('resolution_note')} *</FieldLabel>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} />
          {error && <FieldError>{error}</FieldError>}
        </Field>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('cancel')}</Button>
          <Button onClick={handleSubmit} disabled={mut.isPending}>
            {mut.isPending ? t('submitting') : t('resolve')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
