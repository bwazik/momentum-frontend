import { http, HttpResponse } from 'msw';
import { organizationHandlers } from './organization-handlers';
import { taskCreateHandlers } from './task-create-handlers';
import { confidentialHandlers } from './confidential-handlers';

const mockDocuments = [
  {
    public_id: 'doc-1',
    original_filename: 'report.pdf',
    mime_type: 'application/pdf',
    mime_category: 'Pdf',
    size_bytes: '1024000',
    version_number: '1',
    description: '',
    uploader: { public_id: 'user-1', name_ar: 'أحمد', name_en: 'Ahmed' },
    download_url: 'https://api.momentum.test/v1/documents/doc-1/download',
    preview_url: 'https://api.momentum.test/v1/documents/doc-1/preview',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
];

export const handlers = [
  ...organizationHandlers,
  ...taskCreateHandlers,
  ...confidentialHandlers,
  http.get('https://api.momentum.test/v1/follow-up/actions', () =>
    HttpResponse.json({ data: [], next_cursor: null, has_more: false }),
  ),
  http.get('https://api.momentum.test/v1/analytics/executive/summary', () => {
    return HttpResponse.json(mockExecutiveSummary);
  }),

  http.get('https://api.momentum.test/v1/analytics/executive/department-health', () => {
    return HttpResponse.json(mockDepartmentHealth);
  }),

  http.get('https://api.momentum.test/v1/analytics/executive/bottlenecks', () => {
    return HttpResponse.json(mockBottlenecks);
  }),

  http.get('https://api.momentum.test/v1/analytics/executive/summary/drill-down/:metric', () => {
    return HttpResponse.json({
      data: mockDrillDownTasks,
      next_cursor: null,
      has_more: false,
    });
  }),

  http.get('https://api.momentum.test/v1/analytics/executive/bottlenecks/:stageType/drill-down', () => {
    return HttpResponse.json({
      data: mockDrillDownTasks,
      next_cursor: null,
      has_more: false,
    });
  }),

  http.get('https://api.momentum.test/v1/analytics/tasks/aging', () => {
    return HttpResponse.json({
      data: mockAgingData,
      next_cursor: null,
      has_more: false,
    });
  }),

  // --- Department Dashboard handlers ---

  http.get('https://api.momentum.test/v1/analytics/departments/:department/performance', () => {
    return HttpResponse.json({
      department_public_id: 'dept-1',
      active_tasks: '5',
      overdue_tasks: '1',
      at_risk_tasks: '0',
      average_stage_delay_seconds: '3600',
    });
  }),

  http.get('https://api.momentum.test/v1/analytics/departments/:department/team', () => {
    return HttpResponse.json([
      {
        user_public_id: 'user-1',
        name_ar: 'أحمد',
        name_en: 'Ahmad',
        active_assignments: '3',
        overdue_assignments: '1',
        completed_stages: '5',
      },
      {
        user_public_id: 'user-2',
        name_ar: 'سارة',
        name_en: 'Sara',
        active_assignments: '2',
        overdue_assignments: '0',
        completed_stages: '8',
      },
    ]);
  }),

  http.get('https://api.momentum.test/v1/analytics/departments/:department/performance/drill-down', () => {
    return HttpResponse.json({
      data: [
        {
          task_public_id: 'task-1',
          display_id: 'T-2026-0001',
          title_ar: 'مهمة اختبارية',
          title_en: 'Test Task',
          status: 'active',
          priority: { public_id: 'p1', name_ar: 'عاجل', name_en: 'Urgent', severity_rank: '1', color_code: '#dc2626' },
          current_stage_name_ar: 'مراجعة',
          current_stage_name_en: 'Review',
          owning_department_public_id: 'dept-1',
          sla_health: 'red',
          created_at: '2026-07-01T00:00:00Z',
          created_at_hijri: null,
          completed_at: '',
          completed_at_hijri: null,
        },
      ],
      next_cursor: null,
      has_more: false,
    });
  }),
  http.get('https://api.momentum.test/v1/follow-up/board', () => {
    return HttpResponse.json({
      data: [
        {
          public_id: '01912345-6789-7abc-def0-123456789abc',
          title_ar: 'مهمة اختبارية',
          title_en: 'Test Task',
          status: 'active',
          priority: {
            public_id: 'prio-1',
            name_ar: 'عالية',
            name_en: 'High',
            severity_rank: 'critical',
          },
          classification_level: 'public',
          current_stage: {
            public_id: 'stage-1',
            name_ar: 'مراجعة',
            name_en: 'Review',
            stage_type: {
              public_id: 'st-1',
              name_ar: 'نوع المراجعة',
              name_en: 'Review Type',
            },
          },
          current_assignees: [
            {
              public_id: 'user-1',
              name_ar: 'أحمد',
              name_en: 'Ahmed',
              position_public_id: 'pos-1',
            },
          ],
          sla_health: 'green',
          time_at_current_stage_seconds: '3600',
          working_day_seconds: '28800',
          department: {
            public_id: 'dept-1',
            name_ar: 'تقنية المعلومات',
            name_en: 'IT',
          },
          blueprint_category: {
            public_id: 'cat-1',
            name_ar: 'تقنية',
            name_en: 'Technical',
          },
          due_date: '2026-07-01',
          created_at: '2026-06-01',
          launched_at: '2026-06-02',
        },
        {
          public_id: '01912345-6789-7abc-def0-123456789abd',
          title_ar: 'مهمة متأخرة',
          title_en: 'Overdue Task',
          status: 'active',
          priority: {
            public_id: 'prio-2',
            name_ar: 'متوسطة',
            name_en: 'Medium',
            severity_rank: 'urgent',
          },
          classification_level: 'internal',
          current_stage: {
            public_id: 'stage-2',
            name_ar: 'اعتماد',
            name_en: 'Approval',
            stage_type: {
              public_id: 'st-2',
              name_ar: 'نوع الاعتماد',
              name_en: 'Approval Type',
            },
          },
          current_assignees: [],
          sla_health: 'red',
          time_at_current_stage_seconds: '7200',
          working_day_seconds: '28800',
          department: {
            public_id: 'dept-2',
            name_ar: 'الموارد البشرية',
            name_en: 'HR',
          },
          blueprint_category: null,
          due_date: '2026-06-15',
          created_at: '2026-05-01',
          launched_at: '2026-05-02',
        },
      ],
      next_cursor: null,
      has_more: false,
    });
  }),

  http.get('https://api.momentum.test/v1/tasks/priorities', () => {
    return HttpResponse.json([
      {
        public_id: 'prio-1',
        name_ar: 'عالية',
        name_en: 'High',
        severity_rank: 'critical',
        color_code: '#dc2626',
        is_default: false,
        is_active: true,
        display_order: 1,
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
      },
      {
        public_id: 'prio-2',
        name_ar: 'متوسطة',
        name_en: 'Medium',
        severity_rank: 'urgent',
        color_code: '#d97706',
        is_default: true,
        is_active: true,
        display_order: 2,
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
      },
    ]);
  }),

  http.get('https://api.momentum.test/v1/blueprints/categories', ({ request }) => {
    const url = new URL(request.url);
    const all = url.searchParams.get('all');
    const categories = [
      {
        public_id: 'cat-1',
        name_ar: 'تقنية',
        name_en: 'Technical',
        display_order: 1,
        is_active: true,
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
      },
      {
        public_id: 'cat-2',
        name_ar: 'ملغية',
        name_en: 'Deactivated',
        display_order: 2,
        is_active: false,
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
      },
    ];
    return HttpResponse.json(all ? categories : categories.filter((c) => c.is_active));
  }),

  http.get('https://api.momentum.test/v1/blueprints/stage-types', () => {
    return HttpResponse.json([
      {
        public_id: 'st-1',
        name_ar: 'مراجعة',
        name_en: 'Review',
        is_system_default: true,
        is_active: true,
        display_order: 1,
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
      },
    ]);
  }),

  http.get('https://api.momentum.test/v1/organization/departments', () => {
    return HttpResponse.json({
      data: [
        {
          public_id: 'dept-1',
          parent_department_id: '',
          name_ar: 'تقنية المعلومات',
          name_en: 'IT',
          is_active: true,
          created_at: '2026-01-01',
          updated_at: '2026-01-01',
        },
        {
          public_id: 'dept-2',
          parent_department_id: '',
          name_ar: 'الموارد البشرية',
          name_en: 'HR',
          is_active: true,
          created_at: '2026-01-01',
          updated_at: '2026-01-01',
        },
      ],
      next_cursor: null,
      has_more: false,
    });
  }),

  // --- External entities handlers (must be before /v1/tasks/:publicId to avoid catch-all) ---

  http.get('https://api.momentum.test/v1/tasks/external-entities', ({ request }) => {
    const url = new URL(request.url);
    const all = url.searchParams.get('all');
    const allEntities = [
      {
        public_id: 'entity-1',
        name_ar: 'وزارة التجارة',
        name_en: 'Ministry of Commerce',
        entity_type: 'governmentministry',
        is_active: 'true',
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
      },
      {
        public_id: 'entity-2',
        name_ar: 'شركة التقنية',
        name_en: 'Tech Company',
        entity_type: 'privatecompany',
        is_active: 'true',
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
      },
      {
        public_id: 'entity-3',
        name_ar: 'جهة ملغية',
        name_en: 'Deactivated Entity',
        entity_type: 'other',
        is_active: 'false',
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
      },
    ];
    const data = all ? allEntities : allEntities.filter((e) => e.is_active === 'true');
    return HttpResponse.json(data);
  }),

  http.post('https://api.momentum.test/v1/tasks/external-entities', async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({
      public_id: 'entity-new',
      name_ar: body.name_ar as string,
      name_en: (body.name_en as string) ?? '',
      entity_type: 'other',
      is_active: 'true',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { status: 200 });
  }),

  http.put('https://api.momentum.test/v1/tasks/external-entities/:entity', async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({
      public_id: 'entity-1',
      name_ar: body.name_ar as string,
      name_en: (body.name_en as string) ?? '',
      entity_type: 'governmentministry',
      is_active: 'true',
      created_at: '2026-01-01',
      updated_at: new Date().toISOString(),
    });
  }),

  http.post('https://api.momentum.test/v1/tasks/external-entities/:entity/deactivate', () => {
    return HttpResponse.json({
      public_id: 'entity-1',
      name_ar: 'وزارة التجارة',
      name_en: 'Ministry of Commerce',
      entity_type: 'governmentministry',
      is_active: 'false',
      created_at: '2026-01-01',
      updated_at: new Date().toISOString(),
    });
  }),

  http.post('https://api.momentum.test/v1/tasks/external-entities/:entity/reactivate', () => {
    return HttpResponse.json({
      public_id: 'entity-1',
      name_ar: 'وزارة التجارة',
      name_en: 'Ministry of Commerce',
      entity_type: 'governmentministry',
      is_active: 'true',
      created_at: '2026-01-01',
      updated_at: new Date().toISOString(),
    });
  }),

  http.get('https://api.momentum.test/v1/tasks', () => {
    return HttpResponse.json({
      data: [],
      next_cursor: null,
      has_more: false,
    });
  }),

  http.get('https://api.momentum.test/v1/tasks/:publicId', () => {
    return HttpResponse.json({
      public_id: 'TASK-001',
      display_id: 'T-2026-0001',
      title_ar: 'مهمة اختبار',
      title_en: 'Test Task Detail',
      description_ar: 'وصف المهمة',
      description_en: 'Task description',
      status: 'active',
      priority: {
        public_id: 'prio-1',
        name_ar: 'عالية',
        name_en: 'High',
        severity_rank: 'critical',
      },
      classification_level: 'public',
      initiator_id: 'user-init-1',
      initiator_name_ar: 'المبادر',
      initiator_name_en: 'Initiator',
      created_at: '2026-06-01T10:00:00Z',
      due_date: '2026-07-01T10:00:00Z',
      blueprint: {
        public_id: 'bp-1',
        name_ar: 'نموذج اختبار',
        name_en: 'Test Blueprint',
        stages: [
          {
            public_id: 'bp-stage-1',
            name_ar: 'مرحلة التقديم',
            name_en: 'Submission Stage',
            sequence_order: '1',
            stage_type: { public_id: 'st-1', name_ar: 'مراجعة', name_en: 'Review' },
            sla_policy: null,
          },
          {
            public_id: 'bp-stage-2',
            name_ar: 'مرحلة المراجعة',
            name_en: 'Review Stage',
            sequence_order: '2',
            stage_type: { public_id: 'st-1', name_ar: 'مراجعة', name_en: 'Review' },
            sla_policy: null,
          },
          {
            public_id: 'bp-stage-3',
            name_ar: 'مرحلة الاعتماد',
            name_en: 'Approval Stage',
            sequence_order: '3',
            stage_type: { public_id: 'st-1', name_ar: 'اعتماد', name_en: 'Approval' },
            sla_policy: null,
          },
        ],
        transitions: [
          { public_id: 'tr-1', blueprint_id: 'bp-1', from_stage_id: 'bp-stage-1', to_stage_id: 'bp-stage-2', transition_type: 'advance', return_reason_required: false, created_at: '2026-06-01T00:00:00Z' },
          { public_id: 'tr-2', blueprint_id: 'bp-1', from_stage_id: 'bp-stage-2', to_stage_id: 'bp-stage-3', transition_type: 'advance', return_reason_required: false, created_at: '2026-06-01T00:00:00Z' },
          { public_id: 'tr-3', blueprint_id: 'bp-1', from_stage_id: 'bp-stage-2', to_stage_id: 'bp-stage-1', transition_type: 'return', return_reason_required: true, created_at: '2026-06-01T00:00:00Z' },
        ],
      },
      stages: [
        {
          instance_id: 'stage-inst-1',
          public_id: 'stage-inst-1',
          blueprint_stage: {
            public_id: 'bp-stage-1',
            name_ar: 'مرحلة التقديم',
            name_en: 'Submission Stage',
          },
          status: 'completed',
          entered_at: '2026-06-01T10:00:00Z',
          exited_at: '2026-06-03T10:00:00Z',
          assignments: [
            { user_id: 'user-1', user_name_ar: 'أحمد', user_name_en: 'Ahmed', is_completed: true, reassigned_at: null },
          ],
          sub_stages: [],
          completion_note: 'Initial submission done',
          return_reason: null,
        },
        {
          instance_id: 'stage-inst-2',
          public_id: 'stage-inst-2',
          blueprint_stage: {
            public_id: 'bp-stage-2',
            name_ar: 'مرحلة المراجعة',
            name_en: 'Review Stage',
          },
          status: 'active',
          entered_at: '2026-06-03T10:00:00Z',
          exited_at: null,
          assignments: [
            { user_id: 'user-1', user_name_ar: 'أحمد', user_name_en: 'Ahmed', is_completed: false, reassigned_at: null },
          ],
          department_name_ar: 'تقنية المعلومات',
          department_name_en: 'IT',
          sub_stages: [
            {
              instance_id: 'sub-stage-inst-1',
              blueprint_sub_stage: {
                public_id: 'bp-sub-1',
                name_ar: 'مراجعة أولية',
                name_en: 'Initial Review',
              },
              status: 'completed',
              entered_at: '2026-06-03T10:00:00Z',
              exited_at: '2026-06-04T10:00:00Z',
              assignments: [
                { user_id: 'user-1', user_name_ar: 'أحمد', user_name_en: 'Ahmed', is_completed: true, reassigned_at: null },
              ],
              completion_note: 'Reviewed',
              return_reason: null,
            },
            {
              instance_id: 'sub-stage-inst-2',
              blueprint_sub_stage: {
                public_id: 'bp-sub-2',
                name_ar: 'اعتماد نهائي',
                name_en: 'Final Approval',
              },
              status: 'active',
              entered_at: '2026-06-04T10:00:00Z',
              exited_at: null,
              assignments: [
                { user_id: 'user-1', user_name_ar: 'أحمد', user_name_en: 'Ahmed', is_completed: false, reassigned_at: null },
              ],
              completion_note: null,
              return_reason: null,
            },
          ],
          completion_note: null,
          return_reason: null,
        },
        {
          instance_id: 'stage-inst-3',
          public_id: 'stage-inst-3',
          blueprint_stage: {
            public_id: 'bp-stage-3',
            name_ar: 'مرحلة الاعتماد',
            name_en: 'Approval Stage',
          },
          status: 'pending',
          entered_at: null,
          exited_at: null,
          assignments: [],
          sub_stages: [],
          completion_note: null,
          return_reason: null,
        },
      ],
    });
  }),

  http.get('https://api.momentum.test/v1/tracking/sla/tasks/:publicId', () => {
    return HttpResponse.json({
      overall_health: 'on_track',
      timers: [
        {
          stage_instance_id: 'stage-inst-2',
          sub_stage_instance_id: '',
          deadline_at: '2026-06-13T10:00:00Z',
          warning_at: '2026-06-10T10:00:00Z',
          status: 'running',
        },
      ],
    });
  }),

  http.get('https://api.momentum.test/v1/tasks/:publicId/timeline', () => {
    return HttpResponse.json([
      {
        type: 'stage_entered',
        user_name_ar: 'أحمد',
        user_name_en: 'Ahmed',
        stage_name_ar: 'مرحلة التقديم',
        stage_name_en: 'Submission Stage',
        parent_stage_name_ar: null,
        parent_stage_name_en: null,
        timestamp: '2026-06-01T10:00:00Z',
        completion_note: null,
        return_reason: null,
        reassignment_reason: null,
      },
      {
        type: 'stage_completed',
        user_name_ar: 'أحمد',
        user_name_en: 'Ahmed',
        stage_name_ar: 'مرحلة التقديم',
        stage_name_en: 'Submission Stage',
        parent_stage_name_ar: null,
        parent_stage_name_en: null,
        timestamp: '2026-06-03T10:00:00Z',
        completion_note: 'Initial submission done',
        return_reason: null,
        reassignment_reason: null,
      },
      {
        type: 'stage_entered',
        user_name_ar: 'أحمد',
        user_name_en: 'Ahmed',
        stage_name_ar: 'مرحلة المراجعة',
        stage_name_en: 'Review Stage',
        parent_stage_name_ar: null,
        parent_stage_name_en: null,
        timestamp: '2026-06-03T10:00:00Z',
        completion_note: null,
        return_reason: null,
        reassignment_reason: null,
      },
    ]);
  }),

  http.get('https://api.momentum.test/v1/blueprints/:blueprintId/transitions', () => {
    return HttpResponse.json([
      {
        transition_type: 'return',
        from_stage_id: 'bp-stage-2',
        to_stage_id: 'bp-stage-1',
        return_reason_required: true,
      },
    ]);
  }),

  http.get('https://api.momentum.test/v1/iam/users', () => {
    return HttpResponse.json({
      data: [
        { public_id: 'user-2', name_ar: 'سارة', name_en: 'Sarah' },
        { public_id: 'user-3', name_ar: 'محمد', name_en: 'Mohammed' },
      ],
      next_cursor: null,
      has_more: false,
    });
  }),

  // --- Blueprint handlers ---

  http.get('https://api.momentum.test/v1/blueprints', ({ request }) => {
    const url = new URL(request.url);
    const search = url.searchParams.get('search');
    const isActive = url.searchParams.get('is_active');
    let data = [...mockBlueprints];
    if (search) data = data.filter((bp) => bp.name_ar.includes(search) || bp.name_en.includes(search));
    if (isActive === 'true') data = data.filter((bp) => bp.is_active === true);
    if (isActive === 'false') data = data.filter((bp) => bp.is_active === false);
    return HttpResponse.json({ data, next_cursor: null, has_more: false });
  }),

  http.get('https://api.momentum.test/v1/blueprints/:publicId', ({ params }) => {
    const bp = mockBlueprints.find((b) => b.public_id === params.publicId);
    if (!bp && params.publicId === 'bp-locked') return HttpResponse.json(mockBlueprintLocked);
    if (!bp && params.publicId === 'bp-full') return HttpResponse.json(mockBlueprintFull);
    if (!bp) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(bp);
  }),

  http.post('https://api.momentum.test/v1/blueprints', async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({
      public_id: 'new-bp-uuid', name_ar: body.name_ar ?? '', name_en: body.name_en ?? '', description_ar: '', description_en: '',
      category: null, scope: 'organization', department_id: '', is_locked: false, is_active: false, stages: [], transitions: [],
      created_at: '2026-06-21T00:00:00Z', updated_at: '2026-06-21T00:00:00Z',
    }, { status: 200 });
  }),

  http.put('https://api.momentum.test/v1/blueprints/:publicId', async ({ request, params }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({ ...mockBlueprints[0], ...body, public_id: params.publicId as string });
  }),

  http.post('https://api.momentum.test/v1/blueprints/:publicId/activate', ({ params }) => {
    return HttpResponse.json({ ...mockBlueprints[0], is_active: true, public_id: params.publicId });
  }),

  http.post('https://api.momentum.test/v1/blueprints/:publicId/deactivate', ({ params }) => {
    return HttpResponse.json({ ...mockBlueprints[0], is_active: false, public_id: params.publicId });
  }),

  http.post('https://api.momentum.test/v1/blueprints/:publicId/duplicate', () => {
    return HttpResponse.json({
      ...mockBlueprints[0], public_id: 'copy-uuid', name_ar: 'نسخة من ' + mockBlueprints[0].name_ar,
      name_en: 'Copy of ' + mockBlueprints[0].name_en, is_locked: false, is_active: false,
    });
  }),

  http.post('https://api.momentum.test/v1/blueprints/:blueprintId/stages', async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({
      public_id: 'new-stage-uuid', blueprint_id: String(request.url.split('/')[5]), stage_type: null, sla_policy: null,
      name_ar: body.name_ar ?? '', name_en: body.name_en ?? '', description_ar: '', description_en: '',
      sequence_order: 99, assignment_type: 'specific_position', assigned_position_id: '', assigned_department_id: '',
      assignment_cardinality: 'single', completion_rule: 'any_assignee', escalation_position_id: '', sub_stages: [],
      created_at: '2026-06-21T00:00:00Z', updated_at: '2026-06-21T00:00:00Z',
    }, { status: 200 });
  }),

  http.put('https://api.momentum.test/v1/blueprints/:blueprintId/stages/:stageId', async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({ ...mockStage, ...body });
  }),

  http.delete('https://api.momentum.test/v1/blueprints/:blueprintId/stages/:stageId', () => {
    return new HttpResponse(null, { status: 204 });
  }),

  http.post('https://api.momentum.test/v1/blueprints/:blueprintId/stages/reorder', () => {
    return new HttpResponse(null, { status: 204 });
  }),

  http.post('https://api.momentum.test/v1/blueprints/:blueprintId/stages/:stageId/sub-stages', async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({
      public_id: 'new-sub-stage-uuid', stage_id: 'stage-1', sla_policy: null,
      name_ar: body.name_ar ?? '', name_en: body.name_en ?? '', description_ar: '', description_en: '',
      sequence_order: 1, is_required: false, assignment_type: 'specific_position', assigned_position_id: '', assigned_department_id: '',
      assignment_cardinality: 'single', completion_rule: 'any_assignee',
      created_at: '2026-06-21T00:00:00Z', updated_at: '2026-06-21T00:00:00Z',
    }, { status: 200 });
  }),

  http.put('https://api.momentum.test/v1/blueprints/:blueprintId/stages/:stageId/sub-stages/:subStageId', async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({ ...mockSubStage, ...body });
  }),

  http.delete('https://api.momentum.test/v1/blueprints/:blueprintId/stages/:stageId/sub-stages/:subStageId', () => {
    return new HttpResponse(null, { status: 204 });
  }),

  http.post('https://api.momentum.test/v1/blueprints/:blueprintId/stages/:stageId/sub-stages/reorder', () => {
    return new HttpResponse(null, { status: 204 });
  }),

  http.post('https://api.momentum.test/v1/blueprints/:blueprintId/transitions', async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({
      public_id: 'new-transition-uuid', blueprint_id: String(request.url.split('/')[5]),
      from_stage_id: body.from_stage_id ?? '', to_stage_id: body.to_stage_id ?? '',
      transition_type: 'advance', return_reason_required: false,
      created_at: '2026-06-21T00:00:00Z',
    }, { status: 200 });
  }),

  http.delete('https://api.momentum.test/v1/blueprints/:blueprintId/transitions/:transitionId', () => {
    return new HttpResponse(null, { status: 204 });
  }),

  http.get('https://api.momentum.test/v1/organization/positions', () => {
    return HttpResponse.json({
      data: [
        { public_id: 'pos-1', department: { public_id: 'dept-1', name_ar: 'تقنية المعلومات', name_en: 'IT' }, title_ar: 'مدير', title_en: 'Manager', reports_to_position_id: '', authority_grade: { public_id: 'ag-1', rank: '1', name_ar: 'درجة أولى', name_en: 'Grade 1' }, is_active: true, created_at: '2026-01-01', updated_at: '2026-01-01' },
        { public_id: 'pos-2', department: { public_id: 'dept-2', name_ar: 'الموارد البشرية', name_en: 'HR' }, title_ar: 'موظف', title_en: 'Employee', reports_to_position_id: '', authority_grade: { public_id: 'ag-2', rank: '2', name_ar: 'درجة ثانية', name_en: 'Grade 2' }, is_active: true, created_at: '2026-01-01', updated_at: '2026-01-01' },
      ],
      next_cursor: null,
      has_more: false,
    });
  }),

  // --- Follow-up center handlers ---

  http.get('https://api.momentum.test/v1/follow-up/overdue', () => {
    return HttpResponse.json({ data: [], next_cursor: null, has_more: false });
  }),

  http.get('https://api.momentum.test/v1/follow-up/at-risk', () => {
    return HttpResponse.json({ data: [], next_cursor: null, has_more: false });
  }),

  http.get('https://api.momentum.test/v1/follow-up/bottlenecks', () => {
    return HttpResponse.json({
      data: [
        {
          stage_type: { public_id: 'st-1', name_ar: 'مراجعة', name_en: 'Review' },
          department: { public_id: 'dept-1', name_ar: 'تقنية المعلومات', name_en: 'IT' },
          overdue_count: '3',
          at_risk_count: '2',
          score: '8',
          average_time_at_stage_seconds: '86400',
        },
      ],
    });
  }),

  http.get('https://api.momentum.test/v1/follow-up/actions', () => {
    return HttpResponse.json({
      data: [
        {
          public_id: 'act-1',
          action_type: '1',
          task_display_id: 'T-2026-0001',
          note_ar: 'تم الاتصال بالمسؤول',
          note_en: 'Called the manager',
          contact_name: null,
          created_by: { public_id: 'u-1', name_ar: 'أحمد', name_en: 'Ahmed' },
          created_at: '2026-06-24T09:00:00Z',
        },
      ],
      next_cursor: null,
      has_more: false,
    });
  }),

  http.get('https://api.momentum.test/v1/follow-up/tasks/:task/actions', () => {
    return HttpResponse.json({
      data: [
        {
          public_id: 'act-1',
          action_type: '1',
          note_ar: 'تم الاتصال بالمسؤول',
          note_en: 'Called the manager',
          contact_name: null,
          created_by: { public_id: 'u-1', name_ar: 'أحمد', name_en: 'Ahmed' },
          created_at: '2026-06-24T09:00:00Z',
        },
      ],
      next_cursor: null,
      has_more: false,
    });
  }),

  http.post('https://api.momentum.test/v1/follow-up/tasks/:task/actions', async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({
      public_id: 'act-new',
      ...body,
      created_by: { public_id: 'u-1', name_ar: 'أحمد', name_en: 'Ahmed' },
      created_at: new Date().toISOString(),
    }, { status: 201 });
  }),

  http.get('https://api.momentum.test/v1/tracking/escalations', () => {
    return HttpResponse.json({
      data: [
        {
          public_id: 'esc-1',
          task_id: 't-1',
          task_display_id: 'T-2026-0001',
          stage_instance_id: 'si-1',
          sub_stage_instance_id: null,
          escalation_type: 'Manual',
          escalated_to_user: { public_id: 'u-2', name_ar: 'نورة', name_en: 'Noura' },
          escalated_by_user: null,
          reason: 'SLA at risk',
          status: 'Open',
          resolution_note: null,
          resolved_at: null,
          created_at: '2026-06-24T08:00:00Z',
        },
      ],
      next_cursor: null,
      has_more: false,
    });
  }),

  http.post('https://api.momentum.test/v1/tracking/escalations', async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({
      public_id: 'esc-new',
      ...body,
      status: 'Open',
      resolution_note: null,
      resolved_at: null,
      created_at: new Date().toISOString(),
    }, { status: 201 });
  }),

  http.get('https://api.momentum.test/v1/tasks/:publicId/comments', () => {
    return HttpResponse.json({
      data: [
        {
          public_id: '01912a00-0000-7000-8000-000000000001',
          task_id: 'task-uuid-1',
          author: { public_id: 'user-1', name_ar: 'أحمد', name_en: 'Ahmad' },
          body: 'هل يمكن توضيح المطلوب؟',
          parent_comment_id: '',
          created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          attachment_count: 0,
          replies: [
            {
              public_id: '01912a00-0000-7000-8000-000000000002',
              task_id: 'task-uuid-1',
              author: { public_id: 'user-2', name_ar: 'سارة', name_en: 'Sara' },
              body: 'سأرسل التفاصيل الآن.',
              parent_comment_id: '01912a00-0000-7000-8000-000000000001',
              created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
              attachment_count: 0,
            },
          ],
        },
      ],
      next_cursor: null,
      has_more: false,
    });
  }),

  http.post('https://api.momentum.test/v1/tasks/:publicId/comments', async ({ request }) => {
    const body = (await request.json()) as { body: string; parent_comment_id?: string | null };
    const created = {
      public_id: 'new-comment-uuid',
      task_id: 'task-uuid-1',
      author: { public_id: 'user-1', name_ar: 'المستخدم', name_en: 'Current User' },
      body: body.body,
      parent_comment_id: body.parent_comment_id ?? '',
      created_at: new Date().toISOString(),
      attachment_count: 0,
      replies: [],
    };
    return HttpResponse.json(created, { status: 200 });
  }),

  http.post('https://api.momentum.test/v1/tracking/escalations/:escalation/resolve', async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({
      public_id: 'esc-1',
      status: 'Resolved',
      resolution_note: (body as { resolution_note?: string }).resolution_note,
      resolved_at: new Date().toISOString(),
    });
  }),

  // --- Document handlers ---

  http.get('https://api.momentum.test/v1/tasks/:publicId/documents', () => {
    return HttpResponse.json({
      data: mockDocuments,
      next_cursor: null,
      has_more: false,
    });
  }),

  http.post('https://api.momentum.test/v1/tasks/:publicId/documents', async ({ request }) => {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const created = {
      public_id: 'doc-new',
      original_filename: file?.name ?? 'uploaded.bin',
      mime_type: file?.type ?? 'application/octet-stream',
      mime_category: 'Pdf',
      size_bytes: String(file?.size ?? 0),
      version_number: '1',
      description: String(formData.get('description') ?? ''),
      uploader: { public_id: 'current-user', name_ar: 'أنت', name_en: 'You' },
      download_url: 'https://api.momentum.test/v1/documents/doc-new/download',
      preview_url: null,
      created_at: new Date().toISOString(),
    };
    return HttpResponse.json(created, { status: 200 });
  }),

  http.get('https://api.momentum.test/v1/documents/:documentId/versions', () => {
    return HttpResponse.json({
      data: mockDocuments.map((d) => ({
        public_id: d.public_id,
        version_number: d.version_number,
        original_filename: d.original_filename,
        mime_type: d.mime_type,
        size_bytes: d.size_bytes,
        uploader: d.uploader,
        created_at: d.created_at,
      })),
      next_cursor: null,
      has_more: false,
    });
  }),

  http.post('https://api.momentum.test/v1/documents/:documentId/versions', async ({ request }) => {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    return HttpResponse.json({
      ...mockDocuments[0],
      public_id: 'doc-version-new',
      original_filename: file?.name ?? 'version.pdf',
      version_number: '2',
      created_at: new Date().toISOString(),
    });
  }),

  http.delete('https://api.momentum.test/v1/documents/:documentId', () => {
    return new HttpResponse(null, { status: 204 });
  }),

  http.get('https://api.momentum.test/v1/tasks/:task/external-references', ({ params }) => {
    const taskId = params.task as string;
    if (taskId === 'TASK-422') {
      return new HttpResponse(null, { status: 422 });
    }
    return HttpResponse.json({
      data: [
        {
          public_id: 'ref-1',
          reference_type: 'correspondence',
          reference_number: 'وارد-2026-00412',
          external_entity: { public_id: 'entity-1', name_ar: 'وزارة التجارة', name_en: 'Ministry of Commerce', entity_type: 'governmentministry', is_active: 'true', created_at: '2026-01-01', updated_at: '2026-01-01' },
          notes: '',
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        },
        {
          public_id: 'ref-2',
          reference_type: 'contract',
          reference_number: 'CON-2026-001',
          external_entity: { public_id: 'entity-2', name_ar: 'شركة التقنية', name_en: 'Tech Company', entity_type: 'privatecompany', is_active: 'true', created_at: '2026-01-01', updated_at: '2026-01-01' },
          notes: 'العقد الأصلي',
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
        },
        {
          public_id: 'ref-3',
          reference_type: 'other',
          reference_number: 'EXT-2026-003',
          external_entity: null,
          notes: null,
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
        },
        {
          public_id: 'ref-4',
          reference_type: 'ministerialdecision',
          reference_number: 'MD-2026-042',
          external_entity: { public_id: 'entity-1', name_ar: 'وزارة التجارة', name_en: 'Ministry of Commerce', entity_type: 'governmentministry', is_active: 'true', created_at: '2026-01-01', updated_at: '2026-01-01' },
          notes: 'قرار وزاري رقم 42',
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
        },
      ],
      next_cursor: null,
      has_more: false,
    });
  }),

  http.post('https://api.momentum.test/v1/tasks/:task/external-references', async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({
      public_id: 'ref-new',
      reference_type: body.reference_type as string,
      reference_number: body.reference_number as string,
      external_entity: body.external_entity_id ? { public_id: body.external_entity_id as string, name_ar: 'جهة', name_en: 'Entity', entity_type: 'other', is_active: 'true', created_at: '2026-01-01', updated_at: '2026-01-01' } : null,
      notes: (body.notes as string) ?? null,
      created_at: new Date().toISOString(),
    }, { status: 200 });
  }),

  http.put('https://api.momentum.test/v1/tasks/:task/external-references/:reference', async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({
      public_id: 'ref-1',
      reference_type: body.reference_type as string,
      reference_number: body.reference_number as string,
      external_entity: body.external_entity_id ? { public_id: body.external_entity_id as string, name_ar: 'جهة', name_en: 'Entity', entity_type: 'other', is_active: 'true', created_at: '2026-01-01', updated_at: '2026-01-01' } : null,
      notes: (body.notes as string) ?? null,
      created_at: new Date().toISOString(),
    });
  }),

  http.delete('https://api.momentum.test/v1/tasks/:task/external-references/:reference', () => {
    return new HttpResponse(null, { status: 204 });
  }),

];

