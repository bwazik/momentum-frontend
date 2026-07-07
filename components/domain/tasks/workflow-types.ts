import type {
  TaskDetailResource,
  TaskSlaHealthResource,
  TaskStageInstanceResource,
  TaskSubStageInstanceResource,
  TaskStageAssignmentResource,
  SlaTimerInstanceResource,
  BlueprintTransitionResource,
  BlueprintStageResource,
} from './task-detail-types';
import type { components } from '@/lib/generated/api-types';

export type BlueprintSubStageResource = components['schemas']['BlueprintSubStageResource'];
export {
  TaskDetailResource,
  TaskSlaHealthResource,
  TaskStageInstanceResource,
  TaskSubStageInstanceResource,
  TaskStageAssignmentResource,
  SlaTimerInstanceResource,
  BlueprintTransitionResource,
  BlueprintStageResource,
};

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
