# Coding Standards — Momentum Frontend

> Read when writing new code, refactoring, or unsure about structure.
> **MUST read before writing ANY implementation code.**

---

## General Principles

- Explicit over implicit; one component, one responsibility
- Smallest change that satisfies the spec
- Match patterns in the active feature area before inventing new ones
- Architecture rules in `architecture.md` are non-negotiable
- Colocate related code — keep hooks, types, and utilities near consumers
- Prefer composition over configuration — build from small pieces

---

## Naming Conventions

| Thing | Convention | Example |
|-------|-----------|---------|
| Files (components) | kebab-case `.tsx` | `task-board.tsx`, `sla-badge.tsx` |
| Files (hooks) | kebab-case `use-*.ts` | `use-tasks.ts`, `use-auth.ts` |
| Files (utilities) | kebab-case `.ts` | `date-utils.ts`, `query-keys.ts` |
| Files (types) | kebab-case `.ts` | `task-types.ts` |
| Components | PascalCase | `TaskBoard`, `SlaBadge` |
| Hooks | camelCase with `use` | `useTasks`, `useAuth` |
| Variables | camelCase | `taskStatus`, `isLoading` |
| Constants | UPPER_SNAKE_CASE | `SLA_COLORS`, `DEFAULT_PAGE_SIZE` |
| Query keys | dot-namespaced arrays | `['tasks', 'list', { status }]` |
| Zustand stores | camelCase with `use...Store` | `useFilterStore`, `useSidebarStore` |
| CSS variables | kebab-case `--` prefix | `--color-primary`, `--radius-lg` |
| Route segments | kebab-case | `/task-board`, `/follow-up-center` |
| URL params | camelCase | `publicId`, `blueprintId` |
| Translation keys | dot-namespaced snake_case | `task_board.columns.sla_health` |
| Enum-like objects | PascalCase keys | `TaskStatus.Active`, `SlaHealth.AtRisk` |

---

## File Organization

### Feature-Based Structure

Organize code by feature domain, not by file type:

```
components/
├── ui/                     # shadcn/ui primitives (managed by CLI)
│   ├── button.tsx
│   ├── badge.tsx
│   └── ...
├── domain/                 # Business domain components
│   ├── tasks/
│   │   ├── task-board.tsx
│   │   ├── task-card.tsx
│   │   ├── task-filters.tsx
│   │   └── sla-badge.tsx
│   ├── blueprints/
│   │   ├── blueprint-builder.tsx
│   │   └── stage-node.tsx
│   └── follow-up/
│       ├── follow-up-board.tsx
│       └── action-log.tsx
└── shared/                 # Cross-domain reusable (planned — not yet created)
```

### Route Structure

```
app/
├── (auth)/                 # Unauthenticated layout (login page)
├── (dashboard)/            # Authenticated shell (sidebar + topbar)
│   ├── layout.tsx          # Dashboard shell with auth guard
│   ├── page.tsx            # Dashboard home
│   ├── tasks/page.tsx      # Task board (spec 002)
│   ├── blueprints/page.tsx # Blueprint builder (spec 003)
│   ├── analytics/page.tsx  # Analytics (spec 005)
│   ├── follow-up/page.tsx  # Follow-up center (spec 004)
│   ├── organization/page.tsx # Org structure (spec 006)
│   └── admin/page.tsx      # Admin panel (capability-gated)
├── login-block/            # shadcn login block demo (reference)
├── dashboard-block/        # shadcn dashboard block demo (reference)
├── layout.tsx              # Root layout (reads NEXT_LOCALE cookie)
├── not-found.tsx           # 404 page
└── proxy.ts                # Security headers + cache control
```

### Hooks & Lib Structure