const mockStage = {
  public_id: 'stage-1',
  blueprint_id: 'bp-1',
  stage_type: { public_id: 'st-1', name_ar: 'مراجعة', name_en: 'Review', is_system_default: true, is_active: true, display_order: 1, created_at: '2026-01-01', updated_at: '2026-01-01' },
  sla_policy: null,
  name_ar: 'مرحلة التقديم',
  name_en: 'Submission Stage',
  description_ar: '',
  description_en: '',
  sequence_order: 1,
  assignment_type: 'specific_position',
  assigned_position_id: 'pos-1',
  assigned_department_id: '',
  assignment_cardinality: 'single',
  completion_rule: 'any_assignee',
  escalation_position_id: '',
  sub_stages: [],
  created_at: '2026-06-01T00:00:00Z',
  updated_at: '2026-06-01T00:00:00Z',
};

const mockStage2 = {
  public_id: 'stage-2',
  blueprint_id: 'bp-1',
  stage_type: { public_id: 'st-1', name_ar: 'اعتماد', name_en: 'Approval', is_system_default: true, is_active: true, display_order: 2, created_at: '2026-01-01', updated_at: '2026-01-01' },
  sla_policy: null,
  name_ar: 'مرحلة الاعتماد',
  name_en: 'Approval Stage',
  description_ar: '',
  description_en: '',
  sequence_order: 2,
  assignment_type: 'department_head',
  assigned_position_id: '',
  assigned_department_id: 'dept-1',
  assignment_cardinality: 'single',
  completion_rule: 'all_assignees',
  escalation_position_id: '',
  sub_stages: [
    {
      public_id: 'sub-1',
      stage_id: 'stage-2',
      sla_policy: null,
      name_ar: 'مراجعة أولية',
      name_en: 'Initial Review',
      description_ar: '',
      description_en: '',
      sequence_order: 1,
      is_required: true,
      assignment_type: 'specific_position',
      assigned_position_id: '',
      assigned_department_id: '',
      assignment_cardinality: 'single',
      completion_rule: 'any_assignee',
      created_at: '2026-06-01T00:00:00Z',
      updated_at: '2026-06-01T00:00:00Z',
    },
  ],
  created_at: '2026-06-01T00:00:00Z',
  updated_at: '2026-06-01T00:00:00Z',
};

