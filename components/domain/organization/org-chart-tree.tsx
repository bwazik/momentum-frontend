'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import type { components } from '@/lib/generated/api-types';
import { DepartmentNode } from './department-node';
import { groupPositionsByDept } from './organization-utils';

type DepartmentTreeResource = components['schemas']['DepartmentTreeResource'];
type PositionResource = components['schemas']['PositionResource'];

interface OrgChartTreeProps {
  tree: DepartmentTreeResource[];
  positions: PositionResource[];
  onEditDept?: (publicId: string) => void;
  onDeleteDept?: (publicId: string) => void;
  onDeactivateDept?: (publicId: string) => void;
  onReactivateDept?: (publicId: string) => void;
  onEditPos?: (publicId: string) => void;
  onDeletePos?: (publicId: string) => void;
  onDeactivatePos?: (publicId: string) => void;
  onReactivatePos?: (publicId: string) => void;
}

export function OrgChartTree({
  tree,
  positions,
  onEditDept,
  onDeleteDept,
  onDeactivateDept,
  onReactivateDept,
  onEditPos,
  onDeletePos,
  onDeactivatePos,
  onReactivatePos,
}: OrgChartTreeProps) {
  const t = useTranslations('organization');
  const posByDept = useMemo(() => groupPositionsByDept(positions), [positions]);

  return (
    <nav aria-label={t('overview.org_chart')}>
      <ul className="flex flex-col gap-2" role="tree">
        {tree.map((dept) => (
          <DepartmentNode
            key={dept.public_id}
            department={dept}
            positions={posByDept.get(dept.public_id) ?? []}
            posByDept={posByDept}
            depth={0}
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
      </ul>
    </nav>
  );
}