```
lib/
├── api/
│   ├── client.ts           # Fetch wrapper (credentials, headers, error handling)
│   ├── query-keys.ts       # Centralized query key factory
│   └── hooks/
│       ├── use-tasks.ts    # Task query/mutation hooks
│       ├── use-auth.ts     # Current user, login, logout
│       ├── use-capabilities.ts  # Capability checks
│       ├── use-notifications.ts # Notifications list, count, mark-read
│       ├── use-search.ts   # Global search + recent activity
│       └── use-tenant.ts   # Tenant info hook
├── generated/
│   └── api-types.ts        # OpenAPI → TypeScript (auto-generated, never edit)
├── stores/
│   ├── use-locale-store.ts       # Locale state (used by LocaleToggle)
│   ├── use-capability-store.ts   # Capability strings for permission UI
│   ├── use-brand-color-store.ts  # Persisted brand color (Zustand persist)
│   └── use-sidebar-store.ts      # Pre-existing scaffold — currently unused
└── utils/
    ├── date-utils.ts       # planned — Hijri conversion, relative time
    ├── sla-utils.ts        # planned — SLA health color/label mapping
    └── utils.ts            # Utility functions (cn, etc.)
```

---

## Component Architecture

### Server vs Client Components

Next.js App Router renders Server Components by default. Use this decision tree:

```
Does the component...
├── Need useState, useEffect, event handlers? → 'use client'
├── Need browser APIs (window, localStorage)? → 'use client'
├── Need TanStack Query hooks?                → 'use client'
├── Need Zustand store?                       → 'use client'
├── Need React context consumers?             → 'use client'
└── Only render data passed as props?         → Server Component (default)
```

**Rules:**

```tsx
// ✅ Correct — Server Component (default, no directive needed)
// app/(dashboard)/tasks/page.tsx
export default function TasksPage() {
  return (
    <PageHeader title="task_board.title" />
    <TaskBoard />  {/* Client component handles interactivity */}
  );
}

// ✅ Correct — Client Component (needs interactivity)
// components/domain/tasks/task-board.tsx
'use client';

import { useTasks } from '@/lib/api/hooks/use-tasks';

export function TaskBoard() {
  const { data, isLoading } = useTasks();
  // ...
}

// ❌ Wrong — 'use client' on a page that doesn't need it
'use client';  // Don't add this unless the page itself needs interactivity
export default function TasksPage() { ... }
```

### Component Size Limits

- **Max ~200 lines per component file** — split if larger
- Extract sub-components into the same directory
- Extract hooks into `lib/api/hooks/` or colocated `use-*.ts` files
- Extract types into colocated `*-types.ts` or `lib/generated/`

### Props & Types

```tsx
// ✅ Correct — explicit interface, exported for reuse
interface TaskCardProps {
  task: Task;
  onSelect?: (publicId: string) => void;
  variant?: 'compact' | 'detailed';
}

export function TaskCard({ task, onSelect, variant = 'compact' }: TaskCardProps) {
  // ...
}

// ❌ Wrong — inline object type, no export
export function TaskCard({ task, onSelect }: { task: any; onSelect: Function }) {
  // ...
}
```

**Never use `any`.** Use generated types from `lib/generated/api-types.ts` or define explicit interfaces.

---

## Data Fetching Patterns

### TanStack Query — Server State

All API data fetching uses TanStack Query. Never use `useEffect` + `fetch` for API calls.

#### Query Key Factory

Centralize all query keys in a single factory to prevent typos and enable targeted invalidation:

```ts
// lib/api/query-keys.ts
export const queryKeys = {
  tasks: {
    all: ['tasks'] as const,
    lists: () => [...queryKeys.tasks.all, 'list'] as const,
    list: (filters: TaskFilters) => [...queryKeys.tasks.lists(), filters] as const,
    details: () => [...queryKeys.tasks.all, 'detail'] as const,
    detail: (publicId: string) => [...queryKeys.tasks.details(), publicId] as const,
  },
  blueprints: {
    all: ['blueprints'] as const,
    lists: () => [...queryKeys.blueprints.all, 'list'] as const,
    list: (filters?: BlueprintFilters) => [...queryKeys.blueprints.lists(), filters] as const,
    detail: (publicId: string) => [...queryKeys.blueprints.all, 'detail', publicId] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    list: (filter?: string) => [...queryKeys.notifications.all, 'list', filter] as const,
    unreadCount: () => [...queryKeys.notifications.all, 'unread-count'] as const,
  },
  auth: {
    me: ['auth', 'me'] as const,
    capabilities: (userPublicId: string) => ['auth', 'capabilities', userPublicId] as const,
  },
} as const;
```

