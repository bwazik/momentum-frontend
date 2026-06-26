import type { BottleneckResource, BottleneckEntity } from './follow-up-types';

export function getBottleneckEntities(item: BottleneckResource): {
  stageType: BottleneckEntity | null;
  department: BottleneckEntity | null;
} {
  const narrow = (raw: unknown): BottleneckEntity | null => {
    if (!raw || typeof raw !== 'object') return null;
    const v = raw as Record<string, unknown>;
    if (typeof v.public_id !== 'string') return null;
    return {
      public_id: v.public_id,
      name_ar: typeof v.name_ar === 'string' ? v.name_ar : null,
      name_en: typeof v.name_en === 'string' ? v.name_en : null,
    };
  };
  return {
    stageType: narrow(item.stage_type as unknown),
    department: narrow(item.department as unknown),
  };
}

export const ESCALATION_TYPE_MAP: Record<string, string> = {
  auto_sla_breach: 'auto',
  manual: 'manual',
};

const FOLLOW_UP_ACTION_TYPE_MAP: Record<string, string> = {
  phonecall: 'phone',
  message: 'message',
  meeting: 'meeting',
  email: 'email',
  other: 'other',
};

export function actionTypeKey(actionType: string | number | null | undefined): string {
  if (typeof actionType === 'string' && FOLLOW_UP_ACTION_TYPE_MAP[actionType]) {
    return FOLLOW_UP_ACTION_TYPE_MAP[actionType];
  }
  const n = typeof actionType === 'number' ? actionType : parseInt(String(actionType ?? ''), 10);
  if (n >= 1 && n <= 5) return ['phone', 'message', 'meeting', 'email', 'other'][n - 1];
  return 'other';
}

export {
  readBoardFilters,
  toBoardQuery,
  getCurrentAssignees,
  localizeName,
  formatTimeInStage,
  formatDueDate,
  getSlaSortValue,
} from '@/components/domain/tasks/task-board-utils';
