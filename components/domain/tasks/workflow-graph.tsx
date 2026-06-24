'use client';

import { Fragment, useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowLeftRight } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { WorkflowNode } from './workflow-node';
import { WorkflowAdvanceArrow, WorkflowTerminalNode, WorkflowReturnEdges } from './workflow-edge';
import type { WorkflowNodeModel, WorkflowEdgeModel } from './workflow-types';

interface WorkflowGraphProps {
  nodes: WorkflowNodeModel[];
  edges: WorkflowEdgeModel[];
  taskPublicId: string;
  isTaskCompleted: boolean;
}

export function WorkflowGraph({ nodes, edges, taskPublicId, isTaskCompleted }: WorkflowGraphProps) {
  const locale = useLocale();
  const t = useTranslations('tasks.workflow');
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  useEffect(() => {
    const el = containerRef.current?.querySelector('[data-active-stage]');
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [nodes]);

  return (
    <section className="relative rounded-xl border bg-card p-6" aria-label={t('diagram_title')}>
      <div className="mb-4">
        <h2 className="text-sm font-semibold">{t('diagram_title')}</h2>
      </div>

      <ScrollArea className="relative w-full" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
        <div ref={containerRef} className="min-w-max">
          <div className="relative flex flex-col gap-6 md:flex-row md:items-start">
            {nodes.map((node, index) => {
              const hasReturnToHere = edges.some((e) => e.toIndex === index);
              return (
                <Fragment key={node.blueprintStage.public_id}>
                  <div className="flex flex-col items-center gap-4 md:flex-row md:items-start" {...(node.isActive ? { 'data-active-stage': '' } : {})}>
                    <WorkflowNode
                      node={node}
                      taskPublicId={taskPublicId}
                      isSelected={selectedNodeId === node.blueprintStage.public_id}
                      onSelect={setSelectedNodeId}
                    />
                    {index < nodes.length - 1 && (
                      hasReturnToHere ? (
                        <div className="flex shrink-0 items-center justify-center text-amber-600" aria-hidden="true">
                          <ArrowLeftRight className="size-5" />
                        </div>
                      ) : (
                        <WorkflowAdvanceArrow />
                      )
                    )}
                  </div>
                  {index === nodes.length - 1 && <WorkflowAdvanceArrow />}
                </Fragment>
              );
            })}

            <WorkflowTerminalNode completed={isTaskCompleted} />

            <WorkflowReturnEdges edges={edges} containerRef={containerRef} />
          </div>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </section>
  );
}