#### Query Hook Pattern

```ts
// lib/api/hooks/use-tasks.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../query-keys';
import { apiClient } from '../client';
import type { Task, TaskFilters, CreateTaskRequest } from '@/lib/generated/api-types';

/** Fetch paginated task list with filters */
export function useTasks(filters: TaskFilters) {
  return useQuery({
    queryKey: queryKeys.tasks.list(filters),
    queryFn: () => apiClient.get<TaskListResponse>('/v1/tasks', {
      params: filters,
    }),
    // Cursor-paginated data may use useInfiniteQuery instead — see below
  });
}

/** Fetch single task by publicId */
export function useTask(publicId: string) {
  return useQuery({
    queryKey: queryKeys.tasks.detail(publicId),
    queryFn: () => apiClient.get<Task>(`/v1/tasks/${publicId}`),
    enabled: !!publicId,
  });
}

/** Create a new draft task */
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateTaskRequest) =>
      apiClient.post<Task>('/v1/tasks', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks.lists() });
    },
  });
}
```

#### Cursor Pagination with useInfiniteQuery

The backend uses cursor pagination (`{data, next_cursor, has_more}`). Use `useInfiniteQuery` for paginated lists:

```ts
// lib/api/hooks/use-tasks.ts
import { useInfiniteQuery } from '@tanstack/react-query';

export function useTasksInfinite(filters: TaskFilters) {
  return useInfiniteQuery({
    queryKey: queryKeys.tasks.list(filters),
    queryFn: ({ pageParam }) =>
      apiClient.get<CursorPaginatedResponse<Task>>('/v1/tasks', {
        params: { ...filters, cursor: pageParam },
      }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? lastPage.next_cursor : undefined,
  });
}
```

#### What NOT To Do

```tsx
// ❌ Wrong — manual fetch in useEffect
useEffect(() => {
  fetch('https://api.momentum.test/v1/tasks')
    .then(res => res.json())
    .then(setTasks);
}, []);

// ❌ Wrong — hardcoded query key string
useQuery({ queryKey: ['tasks-list'], ... });

// ❌ Wrong — mutation without invalidation
useMutation({
  mutationFn: createTask,
  // Missing onSuccess invalidation — stale list!
});

// ❌ Wrong — fetching in a Server Component when data needs client interactivity
// Server Components cannot use TanStack Query hooks
export default async function TasksPage() {
  const tasks = await fetch('https://api.momentum.test/v1/tasks'); // Can't interact with this data
  return <TaskBoard tasks={tasks} />;
}
```

---

## API Client

### Fetch Wrapper

A single fetch wrapper handles auth cookies, tenant header, error parsing, and typed responses:

```ts
// lib/api/client.ts
import type { ApiError } from '@/lib/generated/api-types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.momentum.test';

interface RequestOptions {
  params?: Record<string, unknown>;
  headers?: Record<string, string>;
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  options?: RequestOptions,
): Promise<T> {
  const url = new URL(path, BASE_URL);

  if (options?.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });
  }

  const response = await fetch(url.toString(), {
    method,
    credentials: 'include',  // Sanctum cookies
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options?.headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      message: response.statusText,
    }));
    throw new ApiRequestError(response.status, error);
  }

  // 204 No Content (delete responses)
  if (response.status === 204) return undefined as T;

  return response.json();
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>('GET', path, undefined, options),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('POST', path, body, options),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PUT', path, body, options),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>('PATCH', path, body, options),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>('DELETE', path, undefined, options),
};

export class ApiRequestError extends Error {
  constructor(
    public status: number,
    public error: ApiError,
  ) {
    super(error.message);
    this.name = 'ApiRequestError';
  }
}
```

### CSRF Cookie

Before login, fetch the CSRF cookie:

```ts
// lib/api/hooks/use-auth.ts
async function getCsrfCookie(): Promise<void> {
  await fetch('https://api.momentum.test/sanctum/csrf-cookie', { credentials: 'include' });
}

export function useLogin() {
  return useMutation({
    mutationFn: async (credentials: LoginRequest) => {
      await getCsrfCookie();
      return apiClient.post<AuthResponse>('/v1/iam/auth/login', credentials);
    },
  });
}
```

