import type { BoardTaskResource, TaskBoardUrlFilters, BoardQuery, AssigneeDisplay } from './task-board-types';

export type { TaskBoardUrlFilters };

const BOARD_STATUS_VALUES = ['active', 'suspended', 'overdue', 'at_risk', 'completed', 'cancelled'] as const;
const BOARD_DATE_FIELD_VALUES = ['created_at', 'due_date', 'completed_at'] as const;
const BOARD_SORT_FIELD_VALUES = ['priority', 'due_date', 'created_at', 'time_at_stage', 'department', 'stage_type'] as const;
const BOARD_SORT_DIRECTION_VALUES = ['asc', 'desc'] as const;

type BoardStatus = typeof BOARD_STATUS_VALUES[number];
type BoardDateField = typeof BOARD_DATE_FIELD_VALUES[number];
type BoardSortField = typeof BOARD_SORT_FIELD_VALUES[number];
type BoardSortDirection = typeof BOARD_SORT_DIRECTION_VALUES[number];

function asStatus(value?: string): BoardStatus | null | undefined {
  if (value && BOARD_STATUS_VALUES.includes(value as BoardStatus)) {
    return value as BoardStatus;
  }
  return undefined;
}

function asDateField(value?: string): BoardDateField | null | undefined {
  if (value && BOARD_DATE_FIELD_VALUES.includes(value as BoardDateField)) {
    return value as BoardDateField;
  }
  return undefined;
}

function asSortField(value?: string): BoardSortField | undefined {
  if (value && BOARD_SORT_FIELD_VALUES.includes(value as BoardSortField)) {
    return value as BoardSortField;
  }
  return undefined;
}

function asSortDirection(value?: string): BoardSortDirection | undefined {
  if (value && BOARD_SORT_DIRECTION_VALUES.includes(value as BoardSortDirection)) {
    return value as BoardSortDirection;
  }
  return undefined;
}

export function readBoardFilters(params: URLSearchParams): TaskBoardUrlFilters {
  const priorityRaw = params.getAll('priorityId');
  return {
    status: params.get('status') ?? undefined,
    scope: (params.get('scope') as TaskBoardUrlFilters['scope']) ?? undefined,
    stageTypeId: params.get('stageTypeId') ?? undefined,
    assigneeId: params.get('assigneeId') ?? undefined,
    departmentId: params.get('departmentId') ?? undefined,
    priorityId: priorityRaw.length > 0 ? priorityRaw : undefined,
    blueprintCategoryId: params.get('blueprintCategoryId') ?? undefined,
    dateFrom: params.get('dateFrom') ?? undefined,
    dateTo: params.get('dateTo') ?? undefined,
    dateField: params.get('dateField') ?? undefined,
    search: params.get('search') ?? undefined,
    sortBy: params.get('sortBy') ?? undefined,
    sortDirection: params.get('sortDirection') ?? undefined,
  };
}

export function toBoardQuery(
  filters: TaskBoardUrlFilters,
  currentUserPublicId?: string,
): BoardQuery {
  const status = filters.status === 'all'
    ? undefined
    : (filters.status ? asStatus(filters.status) : 'active');

  const result: BoardQuery = {
    status,
    stage_type_id: filters.stageTypeId ?? null,
    assignee_id: filters.scope === 'mine'
      ? currentUserPublicId ?? null
      : (filters.assigneeId ?? null),
    department_id: filters.departmentId ?? null,
    'priority_id[]': filters.priorityId?.length ? filters.priorityId : undefined,
    blueprint_category_id: filters.blueprintCategoryId ?? null,
    date_from: filters.dateFrom ?? null,
    date_to: filters.dateTo ?? null,
    date_field: filters.dateField ? asDateField(filters.dateField) : null,
    search: filters.search ?? null,
    sort_by: filters.sortBy ? asSortField(filters.sortBy) : undefined,
    sort_direction: filters.sortDirection ? asSortDirection(filters.sortDirection) : undefined,
    per_page: 15,
    cursor: null,
  };

  return result;
}

export function getCurrentAssignees(task: BoardTaskResource): AssigneeDisplay[] {
  const raw = task.current_assignees as unknown;
  if (!Array.isArray(raw)) return [];

  return raw.flatMap((item): AssigneeDisplay[] => {
    if (!item || typeof item !== 'object') return [];
    const value = item as Record<string, unknown>;
    const publicId = value.public_id;
    if (typeof publicId !== 'string') return [];
    return [{
      public_id: publicId,
      name_ar: typeof value.name_ar === 'string' ? value.name_ar : null,
      name_en: typeof value.name_en === 'string' ? value.name_en : null,
      position_public_id: typeof value.position_public_id === 'string'
        ? value.position_public_id
        : null,
    }];
  });
}

export function localizeName(locale: string, nameAr?: string | null, nameEn?: string | null): string {
  if (locale === 'ar') return nameAr || nameEn || '';
  return nameEn || nameAr || '';
}

function unit(n: number, day: string, days: string): string {
  return n === 1 ? day : days;
}
function unitAr(n: number): string {
  if (n === 1) return 'يوم';
  if (n === 2) return 'يومان';
  return 'أيام';
}

export function formatTimeInStage(seconds: string | number | null | undefined, locale?: string): string {
  if (seconds === null || seconds === undefined) return '-';
  const totalSeconds = typeof seconds === 'string' ? parseInt(seconds, 10) : seconds;
  if (totalSeconds <= 0) return locale === 'ar' ? 'أقل من ساعة' : '< 1 hour';

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const ud = locale === 'ar' ? unitAr : (n: number) => unit(n, 'day', 'days');
  const uh = locale === 'ar' ? (n: number) => n === 1 ? 'ساعة' : n === 2 ? 'ساعتان' : 'ساعات' : (n: number) => unit(n, 'hour', 'hours');

  if (days > 0 && hours > 0) return `${days} ${ud(days)}, ${hours} ${uh(hours)}`;
  if (days > 0) return `${days} ${ud(days)}`;
  if (hours > 0) return `${hours} ${uh(hours)}`;
  return locale === 'ar' ? 'أقل من ساعة' : '< 1 hour';
}

export function formatDueDate(dateStr: string | null | undefined, locale?: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr + 'T00:00:00');
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffMs = date.getTime() - today.getTime();
  const diffDays = Math.round(diffMs / 86400000);
  const abs = Math.abs(diffDays);
  const d = locale === 'ar' ? unitAr(abs) : unit(abs, 'day', 'days');
  const overdue = locale === 'ar' ? 'متأخر' : 'overdue';

  if (diffDays < 0) return `${abs} ${d} ${overdue}`;
  if (diffDays === 0) return locale === 'ar' ? 'اليوم' : 'Today';
  if (diffDays === 1) return locale === 'ar' ? 'غداً' : 'Tomorrow';
  return `${diffDays} ${d}`;
}

export function getSlaSortValue(health?: string | null): number {
  const raw = (health ?? '').toLowerCase();
  if (raw === 'red') return 0;
  if (raw === 'amber') return 1;
  if (raw === 'grey') return 2;
  return 3;
}
