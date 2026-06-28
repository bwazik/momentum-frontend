'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Edit, ArrowRightLeft, PowerOff, Trash2 } from 'lucide-react';
import { RtlTable } from '@/components/shared/rtl-table';
import { TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ActiveBadge } from '@/components/shared/active-badge';
import { OrgActionMenu, type OrgAction } from './org-action-menu';
import { localizeTitle, localizeName, asBool } from './organization-utils';
import { Button } from '@/components/ui/button';
import { LoadMoreButton } from './load-more-button';
import type { components } from '@/lib/generated/api-types';

type PositionResource = components['schemas']['PositionResource'];

interface PositionsTableProps {
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

export function PositionsTable({
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
}: PositionsTableProps) {
  const t = useTranslations('organization');
  const locale = useLocale();

  return (
    <div className="hidden md:block">
      <RtlTable>
        <TableHeader>
          <TableRow>
            <TableHead className="text-start">{t('dialogs.title_ar')}</TableHead>
            <TableHead className="text-start">{t('dialogs.department')}</TableHead>
            <TableHead className="text-start">{t('dialogs.authority_grade')}</TableHead>
            <TableHead className="text-start">{t('dialogs.head')}</TableHead>
            <TableHead className="text-start">{t('departments.columns.status')}</TableHead>
            <TableHead className="w-[60px] text-end" />
          </TableRow>
        </TableHeader>
        <TableBody>
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
              <TableRow key={pos.public_id} className="cursor-pointer" onClick={() => onViewDetail(pos)}>
                <TableCell className="text-start font-medium">{localizeTitle(pos, locale)}</TableCell>
                <TableCell className="text-start">{localizeName(pos.department, locale)}</TableCell>
                <TableCell className="text-start">{pos.authority_grade.rank} — {localizeName(pos.authority_grade, locale)}</TableCell>
                <TableCell className="text-start">
                  {asBool(pos.is_department_head) ? (
                    <Badge variant="secondary">{t('dialogs.head_of_dept')}</Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">{t('dialogs.member')}</span>
                  )}
                </TableCell>
                <TableCell className="text-start">
                  <ActiveBadge
                    isActive={isActive}
                    activeLabel={t('status.active')}
                    inactiveLabel={t('status.inactive')}
                  />
                </TableCell>
                <TableCell className="text-end" onClick={(e) => e.stopPropagation()}>
                  <OrgActionMenu actions={actions} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </RtlTable>

      <LoadMoreButton hasNextPage={hasNextPage} isFetchingNextPage={isFetchingNextPage} onLoadMore={onLoadMore} />
    </div>
  );
}
