import { http, HttpResponse } from 'msw';

const TASK_URL = 'https://api.momentum.test/v1';

export const taskCreateHandlers = [
  http.post(`${TASK_URL}/tasks`, async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({
      public_id: 'task-new',
      display_id: 'T-2026-0007',
      blueprint_id: body.blueprint_id,
      priority: null,
      title_ar: body.title_ar,
      title_en: body.title_en || body.title_ar,
      description_ar: body.description_ar,
      description_en: body.description_en || body.description_ar,
      classification_level: body.classification_level ?? 1,
      status: 'draft',
      initiator_id: 'user-1',
      due_date: body.due_date || null,
      created_at: new Date().toISOString(),
      launched_at: null, suspended_at: null, resumed_at: null,
      completed_at: null, cancelled_at: null,
      suspension_reason: null, cancellation_reason: null,
    });
  }),
  http.put(`${TASK_URL}/tasks/:publicId`, async ({ params, request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    return HttpResponse.json({ public_id: params.publicId, status: 'draft', ...body });
  }),
  http.post(`${TASK_URL}/tasks/:publicId/launch`, async ({ params }) => {
    return HttpResponse.json({
      public_id: params.publicId,
      status: 'active',
      stages: [],
      launched_at: new Date().toISOString(),
    });
  }),
  http.delete(`${TASK_URL}/tasks/:publicId`, () => new HttpResponse(null, { status: 204 })),
];