---

## State Management

### Decision Tree

```
Where does this data live?

├── Comes from API?           → TanStack Query (server state)
├── URL filter/sort params?   → URL search params (useSearchParams)
├── Form input values?        → shadcn Field (local form state)
├── UI toggle (sidebar open)? → Zustand (client-only global state)
├── Single-component toggle?  → useState (local component state)
└── Shared across pages?      → Zustand (persisted if needed)
```

### Zustand Store Pattern

```ts
// lib/stores/use-filter-store.ts
import { create } from 'zustand';

interface FilterState {
  status: string | null;
  department: string | null;
  priority: string | null;
  setFilter: (key: keyof Omit<FilterState, 'setFilter' | 'resetFilters'>, value: string | null) => void;
  resetFilters: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  status: null,
  department: null,
  priority: null,
  setFilter: (key, value) => set({ [key]: value }),
  resetFilters: () => set({ status: null, department: null, priority: null }),
}));
```

### URL State for Filters

For shareable/bookmarkable filter state, prefer URL search params:

```tsx
// ✅ Correct — filters in URL (shareable, back-button works)
'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';

export function TaskFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const status = searchParams.get('status');

  function setFilter(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <FilterChip
      active={status === 'overdue'}
      onClick={() => setFilter('status', status === 'overdue' ? null : 'overdue')}
    >
      Overdue
    </FilterChip>
  );
}
```

### What NOT To Do

```tsx
// ❌ Wrong — API data in Zustand (duplicates TanStack Query cache)
const useTaskStore = create((set) => ({
  tasks: [],
  fetchTasks: async () => {
    const res = await fetch('https://api.momentum.test/v1/tasks');
    set({ tasks: await res.json() });
  },
}));

// ❌ Wrong — using React context for frequently changing global state
const FilterContext = createContext(null);  // Use Zustand instead

// ❌ Wrong — prop drilling through 4+ levels
<Page filters={filters}>
  <Section filters={filters}>
    <Table filters={filters}>
      <Row filters={filters} />  // Use Zustand or URL state
    </Table>
  </Section>
</Page>
```

---

## Form Handling

### shadcn Field + InputGroup

Forms use shadcn nova components: `Field`, `FieldGroup`, `FieldLabel`, `FieldDescription`, `FieldError`, `FieldSeparator` for layout, and `InputGroup` + `InputGroupInput` + `InputGroupAddon` for inputs with icons.

See `npx shadcn@latest docs input-group` and `npx shadcn@latest docs field` for the full API.

### Bilingual Form Fields

Arabic is required; English is optional. Use a consistent pattern with `FieldLabel` for each locale variant.

---

## Error Handling & Loading States

### Error Boundary

Wrap route segments with error boundaries:

```tsx
// app/(dashboard)/tasks/error.tsx
'use client';

export default function TasksError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <EmptyState
      icon={AlertCircle}
      title="حدث خطأ"
      description={error.message}
      action={<Button onClick={reset}>إعادة المحاولة</Button>}
    />
  );
}
```

### API Error Handling

Handle specific HTTP status codes in query hooks:

```tsx
// ✅ Correct — handle error states
export function TaskBoard() {
  const { data, isLoading, isError, error } = useTasks(filters);

  if (isLoading) return <TaskBoardSkeleton />;
  if (isError) {
    if (error instanceof ApiRequestError && error.status === 403) {
      return <NoPermission capability="task.view" />;
    }
    return <ErrorState message={error.message} />;
  }
  if (!data?.data.length) return <EmptyState type="tasks" />;

  return <DataTable data={data.data} columns={taskColumns} />;
}
```

### Loading States — Required Pattern

Every data-fetching component MUST implement all four states:

| State | Component | Pattern |
|-------|-----------|---------|
| Loading | Skeleton | Match layout shape of real content |
| Error | Error boundary or inline | Show message + retry button |
| Empty | EmptyState | Icon + headline + CTA |
| Success | Real content | Data rendered |

