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
];
