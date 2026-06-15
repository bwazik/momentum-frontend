# Testing Policy — Momentum Frontend

> Read when adding or changing behavior that needs verification.

---

## Philosophy

- Test **user-visible behavior**, not implementation details
- Feature/integration tests are **mandatory** for domain components
- Both locales (Arabic RTL + English LTR) for critical flows
- Mock API with MSW — never hit real backend in tests
- All 4 states tested: loading, error, empty, success

---

## Stack

| Type | Tool | When |
|------|------|------|
| Unit | Vitest | Pure utility functions, hooks with mock fetch |
| Component | Vitest + Testing Library | Domain components, forms, interactions |
| Hook | Vitest + `renderHook` | TanStack Query hooks with MSW |
| E2E | Playwright | Critical flows when core screens exist (login, task board, stage advance) |

---

## Coverage Rules

### New Components

- **Every domain component:** render test + interaction test
- **Every form:** validation test (required fields, submit, error display)
- **Every data table:** loading state, empty state, populated state, sort/filter interaction

### Critical Flows (E2E when Playwright added)

- Login → dashboard redirect
- Task board load → filter → click task → task details
- Stage advance → confirmation → success toast
- Blueprint builder → add stage → save

### What NOT to Test

- shadcn/ui primitives (they have their own tests)
- Generated API types (they're auto-generated)
- Tailwind class output (visual regression is separate)
- Implementation details (internal state, component internals)

---

## Test Structure

```
__tests__/                        # Or colocate as .test.tsx
├── components/
│   ├── domain/
│   │   ├── tasks/
│   │   │   ├── task-board.test.tsx
│   │   │   ├── task-card.test.tsx
│   │   │   └── sla-badge.test.tsx
│   │   ├── blueprints/
│   │   │   └── blueprint-builder.test.tsx
│   │   └── follow-up/
│   │       └── follow-up-board.test.tsx
│   └── shared/
│       ├── data-table.test.tsx
│       └── empty-state.test.tsx
├── hooks/
│   ├── use-tasks.test.ts
│   └── use-auth.test.ts
├── utils/
│   ├── date-utils.test.ts
│   └── sla-utils.test.ts
└── e2e/                          # Playwright (when added)
    ├── login.spec.ts
    ├── task-board.spec.ts
    └── blueprint-builder.spec.ts
```

---

## MSW — API Mocking

Use Mock Service Worker to intercept API calls in tests:

```ts
// __tests__/mocks/handlers.ts
import { http, HttpResponse } from 'msw';
import type { Task } from '@/lib/generated/api-types';

const mockTasks: Task[] = [
  {
    public_id: '01912345-6789-7abc-def0-123456789abc',
    title_ar: 'مهمة اختبارية',
    title_en: 'Test Task',
    status: 'active',
    // ...
  },
];

export const handlers = [
  http.get('https://api.momentum.test/v1/tasks', () => {
    return HttpResponse.json({
      data: mockTasks,
      next_cursor: null,
      has_more: false,
    });
  }),

  http.get('https://api.momentum.test/v1/tasks/:publicId', ({ params }) => {
    const task = mockTasks.find(t => t.public_id === params.publicId);
    if (!task) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(task);
  }),

  http.post('https://api.momentum.test/v1/tasks', async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json({ ...body, public_id: 'new-uuid' }, { status: 201 });
  }),
];
```

```ts
// __tests__/mocks/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

```ts
// vitest.setup.ts
import { server } from './__tests__/mocks/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

---

## TanStack Query Testing

Wrap components in a fresh `QueryClientProvider` per test:

```tsx
// __tests__/utils/test-utils.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, type RenderOptions } from '@testing-library/react';

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

export function renderWithProviders(
  ui: React.ReactElement,
  options?: RenderOptions,
) {
  const queryClient = createTestQueryClient();

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...options }),
    queryClient,
  };
}
```

### Testing Query Hooks

```ts
import { renderHook, waitFor } from '@testing-library/react';
import { useTasks } from '@/lib/api/hooks/use-tasks';
import { renderWithProviders } from '../utils/test-utils';

test('useTasks returns task list', async () => {
  const { result } = renderHook(
    () => useTasks({ status: 'active' }),
    { wrapper: /* QueryClientProvider wrapper */ },
  );

  await waitFor(() => expect(result.current.isSuccess).toBe(true));
  expect(result.current.data?.data).toHaveLength(1);
  expect(result.current.data?.data[0].title_ar).toBe('مهمة اختبارية');
});
```

---

## Component Testing Patterns

### Render + Interaction

```tsx
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../utils/test-utils';
import { TaskBoard } from '@/components/domain/tasks/task-board';

test('renders task board with tasks', async () => {
  renderWithProviders(<TaskBoard />);

  // Loading state
  expect(screen.getByTestId('task-board-skeleton')).toBeInTheDocument();

  // Wait for data
  await screen.findByText('مهمة اختبارية');

  // Verify content
  expect(screen.getByText('مهمة اختبارية')).toBeInTheDocument();
});

test('filters tasks by status', async () => {
  const user = userEvent.setup();
  renderWithProviders(<TaskBoard />);

  await screen.findByText('مهمة اختبارية');

  // Click filter
  await user.click(screen.getByRole('button', { name: /متأخرة/ }));

  // Verify filtered state
  // MSW handler would return filtered results
});
```

### Empty State

```tsx
import { server } from '../mocks/server';
import { http, HttpResponse } from 'msw';

test('shows empty state when no tasks', async () => {
  // Override handler for this test
  server.use(
    http.get('https://api.momentum.test/v1/tasks', () => {
      return HttpResponse.json({ data: [], next_cursor: null, has_more: false });
    }),
  );

  renderWithProviders(<TaskBoard />);

  await screen.findByText('لا توجد مهام');
});
```

### Error State

```tsx
test('shows error state on API failure', async () => {
  server.use(
    http.get('https://api.momentum.test/v1/tasks', () => {
      return new HttpResponse(null, { status: 500 });
    }),
  );

  renderWithProviders(<TaskBoard />);

  await screen.findByText(/حدث خطأ/);
});
```

---

## RTL Testing

Critical flows must be tested in both locales:

```tsx
test('task board renders correctly in RTL (Arabic)', async () => {
  // Set document direction
  document.documentElement.dir = 'rtl';
  document.documentElement.lang = 'ar';

  renderWithProviders(<TaskBoard locale="ar" />);

  await screen.findByText('مهمة اختبارية');
  // Verify RTL-specific layout if needed
});

test('task board renders correctly in LTR (English)', async () => {
  document.documentElement.dir = 'ltr';
  document.documentElement.lang = 'en';

  renderWithProviders(<TaskBoard locale="en" />);

  await screen.findByText('Test Task');
});
```

---

## Common Assertion Patterns

```tsx
// Element presence
expect(screen.getByText('مهمة')).toBeInTheDocument();
expect(screen.queryByText('deleted')).not.toBeInTheDocument();

// Role-based queries (preferred)
expect(screen.getByRole('button', { name: 'إنشاء مهمة' })).toBeEnabled();
expect(screen.getByRole('table')).toBeInTheDocument();

// Test IDs (when semantic queries insufficient)
expect(screen.getByTestId('sla-badge')).toHaveClass('bg-emerald-50');

// Form validation
await user.click(screen.getByRole('button', { name: 'حفظ' }));
expect(screen.getByText('هذا الحقل مطلوب')).toBeInTheDocument();

// Navigation
expect(window.location.pathname).toBe('/ar/tasks');

// Async wait
await waitFor(() => {
  expect(screen.getByText('تم الحفظ بنجاح')).toBeInTheDocument();
});
```

---

## Running Tests

```bash
# Full suite
npm run test

# Watch mode
npm run test:watch

# Single file
npx vitest run __tests__/components/domain/tasks/task-board.test.tsx

# Coverage
npm run test:coverage

# E2E (when Playwright added)
npx playwright test
npx playwright test e2e/login.spec.ts
```

---

## CI Rules

- `lint`, `typecheck`, `build` required on every PR
- All tests pass before merge to `main`
- Typegen freshness check against `../backend/openapi/openapi.json` when wired
- Failing tests block deployment

---

## Manual Test Checklist (every UI PR)

- [ ] Arabic RTL layout correct
- [ ] English LTR layout correct
- [ ] SLA color badges match design tokens
- [ ] Loading skeleton states present and match content shape
- [ ] Empty states present with appropriate messaging
- [ ] Error states handled (network error, 403, 404)
- [ ] 403/401 handled gracefully
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Focus visible on interactive elements

---

→ **Next:** [release-policy.md](release-policy.md)