```tsx
// ✅ Correct — all 4 states handled
function TaskBoard() {
  const { data, isLoading, isError } = useTasks(filters);

  if (isLoading) return <TaskBoardSkeleton />;
  if (isError) return <ErrorState />;
  if (!data?.data.length) return <EmptyState type="tasks" />;
  return <DataTable data={data.data} columns={columns} />;
}

// ❌ Wrong — missing loading and empty states
function TaskBoard() {
  const { data } = useTasks(filters);
  return <DataTable data={data?.data ?? []} columns={columns} />;
}
```

### Skeleton Pattern

Use shadcn `Skeleton` component to match the shape of real content. See `npx shadcn@latest docs skeleton`.

### Toast Notifications

Use shadcn toast for mutation feedback:

```tsx
import { toast } from 'sonner';

const createTask = useCreateTask();

createTask.mutate(values, {
  onSuccess: () => toast.success('تم إنشاء المهمة بنجاح'),
  onError: (error) => toast.error(error.message),
});
```

---

## i18n & RTL

### Library: next-intl

Uses `next-intl` v4 for all UI strings. Translation files live at `messages/{locale}.json` with dot-namespaced keys by feature domain.

**Setup:**
- `next.config.ts` wrapped with `createNextIntlPlugin('./i18n/request.ts')`
- `i18n/request.ts` reads `NEXT_LOCALE` cookie via `cookies()`, returns locale + messages
- `NextIntlClientProvider` in root layout wraps all children

**Server Components** (page.tsx, layouts):

```tsx
import { getTranslations } from 'next-intl/server';

export default async function Page() {
  const t = await getTranslations('namespace');
  return <p>{t('key')}</p>;
}
```

**Client Components:**

```tsx
import { useTranslations } from 'next-intl';

export function Component() {
  const t = useTranslations('namespace');
  return <p>{t('key')}</p>;
}
```

**Zod schema validation messages** must be generated inside the component using `t()`:

```tsx
const loginSchema = z.object({
  email: z.string().email(t('email_invalid')),
  password: z.string().min(1, t('password_required')),
});
```

### Translation Key Conventions

Keys are dot-namespaced by feature, using snake_case:

```json
{
  "auth": {
    "login": {
      "email": "البريد الإلكتروني",
      "email_invalid": "البريد الإلكتروني غير صالح",
      "submit": "دخول"
    }
  },
  "nav": {
    "dashboard": "لوحة التحكم",
    "tasks": "المهام"
  },
  "notifications": {
    "title": "الإشعارات",
    "empty": "لا توجد إشعارات",
    "load_more": "تحميل المزيد"
  }
}
```

Usage: `t('auth.login.email')`, `t('nav.dashboard')`.

### Bilingual Entity Data

API entities return **both** Arabic and English (`name_ar`/`name_en`, `title_ar`/`title_en`). The frontend picks the correct one:

```tsx
const name = user.name_ar || user.name_en;
const title = blueprint.title_ar ?? blueprint.title_en;
```

This is NOT done through `useTranslations` — these values come from the database.

### Backend Error Localization

The frontend sends `X-Locale` header on every API request (from `NEXT_LOCALE` cookie). Backend middleware `SetLocaleFromHeader` calls `app()->setLocale()`, so `__('auth.failed')` returns in the correct language.

### Logical Properties — Mandatory

**Never use physical direction properties.** Always use CSS logical properties via Tailwind:

```tsx
// ✅ Correct — logical properties (RTL-safe)
<div className="ms-4 me-2 ps-3 pe-1 text-start border-s-2">
  <ChevronRight className="rtl:rotate-180" />
</div>

// ❌ Wrong — physical properties (breaks RTL)
<div className="ml-4 mr-2 pl-3 pr-1 text-left border-l-2">
  <ChevronRight />  {/* Doesn't flip in RTL */}
</div>
```

| Physical (never) | Logical (always) |
|-------------------|-------------------|
| `ml-*` / `mr-*` | `ms-*` / `me-*` |
| `pl-*` / `pr-*` | `ps-*` / `pe-*` |
| `left-*` / `right-*` | `start-*` / `end-*` |
| `text-left` / `text-right` | `text-start` / `text-end` |
| `border-l` / `border-r` | `border-s` / `border-e` |
| `rounded-l` / `rounded-r` | `rounded-s` / `rounded-e` |
| `float-left` / `float-right` | `float-start` / `float-end` |

