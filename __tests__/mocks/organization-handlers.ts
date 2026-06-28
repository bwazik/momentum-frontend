import { http, HttpResponse } from 'msw';

const tree = [
  {
    public_id: 'dept-1',
    name_ar: 'الوزارة',
    name_en: 'Ministry',
    is_active: '1',
    children: [
      {
        public_id: 'dept-2',
        name_ar: 'المالية',
        name_en: 'Finance',
        is_active: '1',
        children: [],
      },
    ],
  },
];

const departments = [
  {
    public_id: 'dept-1',
    name_ar: 'الوزارة',
    name_en: 'Ministry',
    parent_department_id: '',
    is_active: '1',
    children: [],
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    public_id: 'dept-2',
    name_ar: 'المالية',
    name_en: 'Finance',
    parent_department_id: 'dept-1',
    is_active: '1',
    children: [],
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
];

const positions = [
  {
    public_id: 'pos-1',
    department: { public_id: 'dept-2', name_ar: 'المالية', name_en: 'Finance' },
    title_ar: 'مدير',
    title_en: 'Director',
    reports_to_position_id: '',
    authority_grade: { public_id: 'g-1', rank: '3', name_ar: 'مدير', name_en: 'Director' },
    is_department_head: '1',
    is_active: '1',
    current_occupant: { public_id: 'u-1', name_ar: 'أحمد', name_en: 'Ahmed' },
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    public_id: 'pos-2',
    department: { public_id: 'dept-2', name_ar: 'المالية', name_en: 'Finance' },
    title_ar: 'محاسب',
    title_en: 'Accountant',
    reports_to_position_id: 'pos-1',
    authority_grade: { public_id: 'g-2', rank: '5', name_ar: 'موظف', name_en: 'Employee' },
    is_department_head: '0',
    is_active: '1',
    current_occupant: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
];

const grades = [
  { public_id: 'g-1', rank: '1', name_ar: 'وزير', name_en: 'Minister', description: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
  { public_id: 'g-2', rank: '3', name_ar: 'مدير', name_en: 'Director', description: null, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z' },
];

const calendars = [
  {
    public_id: 'cal-1',
    name_ar: 'الافتراضي',
    name_en: 'Default',
    working_days: '0,1,2,3,4',
    working_hours_start: '08:00',
    working_hours_end: '16:00',
    timezone: 'Asia/Riyadh',
    is_default: '1',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
];

const holidays = [
  {
    public_id: 'h-1',
    name_ar: 'اليوم الوطني',
    name_en: 'National Day',
    holiday_date: '2026-09-23',
    is_recurring: '1',
    created_at: '2026-01-01T00:00:00Z',
  },
];

export const organizationHandlers = [
  http.get('https://api.momentum.test/v1/organization/departments/tree', () =>
    HttpResponse.json(tree),
  ),

  http.get('https://api.momentum.test/v1/organization/departments', () =>
    HttpResponse.json({ data: departments, next_cursor: null, has_more: false }),
  ),

  http.get('https://api.momentum.test/v1/organization/departments/:id', ({ params }) => {
    const dept = departments.find((d) => d.public_id === params.id);
    if (!dept) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(dept);
  }),

  http.post('https://api.momentum.test/v1/organization/departments', async ({ request }) => {
    const b = (await request.json()) as { name_ar: string };
    return HttpResponse.json(
      { ...departments[0], public_id: 'dept-new', name_ar: b.name_ar },
      { status: 201 },
    );
  }),

  http.put('https://api.momentum.test/v1/organization/departments/:id', async ({ params, request }) => {
    const b = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ ...departments[0], ...b, public_id: params.id });
  }),

  http.post('https://api.momentum.test/v1/organization/departments/:id/deactivate', ({ params }) =>
    HttpResponse.json({ ...departments[0], public_id: params.id, is_active: '0' }),
  ),

  http.post('https://api.momentum.test/v1/organization/departments/:id/reactivate', ({ params }) =>
    HttpResponse.json({ ...departments[0], public_id: params.id, is_active: '1' }),
  ),

  http.delete('https://api.momentum.test/v1/organization/departments/:id', () =>
    new HttpResponse(null, { status: 204 }),
  ),

  http.get('https://api.momentum.test/v1/organization/positions', () =>
    HttpResponse.json({ data: positions, next_cursor: null, has_more: false }),
  ),

  http.get('https://api.momentum.test/v1/organization/positions/:id', ({ params }) => {
    const pos = positions.find((p) => p.public_id === params.id);
    if (!pos) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(pos);
  }),

  http.post('https://api.momentum.test/v1/organization/positions', async ({ request }) => {
    const b = (await request.json()) as { title_ar: string };
    return HttpResponse.json(
      { ...positions[0], public_id: 'pos-new', title_ar: b.title_ar },
      { status: 201 },
    );
  }),

  http.put('https://api.momentum.test/v1/organization/positions/:id', async ({ params, request }) => {
    const b = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ ...positions[0], ...b, public_id: params.id });
  }),

  http.post('https://api.momentum.test/v1/organization/positions/:id/transfer', async ({ params, request }) => {
    const b = (await request.json()) as { department_id: string };
    return HttpResponse.json({
      ...positions[0],
      public_id: params.id,
      department: { public_id: b.department_id, name_ar: 'المالية' },
    });
  }),

  http.post('https://api.momentum.test/v1/organization/positions/:id/deactivate', ({ params }) =>
    HttpResponse.json({ ...positions[0], public_id: params.id, is_active: '0' }),
  ),

  http.post('https://api.momentum.test/v1/organization/positions/:id/reactivate', ({ params }) =>
    HttpResponse.json({ ...positions[0], public_id: params.id, is_active: '1' }),
  ),

  http.delete('https://api.momentum.test/v1/organization/positions/:id', () =>
    new HttpResponse(null, { status: 204 }),
  ),

  http.get('https://api.momentum.test/v1/organization/authority-grades', () =>
    HttpResponse.json(grades),
  ),

  http.post('https://api.momentum.test/v1/organization/authority-grades', async ({ request }) => {
    const b = (await request.json()) as { name_ar: string; rank: number };
    return HttpResponse.json(
      { ...grades[0], public_id: 'g-new', name_ar: b.name_ar, rank: String(b.rank) },
      { status: 201 },
    );
  }),

  http.put('https://api.momentum.test/v1/organization/authority-grades/:id', async ({ params, request }) => {
    const b = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ ...grades[0], ...b, public_id: params.id });
  }),

  http.delete('https://api.momentum.test/v1/organization/authority-grades/:id', () =>
    new HttpResponse(null, { status: 204 }),
  ),

  http.get('https://api.momentum.test/v1/organization/working-calendars', () =>
    HttpResponse.json(calendars),
  ),

  http.post('https://api.momentum.test/v1/organization/working-calendars', async ({ request }) => {
    const b = (await request.json()) as { name_ar: string };
    return HttpResponse.json(
      { ...calendars[0], public_id: 'cal-new', name_ar: b.name_ar },
      { status: 201 },
    );
  }),

  http.put('https://api.momentum.test/v1/organization/working-calendars/:id', async ({ params, request }) => {
    const b = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ ...calendars[0], ...b, public_id: params.id });
  }),

  http.delete('https://api.momentum.test/v1/organization/working-calendars/:id', () =>
    new HttpResponse(null, { status: 204 }),
  ),

  http.get('https://api.momentum.test/v1/organization/working-calendars/:cid/holidays', () =>
    HttpResponse.json(holidays),
  ),

  http.post('https://api.momentum.test/v1/organization/working-calendars/:cid/holidays', async ({ request }) => {
    const b = (await request.json()) as { name_ar: string };
    return HttpResponse.json(
      { ...holidays[0], public_id: 'h-new', name_ar: b.name_ar },
      { status: 201 },
    );
  }),

  http.put('https://api.momentum.test/v1/organization/working-calendars/:cid/holidays/:hid', async ({ params, request }) => {
    const b = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ ...holidays[0], ...b, public_id: params.hid });
  }),

  http.delete('https://api.momentum.test/v1/organization/working-calendars/:cid/holidays/:hid', () =>
    new HttpResponse(null, { status: 204 }),
  ),
];
