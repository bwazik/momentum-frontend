import { narrowAuditEvent } from '@/lib/utils/audit-utils';
import { needsDepartment } from '@/lib/utils/admin-utils';
import { formatAdminScopeType, formatAdminAccountType } from '@/lib/utils/admin-utils';

test('narrowAuditEvent accepts well-formed payload', () => {
  const e = narrowAuditEvent({
    public_id: 'u123', event_type: 'updated', entity_type: 4,
    entity_public_id: 'u-uuid', root_entity_type: null, root_entity_public_id: null,
    user: { public_id: 'u-actor', name_ar: 'محمد', name_en: 'Mohammed' },
    ip_address: '1.1.1.1', user_agent: 'curl', payload: { x: 1 },
    impersonated_by_public_id: null, created_at: '2026-07-19T00:00:00Z', created_at_hijri: null,
  });
  expect(e?.event_type).toBe('updated');
  expect(e?.entity_type).toBe(4);
  expect(e?.payload?.x).toBe(1);
});

test('narrowAuditEvent returns null for invalid input', () => {
  expect(narrowAuditEvent(null)).toBeNull();
  expect(narrowAuditEvent({})).toBeNull();
  expect(narrowAuditEvent('string')).toBeNull();
});

test('needsDepartment returns true only for specific_department (3) and department_tree (4)', () => {
  expect(needsDepartment(3)).toBe(true);
  expect(needsDepartment(4)).toBe(true);
  expect(needsDepartment(1)).toBe(false);
  expect(needsDepartment(2)).toBe(false);
  expect(needsDepartment(5)).toBe(false);
});

test('formatAdminScopeType returns correct Arabic strings', () => {
  expect(formatAdminScopeType('ar', 1)).toBe('على مستوى المستأجر');
  expect(formatAdminScopeType('ar', 3)).toBe('إدارة محددة');
});

test('formatAdminScopeType returns correct English strings', () => {
  expect(formatAdminScopeType('en', 1)).toBe('Tenant-wide');
  expect(formatAdminScopeType('en', 2)).toBe('Own Department');
  expect(formatAdminScopeType('en', 5)).toBe('Own Tasks');
});

test('formatAdminAccountType returns correct values', () => {
  expect(formatAdminAccountType('en', 1)).toBe('Internal User');
  expect(formatAdminAccountType('en', 2)).toBe('Tenant Admin');
  expect(formatAdminAccountType('ar', 3)).toBe('مدقق خارجي');
  expect(formatAdminAccountType('en', 99)).toBe('');
});