### Icons That Must Flip

Directional icons must rotate 180° in RTL:

```tsx
// ✅ Correct — chevrons, arrows, and navigation icons flip
<ChevronRight className="rtl:rotate-180" />
<ArrowLeft className="rtl:rotate-180" />

// ❌ Wrong — direction icons without RTL flip
<ChevronRight />
```

Icons that should NOT flip: checkmarks, plus, minus, search, settings, user avatars.

### Hijri Date Display

API returns Gregorian. Display both formats in the UI:

```tsx
// lib/utils/date-utils.ts
export function formatDualDate(isoDate: string, locale: string): string {
  const date = new Date(isoDate);
  const gregorian = new Intl.DateTimeFormat(locale, {
    year: 'numeric', month: 'short', day: 'numeric',
  }).format(date);

  // Hijri via Intl API (supported in modern browsers)
  const hijri = new Intl.DateTimeFormat(`${locale}-u-ca-islamic`, {
    year: 'numeric', month: 'short', day: 'numeric',
  }).format(date);

  return `${hijri} — ${gregorian}`;
}
```

---

## Performance

### Dynamic Imports

Heavy components that aren't needed on initial render should be lazy-loaded:

```tsx
import dynamic from 'next/dynamic';

// ✅ Correct — heavy chart library loaded on demand
const AnalyticsChart = dynamic(
  () => import('@/components/domain/analytics/analytics-chart'),
  { loading: () => <ChartSkeleton /> }
);

// ✅ Correct — blueprint builder only loaded on that route
const BlueprintCanvas = dynamic(
  () => import('@/components/domain/blueprints/blueprint-canvas'),
  { ssr: false }  // Canvas uses browser APIs
);
```

### Image Optimization

Always use `next/image` for images:

```tsx
import Image from 'next/image';

// ✅ Correct
<Image src={tenantLogo} alt={tenantName} width={120} height={40} />

// ❌ Wrong
<img src={tenantLogo} alt={tenantName} />
```

### Memoization Rules

- **Do NOT** `useMemo`/`useCallback` everything by default
- **Do** memoize expensive computations (sorting/filtering large lists)
- **Do** memoize callbacks passed to heavily re-rendering children (data tables)
- **Do** memoize objects used as TanStack Query `queryKey` dependencies

```tsx
// ✅ Correct — memoize expensive filter
const sortedTasks = useMemo(
  () => tasks.sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
  [tasks]
);

// ❌ Wrong — unnecessary memoization
const label = useMemo(() => `Task ${id}`, [id]);  // String concat is cheap
```

---

## Type Safety

### Generated Types — Never Duplicate

API response types come from `lib/generated/api-types.ts`. **Never** create hand-written interfaces for API responses:

```ts
// ✅ Correct — import from generated types
import type { Task, Blueprint, SlaTimerInstance } from '@/lib/generated/api-types';

// ❌ Wrong — hand-written API response type
interface Task {
  public_id: string;
  title_ar: string;
  // ... duplicating what OpenAPI already defines
}
```

### Discriminated Unions for Status

Use discriminated unions for status-dependent rendering:

```ts
// ✅ Correct — type narrowing on status
type TaskStatus = 'draft' | 'active' | 'suspended' | 'completed' | 'cancelled';

function getStatusBadgeVariant(status: TaskStatus): BadgeVariant {
  const map: Record<TaskStatus, BadgeVariant> = {
    draft: 'secondary',
    active: 'default',
    suspended: 'outline',
    completed: 'success',
    cancelled: 'destructive',
  };
  return map[status];
}
```

### No `any`

```ts
// ❌ Forbidden
function processData(data: any) { ... }
const result: any = await fetch(...);

// ✅ Use `unknown` and narrow
function processData(data: unknown) {
  if (isTask(data)) { ... }
}
```

---

## SLA Status Colors — Semantic Mapping

SLA health colors are critical for the platform. Use the semantic token system consistently:

