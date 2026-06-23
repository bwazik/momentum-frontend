'use client';

import { type ReactNode } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Ellipsis, Pencil, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { RtlTable } from './rtl-table';

interface ActionsDropdownAction {
  label: string;
  onClick: () => void;
  icon?: ReactNode;
  className?: string;
  disabled?: boolean;
}

export function ActionsDropdown({ actions }: { actions: ActionsDropdownAction[] }) {
  const locale = useLocale();
  const t = useTranslations('blueprints.catalog');

  return (
    <DropdownMenu dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8" aria-label={t('actions')}>
          <Ellipsis className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {actions.map((action, i) => (
          <DropdownMenuItem
            key={i}
            onClick={action.onClick}
            className={action.className}
            disabled={action.disabled}
          >
            {action.icon && <span className="me-2 size-4">{action.icon}</span>}
            {action.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function editAction(label: string, onClick: () => void): ActionsDropdownAction {
  return { label, onClick, icon: <Pencil className="size-4" /> };
}

export function deleteAction(label: string, onClick: () => void, disabled = false): ActionsDropdownAction {
  return { label, onClick, icon: <Trash2 className="size-4" />, className: 'text-destructive', disabled };
}

export function deactivateAction(label: string, onClick: () => void): ActionsDropdownAction {
  return { label, onClick, icon: <XCircle className="size-4" /> };
}

export function reactivateAction(label: string, onClick: () => void): ActionsDropdownAction {
  return { label, onClick, icon: <CheckCircle className="size-4" /> };
}

interface FormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
  onConfirm: () => void;
  isPending?: boolean;
  confirmLabel?: string;
  cancelLabel?: string;
  savingLabel?: string;
}

export function FormDialog({
  open, onOpenChange, title, children, onConfirm,
  isPending = false, confirmLabel, cancelLabel, savingLabel,
}: FormDialogProps) {
  const t = useTranslations('blueprints.catalog');
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        {children}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{cancelLabel ?? t('cancel')}</Button>
          <Button onClick={onConfirm} disabled={isPending}>{isPending ? (savingLabel ?? t('saving')) : (confirmLabel ?? t('edit'))}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CatalogSkeleton() {
  return (
    <div className="rounded-lg border">
      <div className="flex items-center gap-4 border-b bg-muted/30 px-4 py-3">
        <Skeleton className="h-4 w-50" />
        <Skeleton className="h-4 w-50" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="ms-auto h-4 w-12" />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 border-b px-4 py-4 last:border-b-0">
          <Skeleton className="h-5 w-50" />
          <Skeleton className="h-5 w-50" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-20" />
          <Skeleton className="ms-auto size-8 w-12 rounded-md" />
        </div>
      ))}
    </div>
  );
}

export { RtlTable };
