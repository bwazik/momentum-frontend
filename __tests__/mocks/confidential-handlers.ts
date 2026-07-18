import { http, HttpResponse } from 'msw';

const META_URL = 'https://api.momentum.test/v1';
const TASK_PUBLIC_ID = '01912345-6789-7abc-def0-123456789abc';
const USER_PUBLIC_ID = 'user-abc-456';

const mockMetadata = {
  public_id: TASK_PUBLIC_ID,
  classification_level: '3',
  title: 'Confidential Task - HR Investigation',
  owning_department: 'Human Resources',
  current_responsible_position: 'HR Director',
  status: 'active',
  due_date: '2026-08-01',
  sla_health: null,
  metadata_only: true,
};

const mockParticipants = [
  {
    user: { public_id: USER_PUBLIC_ID, name_ar: 'أحمد المدير', name_en: 'Ahmed Manager' },
    added_by: { public_id: 'admin-1', name_ar: 'المشرف', name_en: 'Supervisor' },
    added_at: '2026-07-16T10:00:00Z',
    removed_at: null,
  },
  {
    user: { public_id: 'user-xyz-789', name_ar: 'سارة المحلل', name_en: 'Sara Analyst' },
    added_by: { public_id: 'admin-1', name_ar: 'المشرف', name_en: 'Supervisor' },
    added_at: '2026-07-16T11:00:00Z',
    removed_at: null,
  },
];

const mockGovernanceParticipants = [
  {
    public_id: 'gp-1',
    position: { public_id: 'pos-1', title_ar: 'مدير قسم', title_en: 'Department Manager' },
    scope_type: 'tenant',
    scope_department: null,
    blueprint_category: null,
    applies_to_classification_level: '3',
    created_by: { public_id: 'admin-1', name_ar: 'المشرف', name_en: 'Supervisor' },
    created_at: '2026-07-15T08:00:00Z',
    revoked_at: null,
  },
  {
    public_id: 'gp-2',
    position: { public_id: 'pos-2', title_ar: 'رئيس لجنة', title_en: 'Committee Head' },
    scope_type: 'specific_department',
    scope_department: { public_id: 'dept-1', name_ar: 'الموارد البشرية', name_en: 'Human Resources' },
    blueprint_category: null,
    applies_to_classification_level: '3',
    created_by: { public_id: 'admin-1', name_ar: 'المشرف', name_en: 'Supervisor' },
    created_at: '2026-07-14T09:00:00Z',
    revoked_at: null,
  },
];

export const confidentialHandlers = [
  http.get(`${META_URL}/v1/tasks/${TASK_PUBLIC_ID}/metadata`, () => {
    return HttpResponse.json(mockMetadata);
  }),

  http.get(`${META_URL}/v1/tasks/:taskId/confidential-participants`, ({ params }) => {
    if (params.taskId === TASK_PUBLIC_ID) {
      return HttpResponse.json({
        data: mockParticipants,
        next_cursor: null,
        has_more: false,
      });
    }
    return HttpResponse.json({ data: [], next_cursor: null, has_more: false });
  }),

  http.post(`${META_URL}/v1/tasks/:taskId/confidential-participants`, async ({ request }) => {
    const body = (await request.json()) as { user_id?: string };
    if (!body.user_id) {
      return HttpResponse.json({ message: 'user_id is required' }, { status: 422 });
    }
    return HttpResponse.json({
      user: { public_id: body.user_id, name_ar: 'مستخدم جديد', name_en: 'New User' },
      added_by: { public_id: 'admin-1', name_ar: 'المشرف', name_en: 'Supervisor' },
      added_at: new Date().toISOString(),
      removed_at: null,
    }, { status: 201 });
  }),

  http.delete(`${META_URL}/v1/tasks/:taskId/confidential-participants/:userId`, () => {
    return new HttpResponse(null, { status: 204 });
  }),

  http.post(`${META_URL}/v1/tasks/:taskId/access-override`, async ({ request }) => {
    const body = (await request.json()) as { reason?: string };
    if (!body.reason || body.reason.length < 10) {
      return HttpResponse.json({ message: 'Reason must be at least 10 characters' }, { status: 422 });
    }
    return HttpResponse.json({
      public_id: TASK_PUBLIC_ID,
      title_ar: 'مهمة سرية',
      title_en: 'Confidential Task',
      status: 'active',
      classification_level: '3',
    });
  }),

  http.get(`${META_URL}/v1/iam/confidential-governance-participants`, ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    let data = mockGovernanceParticipants;
    if (status === 'active') {
      data = mockGovernanceParticipants.filter((p) => !p.revoked_at);
    } else if (status === 'revoked') {
      data = [];
    }
    return HttpResponse.json({ data, next_cursor: null, has_more: false });
  }),

  http.post(`${META_URL}/v1/iam/confidential-governance-participants`, async ({ request }) => {
    const body = (await request.json()) as { position_id?: string };
    if (!body.position_id) {
      return HttpResponse.json({ message: 'position_id is required' }, { status: 422 });
    }
    return HttpResponse.json({
      public_id: 'gp-new',
      position: { public_id: body.position_id, title_ar: 'منصب جديد', title_en: 'New Position' },
      scope_type: 'tenant',
      scope_department: null,
      blueprint_category: null,
      applies_to_classification_level: '3',
      created_by: { public_id: 'admin-1', name_ar: 'المشرف', name_en: 'Supervisor' },
      created_at: new Date().toISOString(),
      revoked_at: null,
    }, { status: 201 });
  }),

  http.put(`${META_URL}/v1/iam/confidential-governance-participants/:participantId`, async ({ request }) => {
    const body = (await request.json()) as { scope_type?: number };
    return HttpResponse.json({
      public_id: 'gp-1',
      position: { public_id: 'pos-1', title_ar: 'مدير قسم', title_en: 'Department Manager' },
      scope_type: body.scope_type === 4 ? 'department_tree' : 'tenant',
      scope_department: null,
      blueprint_category: null,
      applies_to_classification_level: '3',
      created_by: { public_id: 'admin-1', name_ar: 'المشرف', name_en: 'Supervisor' },
      created_at: '2026-07-15T08:00:00Z',
      revoked_at: null,
    });
  }),

  http.post(`${META_URL}/v1/iam/confidential-governance-participants/:participantId/revoke`, () => {
    return HttpResponse.json({
      public_id: 'gp-1',
      position: { public_id: 'pos-1', title_ar: 'مدير قسم', title_en: 'Department Manager' },
      scope_type: 'tenant',
      scope_department: null,
      blueprint_category: null,
      applies_to_classification_level: '3',
      created_by: { public_id: 'admin-1', name_ar: 'المشرف', name_en: 'Supervisor' },
      created_at: '2026-07-15T08:00:00Z',
      revoked_at: new Date().toISOString(),
    });
  }),

  http.get(`${META_URL}/v1/tasks/:taskId`, ({ params }) => {
    if (params.taskId === TASK_PUBLIC_ID) {
      return HttpResponse.json({
        public_id: TASK_PUBLIC_ID,
        title_ar: 'مهمة سرية',
        title_en: 'Confidential Task',
        status: 'active',
        classification_level: '3',
        initiator_id: USER_PUBLIC_ID,
      });
    }
    return new HttpResponse(null, { status: 404 });
  }),
];
