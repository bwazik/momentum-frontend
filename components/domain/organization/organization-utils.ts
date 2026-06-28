import { localizeName as localizeNameBase, localizeTitle as localizeTitleBase } from '@/lib/utils/localize';
import { ApiRequestError } from '@/lib/api/client';
import type { components } from '@/lib/generated/api-types';

type DepartmentTreeResource = components['schemas']['DepartmentTreeResource'];
type PositionResource = components['schemas']['PositionResource'];

export function localizeName(
  n: { name_ar?: string | null; name_en?: string | null },
  locale: string,
): string {
  return localizeNameBase(locale, n.name_ar, n.name_en);
}

export function localizeTitle(
  p: { title_ar?: string | null; title_en?: string | null },
  locale: string,
): string {
  return localizeTitleBase(locale, p.title_ar, p.title_en);
}

export function asBool(v: unknown): boolean {
  return v === true || v === '1' || v === 1 || v === 'true';
}

export const DAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
export const WEEK_START_SAT = [6, 0, 1, 2, 3, 4, 5] as const;

export function workingDaysLabel(csv: string | null | undefined, t: (k: string) => string): string {
  if (!csv) return '';
  return csv
    .split(',')
    .map((idx) => t(`days.short.${DAYS[Number(idx)]}`))
    .join(', ');
}

export function buildParentMap(
  tree: DepartmentTreeResource[],
  locale: string,
): Map<string, string> {
  const m = new Map<string, string>();
  const walk = (nodes: DepartmentTreeResource[]) => {
    for (const n of nodes) {
      m.set(n.public_id, localizeName(n, locale));
      if (n.children) walk(n.children);
    }
  };
  walk(tree);
  return m;
}

export function groupPositionsByDept(positions: PositionResource[]): Map<string, PositionResource[]> {
  const map = new Map<string, PositionResource[]>();
  for (const pos of positions) {
    const deptId = pos.department.public_id;
    const list = map.get(deptId);
    if (list) {
      list.push(pos);
    } else {
      map.set(deptId, [pos]);
    }
  }
  return map;
}

export function extractApiErrors(err: Error): Record<string, string> | null {
  if (err instanceof ApiRequestError && err.error.errors) {
    const fieldErrors: Record<string, string> = {};
    for (const [key, messages] of Object.entries(err.error.errors)) {
      if (Array.isArray(messages) && messages.length > 0) {
        fieldErrors[key] = messages[0];
      }
    }
    return fieldErrors;
  }
  return null;
}

export function flattenTree(nodes: DepartmentTreeResource[], excludeId?: string): DepartmentTreeResource[] {
  const result: DepartmentTreeResource[] = [];
  const walk = (list: DepartmentTreeResource[]) => {
    for (const n of list) {
      if (n.public_id !== excludeId) result.push(n);
      if (n.children) walk(n.children);
    }
  };
  walk(nodes);
  return result;
}

export function groupByTitle(positions: PositionResource[]): Map<string, PositionResource[]> {
  const groups = new Map<string, PositionResource[]>();
  for (const p of positions) {
    const key = p.title_ar;
    const list = groups.get(key);
    if (list) {
      list.push(p);
    } else {
      groups.set(key, [p]);
    }
  }
  return groups;
}

export function formatDualDate(iso: string, locale: string): string {
  const d = new Date(iso);
  const g = new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d);
  const h = new Intl.DateTimeFormat(`${locale}-u-ca-islamic`, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d);
  return `${h} — ${g}`;
}
