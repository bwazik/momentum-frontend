'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import { useCreateEscalation } from '@/lib/api/hooks/use-escalations';
import { toast } from 'sonner';
import type { BoardTaskResource } from './follow-up-types';

interface EscalateDialogProps {
  task: BoardTaskResource;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EscalateDialog({ task, open, onOpenChange }: EscalateDialogProps) {
  const t = useTranslations('followUp.escalate');
  const mut = useCreateEscalation();
  const [reason, setReason] = useState('');

  function handleSubmit() {
    if (!reason.trim()) {
      toast.error(t('reason_required'));
      return;
    }
    mut.mutate(
      { task_id: task.public_id, reason },
      { onSuccess: () => { onOpenChange(false); setReason(''); } },
    );
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) { setReason(''); } }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
        </DialogHeader>
        <Field>
          <FieldLabel>{t('reason')} *</FieldLabel>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} />
          
        </Field>
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