const mockStage3 = {
  public_id: 'stage-3',
  blueprint_id: 'bp-1',
  stage_type: { public_id: 'st-1', name_ar: 'إغلاق', name_en: 'Closure', is_system_default: true, is_active: true, display_order: 3, created_at: '2026-01-01', updated_at: '2026-01-01' },
  sla_policy: null,
  name_ar: 'مرحلة الإغلاق',
  name_en: 'Closure Stage',
  description_ar: '',
  description_en: '',
  sequence_order: 3,
  assignment_type: 'specific_position',
  assigned_position_id: 'pos-2',
  assigned_department_id: '',
  assignment_cardinality: 'single',
  completion_rule: 'any_assignee',
  escalation_position_id: '',
  sub_stages: [],
  created_at: '2026-06-01T00:00:00Z',
  updated_at: '2026-06-01T00:00:00Z',
};

const mockSubStage = {
  public_id: 'sub-1',
  stage_id: 'stage-2',
  sla_policy: null,
  name_ar: 'مراجعة أولية',
  name_en: 'Initial Review',
  description_ar: '',
  description_en: '',
  sequence_order: 1,
  is_required: true,
  assignment_type: 'specific_position',
  assigned_position_id: '',
  assigned_department_id: '',
  assignment_cardinality: 'single',
  completion_rule: 'any_assignee',
  created_at: '2026-06-01T00:00:00Z',
  updated_at: '2026-06-01T00:00:00Z',
};

