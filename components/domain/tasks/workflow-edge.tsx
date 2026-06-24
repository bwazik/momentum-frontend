'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WorkflowEdgeModel } from './workflow-types';

export function WorkflowAdvanceArrow() {
  return (
    <div className="flex shrink-0 flex-col items-center md:flex-row" aria-hidden="true">
      <div className="h-0.5 w-4 bg-muted-foreground/30 hidden md:block" />
      <div className="hidden md:ltr:block size-0 border-y-[5px] border-l-[6px] border-y-transparent border-l-muted-foreground/30" />
      <div className="hidden md:rtl:block size-0 border-y-[5px] border-r-[6px] border-y-transparent border-r-muted-foreground/30" />
      <div className="w-0.5 h-6 bg-muted-foreground/30 md:hidden block" />
      <div className="md:hidden size-0 border-x-[5px] border-t-[6px] border-x-transparent border-t-muted-foreground/30" />
    </div>
  );
}

export function WorkflowTerminalNode({ completed }: { completed: boolean }) {
  const t = useTranslations('tasks.workflow');
  return (
    <div className="flex shrink-0 flex-col items-center gap-2" aria-hidden={!completed}>
    <div
      className={cn(
        'flex size-12 items-center justify-center rounded-full border-2',
        completed ? 'border-emerald-500 bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400' : 'border-slate-200 text-slate-300',
      )}
      aria-label={completed ? t('legend_terminal') : undefined}
    >
        <Check className="size-6" />
      </div>
      <span className="text-xs text-muted-foreground">{t('legend_terminal')}</span>
    </div>
  );
}

export function WorkflowReturnEdges({
  edges,
  containerRef,
}: {
  edges: WorkflowEdgeModel[];
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [rects, setRects] = useState<DOMRect[]>([]);

  useEffect(() => {
    function measure() {
      const container = containerRef.current;
      const svg = svgRef.current;
      if (!container || !svg) return;
      const svgRect = svg.getBoundingClientRect();
      const nodeRects = Array.from(container.querySelectorAll('[data-workflow-node]')).map((el) =>
        el.getBoundingClientRect(),
      );
      setRects(nodeRects.map((r) => new DOMRect(r.left - svgRect.left, r.top - svgRect.top, r.width, r.height)));
    }
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [containerRef, edges]);

  if (edges.length === 0 || rects.length === 0) return null;

  return (
    <svg
      ref={svgRef}
      className="pointer-events-none absolute inset-0 size-full overflow-visible"
      aria-hidden="true"
    >
      <defs>
        <marker id="return-arrowhead" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 L1,3 z" className="fill-amber-500/60" />
        </marker>
      </defs>
      {edges.map((edge) => {
        const from = rects[edge.fromIndex];
        const to = rects[edge.toIndex];
        if (!from || !to) return null;
        const y = from.top + 12;
        const x1 = from.left + from.width / 2;
        const x2 = to.left + to.width / 2;
        return (
          <path
            key={edge.id}
            d={`M ${x1} ${y} C ${x1} ${y - 40}, ${x2} ${y - 40}, ${x2} ${y}`}
            fill="none"
            stroke="currentColor"
            className="text-amber-500/60"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            markerEnd="url(#return-arrowhead)"
          />
        );
      })}
    </svg>
  );
}