SLA colors: emerald (on track), amber (at risk), red (overdue), slate (suspended). Always pair color with a text label — never color-only.

---

## Permission-Gated UI

### Pattern: Hide or Disable Based on Capabilities

The server is the source of truth. The frontend uses capabilities from the current user's session to optimistically show/hide actions:

```tsx
// lib/api/hooks/use-capabilities.ts
export function useCapability(capability: string): boolean {
  const { data: user } = useCurrentUser();
  return user?.capabilities?.includes(capability) ?? false;
}

// Usage in component
export function TaskActions({ task }: { task: Task }) {
  const canManage = useCapability('task.manage');
  const canEscalate = useCapability('task.escalate');

  return (
    <div className="flex gap-2">
      {canManage && (
        <Button onClick={handleCancel} variant="destructive">
          إلغاء المهمة
        </Button>
      )}
      {canEscalate && (
        <Button onClick={handleEscalate}>تصعيد</Button>
      )}
    </div>
  );
}
```

**Rule:** Never trust client-side capability checks for security. The server returns 403 regardless. These checks are for UX only — hiding actions the user cannot perform.

---

## Cursor Pagination UI

### Pattern: Load More Button

```tsx
export function TaskList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useTasksInfinite(filters);

  const allTasks = data?.pages.flatMap(page => page.data) ?? [];

  return (
    <>
      <DataTable data={allTasks} columns={columns} />
      {hasNextPage && (
        <Button
          variant="outline"
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          className="mt-4 w-full"
        >
          {isFetchingNextPage ? 'جاري التحميل...' : 'تحميل المزيد'}
        </Button>
      )}
    </>
  );
}
```

---

## Tailwind CSS v4 Conventions

### Theme Configuration

Use the `@theme` directive in CSS for design tokens:

```css
/* app/globals.css */
@import "tailwindcss";

@theme inline {
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-sidebar: var(--sidebar);
}
```

### Dark Mode & Theming

- We use `next-themes` to manage Light/Dark/System preferences.
- Wrap the application in `<ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>` in `app/layout.tsx`. Theme toggle moved inside user menu dropdown (Preferences submenu).
- Use Tailwind's `dark:` variant for all inverted styles.
- Do not implement custom theme toggles using local state or `localStorage` directly.

### Class Merging

Always use the `cn()` utility for conditional classes:

```ts
// lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Usage
<div className={cn(
  'rounded-xl border p-4',
  isActive && 'border-primary bg-primary/5',
  isDisabled && 'opacity-50 cursor-not-allowed',
)} />
```

---

## Dependencies

- No new npm packages without team discussion
- Prefer shadcn/ui components over third-party UI libraries
- Prefer native browser APIs over utility libraries (e.g., `Intl.DateTimeFormat` over moment.js)
- Tree-shakeable imports only — no barrel imports from large packages

---

## Code Style

- **Formatter:** ESLint (configured in `eslint.config.mjs`)
- **Linter:** `next lint` catches Next.js-specific issues
- Run before commit: `npm run lint && npm run typecheck`

---

## What To Avoid

- `any` type — use `unknown` and narrow
- `useEffect` for data fetching — use TanStack Query
- Hand-written API response interfaces — use generated types
- Physical direction properties (`ml-`, `mr-`, `text-left`) — use logical (`ms-`, `me-`, `text-start`)
- `localStorage` for auth tokens — Sanctum cookies only
- Business logic duplication (SLA calculation, ABAC decisions) — server is truth
- Hardcoded English-only strings in user-facing components
- `console.log` in committed code — use structured error handling
- God components >200 lines — split by responsibility
- Barrel `index.ts` re-exports in large directories — import directly
- `dangerouslySetInnerHTML` — never use without explicit security review
- Duplicating permission/capability logic — server returns 403
- Offset pagination — backend enforces cursor pagination (`next_cursor`).
- Infinite scroll on tables — use manual "Load More" for tables, but use infinite scroll for chronological feeds (Timeline, Action Log).
- Missing loading/empty/error states — all 4 states required
- Inline styles — use Tailwind classes
- `!important` in CSS — fix specificity instead

---

→ **Next:** [security-policy.md](security-policy.md)
