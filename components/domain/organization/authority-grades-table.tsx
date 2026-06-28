'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Edit, Trash2 } from 'lucide-react';
import { RtlTable } from '@/components/shared/rtl-table';
import { TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { OrgActionMenu, type OrgAction } from './org-action-menu';
import { localizeName } from './organization-utils';
import type { components } from '@/lib/generated/api-types';

type AuthorityGradeResource = components['schemas']['AuthorityGradeResource'];

interface AuthorityGradesTableProps {
  grades: AuthorityGradeResource[];
  activeGradeIds: Set<string>;
  onEdit: (grade: AuthorityGradeResource) => void;
  onDelete: (grade: AuthorityGradeResource) => void;
  canManage: boolean;
}

export function AuthorityGradesTable({
  grades,
  activeGradeIds,
  onEdit,
  onDelete,
  canManage,
}: AuthorityGradesTableProps) {
  const t = useTranslations('organization');
  const locale = useLocale();

  return (
    <RtlTable>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16 text-start">{t('grades.columns.rank')}</TableHead>
          <TableHead className="text-start">{t('grades.columns.name')}</TableHead>
          <TableHead className="text-start">{t('grades.columns.description')}</TableHead>
          {canManage && <TableHead className="w-12 text-end" />}
        </TableRow>
      </TableHeader>
      <TableBody>
        {grades.map((grade) => {
          const hasActive = activeGradeIds.has(grade.public_id);

          const actions: OrgAction[] = [
            {
              label: t('actions.edit'),
              onClick: () => onEdit(grade),
              icon: <Edit className="size-4" />,
            },
            {
              label: t('actions.delete'),
              onClick: () => onDelete(grade),
              icon: <Trash2 className="size-4" />,
              destructive: true,
              disabled: hasActive,
            },
          ];

          return (
            <TableRow key={grade.public_id}>
              <TableCell className="text-start font-mono text-sm">{grade.rank}</TableCell>
              <TableCell className="text-start font-medium">
                {localizeName(grade, locale)}
              </TableCell>
              <TableCell className="text-start max-w-[300px] truncate text-muted-foreground">
                {grade.description || '—'}
              </TableCell>
              {canManage && (
                <TableCell className="text-end">
                  {hasActive ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span>
                          <OrgActionMenu actions={actions} />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        {t('grades.has_active_positions')}
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <OrgActionMenu actions={actions} />
                  )}
                </TableCell>
              )}
            </TableRow>
          );
        })}
      </TableBody>
    </RtlTable>
  );
}
