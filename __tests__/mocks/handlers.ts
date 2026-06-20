import { http, HttpResponse } from 'msw';

export const handlers = [
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
        is_default: '0',
        is_active: '1',
        display_order: '1',
        created_at: '2026-01-01',
        updated_at: '2026-01-01',
      },
      {
        public_id: 'prio-2',
        name_ar: 'متوسطة',
        name_en: 'Medium',
        severity_rank: 'urgent',
        color_code: '#d97706',
        is_default: '1',
        is_active: '1',
        display_order: '2',
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
        display_order: '1',
        is_active: '1',
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
        is_system_default: '1',
        is_active: '1',
        display_order: '1',
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
          is_active: '1',
          created_at: '2026-01-01',
          updated_at: '2026-01-01',
        },
        {
          public_id: 'dept-2',
          parent_department_id: '',
          name_ar: 'الموارد البشرية',
          name_en: 'HR',
          is_active: '1',
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
      },
      stages: [
        {
          instance_id: 'stage-inst-1',
          blueprint_stage: {
            public_id: 'bp-stage-1',
            name_ar: 'مرحلة التقديم',
            name_en: 'Submission Stage',
          },
          status: 'completed',
          entered_at: '2026-06-01T10:00:00Z',
          exited_at: '2026-06-03T10:00:00Z',
          assignments: [
            { user_id: 'user-1', user_name_ar: 'أحمد', user_name_en: 'Ahmed', is_completed: '1', reassigned_at: null },
          ],
          sub_stages: [],
          completion_note: 'Initial submission done',
          return_reason: null,
        },
        {
          instance_id: 'stage-inst-2',
          blueprint_stage: {
            public_id: 'bp-stage-2',
            name_ar: 'مرحلة المراجعة',
            name_en: 'Review Stage',
          },
          status: 'active',
          entered_at: '2026-06-03T10:00:00Z',
          exited_at: null,
          assignments: [
            { user_id: 'user-1', user_name_ar: 'أحمد', user_name_en: 'Ahmed', is_completed: '0', reassigned_at: null },
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
                { user_id: 'user-1', user_name_ar: 'أحمد', user_name_en: 'Ahmed', is_completed: '1', reassigned_at: null },
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
                { user_id: 'user-1', user_name_ar: 'أحمد', user_name_en: 'Ahmed', is_completed: '0', reassigned_at: null },
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
          status: '1',
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
        transition_type: '2',
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
];
