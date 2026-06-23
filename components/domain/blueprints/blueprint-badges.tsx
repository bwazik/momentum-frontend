'use client';

import { useTranslations } from 'next-intl';
import { Lock, Globe, Building2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function LockBadge() {
  const t = useTranslations('blueprints.badges');
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="outline" className="gap-1 border-amber-300 bg-amber-50 text-amber-700 text-xs dark:border-amber-700 dark:bg-amber-950 dark:text-amber-400"><Lock className="size-3" /> {t('locked')}</Badge>
      </TooltipTrigger>
      <TooltipContent>{t('locked_tooltip')}</TooltipContent>
    </Tooltip>
  );
}

export function ScopeBadge({ scope }: { scope: string }) {
  const t = useTranslations('blueprints.badges');
  const Icon = scope === 'organization' ? Globe : Building2;
  const key = scope === 'organization' ? 'scope_organization' : 'scope_department';
  return <Badge variant="outline" className="gap-1 text-xs"><Icon className="size-3" aria-hidden="true" /> {t(key)}</Badge>;
}
