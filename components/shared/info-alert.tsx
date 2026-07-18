'use client';

import type { ReactNode } from 'react';
import { Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface InfoAlertProps {
  title?: string;
  description: string;
  icon?: ReactNode;
  className?: string;
}

export function InfoAlert({ title, description, icon, className }: InfoAlertProps) {
  return (
    <Alert
      variant="default"
      className={cn(
        'border-primary/20 bg-primary/5 text-primary dark:border-primary/30 dark:bg-primary/10',
        className,
      )}
    >
      {icon ?? <Info className="size-4" aria-hidden="true" />}
      {title && <AlertTitle>{title}</AlertTitle>}
      <AlertDescription>{description}</AlertDescription>
    </Alert>
  );
}
