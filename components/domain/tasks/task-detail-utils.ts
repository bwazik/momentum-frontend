import type {
  TaskStageInstanceResource,
  TaskStageAssignmentResource,
  SlaTimerInstanceResource,
  BlueprintTransitionResource,
} from './task-detail-types';

export { localizeName } from '@/lib/utils/localize';

export function getActiveStage(
  stages: TaskStageInstanceResource[] | undefined,
): TaskStageInstanceResource | undefined {
  if (!stages) return undefined;
  return stages.find((s) => s.status === 'active');
}

export function getStageAssignees(
  assignments: TaskStageAssignmentResource[] | undefined,
): TaskStageAssignmentResource[] {
  if (!assignments) return [];
  const seen = new Set<string | undefined>();
  return assignments.filter((a) => {
    if (a.reassigned_at) return false;
    if (seen.has(a.user_id)) return false;
    seen.add(a.user_id);
    return true;
  });
}

export function isUserAssignee(
  assignments: TaskStageAssignmentResource[] | undefined,
  userPublicId: string | undefined,
): boolean {
  if (!userPublicId || !assignments) return false;
  return assignments.some(
    (a) => a.user_id === userPublicId && !a.is_completed,
  );
}

export function getStageTimer(
  timers: SlaTimerInstanceResource[] | undefined,
  stage: { instance_id?: string } | undefined,
): SlaTimerInstanceResource | undefined {
  if (!timers || !stage?.instance_id) return undefined;
  return timers.find(
    (t) =>
      t.stage_instance_id === stage.instance_id && !t.sub_stage_instance_id,
  );
}

export function filterReturnTargets(
  transitions: BlueprintTransitionResource[] | undefined,
  currentStageBlueprintId: string | undefined,
): BlueprintTransitionResource[] {
  if (!transitions || !currentStageBlueprintId) return [];
  return transitions.filter(
    (t) => t.transition_type === 'return' && t.from_stage_id === currentStageBlueprintId,
  );
}

const SLA_HEALTH_MAP: Record<string, string> = {
  on_track: 'green',
  warning: 'amber',
  breached: 'red',
  none: 'none',
};

export function mapSlaHealth(overallHealth: string): string {
  return SLA_HEALTH_MAP[overallHealth] ?? 'green';
}

export interface TimeFmt {
  unitDay(n: number): string;
  unitHour(n: number): string;
  unitMinute(n: number): string;
  lessThan1h: string;
  justNow: string;
  agoLabel: string;
  agoIsPrefix: boolean;
  overduePrefix: string;
  atRisk: string;
  remaining: string;
  dueToday: string;
  paused: string;
  completed: string;
}

function fmtUnit(t: (key: string) => string, n: number, one: string, two: string, many: string): string {
  if (n === 1) return t(one);
  if (n === 2) { const v = t(two); if (v && v !== two) return v; }
  return t(many);
}

export function timeFmtFromT(t: (key: string) => string): TimeFmt {
  const suffix = t('time_ago_suffix');
  const prefix = t('time_ago_prefix');
  return {
    unitDay: (n) => fmtUnit(t, n, 'time_day_one', 'time_day_two', 'time_day_many'),
    unitHour: (n) => fmtUnit(t, n, 'time_hour_one', 'time_hour_two', 'time_hour_many'),
    unitMinute: (n) => fmtUnit(t, n, 'time_minute_one', 'time_minute_two', 'time_minute_many'),
    lessThan1h: t('time_less_than_1h'),
    justNow: t('time_just_now'),
    agoLabel: suffix || prefix || '',
    agoIsPrefix: !suffix && !!prefix,
    overduePrefix: t('time_overdue_prefix'),
    atRisk: t('time_at_risk'),
    remaining: t('time_remaining'),
    dueToday: t('time_due_today'),
    paused: t('time_paused'),
    completed: t('time_completed'),
  };
}