const mockBlueprints = [
  {
    public_id: 'bp-1',
    category: { public_id: 'cat-1', name_ar: 'تقنية', name_en: 'Technical', display_order: 1, is_active: true, created_at: '2026-01-01', updated_at: '2026-01-01' },
    name_ar: 'نموذج اختبار',
    name_en: 'Test Blueprint',
    description_ar: 'نموذج اختبار للعمليات التقنية',
    description_en: 'Test blueprint for technical processes',
    scope: 'organization',
    department_id: '',
    is_locked: false,
    is_active: true,
    stages: [mockStage, mockStage2, mockStage3],
    transitions: [],
    created_at: '2026-06-01T00:00:00Z',
    updated_at: '2026-06-01T00:00:00Z',
  },
  {
    public_id: 'bp-2',
    category: null,
    name_ar: 'نموذج الموارد البشرية',
    name_en: 'HR Blueprint',
    description_ar: 'نموذج لعمليات الموارد البشرية',
    description_en: 'HR process blueprint',
    scope: 'department',
    department_id: 'dept-2',
    is_locked: false,
    is_active: false,
    stages: [mockStage],
    transitions: [],
    created_at: '2026-06-02T00:00:00Z',
    updated_at: '2026-06-02T00:00:00Z',
  },
];

const mockBlueprintLocked = {
  public_id: 'bp-locked',
  category: { public_id: 'cat-1', name_ar: 'تقنية', name_en: 'Technical', display_order: 1, is_active: true, created_at: '2026-01-01', updated_at: '2026-01-01' },
  name_ar: 'نموذج مقفل',
  name_en: 'Locked Blueprint',
  description_ar: 'هذا النموذج مقفل لأن مهمة قد أطلقت منه',
  description_en: 'This blueprint is locked because a task was launched from it',
  scope: 'organization',
  department_id: '',
  is_locked: true,
  is_active: true,
  stages: [mockStage, mockStage2],
  transitions: [],
  created_at: '2026-05-01T00:00:00Z',
  updated_at: '2026-05-15T00:00:00Z',
};

