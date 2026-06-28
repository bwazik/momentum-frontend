'use client';

import { Ellipsis } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface OrgAction {
  label: string;
  onClick: () => void;
  icon: React.ReactNode;
  disabled?: boolean;
  destructive?: boolean;
}

export function OrgActionMenu({ actions }: { actions: OrgAction[] }) {
  const locale = useLocale();
  const t = useTranslations('organization');
  return (
    <DropdownMenu dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8" aria-label={t('actions.actions')}>
          <Ellipsis className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {actions.map((a, i) => (
          <DropdownMenuItem
            key={i}
            onClick={a.onClick}
            disabled={a.disabled}
            className={a.destructive ? 'text-destructive' : ''}
          >
            <span className="me-2 size-4">{a.icon}</span>
            {a.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
