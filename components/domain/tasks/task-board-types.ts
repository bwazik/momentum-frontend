import type { components, operations } from '@/lib/generated/api-types';

export type BoardTaskResource = components['schemas']['BoardTaskResource'];
export type TaskPriorityResource = components['schemas']['TaskPriorityResource'];
export type DepartmentResource = components['schemas']['DepartmentResource'];
export type BlueprintCategoryResource = components['schemas']['BlueprintCategoryResource'];
export type StageTypeResource = components['schemas']['StageTypeResource'];

export type BoardQuery = NonNullable<
  operations['followUpBoard.board']['parameters']['query']
> & { cursor?: string | null };

export interface TaskBoardUrlFilters {
  status?: string;
  scope?: 'mine' | 'all';
  stageTypeId?: string;
  assigneeId?: string;
  departmentId?: string;
  priorityId?: string[];
  blueprintCategoryId?: string;
  dateFrom?: string;
  dateTo?: string;
  dateField?: string;
  search?: string;
  sortBy?: string;
  sortDirection?: string;
  externalReference?: string;
}

export interface AssigneeDisplay {
  public_id: string;
  name_ar?: string | null;
  name_en?: string | null;
  position_public_id?: string | null;
}
