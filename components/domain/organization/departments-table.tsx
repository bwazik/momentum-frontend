'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Edit, PowerOff, Power, Trash2 } from 'lucide-react';
import { RtlTable } from '@/components/shared/rtl-table';
import { TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { ActiveBadge } from '@/components/shared/active-badge';
import { OrgActionMenu, type OrgAction } from './org-action-menu';
import { LoadMoreButton } from './load-more-button';
import { localizeName, asBool } from './organization-utils';
import type { components } from '@/lib/generated/api-types';

type DepartmentResource = components['schemas']['DepartmentResource'];

interface DepartmentsTableProps {
  departments: DepartmentResource[];
  parentMap: Map<string, string>;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
  onEdit: (dept: DepartmentResource) => void;
  onDeactivate: (dept: DepartmentResource) => void;
  onReactivate: (dept: DepartmentResource) => void;
  onDelete: (dept: DepartmentResource) => void;
  canManage: boolean;
}

export function DepartmentsTable({
  departments,
  parentMap,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  onEdit,
  onDeactivate,
  onReactivate,
  onDelete,
  canManage,
}: DepartmentsTableProps) {
  const t = useTranslations('organization');
  const locale = useLocale();

  return (
    <div className="flex flex-col gap-4">
      <RtlTable>
        <TableHeader>
          <TableRow>
            <TableHead className="text-start">{t('departments.columns.name')}</TableHead>
            <TableHead className="text-start">{t('departments.columns.parent')}</TableHead>
            <TableHead className="text-start">{t('departments.columns.status')}</TableHead>
            {canManage && <TableHead className="w-12 text-end" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {departments.map((dept) => {
            const actions: OrgAction[] = [];
            if (canManage) {
              actions.push({
                label: t('actions.edit'),
                onClick: () => onEdit(dept),
                icon: <Edit className="size-4" />,
              });
              if (asBool(dept.is_active)) {
                actions.push({
                  label: t('actions.deactivate'),
                  onClick: () => onDeactivate(dept),
                  icon: <PowerOff className="size-4" />,
                });
              } else {
                actions.push({
                  label: t('actions.reactivate'),
                  onClick: () => onReactivate(dept),
                  icon: <Power className="size-4" />,
                });
              }
              actions.push({
                label: t('actions.delete'),
                onClick: () => onDelete(dept),
                icon: <Trash2 className="size-4" />,
                destructive: true,
              });
            }

            return (
              <TableRow key={dept.public_id}>
                <TableCell className="text-start font-medium">
                  {localizeName(dept, locale)}
                </TableCell>
                <TableCell className="text-start">
                  {dept.parent_department_id
                    ? parentMap.get(dept.parent_department_id) ?? '—'
                    : '—'}
                </TableCell>
                <TableCell className="text-start">
                  <ActiveBadge
                    isActive={asBool(dept.is_active)}
                    activeLabel={t('status.active')}
                    inactiveLabel={t('status.inactive')}
                  />
                </TableCell>
                {canManage && (
                  <TableCell className="text-end">
                    <OrgActionMenu actions={actions} />
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </RtlTable>

      <LoadMoreButton hasNextPage={hasNextPage} isFetchingNextPage={isFetchingNextPage} onLoadMore={onLoadMore} />
    </div>
  );
}
