'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { InfoAlert } from '@/components/shared/info-alert';
import { Field, FieldLabel } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
  isPending: boolean;
}

export function AccessOverrideDialog({ open, onOpenChange, onConfirm, isPending }: Props) {
  const t = useTranslations('confidential.override');
  const [reason, setReason] = useState('');
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReason('');
    if (open) {
      setTimeout(() => ref.current?.focus(), 0);
    }
  }, [open]);

  function handleConfirm() {
    if (reason.trim().length < 10) {
      toast.error(t('reason_too_short'));
      return;
    }
    onConfirm(reason.trim());
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('title')}</AlertDialogTitle>
          <AlertDialogDescription>{t('description')}</AlertDialogDescription>
        </AlertDialogHeader>
        <InfoAlert description={t('audit_notice')} />
        <Field>
          <FieldLabel>{t('reason_label')}</FieldLabel>
          <Textarea
            ref={ref}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t('reason_placeholder')}
            aria-required="true"
            aria-describedby="reason-hint"
            disabled={isPending}
          />
          <p id="reason-hint" className="text-xs text-muted-foreground">{t('reason_hint')}</p>
        </Field>
        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button variant="outline" disabled={isPending}>{t('cancel')}</Button>
          </AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button onClick={handleConfirm} disabled={isPending}>
              {isPending ? <Loader2 className="me-2 size-4 animate-spin" /> : null}
              {t('confirm')}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
