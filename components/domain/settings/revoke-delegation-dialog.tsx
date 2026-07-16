'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useRevokeDelegation } from '@/lib/api/hooks/use-delegations';

interface RevokeDelegationDialogProps {
  publicId: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function RevokeDelegationDialog({ publicId, open, onOpenChange }: RevokeDelegationDialogProps) {
  const t = useTranslations('settings.delegations.revoke');
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = open ?? internalOpen;
  const setIsOpen = onOpenChange ?? setInternalOpen;
  const isControlled = open !== undefined;
  const revoke = useRevokeDelegation();

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      {!isControlled && (
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="sm" className="text-destructive">
            {t('button')}
          </Button>
        </AlertDialogTrigger>
      )}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('title')}</AlertDialogTitle>
          <AlertDialogDescription>{t('description')}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
          <AlertDialogAction
            className="text-destructive"
            onClick={() => revoke.mutate(publicId, { onSuccess: () => setIsOpen(false) })}
          >
            {t('confirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
