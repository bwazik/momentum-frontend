import { describe, it, expect } from 'vitest';
import { readBoardFilters, toBoardQuery, getCurrentAssignees, localizeName, formatTimeInStage, formatDueDate, getSlaSortValue } from '@/components/domain/tasks/task-board-utils';
import type { BoardTaskResource } from '@/components/domain/tasks/task-board-types';

describe('readBoardFilters', () => {
  it('returns default values for empty params', () => {
    const params = new URLSearchParams();
    const filters = readBoardFilters(params);
    expect(filters.status).toBeUndefined();
    expect(filters.scope).toBeUndefined();
    expect(filters.sortBy).toBeUndefined();
    expect(filters.priorityId).toBeUndefined();
  });

  it('parses status from URL', () => {
    const params = new URLSearchParams('status=overdue');
    expect(readBoardFilters(params).status).toBe('overdue');
  });

  it('parses scope=mine', () => {
    const params = new URLSearchParams('scope=mine');
    expect(readBoardFilters(params).scope).toBe('mine');
  });

  it('parses multiple priorityIds', () => {
    const params = new URLSearchParams('priorityId=a&priorityId=b');
    expect(readBoardFilters(params).priorityId).toEqual(['a', 'b']);
  });

  it('parses search query', () => {
    const params = new URLSearchParams('search=test');
    expect(readBoardFilters(params).search).toBe('test');
  });
});

describe('toBoardQuery', () => {
  it('defaults status to active', () => {
    const result = toBoardQuery({});
    expect(result.status).toBe('active');
  });

  it('clears status when status is all', () => {
    const result = toBoardQuery({ status: 'all' });
    expect(result.status).toBeUndefined();
  });

  it('maps scope=mine to assignee_id with current user', () => {
    const result = toBoardQuery({ scope: 'mine' }, 'user-1');
    expect(result.assignee_id).toBe('user-1');
    expect(result.status).toBe('active');
  });

  it('maps scope=all without assignee_id', () => {
    const result = toBoardQuery({ scope: 'all' });
    expect(result.assignee_id).toBeNull();
  });

  it('maps priorityId to priority_id[]', () => {
    const result = toBoardQuery({ priorityId: ['p1', 'p2'] });
    expect(result['priority_id[]']).toEqual(['p1', 'p2']);
  });

  it('omits empty priorityId', () => {
    const result = toBoardQuery({ priorityId: [] });
    expect(result['priority_id[]']).toBeUndefined();
  });

  it('sets per_page to 15', () => {
    const result = toBoardQuery({});
    expect(result.per_page).toBe(15);
  });

  it('maps camelCase URL params to snake_case API params', () => {
    const result = toBoardQuery({
      stageTypeId: 'st-1',
      departmentId: 'dept-1',
      blueprintCategoryId: 'cat-1',
      search: 'test',
      sortBy: 'due_date',
      sortDirection: 'asc',
    });
    expect(result.stage_type_id).toBe('st-1');
    expect(result.department_id).toBe('dept-1');
    expect(result.blueprint_category_id).toBe('cat-1');
    expect(result.search).toBe('test');
    expect(result.sort_by).toBe('due_date');
    expect(result.sort_direction).toBe('asc');
  });
});

describe('getCurrentAssignees', () => {
  it('returns empty array for string assignees (type mismatch)', () => {
    const task = { current_assignees: 'some string' } as unknown as BoardTaskResource;
    expect(getCurrentAssignees(task)).toEqual([]);
  });

  it('returns empty array for null assignees', () => {
    const task = { current_assignees: null } as unknown as BoardTaskResource;
    expect(getCurrentAssignees(task)).toEqual([]);
  });

  it('parses valid assignee array', () => {
    const task = { current_assignees: [{ public_id: 'u1', name_ar: 'أحمد', name_en: 'Ahmed', position_public_id: 'p1' }] } as unknown as BoardTaskResource;
    const result = getCurrentAssignees(task);
    expect(result).toHaveLength(1);
    expect(result[0].public_id).toBe('u1');
    expect(result[0].name_ar).toBe('أحمد');
    expect(result[0].name_en).toBe('Ahmed');
    expect(result[0].position_public_id).toBe('p1');
  });

  it('filters out items without public_id', () => {
    const task = { current_assignees: [{ name_ar: 'No ID' }, { public_id: 'u2', name_ar: 'Has ID' }] } as unknown as BoardTaskResource;
    const result = getCurrentAssignees(task);
    expect(result).toHaveLength(1);
    expect(result[0].public_id).toBe('u2');
  });

  it('returns empty array for non-array input', () => {
    const task = { current_assignees: 42 } as unknown as BoardTaskResource;
    expect(getCurrentAssignees(task)).toEqual([]);
  });
});

describe('formatTimeInStage', () => {
  it('returns < 1h for zero seconds', () => {
    expect(formatTimeInStage('0')).toBe('< 1h');
  });

  it('returns dash for null', () => {
    expect(formatTimeInStage(null)).toBe('-');
  });

  it('formats hours correctly', () => {
    expect(formatTimeInStage('7200')).toBe('2h');
  });

  it('formats days and hours', () => {
    expect(formatTimeInStage('90000')).toBe('1d 1h');
  });

  it('returns < 1h for less than an hour', () => {
    expect(formatTimeInStage('1800')).toBe('< 1h');
  });

  it('accepts numeric input', () => {
    expect(formatTimeInStage(3600)).toBe('1h');
  });
});

describe('formatDueDate', () => {
  it('returns empty for null', () => {
    expect(formatDueDate(null)).toBe('');
  });

  it('returns today for current date', () => {
    const now = new Date();
    const str = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    expect(formatDueDate(str)).toBe('Today');
  });

  it('returns overdue for past date', () => {
    const past = new Date();
    past.setDate(past.getDate() - 5);
    const str = past.toISOString().slice(0, 10);
    expect(formatDueDate(str)).toContain('overdue');
  });
});

describe('getSlaSortValue', () => {
  it('returns 0 for red', () => {
    expect(getSlaSortValue('red')).toBe(0);
  });

  it('returns 3 for green', () => {
    expect(getSlaSortValue('green')).toBe(3);
  });

  it('handles null', () => {
    expect(getSlaSortValue(null)).toBe(3);
  });

  it('handles capitalised input', () => {
    expect(getSlaSortValue('Red')).toBe(0);
  });
});

describe('localizeName', () => {
  it('returns Arabic name when locale is ar', () => {
    expect(localizeName('ar', 'أحمد', 'Ahmed')).toBe('أحمد');
  });

  it('returns English name when locale is en', () => {
    expect(localizeName('en', 'أحمد', 'Ahmed')).toBe('Ahmed');
  });

  it('falls back to English when Arabic is missing and locale is ar', () => {
    expect(localizeName('ar', null, 'Ahmed')).toBe('Ahmed');
  });

  it('falls back to Arabic when English is missing and locale is en', () => {
    expect(localizeName('en', 'أحمد', null)).toBe('أحمد');
  });

  it('returns empty string when both are null', () => {
    expect(localizeName('ar', null, null)).toBe('');
  });
});