const mockBlueprintFull = {
  public_id: 'bp-full',
  category: { public_id: 'cat-1', name_ar: 'تقنية', name_en: 'Technical', display_order: 1, is_active: true, created_at: '2026-01-01', updated_at: '2026-01-01' },
  name_ar: 'نموذج كامل',
  name_en: 'Full Blueprint',
  description_ar: 'نموذج كامل بجميع المراحل والانتقالات',
  description_en: 'Full blueprint with all stages and transitions',
  scope: 'organization',
  department_id: '',
  is_locked: false,
  is_active: true,
  stages: [mockStage, mockStage2, mockStage3],
  transitions: [
    { public_id: 'tr-1', blueprint_id: 'bp-full', from_stage_id: 'stage-1', to_stage_id: 'stage-2', transition_type: 'advance', return_reason_required: false, created_at: '2026-06-01T00:00:00Z' },
    { public_id: 'tr-2', blueprint_id: 'bp-full', from_stage_id: 'stage-2', to_stage_id: 'stage-3', transition_type: 'advance', return_reason_required: false, created_at: '2026-06-01T00:00:00Z' },
    { public_id: 'tr-3', blueprint_id: 'bp-full', from_stage_id: 'stage-2', to_stage_id: 'stage-1', transition_type: 'return', return_reason_required: true, created_at: '2026-06-01T00:00:00Z' },
  ],
  created_at: '2026-06-01T00:00:00Z',
  updated_at: '2026-06-10T00:00:00Z',
};

