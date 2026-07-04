'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ChevronDown, Edit2, Trash2, Power, PowerOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCapability } from '@/lib/api/hooks/use-capabilities';
import { OrgActionMenu, type OrgAction } from './org-action-menu';
import { localizeName, localizeTitle, asBool, groupByTitle } from './organization-utils';
import { VacantBadge } from './vacant-badge';
import { ActiveBadge } from '@/components/shared/active-badge';
import type { components } from '@/lib/generated/api-types';

type DepartmentTreeResource = components['schemas']['DepartmentTreeResource'];
type PositionResource = components['schemas']['PositionResource'];

interface DepartmentNodeProps {
  department: DepartmentTreeResource;
  positions: PositionResource[];
  posByDept: Map<string, PositionResource[]>;
  depth?: number;
  onEditDept?: (publicId: string) => void;
  onDeleteDept?: (publicId: string) => void;
  onDeactivateDept?: (publicId: string) => void;
  onReactivateDept?: (publicId: string) => void;
  onEditPos?: (publicId: string) => void;
  onDeletePos?: (publicId: string) => void;
  onDeactivatePos?: (publicId: string) => void;
  onReactivatePos?: (publicId: string) => void;
}

export function DepartmentNode({
  department,
  positions,
  posByDept,
  depth = 0,
  onEditDept,
  onDeleteDept,
  onDeactivateDept,
  onReactivateDept,
  onEditPos,
  onDeletePos,
  onDeactivatePos,
  onReactivatePos,
}: DepartmentNodeProps) {
  const t = useTranslations('organization');
  const locale = useLocale();
  const canManage = useCapability('organization.manage');
  const [expanded, setExpanded] = useState(depth < 2);

  const name = localizeName(department, locale);
  const isActive = asBool(department.is_active);

  const deptActions: OrgAction[] = [];
  if (onEditDept) deptActions.push({ label: t('actions.edit'), onClick: () => onEditDept(department.public_id), icon: <Edit2 /> });
  if (isActive && onDeactivateDept) deptActions.push({ label: t('actions.deactivate'), onClick: () => onDeactivateDept(department.public_id), icon: <PowerOff /> });
  if (!isActive && onReactivateDept) deptActions.push({ label: t('actions.reactivate'), onClick: () => onReactivateDept(department.public_id), icon: <Power /> });
  if (onDeleteDept) deptActions.push({ label: t('actions.delete'), onClick: () => onDeleteDept(department.public_id), icon: <Trash2 />, destructive: true });

  const filled = positions.filter((p) => p.current_occupant != null).length;
  const total = positions.length;

  return (
    <li>
      <div
        className={cn(
          'flex items-center justify-between gap-2 rounded-lg border bg-card px-4 py-3',
          !isActive && 'opacity-60',
        )}
      >
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex min-w-0 flex-1 items-center gap-2 text-start"
          aria-expanded={expanded}
        >
          <ChevronDown
            className={cn(
              'size-4 shrink-0 text-muted-foreground transition-transform',
              expanded ? 'rotate-0' : '-rotate-90 rtl:rotate-90',
            )}
          />
          <span className="truncate text-sm font-semibold">{name}</span>
          <ActiveBadge isActive={isActive} activeLabel={t('status.active')} inactiveLabel={t('status.inactive')} />
          <span className="ms-auto text-xs text-muted-foreground">
            {t('overview.position_count', { filled, total })}
          </span>
        </button>
        {canManage && deptActions.length > 0 && <OrgActionMenu actions={deptActions} />}
      </div>
      {expanded && (
        <ul className="ms-4 mt-1 flex flex-col gap-1 border-s border-muted ps-3" role="group">
          {department.children?.map((child) => (
            <DepartmentNode
              key={child.public_id}
              department={child}
              positions={posByDept.get(child.public_id) ?? []}
              posByDept={posByDept}
              depth={depth + 1}
              onEditDept={onEditDept}
              onDeleteDept={onDeleteDept}
              onDeactivateDept={onDeactivateDept}
              onReactivateDept={onReactivateDept}
              onEditPos={onEditPos}
              onDeletePos={onDeletePos}
              onDeactivatePos={onDeactivatePos}
              onReactivatePos={onReactivatePos}
            />
          ))}
          {Array.from(groupByTitle(positions).entries()).map(([titleKey, slots]) => {
            const filled = slots.filter((s) => s.current_occupant != null).length;
            const total = slots.length;
            const first = slots[0];
            const gradeName = first.authority_grade ? localizeName(first.authority_grade, locale) : null;
            const isHead = asBool(first.is_department_head);
            return (
              <li key={titleKey}>
                <div className="flex items-center justify-between gap-2 rounded-md border-s-2 border-s-primary/20 bg-card px-3 py-2">
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium">
                        {localizeTitle(first, locale)}
                      </span>
                      {total > 1 && (
                        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                          ×{total}
                        </span>
                      )}
                      {isHead && (
                        <span className="shrink-0 rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-secondary-foreground">
                          {t('positions.head')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {gradeName && <span>{gradeName}</span>}
                      {gradeName && <span>·</span>}
                      <span>{t('overview.position_count', { filled, total })}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {filled === total ? (
                      <span className="text-xs text-muted-foreground">
                        {slots.find((s) => s.current_occupant)
                          ? localizeName(slots.find((s) => s.current_occupant)!.current_occupant!, locale)
                          : null}
                      </span>
                    ) : (
                      <VacantBadge count={total - filled} />
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </li>
  );
}
