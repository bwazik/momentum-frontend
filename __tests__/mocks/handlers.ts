import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('https://api.momentum.test/v1/tasks', () => {
    return HttpResponse.json({
      data: [],
      next_cursor: null,
      has_more: false,
    });
  }),
];
