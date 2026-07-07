'use client';

import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { LockBadge, ScopeBadge } from './blueprint-badges';
import { ActiveBadge } from '@/components/shared/active-badge';
import { localizeName } from '@/lib/utils/localize';
import { getStagesCount } from '@/lib/utils/blueprint-utils';
import type { BlueprintResource } from './blueprint-types';

interface BlueprintCardListProps {
  blueprints: BlueprintResource[];
}

export function BlueprintCardList({ blueprints }: BlueprintCardListProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('blueprints.library.columns');

  return (
    <div className="flex flex-col gap-3">
      {blueprints.map((bp) => {
        const name = localizeName(locale, bp.name_ar, bp.name_en);
        const stagesCount = getStagesCount(bp);
        return (
          <Card key={bp.public_id} className="cursor-pointer p-4" tabIndex={0} role="button"
            onClick={() => router.push(`/blueprints/${bp.public_id}`)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); router.push(`/blueprints/${bp.public_id}`); } }}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">{name}</span>
                {bp.category && (
                  <span className="text-xs text-muted-foreground">
                    {localizeName(locale, bp.category.name_ar, bp.category.name_en)}
                  </span>
                )}
              </div>
              <ScopeBadge scope={bp.scope} />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <ActiveBadge isActive={!!bp.is_active} activeLabel={t('active')} inactiveLabel={t('inactive')} />
              <span className="text-xs text-muted-foreground">{t('stages_count', { count: stagesCount })}</span>
              {bp.is_locked && <LockBadge />}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
