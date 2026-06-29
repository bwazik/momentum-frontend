'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTaskFormStore } from '@/lib/stores/use-task-form-store';
import { CancelDiscardDialog } from './cancel-discard-dialog';

export function TaskCancelButton({ href }: { href: string }) {
  const t = useTranslations('tasks.new');
  const router = useRouter();
  const touched = useTaskFormStore((s) => s.touched);
  const [open, setOpen] = useState(false);

  const handleClick = () => {
    if (touched) {
      setOpen(true);
    } else {
      router.push(href);
    }
  };

  return (
    <>
      <Button variant="outline" className="border-destructive/30 text-destructive" onClick={handleClick}>
        <X className="size-4" />
        {t('cancel')}
      </Button>
      <CancelDiscardDialog
        open={open}
        onOpenChange={setOpen}
        onConfirm={() => { setOpen(false); router.push(href); }}
      />
    </>
  );
}
