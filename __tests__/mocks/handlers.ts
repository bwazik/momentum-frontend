import { http, HttpResponse } from 'msw';
import { organizationHandlers } from './organization-handlers';

export const handlers = [
  ...organizationHandlers,
  http.get('https://api.momentum.test/v1/follow-up/actions', () =>
    HttpResponse.json({ data: [], next_cursor: null, has_more: false }),
  ),
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

  http.get('https://api.momentum.test/v1/blueprints/categories', () => {
    return HttpResponse.json([
      {
        public_id: 'cat-1',
        name_ar: 'تقنية',
        name_en: 'Technical',
        display_order: 1,
        is_active: true,
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
      },
    ]);
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

  http.post('https://api.momentum.test/v1/tracking/escalations/:escalation/resolve', async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({
      public_id: 'esc-1',
      status: 'Resolved',
      resolution_note: (body as { resolution_note?: string }).resolution_note,
      resolved_at: new Date().toISOString(),
    });
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
