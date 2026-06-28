'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { VacantBadge } from './vacant-badge';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { ActiveBadge } from '@/components/shared/active-badge';
import { localizeTitle, localizeName, asBool } from './organization-utils';
import type { components } from '@/lib/generated/api-types';

type PositionResource = components['schemas']['PositionResource'];

interface PositionDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  position: PositionResource;
  positions: PositionResource[];
}

export function PositionDetailDrawer({
  open,
  onOpenChange,
  position,
  positions,
}: PositionDetailDrawerProps) {
  const t = useTranslations('organization');
  const locale = useLocale();
  const side = locale === 'ar' ? 'left' : 'right';

  const reportsTo = position.reports_to_position_id
    ? positions.find((p) => p.public_id === position.reports_to_position_id)
    : null;

  const isActive = asBool(position.is_active);
  const isHead = asBool(position.is_department_head);
  const occupant = position.current_occupant;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={side}>
        <SheetHeader>
          <SheetTitle>{localizeTitle(position, locale)}</SheetTitle>
          <SheetDescription>{localizeName(position.department, locale)}</SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 px-4">
          <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2">
            <span className="text-sm font-medium text-muted-foreground">{t('status.status')}</span>
            <div className="flex items-center gap-2">
              <ActiveBadge
                isActive={isActive}
                activeLabel={t('status.active')}
                inactiveLabel={t('status.inactive')}
              />
              {isHead && (
                <Badge variant="secondary" className="text-[10px]">{t('dialogs.head_of_dept')}</Badge>
              )}
            </div>
          </div>

          <Separator />

          <div className="flex flex-col gap-3">
            <div>
              <span className="text-xs font-medium text-muted-foreground">{t('dialogs.authority_grade')}</span>
              <p className="text-sm text-foreground">{position.authority_grade.rank} — {localizeName(position.authority_grade, locale)}</p>
            </div>
            <div>
              <span className="text-xs font-medium text-muted-foreground">{t('dialogs.department')}</span>
              <p className="text-sm text-foreground">{localizeName(position.department, locale)}</p>
            </div>
          </div>

          <Separator />

          <div>
            <span className="text-xs font-medium text-muted-foreground">{t('positions.occupant')}</span>
            {occupant ? (
              <p className="text-sm font-medium text-foreground">{localizeName(occupant, locale)}</p>
            ) : (
              <div className="mt-1">
                <VacantBadge />
              </div>
            )}
          </div>

          {reportsTo && (
            <>
              <Separator />
              <div>
                <span className="text-xs font-medium text-muted-foreground">{t('dialogs.reports_to')}</span>
                <p className="text-sm text-foreground">{localizeTitle(reportsTo, locale)}</p>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