const mockExecutiveSummary = {
  active: '142',
  overdue: '23',
  at_risk: '18',
  suspended: '7',
  completed: '456',
  cancelled: '12',
  completion_rate: '0.75',
};

const mockDepartmentHealth = [
  {
    department_public_id: 'dept-1',
    department_name_ar: 'تقنية المعلومات',
    department_name_en: 'IT',
    health: 'red',
    health_label: 'Overdue',
    active_tasks: '45',
    overdue_tasks: '12',
    at_risk_tasks: '8',
  },
  {
    department_public_id: 'dept-2',
    department_name_ar: 'الموارد البشرية',
    department_name_en: 'HR',
    health: 'amber',
    health_label: 'At Risk',
    active_tasks: '32',
    overdue_tasks: '3',
    at_risk_tasks: '7',
  },
  {
    department_public_id: 'dept-3',
    department_name_ar: 'المالية',
    department_name_en: 'Finance',
    health: 'green',
    health_label: 'On Track',
    active_tasks: '65',
    overdue_tasks: '0',
    at_risk_tasks: '3',
  },
];

const mockBottlenecks = [
  {
    stage_type: { public_id: 'st-1', name_ar: 'مراجعة', name_en: 'Review' },
    department: { public_id: 'dept-1', name_ar: 'تقنية المعلومات', name_en: 'IT' },
    overdue_count: '5',
    at_risk_count: '3',
    score: '8',
    average_time_at_stage_seconds: '86400',
  },
  {
    stage_type: { public_id: 'st-2', name_ar: 'اعتماد', name_en: 'Approval' },
    department: { public_id: 'dept-2', name_ar: 'الموارد البشرية', name_en: 'HR' },
    overdue_count: '2',
    at_risk_count: '4',
    score: '6',
    average_time_at_stage_seconds: '43200',
  },
];

