import type {
  ExecutiveDashboardUrlFilters,
  ExecutiveSummary,
  DepartmentHealthItem,
  DepartmentHealthKey,
  BottleneckItem,
  DrillDownTaskItem,
  SlaHealthKey,
  DrillDownTaskPriority,
} from './executive-dashboard-types';

export function readExecutiveFilters(params: URLSearchParams): ExecutiveDashboardUrlFilters {
  return {
    dateFrom: params.get('dateFrom') ?? undefined,
    dateTo: params.get('dateTo') ?? undefined,
    priorityId: params.get('priorityId') ?? undefined,
    departmentId: params.get('departmentId') ?? undefined,
    blueprintCategoryId: params.get('blueprintCategoryId') ?? undefined,
  };
}

export function toExecutiveSummaryQuery(filters: ExecutiveDashboardUrlFilters): Record<string, unknown> {
  return {
    date_from: filters.dateFrom ?? null,
    date_to: filters.dateTo ?? null,
    priority_id: filters.priorityId ?? null,
    department_id: filters.departmentId ?? null,
    blueprint_category_id: filters.blueprintCategoryId ?? null,
  };
}

export function toExecutiveBottlenecksQuery(filters: ExecutiveDashboardUrlFilters): Record<string, unknown> {
  return {
    department_id: filters.departmentId ?? null,
    limit: 10,
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

function toString(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
}

function narrowObject(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object') return null;
  return raw as Record<string, unknown>;
}

export function narrowExecutiveSummary(raw: unknown): ExecutiveSummary | null {
  const v = narrowObject(raw);
  if (!v) return null;
  return {
    active: toNumber(v.active),
    overdue: toNumber(v.overdue),
    atRisk: toNumber(v.at_risk),
    suspended: toNumber(v.suspended),
    completed: toNumber(v.completed),
    cancelled: toNumber(v.cancelled),
    completionRate: toNumber(v.completion_rate),
  };
}

const VALID_HEALTH: string[] = ['green', 'amber', 'red'];

function narrowHealthKey(raw: unknown): DepartmentHealthKey {
  const s = toString(raw).toLowerCase();
  return VALID_HEALTH.includes(s) ? (s as DepartmentHealthKey) : 'green';
}

export function narrowDepartmentHealthItem(raw: unknown): DepartmentHealthItem | null {
  const v = narrowObject(raw);
  if (!v || typeof v.department_public_id !== 'string') return null;
  return {
    departmentPublicId: v.department_public_id,
    departmentNameAr: typeof v.department_name_ar === 'string' ? v.department_name_ar : '',
    departmentNameEn: typeof v.department_name_en === 'string' ? v.department_name_en : '',
    health: narrowHealthKey(v.health),
    healthLabel: toString(v.health_label),
    activeTasks: toNumber(v.active_tasks),
    overdueTasks: toNumber(v.overdue_tasks),
    atRiskTasks: toNumber(v.at_risk_tasks),
  };
}

export function narrowBottleneckItem(raw: unknown): BottleneckItem | null {
  const v = narrowObject(raw);
  if (!v) return null;
  const stageType = narrowObject(v.stage_type);
  const department = narrowObject(v.department);
  return {
    stageTypePublicId: stageType ? toString(stageType.public_id) : '',
    stageTypeNameAr: stageType ? toString(stageType.name_ar) : '',
    stageTypeNameEn: stageType ? toString(stageType.name_en) : '',
    departmentPublicId: department ? toString(department.public_id) : '',
    departmentNameAr: department ? toString(department.name_ar) : '',
    departmentNameEn: department ? toString(department.name_en) : '',
    overdueCount: toNumber(v.overdue_count),
    atRiskCount: toNumber(v.at_risk_count),
    score: toNumber(v.score),
    averageTimeAtStageSeconds: toNumber(v.average_time_at_stage_seconds),
  };
}

const VALID_SLA_HEALTH: string[] = ['green', 'amber', 'red', 'grey', 'none'];

function narrowSlaHealth(raw: unknown): SlaHealthKey {
  const s = toString(raw).toLowerCase();
  return VALID_SLA_HEALTH.includes(s) ? (s as SlaHealthKey) : 'none';
}

function narrowPriority(raw: unknown): DrillDownTaskPriority {
  const v = narrowObject(raw);
  if (!v) return null;
  return {
    public_id: toString(v.public_id),
    name_ar: toString(v.name_ar),
    name_en: toString(v.name_en),
    severity_rank: toString(v.severity_rank),
    color_code: toString(v.color_code),
  };
}

export function narrowDrillDownTaskItem(raw: unknown): DrillDownTaskItem | null {
  const v = narrowObject(raw);
  if (!v || typeof v.task_public_id !== 'string') return null;
  return {
    taskPublicId: v.task_public_id,
    displayId: toString(v.display_id),
    titleAr: toString(v.title_ar),
    titleEn: toString(v.title_en),
    status: toString(v.status),
    priority: narrowPriority(v.priority),
    currentStageNameAr: toString(v.current_stage_name_ar),
    currentStageNameEn: toString(v.current_stage_name_en),
    owningDepartmentPublicId: toString(v.owning_department_public_id),
    slaHealth: narrowSlaHealth(v.sla_health),
    createdAt: toString(v.created_at),
  };
}

export function formatDuration(seconds: number, locale: string): string {
  if (seconds <= 0) return locale === 'ar' ? 'أقل من ساعة' : '< 1 hour';

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  const plural = (n: number, arOne: string, arTwo: string, arMany: string, enOne: string, enMany: string) => {
    if (locale !== 'ar') return `${n} ${n === 1 ? enOne : enMany}`;
    if (n === 1) return `${n} ${arOne}`;
    if (n === 2) return `${n} ${arTwo}`;
    return `${n} ${arMany}`;
  };

  if (days > 0 && hours > 0) return `${plural(days, 'يوم', 'يومان', 'أيام', 'day', 'days')} ${plural(hours, 'ساعة', 'ساعتان', 'ساعات', 'hr', 'hrs')}`;
  if (days > 0) return plural(days, 'يوم', 'يومان', 'أيام', 'day', 'days');
  if (hours > 0) return plural(hours, 'ساعة', 'ساعتان', 'ساعات', 'hr', 'hrs');
  return plural(minutes, 'دقيقة', 'دقيقتان', 'دقائق', 'min', 'mins');
}

const HEALTH_ORDER: Record<DepartmentHealthKey, number> = { red: 0, amber: 1, green: 2 };

export function sortDepartmentHealth(items: DepartmentHealthItem[], locale: string): DepartmentHealthItem[] {
  return [...items].sort((a, b) => {
    const orderDiff = HEALTH_ORDER[a.health] - HEALTH_ORDER[b.health];
    if (orderDiff !== 0) return orderDiff;
    const nameA = locale === 'ar' ? a.departmentNameAr : a.departmentNameEn;
    const nameB = locale === 'ar' ? b.departmentNameAr : b.departmentNameEn;
    return nameA.localeCompare(nameB, locale);
  });
}
