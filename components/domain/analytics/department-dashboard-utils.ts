import type {
  DepartmentDashboardUrlFilters,
  DepartmentPerformance,
  TeamMember,
} from './department-dashboard-types';
import { formatDuration } from './executive-dashboard-utils';

export { formatDuration };

export function readDepartmentDashboardFilters(params: URLSearchParams): DepartmentDashboardUrlFilters {
  return {
    departmentId: params.get('departmentId') ?? undefined,
    dateFrom: params.get('dateFrom') ?? undefined,
    dateTo: params.get('dateTo') ?? undefined,
    priorityId: params.get('priorityId') ?? undefined,
    status: params.get('status') ?? undefined,
    slaHealth: params.get('slaHealth') ?? undefined,
    blueprintCategoryId: params.get('blueprintCategoryId') ?? undefined,
    assigneeId: params.get('assigneeId') ?? undefined,
  };
}

function toNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

function narrowObject(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object') return null;
  return raw as Record<string, unknown>;
}

function stripNulls(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, v]) => v != null),
  );
}

export function buildBaseQuery(filters: DepartmentDashboardUrlFilters): Record<string, unknown> {
  return stripNulls({
    date_from: filters.dateFrom ?? null,
    date_to: filters.dateTo ?? null,
    priority_id: filters.priorityId ?? null,
    status: filters.status ?? null,
    blueprint_category_id: filters.blueprintCategoryId ?? null,
  });
}

export function toDepartmentPerformanceQuery(filters: DepartmentDashboardUrlFilters): Record<string, unknown> {
  return buildBaseQuery(filters);
}

export function toDepartmentTeamQuery(filters: DepartmentDashboardUrlFilters): Record<string, unknown> {
  return buildBaseQuery(filters);
}

export function toDepartmentDrillDownQuery(filters: DepartmentDashboardUrlFilters): Record<string, unknown> {
  return stripNulls({
    ...buildBaseQuery(filters),
    assignee_id: filters.assigneeId ?? null,
    sla_health: filters.slaHealth ?? null,
    per_page: 15,
  });
}

export function narrowDepartmentPerformance(raw: unknown): DepartmentPerformance | null {
  const v = narrowObject(raw);
  if (!v || typeof v.department_public_id !== 'string') return null;
  return {
    departmentPublicId: v.department_public_id,
    activeTasks: toNumber(v.active_tasks),
    overdueTasks: toNumber(v.overdue_tasks),
    atRiskTasks: toNumber(v.at_risk_tasks),
    averageStageDelaySeconds: toNumber(v.average_stage_delay_seconds),
  };
}

export function narrowTeamMember(raw: unknown): TeamMember | null {
  const v = narrowObject(raw);
  if (!v || typeof v.user_public_id !== 'string') return null;
  return {
    userPublicId: v.user_public_id,
    nameAr: typeof v.name_ar === 'string' ? v.name_ar : '',
    nameEn: typeof v.name_en === 'string' ? v.name_en : '',
    activeAssignments: toNumber(v.active_assignments),
    overdueAssignments: toNumber(v.overdue_assignments),
    completedStages: toNumber(v.completed_stages),
  };
}

export function sortTeamMembers(members: TeamMember[], locale: string): TeamMember[] {
  return [...members].sort((a, b) => {
    if (b.overdueAssignments !== a.overdueAssignments) {
      return b.overdueAssignments - a.overdueAssignments;
    }
    if (b.activeAssignments !== a.activeAssignments) {
      return b.activeAssignments - a.activeAssignments;
    }
    const nameA = locale === 'ar' ? a.nameAr : a.nameEn;
    const nameB = locale === 'ar' ? b.nameAr : b.nameEn;
    return nameA.localeCompare(nameB, locale);
  });
}