function unit(n: number, day: string, days: string, two?: string): string {
  return n === 1 ? day : n === 2 && two ? two : days;
}

function fmtDurationVerbose(fmt: TimeFmt, days: number, hours: number): string {
  if (days > 0 && hours > 0) return `${days} ${fmt.unitDay(days)}, ${hours} ${fmt.unitHour(hours)}`;
  if (days > 0) return `${days} ${fmt.unitDay(days)}`;
  if (hours > 0) return `${hours} ${fmt.unitHour(hours)}`;
  return fmt.lessThan1h;
}

export function formatSlaInline(timer: SlaTimerInstanceResource | undefined, fmt: TimeFmt): string | null {
  if (!timer) return null;
  const deadline = new Date(timer.deadline_at);
  const now = new Date();
  const diffMs = deadline.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / 86400000);
  const abs = Math.abs(diffDays);

  if (timer.status === 'paused') return fmt.paused;
  if (timer.status === 'completed') return fmt.completed;
  if (timer.status === 'breached' || diffDays < 0) return `${fmt.overduePrefix}${abs} ${fmt.unitDay(abs)}`;
  if (timer.status === 'warning') return `${fmt.atRisk} — ${diffDays} ${fmt.unitDay(diffDays)}${fmt.remaining}`;
  if (diffDays === 0) return fmt.dueToday;
  return `${diffDays} ${fmt.unitDay(diffDays)}${fmt.remaining}`;
}

export function formatDuration(enteredAt: string, exitedAt: string | null, fmt: TimeFmt): string {
  const start = new Date(enteredAt).getTime();
  const end = exitedAt ? new Date(exitedAt).getTime() : Date.now();
  const diffSec = Math.round((end - start) / 1000);
  const days = Math.floor(diffSec / 86400);
  const hours = Math.floor((diffSec % 86400) / 3600);
  return fmtDurationVerbose(fmt, days, hours);
}

export function formatDualDate(isoDate: string, locale: string): string {
  const date = new Date(isoDate);
  const gregorian = new Intl.DateTimeFormat(locale, {
    year: 'numeric', month: 'short', day: 'numeric',
  }).format(date);

  const hijri = new Intl.DateTimeFormat(`${locale}-u-ca-islamic`, {
    year: 'numeric', month: 'short', day: 'numeric',
  }).format(date);

  return `${hijri} — ${gregorian}`;
}

export function buildStageActivities(
  stages: { blueprint_stage: { name_ar?: string; name_en?: string }; entered_at: string; status: string }[] | undefined,
): { stage_name_ar: string | null; stage_name_en: string | null; timestamp: string; type: string }[] {
  if (!stages) return [];
  return stages.map((s) => ({
    stage_name_ar: s.blueprint_stage?.name_ar ?? null,
    stage_name_en: s.blueprint_stage?.name_en ?? null,
    timestamp: s.entered_at,
    type: s.status === 'completed' ? 'stage_completed' : 'stage_entered',
  })).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function formatRelativeTime(timestamp: string, fmt: TimeFmt): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffSec = Math.round((now - then) / 1000);
  if (diffSec < 60) return fmt.justNow;
  const mins = Math.floor(diffSec / 60);
  if (mins < 60) return fmt.agoIsPrefix ? `${fmt.agoLabel}${mins} ${fmt.unitMinute(mins)}` : `${mins} ${fmt.unitMinute(mins)}${fmt.agoLabel}`;
  const hours = Math.floor(diffSec / 3600);
  if (hours < 24) return fmt.agoIsPrefix ? `${fmt.agoLabel}${hours} ${fmt.unitHour(hours)}` : `${hours} ${fmt.unitHour(hours)}${fmt.agoLabel}`;
  const days = Math.floor(diffSec / 86400);
  return fmt.agoIsPrefix ? `${fmt.agoLabel}${days} ${fmt.unitDay(days)}` : `${days} ${fmt.unitDay(days)}${fmt.agoLabel}`;
}
