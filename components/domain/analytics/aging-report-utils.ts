import type { AgingReportItem, AgingReportUrlFilters, AgingReportQuery, AgingPriority } from './aging-report-types';

const AGING_STATUS_MAP: Record<string, number> = {
  active: 2,
  suspended: 3,
};

export function readAgingFilters(params: URLSearchParams): AgingReportUrlFilters {
  return {
    status: (params.get('status') as AgingReportUrlFilters['status']) ?? undefined,
    priorityId: params.get('priorityId') ?? undefined,
    departmentId: params.get('departmentId') ?? undefined,
    blueprintCategoryId: params.get('blueprintCategoryId') ?? undefined,
    dateFrom: params.get('dateFrom') ?? undefined,
    dateTo: params.get('dateTo') ?? undefined,
  };
}

export function toAgingQuery(filters: AgingReportUrlFilters): AgingReportQuery {
  return {
    status: filters.status && filters.status !== 'all'
      ? (AGING_STATUS_MAP[filters.status] as 2 | 3)
      : undefined,
    priority_id: filters.priorityId ?? null,
    department_id: filters.departmentId ?? null,
    blueprint_category_id: filters.blueprintCategoryId ?? null,
    date_from: filters.dateFrom ?? null,
    date_to: filters.dateTo ?? null,
    per_page: 15,
  };
}

function narrowPriority(raw: unknown): AgingPriority | null {
  if (!raw || typeof raw !== 'object') return null;
  const v = raw as Record<string, unknown>;
  if (typeof v.public_id !== 'string') return null;
  return {
    public_id: v.public_id,
    name_ar: typeof v.name_ar === 'string' ? v.name_ar : '',
    name_en: typeof v.name_en === 'string' ? v.name_en : '',
    severity_rank: typeof v.severity_rank === 'string' ? v.severity_rank : '',
    color_code: typeof v.color_code === 'string' ? v.color_code : null,
  };
}

function isAgingAssignee(raw: unknown): raw is { public_id: string; name_ar?: string | null; name_en?: string | null } {
  if (!raw || typeof raw !== 'object') return false;
  const v = raw as Record<string, unknown>;
  return typeof v.public_id === 'string';
}

export function narrowAgingItem(raw: unknown): AgingReportItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const v = raw as Record<string, unknown>;
  if (typeof v.task_public_id !== 'string') return null;

  const assigneesRaw = Array.isArray(v.active_assignees) ? v.active_assignees : [];

  return {
    task_public_id: v.task_public_id,
    title_ar: typeof v.title_ar === 'string' ? v.title_ar : '',
    title_en: typeof v.title_en === 'string' ? v.title_en : '',
    priority: narrowPriority(v.priority),
    current_stage_name_ar: typeof v.current_stage_name_ar === 'string' ? v.current_stage_name_ar : null,
    current_stage_name_en: typeof v.current_stage_name_en === 'string' ? v.current_stage_name_en : null,
    active_assignees: assigneesRaw.filter(isAgingAssignee) as AgingReportItem['active_assignees'],
    sla_health: ['green', 'amber', 'red', 'grey', 'none'].includes(String(v.sla_health))
      ? (String(v.sla_health) as AgingReportItem['sla_health'])
      : 'none',
    created_at: typeof v.created_at === 'string' ? v.created_at : null,
    entered_at: typeof v.entered_at === 'string' ? v.entered_at : null,
  };
}

export function narrowAgingItems(data: unknown[]): AgingReportItem[] {
  return data.map(narrowAgingItem).filter((item): item is AgingReportItem => item !== null);
}

export function formatTimeSince(dateStr: string | null | undefined, locale?: string): string {
  if (!dateStr) return '-';
  const entered = new Date(dateStr);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - entered.getTime()) / 1000);
  if (seconds < 0) return locale === 'ar' ? 'أقل من ساعة' : '< 1 hour';

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);

  const unitEn = (n: number, one: string, many: string) => (n === 1 ? one : many);
  const unitAr = (n: number, one: string, two: string, many: string) => {
    if (n === 1) return one;
    if (n === 2) return two;
    return many;
  };

  const d = locale === 'ar'
    ? (n: number) => unitAr(n, 'يوم', 'يومان', 'أيام')
    : (n: number) => unitEn(n, 'day', 'days');
  const h = locale === 'ar'
    ? (n: number) => unitAr(n, 'ساعة', 'ساعتان', 'ساعات')
    : (n: number) => unitEn(n, 'hour', 'hours');

  if (days > 0 && hours > 0) return `${days} ${d(days)}, ${hours} ${h(hours)}`;
  if (days > 0) return `${days} ${d(days)}`;
  if (hours > 0) return `${hours} ${h(hours)}`;
  return locale === 'ar' ? 'أقل من ساعة' : '< 1 hour';
}

export function formatDate(iso: string | null | undefined, locale?: string): string {
  if (!iso) return '-';
  try {
    return new Intl.DateTimeFormat(locale ?? 'en', {
      year: 'numeric', month: 'short', day: 'numeric',
    }).format(new Date(iso));
  } catch {
    return '-';
  }
}
