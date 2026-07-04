'use client';

import { useState, useMemo, useCallback } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { localizeName, asBool, groupPositionsByDept } from './organization-utils';
import type { components } from '@/lib/generated/api-types';

type DepartmentTreeResource = components['schemas']['DepartmentTreeResource'];
type PositionResource = components['schemas']['PositionResource'];

interface VisualOrgChartProps {
  tree: DepartmentTreeResource[];
  positions: PositionResource[];
  selectedDeptId?: string | null;
  onSelectDept?: (publicId: string) => void;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.charAt(0))
    .join('')
    .toUpperCase();
}

const TIER_GRADIENTS = [
  'from-emerald-500 to-teal-600',
  'from-blue-500 to-blue-600',
  'from-purple-400 to-purple-600',
  'from-amber-400 to-orange-500',
  'from-rose-400 to-pink-500',
] as const;

const TIER_SIZES = ['size-16 text-xl', 'size-14 text-lg', 'size-12 text-sm', 'size-10 text-xs', 'size-10 text-xs'] as const;

function OrgChartCard({
  department,
  positions,
  depth,
  isSelected,
  onSelect,
}: {
  department: DepartmentTreeResource;
  positions: PositionResource[];
  depth: number;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const t = useTranslations('organization');
  const locale = useLocale();
  const name = localizeName(department, locale);
  const gradient = TIER_GRADIENTS[Math.min(depth, TIER_GRADIENTS.length - 1)];
  const size = TIER_SIZES[Math.min(depth, TIER_SIZES.length - 1)];
  const isActive = asBool(department.is_active);
  const filled = positions.filter((p) => p.current_occupant != null).length;
  const total = positions.length;
  const head = positions.find((p) => asBool(p.is_department_head));

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex cursor-pointer flex-col items-center gap-2 rounded-xl border bg-card p-4 text-center transition-all duration-200 hover:shadow-md motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        isSelected && 'border-primary shadow-md ring-1 ring-primary',
        !isActive && 'opacity-60',
      )}
    >
      <div
        className={cn(
          'flex items-center justify-center rounded-xl bg-gradient-to-br shadow',
          gradient,
          size,
        )}
      >
        <span className="font-bold text-white">{initials(name)}</span>
      </div>
      <p className="text-sm font-semibold text-foreground">{name}</p>
      {!isActive && (
        <Badge variant="outline" className="text-xs">{t('status.inactive')}</Badge>
      )}
      {head?.current_occupant ? (
        <div className="flex flex-col gap-0.5">
          {head.authority_grade && (
            <p className="text-[10px] text-muted-foreground">
              {localizeName(head.authority_grade, locale)}
            </p>
          )}
          <p className="text-xs font-medium text-foreground">
            {localizeName(head.current_occupant, locale)}
          </p>
        </div>
      ) : null}
      <p className="text-[10px] text-muted-foreground">
        {t('overview.position_count', { filled, total })}
      </p>
    </button>
  );
}

function ConnectorVertical() {
  return <div className="mx-auto h-6 w-0.5 bg-muted-foreground/30" />;
}

function TreeBranch({
  nodes,
  posByDept,
  depth,
  selectedDeptId,
  onSelectDept,
}: {
  nodes: DepartmentTreeResource[];
  posByDept: Map<string, PositionResource[]>;
  depth: number;
  selectedDeptId?: string | null;
  onSelectDept?: (publicId: string) => void;
}) {
  if (nodes.length === 0) return null;

  return (
    <div className="flex justify-center gap-12">
      {nodes.map((node) => {
        const childrenCount = node.children?.length ?? 0;
        const hasChildren = childrenCount > 0;
        const hasMultipleChildren = childrenCount > 1;

        return (
          <div key={node.public_id} className="flex flex-col items-center">
            <OrgChartCard
              department={node}
              positions={posByDept.get(node.public_id) ?? []}
              depth={depth}
              isSelected={selectedDeptId === node.public_id}
              onSelect={() => onSelectDept?.(node.public_id)}
            />

            {hasChildren && (
              <>
                <ConnectorVertical />

                <div className="relative flex items-start gap-12">
                  {hasMultipleChildren && (
                    <div className="absolute start-0 end-0 top-0 h-0.5 bg-muted-foreground/30" />
                  )}

                  {hasMultipleChildren
                    ? node.children!.map((child) => (
                        <div key={child.public_id} className="flex flex-col items-center">
                          <div className="w-0.5 h-3 bg-muted-foreground/30 mx-auto" />
                          <TreeBranch
                            nodes={[child]}
                            posByDept={posByDept}
                            depth={depth + 1}
                            selectedDeptId={selectedDeptId}
                            onSelectDept={onSelectDept}
                          />
                        </div>
                      ))
                    : (
                        <TreeBranch
                          nodes={node.children!}
                          posByDept={posByDept}
                          depth={depth + 1}
                          selectedDeptId={selectedDeptId}
                          onSelectDept={onSelectDept}
                        />
                      )}
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function VisualOrgChart({ tree, positions, selectedDeptId, onSelectDept }: VisualOrgChartProps) {
  const posByDept = useMemo(() => groupPositionsByDept(positions), [positions]);
  const [zoom, setZoom] = useState(1);
  const zoomLevels = useMemo(() => [0.5, 0.75, 1, 1.25, 1.5], []);

  const zoomIn = useCallback(() => {
    setZoom((prev) => {
      const idx = zoomLevels.indexOf(prev);
      return idx < zoomLevels.length - 1 ? zoomLevels[idx + 1] : prev;
    });
  }, [zoomLevels]);

  const zoomOut = useCallback(() => {
    setZoom((prev) => {
      const idx = zoomLevels.indexOf(prev);
      return idx > 0 ? zoomLevels[idx - 1] : prev;
    });
  }, [zoomLevels]);

  if (!tree || tree.length === 0) return null;

  return (
    <div className="w-full max-w-full">
      <div className="mb-2 flex items-center gap-1">
        <Button variant="outline" size="sm" onClick={zoomOut} disabled={zoom === zoomLevels[0]} className="size-7" aria-label="Zoom out">
          <ZoomOut className="size-3.5" />
        </Button>
        <span className="w-10 text-center text-xs tabular-nums text-muted-foreground">{Math.round(zoom * 100)}%</span>
        <Button variant="outline" size="sm" onClick={zoomIn} disabled={zoom === zoomLevels[zoomLevels.length - 1]} className="size-7" aria-label="Zoom in">
          <ZoomIn className="size-3.5" />
        </Button>
      </div>
      <div className="w-full max-w-full overflow-auto pb-6">
        <div className="mx-auto w-fit origin-top transition-transform duration-200" style={{ transform: `scale(${zoom})` }}>
          <TreeBranch
            nodes={tree}
            posByDept={posByDept}
            depth={0}
            selectedDeptId={selectedDeptId}
            onSelectDept={onSelectDept}
          />
        </div>
      </div>
    </div>
  );
}
