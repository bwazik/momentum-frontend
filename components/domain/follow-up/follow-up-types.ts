import type { components } from '@/lib/generated/api-types';

export type BottleneckResource = components['schemas']['BottleneckResource'];
export type FollowUpActionResource = components['schemas']['FollowUpActionResource'];
export type EscalationResource = components['schemas']['EscalationResource'];
export type EscalationDetailResource = components['schemas']['EscalationDetailResource'];
export type CreateManualEscalationRequest = components['schemas']['CreateManualEscalationRequest'];
export type ResolveEscalationRequest = components['schemas']['ResolveEscalationRequest'];
export type StoreFollowUpActionRequest = components['schemas']['StoreFollowUpActionRequest'];

export interface BottleneckEntity {
  public_id: string;
  name_ar?: string | null;
  name_en?: string | null;
}

export type { BoardTaskResource, TaskBoardUrlFilters, BoardQuery, AssigneeDisplay } from '@/components/domain/tasks/task-board-types';
