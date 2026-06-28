'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Edit2, Trash2, UserMinus, UserPlus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { VacantBadge } from './vacant-badge';

import { useCapability } from '@/lib/api/hooks/use-capabilities';
import { OrgActionMenu, type OrgAction } from './org-action-menu';
import { localizeTitle, localizeName, asBool } from './organization-utils';

import type { components } from '@/lib/generated/api-types';

type PositionResource = components['schemas']['PositionResource'];

interface PositionNodeProps {
  position: PositionResource;
  onEdit?: (publicId: string) => void;
  onDelete?: (publicId: string) => void;
  onDeactivate?: (publicId: string) => void;
  onReactivate?: (publicId: string) => void;
}

export function PositionNode({ position, onEdit, onDelete, onDeactivate, onReactivate }: PositionNodeProps) {
  const t = useTranslations('organization');
  const locale = useLocale();
  const canManage = useCapability('organization.manage');

  const title = localizeTitle(position, locale);
  const grade = position.authority_grade;
  const gradeName = localizeName(grade, locale);
  const occupant = position.current_occupant;
  const isActive = asBool(position.is_active);

  const actions: OrgAction[] = [];
  if (onEdit) actions.push({ label: t('actions.edit'), onClick: () => onEdit(position.public_id), icon: <Edit2 /> });
  if (isActive && onDeactivate) actions.push({ label: t('actions.deactivate'), onClick: () => onDeactivate(position.public_id), icon: <UserMinus /> });
  if (!isActive && onReactivate) actions.push({ label: t('actions.reactivate'), onClick: () => onReactivate(position.public_id), icon: <UserPlus /> });
  if (onDelete) actions.push({ label: t('actions.delete'), onClick: () => onDelete(position.public_id), icon: <Trash2 />, destructive: true });

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border-s-2 border-s-primary/20 bg-card px-4 py-3">
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">{title}</span>
          {asBool(position.is_department_head) && (
            <Badge variant="secondary" className="text-xs">{t('positions.head')}</Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{gradeName}</span>
          <span className="text-muted-foreground/50">·</span>
          <span>{t('positions.grade_rank', { rank: grade.rank })}</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {occupant ? (
          <span className="text-sm text-foreground">{locale === 'ar' ? occupant.name_ar : occupant.name_en}</span>
        ) : (
          <VacantBadge />
        )}
        {canManage && actions.length > 0 && <OrgActionMenu actions={actions} />}
      </div>
    </div>
  );
}
