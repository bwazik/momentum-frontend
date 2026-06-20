'use client';

import { SubStageItem } from './sub-stage-item';
import type { TaskSubStageInstanceResource } from './task-detail-types';

interface SubStageListProps {
  subStages: TaskSubStageInstanceResource[];
  taskPublicId: string;
}

export function SubStageList({
  subStages,
  taskPublicId,
}: SubStageListProps) {
  if (!subStages || subStages.length === 0) return null;

  return (
    <div className="mt-2 space-y-1 border-s-2 border-border ps-3">
      {subStages.map((subStage, i) => (
        <SubStageItem
          key={`${subStage.blueprint_sub_stage?.public_id ?? i}-${i}`}
          subStage={subStage}
          taskPublicId={taskPublicId}
        />
      ))}
    </div>
  );
}
