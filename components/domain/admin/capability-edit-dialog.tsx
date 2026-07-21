'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useUpdateCapability } from '@/lib/api/hooks/use-admin-access';
import type { components } from '@/lib/generated/api-types';

type CapabilityResource = components['schemas']['CapabilityResource'];

interface CapabilityEditDialogProps {
  capability: CapabilityResource;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CapabilityEditDialog({ capability, open, onOpenChange }: CapabilityEditDialogProps) {
  const t = useTranslations('admin.access.catalog.edit');
  const updateCap = useUpdateCapability(capability.public_id);
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (open) setTimeout(() => {
      setNameAr(capability.name_ar ?? '');
      setNameEn(capability.name_en ?? '');
      setDescription(capability.description ?? '');
    }, 0);
  }, [open, capability]);

  function handleSubmit() {
    if (!nameAr.trim()) return toast.error(t('name_ar_required'));
    updateCap.mutate({
      name_ar: nameAr,
      name_en: nameEn || null,
      description: description || null,
    }, { onSuccess: () => onOpenChange(false) });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>{t('title')}</DialogTitle></DialogHeader>
        <div className="mb-4 p-3 bg-muted rounded-lg text-sm">
          <span className="text-muted-foreground">{t('key_label')}: </span>
          <span className="font-mono">{capability.key}</span>
        </div>
        <FieldGroup className="flex flex-col gap-4">
          <Field>
            <FieldLabel>{t('name_ar')} <span className="text-destructive">*</span></FieldLabel>
            <Input dir="rtl" value={nameAr} onChange={(e) => setNameAr(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel>{t('name_en')}</FieldLabel>
            <Input dir="ltr" value={nameEn} onChange={(e) => setNameEn(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel>{t('description')}</FieldLabel>
            <Textarea dir="auto" value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
        </FieldGroup>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('cancel')}</Button>
          <Button onClick={handleSubmit} disabled={updateCap.isPending}>{t('save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
