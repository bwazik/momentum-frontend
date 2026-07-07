import type { components } from '@/lib/generated/api-types';

type StoreTaskRequest = components['schemas']['StoreTaskRequest'];
type ApiManualAssignment = NonNullable<StoreTaskRequest['manual_assignments']>[number];

export function toApiManual(map: Record<string, string[]>): ApiManualAssignment[] {
  return Object.entries(map)
    .filter(([, ids]) => ids.length > 0)
    .map(([key, user_ids]) =>
      key.startsWith('sub:')
        ? { blueprint_sub_stage_id: key.slice(4), user_ids }
        : { blueprint_stage_id: key, user_ids },
    );
}