const mockDrillDownTasks = [
  {
    task_public_id: '01912345-6789-7abc-def0-123456789abc',
    display_id: 'T-2026-0001',
    title_ar: 'مهمة متأخرة',
    title_en: 'Overdue Task',
    status: 'active',
    priority: { public_id: 'prio-1', name_ar: 'عالية', name_en: 'High', severity_rank: 'urgent', color_code: '#d97706' },
    current_stage_name_ar: 'مراجعة',
    current_stage_name_en: 'Review',
    owning_department_public_id: 'dept-1',
    sla_health: 'red',
    created_at: '2026-07-01T00:00:00Z',
  },
  {
    task_public_id: '01922345-6789-7abc-def0-123456789abc',
    display_id: 'T-2026-0002',
    title_ar: 'مهمة قيد المراجعة',
    title_en: 'In Review Task',
    status: 'active',
    priority: null,
    current_stage_name_ar: 'تدقيق',
    current_stage_name_en: 'Audit',
    owning_department_public_id: 'dept-2',
    sla_health: 'green',
    created_at: '2026-07-02T00:00:00Z',
  },
];

export const mockAgingData = [
  {
    task_public_id: '01912345-6789-7abc-def0-123456789abc',
    title_ar: 'مهمة متأخرة',
    title_en: 'Overdue Task',
    priority: {
      public_id: 'prio-1',
      name_ar: 'عاجل',
      name_en: 'Urgent',
      severity_rank: 'urgent',
      color_code: '#f59e0b',
    },
    current_stage_name_ar: 'مراجعة',
    current_stage_name_en: 'Review',
    active_assignees: [{ public_id: 'u1', name_ar: 'أحمد', name_en: 'Ahmad' }],
    sla_health: 'red',
    created_at: '2026-07-01T00:00:00Z',
    entered_at: '2026-07-05T00:00:00Z',
  },
  {
    task_public_id: '01922345-6789-7abc-def0-123456789abc',
    title_ar: 'مهمة قيد المراجعة',
    title_en: 'In Review Task',
    priority: {
      public_id: 'prio-2',
      name_ar: 'عادي',
      name_en: 'Normal',
      severity_rank: 'routine',
      color_code: null,
    },
    current_stage_name_ar: 'تدقيق',
    current_stage_name_en: 'Audit',
    active_assignees: [
      { public_id: 'u2', name_ar: 'سارة', name_en: 'Sara' },
      { public_id: 'u3', name_ar: 'محمد', name_en: 'Mohamed' },
    ],
    sla_health: 'green',
    created_at: '2026-07-02T00:00:00Z',
    entered_at: '2026-07-06T00:00:00Z',
  },
  {
    task_public_id: '01932345-6789-7abc-def0-123456789abc',
    title_ar: 'مهمة معلقة',
    title_en: 'Suspended Task',
    priority: null,
    current_stage_name_ar: 'انتظار',
    current_stage_name_en: 'Waiting',
    active_assignees: [],
    sla_health: 'grey',
    created_at: '2026-06-28T00:00:00Z',
    entered_at: '2026-06-30T00:00:00Z',
  },
];
