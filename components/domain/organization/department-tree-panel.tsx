'use client';

import { useState, useCallback } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { localizeName } from './organization-utils';
import type { components } from '@/lib/generated/api-types';

type DepartmentTreeResource = components['schemas']['DepartmentTreeResource'];

interface DepartmentTreePanelProps {
  tree: DepartmentTreeResource[];
  selectedParent: string | undefined;
  onSelect: (id: string | undefined) => void;
}

interface TreeNodeProps {
  node: DepartmentTreeResource;
  depth: number;
  selectedParent: string | undefined;
  onSelect: (id: string | undefined) => void;
}

function TreeNode({ node, depth, selectedParent, onSelect }: TreeNodeProps) {
  const locale = useLocale();
  const [expanded, setExpanded] = useState(false);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedParent === node.public_id;

  const handleClick = useCallback(() => {
    if (isSelected) {
      onSelect(undefined);
    } else {
      onSelect(node.public_id);
    }
  }, [isSelected, onSelect, node.public_id]);

  return (
    <li>
      <div
        className={cn(
          'flex items-center gap-1 rounded-md px-2 py-1.5 text-sm cursor-pointer transition-colors hover:bg-accent',
          isSelected && 'bg-accent font-medium',
        )}
        style={{ paddingInlineStart: `${depth * 16 + 8}px` }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded((prev) => !prev);
            }}
            className="flex size-5 shrink-0 items-center justify-center rounded-sm hover:bg-muted"
            aria-expanded={expanded}
          >
            {expanded ? (
              <ChevronDown className="size-3.5" />
            ) : (
              <ChevronRight className="size-3.5 rtl:rotate-180" />
            )}
          </button>
        ) : (
          <span className="size-5 shrink-0" />
        )}
        <button
          type="button"
          className="flex-1 truncate text-start"
          onClick={handleClick}
        >
          {localizeName(node, locale)}
        </button>
      </div>
      {hasChildren && expanded && (
        <ul role="group">
          {node.children!.map((child) => (
            <TreeNode
              key={child.public_id}
              node={child}
              depth={depth + 1}
              selectedParent={selectedParent}
              onSelect={onSelect}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export function DepartmentTreePanel({
  tree,
  selectedParent,
  onSelect,
}: DepartmentTreePanelProps) {
  const t = useTranslations('organization');

  if (tree.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border p-4">
      <p className="mb-2 text-sm font-medium text-muted-foreground">
        {t('departments.tree_title')}
      </p>
      <ul role="tree" className="flex flex-col gap-0.5">
        {tree.map((node) => (
          <TreeNode
            key={node.public_id}
            node={node}
            depth={0}
            selectedParent={selectedParent}
            onSelect={onSelect}
          />
        ))}
      </ul>
      {selectedParent && (
        <button
          type="button"
          onClick={() => onSelect(undefined)}
          className="mt-2 text-xs text-muted-foreground underline hover:text-foreground"
        >
          {t('departments.clear_filter')}
        </button>
      )}
    </div>
  );
}
