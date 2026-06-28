'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Edit, ArrowRightLeft, PowerOff, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ActiveBadge } from '@/components/shared/active-badge';
import { OrgActionMenu, type OrgAction } from './org-action-menu';
import { localizeTitle, localizeName, asBool } from './organization-utils';
import { Button } from '@/components/ui/button';
import { LoadMoreButton } from './load-more-button';
import type { components } from '@/lib/generated/api-types';

type PositionResource = components['schemas']['PositionResource'];

interface PositionsCardListProps {
  positions: PositionResource[];
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
  onEdit: (pos: PositionResource) => void;
  onTransfer: (pos: PositionResource) => void;
  onDeactivate: (pos: PositionResource) => void;
  onReactivate: (pos: PositionResource) => void;
  onDelete: (pos: PositionResource) => void;
  onViewDetail: (pos: PositionResource) => void;
}

export function PositionsCardList({
  positions,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  onEdit,
  onTransfer,
  onDeactivate,
  onReactivate,
  onDelete,
  onViewDetail,
}: PositionsCardListProps) {
  const t = useTranslations('organization');
  const locale = useLocale();

  return (
    <div className="md:hidden">
      <div className="flex flex-col gap-3">
        {positions.map((pos) => {
          const isActive = asBool(pos.is_active);
          const actions: OrgAction[] = [
            { label: t('actions.edit'), onClick: () => onEdit(pos), icon: <Edit className="size-4" /> },
            { label: t('actions.transfer'), onClick: () => onTransfer(pos), icon: <ArrowRightLeft className="size-4" /> },
          ];
          if (isActive) {
            actions.push({ label: t('actions.deactivate'), onClick: () => onDeactivate(pos), icon: <PowerOff className="size-4" /> });
          } else {
            actions.push({ label: t('actions.reactivate'), onClick: () => onReactivate(pos), icon: <PowerOff className="size-4" /> });
          }
          actions.push({ label: t('actions.delete'), onClick: () => onDelete(pos), icon: <Trash2 className="size-4" />, destructive: true });

          return (
            <Card key={pos.public_id} className="cursor-pointer" onClick={() => onViewDetail(pos)}>
              <CardContent className="flex items-start justify-between gap-3 p-4">
                <div className="flex flex-col gap-1.5 min-w-0">
                  <p className="text-sm font-medium truncate">{localizeTitle(pos, locale)}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {localizeName(pos.department, locale)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {pos.authority_grade.rank} — {localizeName(pos.authority_grade, locale)}
                  </p>
                  <div className="flex items-center gap-2">
                    {asBool(pos.is_department_head) && (
                      <Badge variant="secondary" className="text-xs">{t('dialogs.head_of_dept')}</Badge>
                    )}
                    <ActiveBadge
                      isActive={isActive}
                      activeLabel={t('status.active')}
                      inactiveLabel={t('status.inactive')}
                    />
                  </div>
                </div>
                <div onClick={(e) => e.stopPropagation()}>
                  <OrgActionMenu actions={actions} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <LoadMoreButton hasNextPage={hasNextPage} isFetchingNextPage={isFetchingNextPage} onLoadMore={onLoadMore} />
    </div>
  );
}
