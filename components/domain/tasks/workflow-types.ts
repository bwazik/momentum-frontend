import type { components } from '@/lib/generated/api-types';

export type TaskDetailResource = components['schemas']['TaskDetailResource'];
export type TaskSlaHealthResource = components['schemas']['TaskSlaHealthResource'];
export type TaskStageInstanceResource = components['schemas']['TaskStageInstanceResource'];
export type TaskSubStageInstanceResource = components['schemas']['TaskSubStageInstanceResource'];
export type TaskStageAssignmentResource = components['schemas']['TaskStageAssignmentResource'];
export type SlaTimerInstanceResource = components['schemas']['SlaTimerInstanceResource'];
export type BlueprintTransitionResource = components['schemas']['BlueprintTransitionResource'];
export type BlueprintStageResource = components['schemas']['BlueprintStageResource'];
export type BlueprintSubStageResource = components['schemas']['BlueprintSubStageResource'];

export type WorkflowNodeStatus = 'pending' | 'active' | 'completed' | 'returned' | 'skipped';

export interface WorkflowNodeModel {
  blueprintStage: BlueprintStageResource;
  instance?: TaskStageInstanceResource;
  status: WorkflowNodeStatus;
  sequenceOrder: number;
  isActive: boolean;
  isTerminal: boolean;
  slaTimer?: SlaTimerInstanceResource;
}

export interface WorkflowEdgeModel {
  id: string;
  fromIndex: number;
  toIndex: number;
  type: 'advance' | 'return';
}
